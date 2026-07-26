import { GameResult, GameStatus, PlayerColor } from "@prisma/client";
import gameRepository from "../modules/game/game.repository.js";
import calculatePlayerTime from "../utils/calculatePlayerTime.js";
import { endGame } from "../utils/game.js";
import { notify } from "../utils/notifier.js";
import { REDIS_KEYS } from "../constants/keys.js";
import acquireLock from "../utils/acquireLock.js";
import releaseLock from "../utils/releaseLock.js";
import redis from "../config/redis.js";

const handlePlayerTimeoutJob = async (job) => {
  const { gameId, turn } = job.data;

  if (!gameId || !Object.values(PlayerColor).includes(turn)) {
    console.log("Invalid timeout job payload");
    return;
  }

  const lockKey = REDIS_KEYS.lock("game", gameId);
  const acquired = await acquireLock(lockKey, 5);

  if (!acquired) {
    // The move handler is already updating the game.
    return;
  }

  try {
    const game = await gameRepository.getRedisGame(gameId);

    if (!game) {
      return;
    }

    if (game.status !== GameStatus.ACTIVE) {
      return;
    }

    // Stale timeout job.
    if (game.turn !== turn) {
      return;
    }

    // Update remaining time using the current timestamp.
    calculatePlayerTime(game, turn);

    const remainingTime =
      turn === PlayerColor.WHITE
        ? Number(game.whiteTimeLeft)
        : Number(game.blackTimeLeft);

    // Player still has time remaining.
    if (remainingTime > 0) {
      return;
    }

    const winner =
      turn === PlayerColor.WHITE ? GameResult.BLACK : GameResult.WHITE;

    const updatedGame = await endGame(game, GameStatus.TIMEOUT, winner);

    notify({
      event: "PLAYER_TIMEOUT",
      room: gameId,
      payload: updatedGame,
    });

    console.log("Cleaning up Redis keys for game", gameId);

    // redis cleanup
    const player1 = REDIS_KEYS.userActiveGame(game.white);
    const player2 = REDIS_KEYS.userActiveGame(game.black);
    const activeGameKey = REDIS_KEYS.userActiveGame(gameId);
    const movesKey = REDIS_KEYS.gameMoves(gameId);
    const gameKey = REDIS_KEYS.game(gameId);
    await Promise.all([
      redis.del(activeGameKey),
      redis.del(player1),
      redis.del(player2),
      redis.del(gameKey),
      redis.del(movesKey),
    ]);

    console.log(
      `Game ${gameId} ended due to player timeout. Winner: ${winner}`,
    );
  } catch (err) {
    console.error("Player timeout worker failed:", err);
    throw err;
  } finally {
    await releaseLock(lockKey, acquired);
  }
};

export default handlePlayerTimeoutJob;
