import prisma from "../../config/prisma.js";

const createUser = async (tx, data) => {
  const db = tx || prisma;
  return await db.user.create({ data });
};

const findUserByEmail = async (email, options) => {
  return await prisma.user.findUnique({ where: { email }, ...options });
};

const createSession = async (data) => {
  return await prisma.session.create({ data });
};

const findSession = async (query) => {
  return await prisma.session.findFirst(query);
};

const updateSession = async (where, data) => {
  return await prisma.session.update({ where, data });
};

const findUserById = async (userId, options) => {
  return await prisma.user.findUnique({ where: { id: userId }, ...options });
};

export default {
  createUser,
  findUserByEmail,
  createSession,
  findSession,
  updateSession,
  findUserById,
};
