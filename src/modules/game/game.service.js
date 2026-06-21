import { GameStatus } from "@prisma/client";
import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import gameRepository from "./game.repository.js";
import AppError from "../../utils/AppError.js";
import { INITIAL_FEN } from "../../constants/game.js";
import { io } from "../../app.js";

const getGame = async (gameId, userId) => {
  const key = REDIS_KEYS.game(gameId);
  // find the game in redis
  const cachedGame = await redis.get(key);
  // return the cached game
  if (cachedGame) {
    const game = JSON.parse(cachedGame);
    // set userColor property for frontend
    game.userColor = game.white === userId ? "WHITE" : "BLACK";
    return { game };
  }
  // in case of cache miss query the database
  const query = {
    where: { OR: [{ white: userId }, { black: userId }] },
    include: {
      whitePlayer: {
        select: {
          username: true,
          rating: true,
        },
      },
      blackPlayer: {
        select: {
          username: true,
          rating: true,
        },
      },
    },
  };
  const game = await gameRepository.findGameById(gameId, query);

  if (!game) {
    throw new AppError("Game not found");
  }

  // find the current fen of game
  const currentFen = await gameRepository.getGameFen(gameId);
  game.currentFen = currentFen ? currentFen.fenAfter : INITIAL_FEN;

  // find the number of moves in the game
  const moveCount = await gameRepository.countMoves(gameId);
  game.version = moveCount;

  // if the game is active cache it
  if (game.status === GameStatus.ACTIVE) {
    await redis.set(
      key,
      JSON.stringify(game),
      "EX",
      60 * 60, // 1 hour
    );
  }

  // set userColor property for frontend
  game.userColor = game.white === userId ? "WHITE" : "BLACK";
  return { game };
};

export default { getGame };
