import { GameStatus } from "@prisma/client";
import { REDIS_KEYS } from "../constants/keys.js";
import redis from "../config/redis.js";
import { io } from "../app.js";
import gameRepository from "../modules/game/game.repository.js";
import { notify } from "../utils/notifier.js";

const reconnectionTimeoutJob = async (job) => {
  console.log(
    `Reconnection timeout job started for user ${job.data.userId} and game ${job.data.gameId}`,
  );
  const { userId, gameId } = job.data;

  // confirm if the user is still disconnected and the game is still active
  const activeGameKey = REDIS_KEYS.userActiveGame(userId);

  const activeGameId = await redis.get(activeGameKey);

  if (activeGameId !== gameId) {
    console.log(
      `User ${userId} has reconnected or game ${gameId} is no longer active. No action needed.`,
    );
    return;
  }

  const game = await gameRepository.getRedisGame(gameId);

  if (!game) {
    console.log(`Game ${gameId} not found in Redis. No action needed.`);
    return;
  }

  if (game.status !== GameStatus.ACTIVE) {
    console.log(`Game ${gameId} is not active. No action needed.`);
    return;
  }

  const userColor = game.white === userId ? "WHITE" : "BLACK";

  const isConnected =
    userColor === "WHITE" ? game?.whiteConnected : game?.blackConnected;

  if (isConnected) {
    return;
  }

  // If the user has not reconnected within the timeout, handle the disconnection
  console.log(
    `User ${userId} has not reconnected within the timeout. Handling disconnection for game ${gameId}.`,
  );

  await gameRepository.finishGame(
    game,
    GameStatus.ABORTED,
    userColor,
    userColor,
  );

  notify({
    room: gameId,
    event: "GAME_ABORTED",
    payload: {
      message: `Game is aborted by ${userColor.toLocaleLowerCase()}`,
      abortedBy: userColor,
    },
  });

  // redis cleanup
  await gameRepository.cleanUpRedisKeys(gameId, game.white, game.black);

  console.log("Game aborted and Redis cleaned up for game", gameId);
};

export default reconnectionTimeoutJob;
