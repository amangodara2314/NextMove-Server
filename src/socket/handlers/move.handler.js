import { Chess } from "chess.js";
import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import moveQueue from "../../queues/move.queue.js";
import acquireLock from "../../utils/acquireLock.js";
import releaseLock from "../../utils/releaseLock.js";
import PIECE_MAP from "../../constants/pieces.js";
import { GameStatus, PlayerColor } from "@prisma/client";
import { prepareDateForDb } from "../../utils/prepareDateForDb.js";
import gameRepository from "../../modules/game/game.repository.js";
import createMove from "../validations/move.validation.js";
import { io } from "../../app.js";
import { endGame, generateMovePayload, isPromotion } from "../../utils/game.js";

const handleMove = async (socket) => {
  socket.on("MAKE_MOVE", async (data, callback) => {
    // Validate data object using zod
    const result = createMove.safeParse(data);
    if (!result.success) {
      callback?.({
        success: false,
        message: result?.error?.issues[0]?.message || "Validation error",
      });
    }
    const { gameId, from, to, promotion, version, timeSpent, timestamp } = data;
    if (!gameId) {
      throw new Error("Game ID is required.");
    }

    // Acquire a lock for the game to prevent concurrent modifications
    const lockKey = REDIS_KEYS.lock("game", data.gameId);
    const acquired = await acquireLock(lockKey, 5);

    if (!acquired) {
      throw new Error("Game is busy. Please try again.");
    }
    try {
      // Fetch the current game state from Redis
      const gameKey = REDIS_KEYS.game(gameId);
      const cachedGame = await redis.get(gameKey);

      if (!cachedGame) {
        throw new Error("Game state not found.");
      }

      const game = JSON.parse(cachedGame);
      // if the game is not active, return error
      if (game && game.status !== "ACTIVE") {
        throw new Error("Game is not active.");
      }

      game.version = Number(game.version); // ensure version is a number for comparison

      // if the game version is not same as the client version, return error
      if (Number(version) !== game.version) {
        throw new Error("STALE_STATE");
      }

      // recreate the chess board with client fen to validate
      const chess = new Chess(game.fen);

      // validate the move

      const validateMove = {
        from,
        to,
        promotion: isPromotion(from, to, chess)
          ? (promotion ?? "q")
          : undefined,
      };
      const result = chess.move(validateMove);

      if (!result) {
        throw new Error("Illegal move.");
      }

      const move = generateMovePayload(
        game.version + 1,
        result,
        chess,
        timeSpent,
        timestamp,
      );

      // update the game state in redis
      game.fen = chess.fen();
      game.version = game.version + 1;
      game.turn = result.color === "w" ? PlayerColor.BLACK : PlayerColor.WHITE; // next player's turn

      // Handle game-ending conditions
      if (move.isCheckmate) {
        const dbResult = result.color === "w" ? "1-0" : "0-1";
        await endGame(game, GameStatus.FINISHED, dbResult);
      } else if (move.isStalemate || chess.isDraw()) {
        await endGame(game, GameStatus.FINISHED, "1/2-1/2");
      }

      // Atomically store moves list and updated game
      const movesKey = REDIS_KEYS.gameMoves(gameId);
      await redis
        .multi()
        .rpush(movesKey, JSON.stringify(move))
        .set(gameKey, JSON.stringify(game))
        .exec();

      // Queue DB write
      await moveQueue.add("move", { ...move, gameId });

      // Broadcast to opponent
      io.to(gameId).emit("MOVE_MADE", {
        move,
        fen: game.fen,
        version: game.version,
      });
      const response = {
        move,
        fen: game.fen,
        version: game.version,
      };
      if (
        game.status === GameStatus.FINISHED ||
        game.status === GameStatus.ABORTED
      ) {
        response.gameOver = true;
        response.gameStatus = game.status;
        response.gameResult = game.result;
      }
      callback?.({ success: true, ...response });
    } catch (error) {
      console.error("error in move handler", error);
      callback?.({
        success: false,
        message:
          error.message || "An error occurred while processing the move.",
      });
    } finally {
      // Release the lock
      await releaseLock(lockKey, acquired);
    }
  });
};

export default handleMove;
