import { Chess } from "chess.js";
import redis from "../../config/redis";
import { REDIS_KEYS } from "../../constants/keys";
import moveQueue from "../../queues/move.queue";
import acquireLock from "../../utils/acquireLock";
import releaseLock from "../../utils/releaseLock";
import PIECE_MAP from "../../constants/pieces";

const handleMove = async (socket) => {
  socket.on("MAKE_MOVE", async (data, callback) => {
    try {
      const { gameId, from, to, promotion, version, timeSpent, timestamp } =
        data;
      if (!gameId) {
        throw new Error("Game ID is required.");
      }

      // Acquire a lock for the game to prevent concurrent modifications
      const lockKey = REDIS_KEYS.lock("game", data.gameId);
      const acquired = await acquireLock(lockKey, 5);

      if (!acquired) {
        throw new Error("Game is busy. Please try again.");
      }

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

      // if the game version is not same as the client version, return error
      if (version !== game.version) {
        throw new Error("STALE_STATE");
      }

      // recreate the chess board with client fen to validate
      const chess = new Chess(game.fen);

      // validate the move
      const result = chess.move({
        from: from,
        to: to,
        promotion: promotion,
      });

      if (!result) {
        throw new Error("Illegal move.");
      }

      const move = {
        moveNumber: Math.ceil(chess.history().length / 2), // full move number
        piece: PIECE_MAP[result.piece],
        player: result.color === "w" ? "WHITE" : "BLACK",
        from: result.from,
        to: result.to,
        captured: result.captured ? result.captured.toUpperCase() : null,
        promotion: result.promotion ? result.promotion.toUpperCase() : null,
        castle: result.flags.includes("k")
          ? "KINGSIDE"
          : result.flags.includes("q")
            ? "QUEENSIDE"
            : null,
        fenAfter: chess.fen(),
        san: result.san,
        uci: `${result.from}${result.to}${result.promotion ?? ""}`,
        timeSpent: timeSpent,
        timestamp: timestamp,
        isCheck: chess.isCheck(),
        isCheckmate: chess.isCheckmate(),
        isStalemate: chess.isStalemate(),
      };

      // update the game state in redis
      game.fen = chess.fen();
      game.version = game.version + 1;
      game.turn = result.color === "w" ? "BLACK" : "WHITE"; // next player's turn

      // Handle game-ending conditions
      if (move.isCheckmate) {
        game.status = "COMPLETED";
        game.result = result.color === "w" ? "1-0" : "0-1";
      } else if (move.isStalemate || chess.isDraw()) {
        game.status = "COMPLETED";
        game.result = "1/2-1/2";
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
      socket
        .to(gameId)
        .emit("MOVE_MADE", { move, fen: game.fen, version: game.version });

      callback?.({ success: true, move, fen: game.fen, version: game.version });
    } catch (error) {
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
