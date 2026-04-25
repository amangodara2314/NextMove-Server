import dotenv from "dotenv";
dotenv.config();

export const ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

export const REFRESH_TOKEN_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export const SALT_ROUNDS = process.env.SALT_ROUNDS || 10;

export const JWT_SECRET = process.env.JWT_SECRET;
