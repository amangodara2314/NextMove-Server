// import gameService from "./game.service";

import { successResponse } from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import gameService from "./game.service.js";

const getGame = async (req, res) => {
  const { gameId } = req.query;
  const userId = req.user.userId;
  if (!gameId) {
    throw new AppError("Game is required");
  }
  const result = await gameService.getGame(gameId, userId);

  return successResponse(res, 200, result, "Game found");
};

export default { getGame };
