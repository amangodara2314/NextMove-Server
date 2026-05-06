import redis from "../config/redis.js";
import authenticateSocket from "../middlewares/socketAuth.middleware.js";
import handleSocketConnection from "./handlers/connection.handler.js";
import eventGuard from "./middlewares/eventGuard.js";

const setupSocket = (io) => {
  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    // register socket middlewares
    socket.use(eventGuard(socket));

    // register socket handlers
    handleSocketConnection(socket);
  });
};

export default setupSocket;
