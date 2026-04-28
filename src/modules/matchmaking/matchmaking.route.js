import { Router } from "express";
import matchmakingController from "./matchmaking.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";

const matchmakingRouter = Router();

matchmakingRouter.use(authenticate);

matchmakingRouter.post("/new-game", matchmakingController.newGame);

export default matchmakingRouter;
