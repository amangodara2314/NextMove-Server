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

const offerDraw = async (req, res) => {
  const { gameId } = req.params;
  const userId = req.user.userId;
  const result = await gameService.offerDraw(gameId, userId);
  return successResponse(res, 200, result, "Draw offer sent");
};

const acceptDraw = async (req, res) => {
  const { gameId } = req.params;
  const userId = req.user.userId;
  const result = await gameService.acceptDraw(gameId, userId);
  return successResponse(res, 200, result, "Draw accepted");
};

const getRecentGames = async (req, res) => {
  const userId = req.user.userId;
  const { take = 10 } = req.query;
  if (isNaN(take) || take <= 0 || take > 10) {
    throw new AppError(
      "Invalid 'take' parameter. It must be a positive number. Maximum allowed value is 10.",
    );
  }
  const result = await gameService.getRecentGames(userId, take);
  return successResponse(res, 200, result, "Recent games found");
};

export default {
  getGame,
  getMoves,
  checkPlayerTimeout,
  offerDraw,
  acceptDraw,
  getRecentGames,
};
