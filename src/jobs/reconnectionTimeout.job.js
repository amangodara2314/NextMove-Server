import { GameStatus } from "@prisma/client";
import { REDIS_KEYS } from "../constants/keys.js";
import redis from "../config/redis.js";
import { endGame } from "../utils/game.js";
import { io } from "../app.js";

const reconnectionTimeoutJob = async (job) => {
  console.log(
    `Reconnection timeout job started for user ${job.data.userId} and game ${job.data.gameId}`,
  );
  const { userId, gameId } = job.data;

  // confirm if the user is still disconnected and the game is still active
  const socketKey = REDIS_KEYS.userSocket(userId);
  const activeGameKey = REDIS_KEYS.userActiveGame(userId);
  const [socketId, activeGameId] = await Promise.all([
    redis.get(socketKey),
    redis.get(activeGameKey),
  ]);

  if (socketId || activeGameId !== gameId) {
    console.log(
      `User ${userId} has reconnected or game ${gameId} is no longer active. No action needed.`,
    );
    return;
  }

  const gameKey = REDIS_KEYS.game(gameId);
  const game = await redis.get(gameKey);

  if (!game) {
    console.log(`Game ${gameId} not found in Redis. No action needed.`);
    return;
  }

  if (game.status !== GameStatus.ACTIVE) {
    console.log(`Game ${gameId} is not active. No action needed.`);
    return;
  }

  // If the user has not reconnected within the timeout, handle the disconnection
  console.log(
    `User ${userId} has not reconnected within the timeout. Handling disconnection for game ${gameId}.`,
  );

  const opponentColor = game.white === userId ? "Black" : "WHITE";

  await endGame(
    game,
    GameStatus.ABORTED,
    opponentColor === "WHITE" ? "1-0" : "0-1",
  );

  io.to(gameId).emit("GAME_ABORTED", {
    message: `Game is aborted by ${opponentColor.toLocaleLowerCase()}`,
    abortedBy: userId,
  });
};

export default reconnectionTimeoutJob;
