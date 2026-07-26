import redis from "../config/redis.js";
import { REDIS_KEYS } from "../constants/keys.js";
import gameRepository from "../modules/game/game.repository.js";

const endGame = async (game, status, result, abortedBy) => {
  game.status = status;
  game.result = result;
  const updateGame = await gameRepository.updateGame(game.id, {
    status: status,
    result: game.result,
    turn: game.turn,
    abortedBy,
    whiteTimeLeft: parseInt(game.whiteTimeLeft),
    blackTimeLeft: parseInt(game.blackTimeLeft),
    lastMoveAt: game.lastMoveAt || null,
  });
  await Promise.all([
    redis.del(REDIS_KEYS.userActiveGame(game.white)),
    redis.del(REDIS_KEYS.userActiveGame(game.black)),
  ]);
  return updateGame;
};

const cleanUpRedisKeys = async (gameId, white, black) => {
  const gameKey = REDIS_KEYS.game(gameId);
  const movesKey = REDIS_KEYS.gameMoves(gameId);
  const whiteActiveGameKey = REDIS_KEYS.userActiveGame(white);
  const blackActiveGameKey = REDIS_KEYS.userActiveGame(black);
  await Promise.all([
    redis.del(gameKey),
    redis.del(movesKey),
    redis.del(whiteActiveGameKey),
    redis.del(blackActiveGameKey),
  ]);
};

export { endGame, cleanUpRedisKeys };
