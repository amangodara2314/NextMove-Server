import prisma from "../../config/prisma";

const createUser = async (email, password) => {
  return await prisma.user.create({ data: { email, password } });
};

const findUserByEmail = async (email, options) => {
  return await prisma.user.findUnique({ where: { email }, ...options });
};

const createSession = async (data) => {
  return await prisma.session.create({ data });
};

export default { createUser, findUserByEmail, createSession };
