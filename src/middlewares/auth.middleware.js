import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/token.js";

const authenticate = async (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];

  if (!token) {
    throw new AppError("Token not found", 401);
  }

  let decoded = null;

  decoded = verifyToken(token);

  if (!decoded) {
    throw new AppError("Invalid or expired token. Please login again", 401);
  }

  req.user = decoded;
  req.token = token;

  next();
};

export default authenticate;
