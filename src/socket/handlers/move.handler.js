import { Chess } from "chess.js";
import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import moveQueue from "../../queues/move.queue.js";
import acquireLock from "../../utils/acquireLock.js";
import releaseLock from "../../utils/releaseLock.js";
import PIECE_MAP from "../../constants/pieces.js";
import { GameResult, GameStatus, PlayerColor } from "@prisma/client";
import { prepareDateForDb } from "../../utils/prepareDateForDb.js";
import gameRepository from "../../modules/game/game.repository.js";
import createMove from "../validations/move.validation.js";
import { io } from "../../app.js";
import calculatePlayerTime from "../../utils/calculatePlayerTime.js";
import playerTimeoutQueue from "../../queues/playerTimeoutQueue.js";
import { generateMovePayload, isPromotion } from "../../utils/move.js";
import gameService from "../../modules/game/game.service.js";

const handleMoveEvents = async (socket) => {
  socket.on("MAKE_MOVE", async (data, callback) => {
    const validation = createMove.safeParse(data);
    if (!validation.success) {
      return callback?.({
        success: false,
        message: validation.error?.issues[0]?.message || "Validation error",
      });
    }

    const { gameId } = data;

    try {
      const { response, broadcastEvent, broadcastPayload } =
        await gameService.makeMove(gameId, data);

      io.to(gameId).emit(broadcastEvent, broadcastPayload);
      callback?.({ success: true, ...response });
    } catch (error) {
      console.error("error in move handler", error);

      callback?.({
        success: false,
        message:
          error.message || "An error occurred while processing the move.",
      });
    }
  });
};

export default handleMoveEvents;
