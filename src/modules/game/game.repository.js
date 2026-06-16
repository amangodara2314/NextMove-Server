import prisma from "../../config/prisma.js";

const createGame = async (data) => {
  return await prisma.game.create({ data });
};

const findGameById = async (gameId, { where, ...query }) => {
  return await prisma.game.findUnique({
    where: { id: gameId, ...where },
    ...query,
  });
};

const getGameFen = async (gameId) => {
  return await prisma.move.findFirst({
    where: { gameId },
    orderBy: { createdAt: "desc" },
    select: { fenAfter: true },
  });
};

export default { createGame, findGameById, getGameFen };
