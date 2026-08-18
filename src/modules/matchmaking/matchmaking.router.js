import { Router } from "express";
import matchmakingController from "./matchmaking.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/zodValidator.middleware.js";
import matchmakingSchema from "./matchmaking.validations.js";

const matchmakingRouter = Router();

matchmakingRouter.use(authenticate);

matchmakingRouter.post(
  "/new-game",
  validate(matchmakingSchema),
  matchmakingController.newGame,
);
matchmakingRouter.get(
  "/settings",
  matchmakingController.getTimeControlSettings,
);

export default matchmakingRouter;
