import { successResponse } from "../../utils/apiResponse.js";
import matchmakingService from "./matchmaking.service.js";

const newGame = async (req, res) => {
  const userId = req.user.userId;
  const result = await matchmakingService.newGame(userId);
  const message = result.matchFound ? "Opponent found" : "Waiting for opponent";
  return successResponse(res, 200, result, message);
};

export default { newGame };
