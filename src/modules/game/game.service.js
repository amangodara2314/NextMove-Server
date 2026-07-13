import { GameStatus } from "@prisma/client";
import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import gameRepository from "./game.repository.js";
import AppError from "../../utils/AppError.js";
import { INITIAL_FEN } from "../../constants/game.js";
import { io } from "../../app.js";
import { updatePlayerConnection } from "../../utils/reconnection.js";

const getGame = async (gameId, userId) => {
  const key = REDIS_KEYS.game(gameId);
  // find the game in redis
  let game = await gameRepository.getRedisGame(gameId);
  // return the cached game
  if (game) {
    // set userColor property for frontend
    game.userColor = game.white === userId ? "WHITE" : "BLACK";
    // set the player status as active
    const updatedData = await updatePlayerConnection(game.userColor, gameId);

    game = { ...game, ...updatedData };

    io.to(gameId).emit("PLAYER_RECONNECTED", {
      userId,
      color: game.userColor,
      message: `Player ${game.userColor.toLowerCase()} has reconnected`,
    });

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
  const dbGame = await gameRepository.findGame(gameId, query);

  if (!dbGame) {
    throw new AppError("Game not found");
  }

  // find the current fen of game
  const currentFen = await gameRepository.getGameFen(gameId);
  dbGame.currentFen = currentFen ? currentFen.fenAfter : INITIAL_FEN;

  // find the number of moves in the game
  const moveCount = await gameRepository.countMoves(gameId);
  dbGame.version = moveCount;
  const userColor = dbGame.white === userId ? "WHITE" : "BLACK";

  // if the game is active cache it
  if (dbGame.status === GameStatus.ACTIVE) {
    io.to(gameId).emit("PLAYER_RECONNECTED", {
      userId,
      color: userColor,
    });

    await gameRepository.createRedisGame(gameId, dbGame, 60 * 60);
    await updatePlayerConnection(userColor, gameId);
  }

  // set userColor property for frontend
  dbGame.userColor = userColor;
  return { game: dbGame };
};

const getMoves = async (gameId, cursor = null, take = 20) => {
  let game = await gameRepository.getRedisGame(gameId);

  // fallback to DB
  if (!game) {
    game = await gameRepository.findGameById(gameId);
  }

  if (!game) {
    throw new AppError("Game not found.", 404);
  }

  const movesKey = REDIS_KEYS.gameMoves(gameId);

  let moves = [];

  // ACTIVE game use Redis
  const parsedCursor = cursor ? parseInt(cursor, 10) : null;
  if (game.status === "ACTIVE") {
    const totalMoves = game.version;

    let start;
    let end;

    if (!parsedCursor) {
      // latest moves
      start = Math.max(0, totalMoves - take);
      end = totalMoves - 1;
    } else {
      // older moves before cursor
      start = Math.max(0, parsedCursor - take - 1);
      end = parsedCursor - 2;
    }

    const cachedMoves = await redis.lrange(movesKey, start, end);

    moves = cachedMoves.map((move) => JSON.parse(move));

    const nextCursor = moves.length > 0 ? moves[0].moveNumber : null;

    return {
      moves,
      nextCursor,
      hasMore: start > 0,
      source: "redis",
    };
  }

  // FINISHED game use db
  let dbMoves = await gameRepository.findMoves({
    where: { gameId },
    ...(parsedCursor && {
      cursor: {
        gameId_moveNumber: {
          gameId,
          moveNumber: parsedCursor,
        },
      },
      skip: 1,
    }),
    orderBy: {
      moveNumber: "desc",
    },
    take,
  });

  dbMoves = dbMoves.reverse();

  return {
    moves: dbMoves,
    nextCursor: dbMoves.length > 0 ? dbMoves[0].moveNumber : null,
    hasMore: dbMoves.length === take,
    source: "db",
  };
};
export default { getGame, getMoves };
