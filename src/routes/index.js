import { Router } from "express";
import authRouter from "../modules/auth/auth.routes.js";
import matchmakingRouter from "../modules/matchmaking/matchmaking.route.js";
import gameRouter from "../modules/game/game.router.js";
const router = Router();

router.use("/auth", authRouter);
router.use("/matchmaking", matchmakingRouter);
router.use("/game", gameRouter);

export default router;
