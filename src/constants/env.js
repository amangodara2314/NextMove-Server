import dotenv from "dotenv";
dotenv.config();

export const ACCESS_TOKEN_EXPIRES_IN =
  process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

export const REFRESH_TOKEN_EXPIRES_IN =
  process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export const SALT_ROUNDS = process.env.SALT_ROUNDS || 10;

export const JWT_SECRET = process.env.JWT_SECRET;

export const MATCHMAKING_TIMEOUT = process.env.MATCHMAKING_TIMEOUT || 60;

export const RATING_RANGE = process.env.RATING_RANGE || 200;
