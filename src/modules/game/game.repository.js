import prisma from "../../config/prisma.js";

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
};
