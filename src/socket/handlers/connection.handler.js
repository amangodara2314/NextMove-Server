import { GameStatus } from "@prisma/client";
import redis from "../../config/redis.js";
import { RESERVATION_TTL } from "../../constants/env.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import gameRepository from "../../modules/game/game.repository.js";
import reconnectionTimeoutQueue from "../../queues/reconnectionTimeout.queue.js";
import { updatePlayerConnection } from "../../utils/reconnection.js";

const handleSocketConnection = async (socket) => {
  const userId = socket.user.userId;
  const socketKey = REDIS_KEYS.userSocket(userId);
  const activeGameKey = REDIS_KEYS.userActiveGame(userId);

  await redis.set(socketKey, socket.id);

  // log the connected socket id and user id
  console.log("socket connected :", socket.id);
  console.log("user email :", socket?.user?.email);
  socket.join(userId);

  socket.on("disconnect", async () => {
    const currSocket = await redis.get(socketKey);
    if (currSocket === socket.id) {
      await redis.del(socketKey);
    }
    const activeGameId = await redis.get(activeGameKey);
    if (activeGameId) {
      const game = await gameRepository.getRedisGame(activeGameId);
      if (game && game.status === GameStatus.ACTIVE) {
        const userColor = game.white === userId ? "WHITE" : "BLACK";
        await updatePlayerConnection(userColor, game.id, false);

        await reconnectionTimeoutQueue.add(
          "reconnection-timeout",
          {
            userId,
            gameId: activeGameId,
          },
          { delay: RESERVATION_TTL * 1000, jobId: `${userId}_${activeGameId}` },
        );
      }
    }
    console.log("socket disconnected :", socket.id);
  });
};

export default handleSocketConnection;
