import { verifyToken } from "../utils/token.js";

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Token not found"));
  }

  const verifyTokenResult = verifyToken(token);

  if (!verifyTokenResult) {
    return next(new Error("Invalid or expired token. Please login again"));
  }

  socket.user = verifyTokenResult;

  next();
};

export default authenticateSocket;
