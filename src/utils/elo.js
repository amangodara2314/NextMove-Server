const K_FACTOR = 32;

const calculateExpectedScore = (playerRating, opponentRating) => {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
};

const calculateNewRating = (playerRating, opponentRating, actualScore) => {
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);

  return Math.round(playerRating + K_FACTOR * (actualScore - expectedScore));
};

export const calculateElo = ({ whiteRating, blackRating, result }) => {
  let whiteScore;
  let blackScore;

  if (result === "WHITE") {
    whiteScore = 1;
    blackScore = 0;
  } else if (result === "BLACK") {
    whiteScore = 0;
    blackScore = 1;
  } else {
    whiteScore = 0.5;
    blackScore = 0.5;
  }

  return {
    whiteRating: calculateNewRating(whiteRating, blackRating, whiteScore),

    blackRating: calculateNewRating(blackRating, whiteRating, blackScore),
  };
};
