import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import gameController from "./game.controller.js";

const gameRouter = Router();

gameRouter.use(authenticate);

gameRouter.get("/", gameController.getGame);

export default gameRouter;
