import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import AppError from "../../utils/AppError.js";
import matchmakingRepository from "./matchmaking.repository.js";
import gameRepository from "../game/game.repository.js";
import authRepository from "../auth/auth.repository.js";
import luaScript from "../../constants/luaScript.js";
import matchmakingTimeoutQueue from "../../queues/matchmakingTimeout.queue.js";
import { MATCHMAKING_TIMEOUT, RATING_RANGE } from "../../constants/env.js";

const newGame = async (userId) => {
  if (!userId) {
    throw new AppError("userId not found", 404);
  }

  const user = await authRepository.findUserById(userId, {
    select: {
      id: true,
      username: true,
      rating: true,
    },
  });

  const rating = user.rating;

  // check if the user is already in matchmaking queue
  const queueKey = REDIS_KEYS.matchmakingQueue();
  const joinedAtKey = REDIS_KEYS.matchmakingJoinedAt();

  const opponent = await redis.eval(
    luaScript,
    2,
    queueKey,
    joinedAtKey,
    userId,
    rating,
    Date.now(),
    RATING_RANGE,
    MATCHMAKING_TIMEOUT * 1000,
  );

  // if opponent is not null, it means a match is found
  if (opponent) {
    // get opponent details
    const opponentDetails = await authRepository.findUserById(opponent, {
      select: {
        id: true,
        username: true,
        rating: true,
      },
    });

    // create game with userId and opponent as opponentId
    function pick0Or1() {
      return Math.floor(Math.random() * 2);
    }

    // choose user's color randomly
    const userColor = pick0Or1() === 1 ? "WHITE" : "BLACK";

    const data = {
      turn: "WHITE",
      white: userColor === "WHITE" ? userId : opponent,
      black: userColor === "BLACK" ? userId : opponent,
    };
    const game = await gameRepository.createGame(data);

    return { matchFound: true, opponent: opponentDetails };
  }
  // add the userId to matchmaking-timeout queue to notify user if no opponent is available
  await matchmakingTimeoutQueue.add(
    "matchmaking-timeout",
    { userId },
    { delay: MATCHMAKING_TIMEOUT * 1000 + 2 }, // added 2ms buffer time
  );

  return { matchFound: false };
};

export default { newGame };
