import { io } from "../app.js";
import redis from "../config/redis.js";
import { REDIS_KEYS } from "../constants/keys.js";
import { notify } from "../utils/notifier.js";

const notifyPlayer = async (userId) => {
  const socketKey = REDIS_KEYS.userSocket(userId);
  const socketId = await redis.get(socketKey);
  notify({
    event: "NO_MATCH_FOUND",
    room: socketId,
  });
};

const handleReservationTimeoutJob = async (job) => {
  const data = job.data;

  // find the reservation
  const key = REDIS_KEYS.reservation(data.reservationId);
  const reservation = await redis.hgetall(key);

  // return if reservation not found
  if (!reservation) {
    return;
  }

  // if any player's ACK is set to true send them socket event to notify
  if (reservation.player1Ack === "true") {
    await notifyPlayer(reservation.player1);
  }

  if (reservation.player2Ack === "true") {
    await notifyPlayer(reservation.player2);
  }

  await redis.del(key);
};

export default handleReservationTimeoutJob;
