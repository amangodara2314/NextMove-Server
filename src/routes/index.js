import { Router } from "express";
import authRouter from "../modules/auth/auth.routes.js";
import matchmakingRouter from "../modules/matchmaking/matchmaking.route.js";
const router = Router();

router.use("/auth", authRouter);
router.use("/matchmaking", matchmakingRouter);

export default router;
