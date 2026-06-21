import redis from "../config/redis.js";
import authenticateSocket from "../middlewares/socketAuth.middleware.js";
import handleSocketConnection from "./handlers/connection.handler.js";
import handleMove from "./handlers/move.handler.js";
import handleGame from "./handlers/game.handler.js";
import handleReservationAck from "./handlers/reservation.handler.js";
import eventGuard from "./middlewares/eventGuard.js";
import rateLimitSocket from "./middlewares/rateLimit.js";
import rateLimit from "./middlewares/rateLimit.js";

const setupSocket = (io) => {
  io.use(authenticateSocket);

  io.on("connection", async (socket) => {
    // register socket middlewares
    socket.use(eventGuard(socket));
    socket.use(rateLimitSocket(socket));

    // register socket handlers
    handleSocketConnection(socket);
    handleReservationAck(socket);
    handleGame(socket);
    handleMove(socket);
  });
};

export default setupSocket;
