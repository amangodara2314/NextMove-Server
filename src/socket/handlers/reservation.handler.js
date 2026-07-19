import { io } from "../../app.js";
import redis from "../../config/redis.js";
import { RESERVATION_TTL } from "../../constants/env.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import { reservationLuaScript } from "../../constants/luaScript.js";
import { TIME_CONTROL } from "../../constants/timeControl.js";
import gameRepository from "../../modules/game/game.repository.js";

const handleReservationAck = async (socket) => {
  socket.on("MATCH_ACK", async (data) => {
    try {
      console.debug("[MATCH_ACK] received", {
        data,
        socketId: socket.id,
        user: socket.user && socket.user.userId,
      });

      const reservationId = data && data.reservationId;
      const user = socket.user;

      if (!reservationId || !user || !user.userId) {
        console.warn("[MATCH_ACK] missing reservationId or user", {
          reservationId,
          userId: user && user.userId,
        });
        return;
      }

      const key = REDIS_KEYS.reservation(reservationId);

      const result = await redis.eval(
        reservationLuaScript,
        1,
        key,
        user.userId,
        Date.now(),
        RESERVATION_TTL,
      );

      console.debug("[MATCH_ACK] lua result", { result });

      if (!result || result.length === 0) {
        console.warn("[MATCH_ACK] empty lua result", { reservationId });
        return;
      }

      const status = result[0];

      if (status !== "READY") {
        console.info("[MATCH_ACK] reservation status", {
          reservationId,
          status,
        });
        return;
      }

      // if players are ready, create a game and notify them
      const player1 = result[1];
      const player2 = result[2];
      const timeControl = result[3];

      if (!player1 || !player2) {
        console.warn("[MATCH_ACK] missing players from lua", {
          reservationId,
          player1,
          player2,
        });
        return;
      }

      // pick a random player to be white
      const white = Math.random() < 0.5 ? player1 : player2;

      const black = white === player1 ? player2 : player1;

      const timeControlSettings = TIME_CONTROL[timeControl];

      if (!timeControlSettings) {
        console.warn("[MATCH_ACK] invalid timeControl", {
          reservationId,
          timeControl,
        });
        return;
      }

      const whiteTimeLeft = timeControlSettings.initialTime;
      const blackTimeLeft = timeControlSettings.initialTime;

      const game = await gameRepository.createGame({
        white,
        black,
        timeControl,
        whiteTimeLeft,
        blackTimeLeft,
      });

      // get sockets of both players
      const [p1Socket, p2Socket] = await Promise.all([
        redis.get(REDIS_KEYS.userSocket(player1)),
        redis.get(REDIS_KEYS.userSocket(player2)),
      ]);

      // set both players active game in redis
      await Promise.all([
        redis.set(REDIS_KEYS.userActiveGame(player1), game.id),
        redis.set(REDIS_KEYS.userActiveGame(player2), game.id),
      ]);

      // notify both players that the match is ready with gameId
      io.to([p1Socket, p2Socket]).emit("MATCH_READY", {
        gameId: game.id,
      });
    } catch (err) {
      console.error("[MATCH_ACK] handler error", err);
    }
  });
};

export default handleReservationAck;
