import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (data, expiresIn = "15m", options) => {
  return jwt.sign(data, JWT_SECRET, {
    expiresIn,
    ...options,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

export { generateToken, verifyToken };
