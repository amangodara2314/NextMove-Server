import createMove from "../validations/move.validation.js";
import { io } from "../../app.js";
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
