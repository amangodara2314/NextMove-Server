import { GameStatus, TimeControl } from "@prisma/client";
import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import gameRepository from "./game.repository.js";
import AppError from "../../utils/AppError.js";
import { INITIAL_FEN } from "../../constants/game.js";
import { io } from "../../app.js";
import { updatePlayerConnection } from "../../utils/reconnection.js";
import calculatePlayerTime from "../../utils/calculatePlayerTime.js";
import acquireLock from "../../utils/acquireLock.js";
import releaseLock from "../../utils/releaseLock.js";
import gameLogic from "../../utils/gameLogic.js";
import { scheduleGameJobs } from "../../utils/scheduleGameJobs.js";

const getActiveGame = async (gameId) => {
  const game = await gameRepository.getRedisGame(gameId);
  if (!game) throw new AppError("Game state not found.", 404);
  if (game.status !== GameStatus.ACTIVE)
    throw new AppError("Game is not active.", 400);
  game.version = Number(game.version);
  return game;
};

const makeMove = async (
  gameId,
  { from, to, promotion, version, timeSpent, timestamp },
) => {
  const lockKey = REDIS_KEYS.lock("game", gameId);
  const acquired = await acquireLock(lockKey, 5);
  if (!acquired) throw new AppError("Game is busy. Please try again.", 409);

  try {
    let game = await getActiveGame(gameId);
    gameLogic.assertVersionMatches(game, version);

    const { chess, moveResult } = gameLogic.validateChessMove(game.fen, {
      from,
      to,
      promotion,
    });
    const move = gameLogic.applyMoveToGameState(
      game,
      chess,
      moveResult,
      timeSpent,
      timestamp,
    );

    console.log(
      `Player ${moveResult.color} made move ${from}-${to} in game ${gameId}. Remaining - White: ${game.whiteTimeLeft}ms, Black: ${game.blackTimeLeft}ms`,
    );

    const ending = gameLogic.determineGameEnd(
      game,
      move,
      chess,
      moveResult.color,
    );
    let finishedGame = null;
    if (ending) {
      finishedGame = await gameRepository.finishGame(
        game,
        ending.status,
        ending.result,
      );
      game = { ...game, ...finishedGame };
    }

    await gameRepository.persistMove(gameId, move, game);
    await scheduleGameJobs(gameId, move, game);

    const response = gameLogic.buildResponse(game, move);

    return {
      response,
      broadcastEvent:
        game.status === GameStatus.TIMEOUT ? "PLAYER_TIMEOUT" : "MOVE_MADE",
      broadcastPayload:
        game.status === GameStatus.TIMEOUT ? finishedGame : response,
    };
  } finally {
    await releaseLock(lockKey, acquired);
  }
};

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

    calculatePlayerTime(game, game.turn);

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
  let dbGame = await gameRepository.findGame(gameId, query);

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
  calculatePlayerTime(dbGame, dbGame.turn);

  return { game: dbGame };
};

const getMoves = async (gameId, cursor = null, take = 20) => {
  let game = await gameRepository.getRedisGame(gameId);
  let source = "redis";

  // fallback to DB
  if (!game) {
    game = await gameRepository.findGameById(gameId);
    source = "db";
  }

  if (!game) {
    throw new AppError("Game not found.", 404);
  }

  const movesKey = REDIS_KEYS.gameMoves(gameId);

  let moves = [];

  // use redis if moves are cached, otherwise use db
  const parsedCursor = cursor ? parseInt(cursor, 10) : null;
  if (source === "redis") {
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
      source,
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
    source,
  };
};

