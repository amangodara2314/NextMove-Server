import { successResponse } from "../../utils/apiResponse.js";
import AppError from "../../utils/AppError.js";
import gameService from "./game.service.js";

const getGame = async (req, res) => {
  const { gameId } = req.params;
  const userId = req.user.userId;
  if (!gameId) {
    throw new AppError("Game is required");
  }
  const result = await gameService.getGame(gameId, userId);

  return successResponse(res, 200, result, "Game found");
};

const getMoves = async (req, res) => {
  const { gameId } = req.params;
  const { cursor } = req.query;
  const result = await gameService.getMoves(gameId, cursor);

  return successResponse(res, 200, result, "Moves found");
};

const checkPlayerTimeout = async (req, res) => {
  const { gameId } = req.params;
  const userId = req.user.userId;
  const result = await gameService.checkPlayerTimeout(gameId, userId);
  return successResponse(res, 200, result, "Player timeout checked");
};

export default { getGame, getMoves, checkPlayerTimeout };
