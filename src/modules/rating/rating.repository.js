import prisma from "../../config/prisma.js";

const getUserRating = async (userId, type, options = {}) => {
  return await prisma.userRating.findUnique({
    where: { userId, type },
    ...options,
  });
};

const getUserRatings = async (userId, options) => {
  const { where = {}, ...ops } = options;
  where.userId = userId;
  return await prisma.userRating.findMany({
    where,
    ...ops,
  });
};

export default { getUserRating, getUserRatings };
