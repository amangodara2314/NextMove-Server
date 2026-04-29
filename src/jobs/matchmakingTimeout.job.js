import { io } from "../app.js";
import redis from "../config/redis.js";
import { REDIS_KEYS } from "../constants/keys.js";

const handleMatchmakingTimeoutJob = async (job) => {
  const { userId } = job.data;

  console.log(`Handling matchmaking timeout for user ${userId}`);

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

export default handleMatchmakingTimeoutJob;
