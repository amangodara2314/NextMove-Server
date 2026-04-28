import { Router } from "express";
import authController from "./auth.controller.js";
import validate from "../../middlewares/zodValidator.middleware.js";
import { createUserSchema, loginUserSchema } from "./auth.validations.js";
import authenticate from "../../middlewares/auth.middleware.js";
const authRouter = Router();

authRouter.post(
  "/register",
  validate(createUserSchema),
  authController.register,
);

authRouter.post("/login", validate(loginUserSchema), authController.login);
authRouter.get("/refresh-token", authController.refreshToken);

authRouter.get("/me", authenticate, authController.getMe);

export default authRouter;
