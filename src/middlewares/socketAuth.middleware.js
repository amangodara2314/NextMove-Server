import { verifyToken } from "../utils/token.js";

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("INVALID_TOKEN"));
  }

  const verifyTokenResult = verifyToken(token);

  if (!verifyTokenResult) {
    return next(new Error("INVALID_TOKEN"));
  }

  socket.user = verifyTokenResult;

  next();
};

export default authenticateSocket;