const checkPlayerTimeout = async (gameId) => {
  // Check if the game exists in Redis
  let game = await gameRepository.getRedisGame(gameId);

  // If not found in Redis, check the database
  if (!game) {
    game = await gameRepository.findGameById(gameId);
  }

  if (!game) {
    throw new AppError("Game not found.", 404);
  }

  if (game.status !== GameStatus.ACTIVE) {
    return { status: game.status };
  }
  // check if any of the players have timed out
  calculatePlayerTime(game, game.turn);
  console.log(
    `Checking player timeout for game ${gameId}: White time left: ${game.whiteTimeLeft}, Black time left: ${game.blackTimeLeft}`,
  );
  if (Number(game.whiteTimeLeft) <= 0 || Number(game.blackTimeLeft) <= 0) {
    let lockKey = REDIS_KEYS.lock("game", gameId);
    let acquiredLock;
    try {
      acquiredLock = await acquireLock(lockKey, 5000); // 5 seconds lock
      if (!acquiredLock) {
        console.log(
          `Could not acquire lock for game ${gameId}. Another process is handling the timeout.`,
        );
        return { status: game.status };
      }
      // update the game status to TIMEOUT and set the winner
      const winner = game.whiteTimeLeft <= 0 ? "BLACK" : "WHITE";
      [game] = await Promise.all([
        gameRepository.finishGame(game, GameStatus.TIMEOUT, winner),
        gameRepository.cleanUpRedisKeys(gameId, game.white, game.black),
      ]);

      // clean up redis keys
    } catch (error) {
      console.error(
        `Error while handling player timeout for game ${gameId}:`,
        error,
      );
    } finally {
      // Release the lock
      if (acquiredLock) {
        await releaseLock(lockKey, acquiredLock);
      }
    }

    io.to(gameId).emit("PLAYER_TIMEOUT", game);
  }
  console.log(
    `Player timeout check completed for game ${gameId}: Status: ${game.status}, Winner: ${game.winner}`,
  );
  return { status: game.status, winner: game.winner || null };
};

const offerDraw = async (gameId, userId, offeredTo) => {
  let game = await gameRepository.getRedisGame(gameId);

  // validate game
  if (!game) {
    throw new AppError("Game not found");
  }

  if (game.status !== GameStatus.ACTIVE) {
    throw new AppError("Game is not active");
  }

  calculatePlayerTime(game);

  const playerTime =
    game.white === userId ? game.whiteTimeLeft : game.blackTimeLeft;

  if (playerTime === 0) {
    throw new AppError("You are out of time. you cannot offer draw");
  }

  const drawOffer = await gameRepository.createDrawOffer({
    gameId,
    offeredBy: userId,
    offeredTo,
  });

  if (!drawOffer) {
    throw new AppError("Cannot offer draw right now. Please try again later");
  }

  return { drawOffer };
};

const acceptDraw = async (gameId, userId) => {
  const lockKey = REDIS_KEYS.lock("game", gameId);
  let acquired = null;

  try {
    acquired = await acquireLock(lockKey, 10);
    const drawOfferKey = REDIS_KEYS.drawOffer(gameId);
    const offer = await redis.get(drawOfferKey);

    const drawOffer = offer ? JSON.parse(offer) : null;

    if (!drawOffer) {
      throw new AppError("No draw offer found for this game");
    }
    if (drawOffer.offeredBy === userId) {
      throw new AppError("Cannot accept your own draw offer");
    }

    if (drawOffer.offeredTo !== userId) {
      throw new AppError("You are not authorized to accept this draw offer");
    }

    let game = await gameRepository.getRedisGame(gameId);

    if (!game) {
      throw new AppError("Game not found");
    }

    if (game.status !== GameStatus.ACTIVE) {
      throw new AppError("Game is not active");
    }

    const [updatedGame] = await Promise.all([
      gameRepository.finishGame(game, GameStatus.DRAW, "DRAW"),
      gameRepository.cleanUpRedisKeys(gameId, game.white, game.black),
      redis.del(drawOfferKey),
    ]);

    io.to(gameId).emit("DRAW_ACCEPTED", updatedGame);

    return { game: updatedGame };
  } finally {
    if (acquired) {
      await releaseLock(lockKey, acquired);
    }
  }
};

export default {
  getGame,
  getMoves,
  checkPlayerTimeout,
  makeMove,
  getActiveGame,
};
