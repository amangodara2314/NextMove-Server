import prisma from "../../config/prisma.js";

const createGame = async (data) => {
  return await prisma.game.create({
    data,
  });
};

export default { createGame };
