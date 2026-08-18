import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import ratingController from "./rating.controller.js";

const ratingRouter = Router();

ratingRouter.use(authenticate);

ratingRouter.get("/ratings", ratingController.getUserRatings);

export default ratingRouter;
