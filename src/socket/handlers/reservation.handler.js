import { io } from "../../app.js";
import redis from "../../config/redis.js";
import { RESERVATION_TTL } from "../../constants/env.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import gameRepository from "../../modules/game/game.repository.js";

const handleReservationAck = async (socket) => {
  socket.on("MATCH_ACK", async (data) => {
    const reservationId = data.reservationId;
    const user = socket.user;
    const key = REDIS_KEYS.reservation(reservationId);
    const reservation = await redis.hgetall(key);

    if (!reservation) {
      return;
    }

    if (reservation.createdAt < Date.now() - RESERVATION_TTL * 1000) {
      return;
    }

    if (reservation.player1 == user.userId) {
      await redis.hset(key, {
        player1Ack: "true",
      });
    }

    if (reservation.player2 == user.userId) {
      await redis.hset(key, {
        player2Ack: "true",
      });
    }

    // reload latest state
    const updated = await redis.hgetall(key);

    if (updated.player1Ack === "true" && updated.player2Ack === "true") {
      // if both players are active create their game
      function pick0Or1() {
        return Math.floor(Math.random() * 2);
      }

      const opponentId =
        updated.player1 === user.userId ? updated.player2 : updated.player1;
      const userColor = pick0Or1() === 0 ? "WHITE" : "BLACK";

      // send both player the gameId
      const opponentSocketId = await redis.get(
        REDIS_KEYS.userSocket(opponentId),
      );
      const userSocketId = await redis.get(REDIS_KEYS.userSocket(user.userId));

      const game = await gameRepository.createGame({
        white: userColor === "WHITE" ? user.userId : opponentId,
        black: userColor === "BLACK" ? user.userId : opponentId,
      });

      io.to(opponentSocketId).to(userSocketId).emit("MATCH_READY", {
        gameId: game.id,
      });

      await redis.del(key);
    }
  });
};

export default handleReservationAck;
