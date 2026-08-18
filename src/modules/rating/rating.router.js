import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware";
import ratingController from "./rating.controller";

const ratingRouter = Router();

ratingRouter.use(authenticate);

ratingRouter.get("/ratings", ratingController.getUserRatings);

export default ratingRouter;
