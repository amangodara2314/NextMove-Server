import { Router } from "express";
import authController from "./auth.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
const authRouter = Router();

authRouter.post("/google", authController.googleAuth);

authRouter.get("/refresh-token", authController.refreshToken);
authRouter.get("/me", authenticate, authController.getMe);
authRouter.put("/profile", authenticate, authController.updateProfile);

export default authRouter;
