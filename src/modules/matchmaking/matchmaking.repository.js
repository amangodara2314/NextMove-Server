import prisma from "../../config/prisma.js";
import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";

const createGame = async (data) => {
  return await prisma.game.create({
    data,
  });
};

const createReservation = async (key, data, ttl) => {
  await redis.hset(key, data.reservationId, JSON.stringify(data));

  return data;
};

export default { createGame, createReservation };
