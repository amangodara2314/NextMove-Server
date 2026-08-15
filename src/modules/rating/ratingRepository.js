import prisma from "../../config/prisma";

const getUserRating = async (userId, type, options = {}) => {
  return await prisma.userRating.findUnique({
    where: { userId, type },
    ...options,
  });
};

export default { getUserRating };
