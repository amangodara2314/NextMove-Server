import prisma from "../../config/prisma.js";
import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";

const createGame = async (data) => {
  return await prisma.game.create({ data });
};

const findGame = async (gameId, { where, ...query } = {}) => {
  return await prisma.game.findUnique({
    where: { id: gameId, ...where },
    ...query,
  });
};

const findGameById = async (gameId, query) => {
  return await prisma.game.findUnique({ where: { id: gameId }, ...query });
};

const getGameFen = async (gameId) => {
  return await prisma.move.findFirst({
    where: { gameId },
    orderBy: { createdAt: "desc" },
    select: { fenAfter: true },
  });
};

const countMoves = async (gameId) => {
  return await prisma.move.count({
    where: { gameId },
  });
};

const createMove = async (data) => {
  return await prisma.move.create({ data });
};

const updateGame = async (gameId, data) => {
  return await prisma.game.update({
    where: { id: gameId },
    data,
  });
};

const findUserActiveGame = async (userId) => {
  return await prisma.game.findFirst({
    where: {
      OR: [{ white: userId }, { black: userId }],
      status: "ACTIVE",
    },
  });
};

const findMoves = async (query) => {
  return await prisma.move.findMany(query);
};

const createRedisGame = async (gameId, data, expiresIn = 60 * 60) => {
  const key = REDIS_KEYS.game(gameId);
  const serialized = {
    ...data,
    whitePlayer: JSON.stringify(data?.whitePlayer),
    blackPlayer: JSON.stringify(data?.blackPlayer),
  };
  const pipeline = redis.pipeline();
  pipeline.hset(key, serialized);
  pipeline.expire(key, expiresIn); // expiresIn in seconds
  return await pipeline.exec();
};

const updateRedisGame = async (gameId, data) => {
  const key = REDIS_KEYS.game(gameId);
  const exists = await redis.exists(key);
  if (!exists) return null; // don't create a stray partial hash
  return await redis.hset(key, data);
};

const getRedisGame = async (gameId) => {
  const game = await redis.hgetall(REDIS_KEYS.game(gameId));
  if (Object.keys(game).length === 0) return null;
  return {
    ...game,
    version: Number(game.version),
    whiteConnected: game.whiteConnected === "true",
    blackConnected: game.blackConnected === "true",
    whitePlayer: game.whitePlayer ? JSON.parse(game.whitePlayer) : null,
    blackPlayer: game.blackPlayer ? JSON.parse(game.blackPlayer) : null,
  };
};

export default {
  createGame,
  findGame,
  getGameFen,
  countMoves,
  findUserActiveGame,
  createMove,
  updateGame,
  findMoves,
  findGameById,
  createRedisGame,
  getRedisGame,
  updateRedisGame,
};
