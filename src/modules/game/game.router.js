import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import gameController from "./game.controller.js";

const gameRouter = Router();

gameRouter.use(authenticate);

gameRouter.get("/moves/:gameId", gameController.getMoves);
gameRouter.get("/check-timeout/:gameId", gameController.checkPlayerTimeout);
gameRouter.get("/:gameId", gameController.getGame);
gameRouter.post("/offer-draw/:gameId", gameController.offerDraw);
gameRouter.post("/accept-draw/:gameId", gameController.acceptDraw);

export default gameRouter;
