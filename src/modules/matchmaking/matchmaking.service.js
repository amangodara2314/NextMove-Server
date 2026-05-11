import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import AppError from "../../utils/AppError.js";
import matchmakingRepository from "./matchmaking.repository.js";
import gameRepository from "../game/game.repository.js";
import authRepository from "../auth/auth.repository.js";
import luaScript from "../../constants/luaScript.js";
import matchmakingTimeoutQueue from "../../queues/matchmakingTimeout.queue.js";
import {
  MATCHMAKING_TIMEOUT,
  RATING_RANGE,
  RESERVATION_TTL,
} from "../../constants/env.js";
import { uuid } from "zod";
import { io } from "../../app.js";

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
    // create a reservation for both players with a short expiration time
    const reservationId = uuid();
    const key = REDIS_KEYS.reservation(reservationId);
    const data = {
      reservationId,
      player1: userId,
      player2: opponent.id,
      player1Ack: "false",
      player2Ack: "false",
      createdAt: Date.now(),
    };
    const reservation = await matchmakingRepository.createReservation(
      key,
      data,
      RESERVATION_TTL,
    );

    const userSocket = await redis.get(REDIS_KEYS.userSocket(userId));
    const opponentSocket = await redis.get(REDIS_KEYS.userSocket(opponent.id));

    // Notify both players via WebSockets

    if (userSocket) {
      io.to(userSocket).emit("MATCH_FOUND", {
        message: "Opponent found! Please confirm your availability.",
        reservationId,
      });
    }

    if (opponentSocket) {
      io.to(opponentSocket).emit("MATCH_FOUND", {
        message: "Opponent found! Please confirm your availability.",
        reservationId,
      });
    }

    return { matchFound: true, reservationId };
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
