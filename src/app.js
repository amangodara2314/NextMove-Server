import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use("/", router);

app.use(errorMiddleware);

export default app;
