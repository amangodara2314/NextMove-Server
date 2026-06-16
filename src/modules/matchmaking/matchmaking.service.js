import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import AppError from "../../utils/AppError.js";
import matchmakingRepository from "./matchmaking.repository.js";
import gameRepository from "../game/game.repository.js";
import authRepository from "../auth/auth.repository.js";
import { matchmakingLuaScript } from "../../constants/luaScript.js";
import matchmakingTimeoutQueue from "../../queues/matchmakingTimeout.queue.js";
import {
  MATCHMAKING_TIMEOUT,
  RATING_RANGE,
  RESERVATION_TTL,
} from "../../constants/env.js";
import { io } from "../../app.js";
import reservationTimeoutQueue from "../../queues/reservationTimeout.queue.js";
import { v4 as uuidv4 } from "uuid";

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
  const userStateKey = REDIS_KEYS.userState(userId);

  const opponent = await redis.eval(
    matchmakingLuaScript,
    3,
    queueKey,
    joinedAtKey,
    userStateKey,
    userId,
    rating,
    Date.now(),
    RATING_RANGE,
    MATCHMAKING_TIMEOUT * 1000,
  );

  // if opponent is not null, it means a match is found
  if (opponent) {
    // remove the opponent match timeout job if exists
    await matchmakingTimeoutQueue.remove(`matchmaking-timeout-${opponent}`);

    // create a reservation for both players with a short expiration time
    const reservationId = uuidv4();
    const key = REDIS_KEYS.reservation(reservationId);
    const data = {
      reservationId,
      player1: userId,
      player2: opponent,
      player1Ack: "false",
      player2Ack: "false",
      createdAt: Date.now(),
    };
    const reservation = await matchmakingRepository.createReservation(
      key,
      data,
    );
    // add the reservation to queue to for cleanup
    await reservationTimeoutQueue.add("reservation-timeout", reservation, {
      delay: RESERVATION_TTL * 1000 + 1,
    });

    const userSocket = await redis.get(REDIS_KEYS.userSocket(userId));
    const opponentSocket = await redis.get(REDIS_KEYS.userSocket(opponent));
    console.log("socket of user and opponent :", userSocket, opponentSocket);

    // Notify both players via WebSockets

    if (userSocket) {
      console.log("emitting to user socket :", userSocket, opponent);
      io.to(userSocket).emit("MATCH_FOUND", {
        message: "Opponent found! Please confirm your availability.",
        reservationId,
      });
    }

    if (opponentSocket) {
      console.log("emitting to opponent socket :", opponentSocket, userId);
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
    {
      delay: MATCHMAKING_TIMEOUT * 1000 + 2,
      jobId: `matchmaking-timeout-${userId}`,
    }, // added 2ms buffer time
  );

  return { matchFound: false };
};

export default { newGame };
