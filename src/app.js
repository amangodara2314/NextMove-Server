import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import { createServer } from "http";
import { Server } from "socket.io";
import handleSocketEvents from "./utils/io.js";
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

handleSocketEvents(io);

app.use((req, res, next) => {
  // attack io to the req object to access it in routes
  req.io = io;
  next();
});

app.use("/", router);

app.use(errorMiddleware);

export { io };
export default httpServer;
