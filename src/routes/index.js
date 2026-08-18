import { Router } from "express";
import authRouter from "../modules/auth/auth.routes.js";
import matchmakingRouter from "../modules/matchmaking/matchmaking.router.js";
import gameRouter from "../modules/game/game.router.js";
import ratingRouter from "../modules/rating/rating.router.js";
const router = Router();

router.use("/auth", authRouter);
router.use("/matchmaking", matchmakingRouter);
router.use("/game", gameRouter);
router.use("/ratings", ratingRouter);

export default router;
