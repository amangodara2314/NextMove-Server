import { successResponse } from "../../utils/apiResponse.js";
import matchmakingService from "./matchmaking.service.js";

const newGame = async (req, res) => {
  const userId = req.user.userId;
  const timeControl = req.body.timeControl;
  const result = await matchmakingService.newGame(userId, timeControl);
  const message = result.matchFound ? "Opponent found" : "Waiting for opponent";
  return successResponse(res, 200, result, message);
};

const getTimeControlSettings = (req, res) => {
  const settings = matchmakingService.getTimeControlSettings();
  return successResponse(res, 200, settings, "Settings Found");
};

export default { newGame, getTimeControlSettings };
