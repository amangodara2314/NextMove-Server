import AppError from "../../utils/AppError";
import ratingRepository from "./rating.repository";

const getUserRatings = async (userId) => {
  const ratings = await ratingRepository.getUserRatings(userId, {
    select: {
      type: true,
      rating: true,
      gamesPlayed: true,
      wins: true,
      losses: true,
      draws: true,
    },
  });

  if (!ratings || ratings.length === 0) {
    throw new AppError(`No ratings found`, 404);
  }

  return ratings;
};

export default { getUserRatings };
