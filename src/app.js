import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import { createServer } from "http";
import { Server } from "socket.io";
import setupSocket from "./socket/index.js";
import { FRONTEND_URL } from "./constants/env.js";
import redis, { pubClient, subClient } from "./config/redis.js";
import { createAdapter } from "@socket.io/redis-adapter";
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  adapter: createAdapter(pubClient, subClient),
  cors: {
    origin: FRONTEND_URL,
  },
});

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

setupSocket(io);

app.use((req, res, next) => {
  // attack io to the req object to access it in routes
  req.io = io;
  next();
});

app.use("/api", router);

app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

app.use(errorMiddleware);

export { io };
export default httpServer;
