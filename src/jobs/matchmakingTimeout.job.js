import { io } from "../app";
import redis from "../config/redis";
import { REDIS_KEYS } from "../constants/keys";

const handleMatchmakingTimeout = async (job) => {
  const { userId } = job.data;

  // check if user is still in the queue
  const queueKey = REDIS_KEYS.matchmakingQueue();
  const joinedAtKey = REDIS_KEYS.matchmakingJoinedAt();

  // check and remove if expired
  const removed = await redis.zrem(queueKey, userId);
  await redis.zrem(joinedAtKey, userId);

  if (removed) {
    // Notify the user via WebSockets
    io.to(userId).emit("MATCHMAKING_TIMEOUT", {
      message: "We couldn't find a match for you in time.",
    });
  }
};

export default handleMatchmakingTimeout;
