import { io } from "../app.js";
import redis from "../config/redis.js";
import { REDIS_KEYS } from "../constants/keys.js";
import { notify } from "../utils/notifier.js";

const handleMatchmakingTimeoutJob = async (job) => {
  try {
    const { userId, timeControl } = job.data;

    console.log(
      `Handling matchmaking timeout for user ${userId} for timeControl ${timeControl}`,
    );

    // check if user is still in the queue
    const queueKey = REDIS_KEYS.matchmakingQueue(timeControl);
    const joinedAtKey = REDIS_KEYS.matchmakingJoinedAt();
    const userMatchmakingQueueKey = REDIS_KEYS.userMatchmakingQueue(userId);

    // check and remove if expired
    const removed = await redis.zrem(queueKey, userId);
    await Promise.all([
      redis.zrem(joinedAtKey, userId),
      redis.del(userMatchmakingQueueKey),
    ]);

    if (removed) {
      console.log(
        `User ${userId} removed from matchmaking queue due to timeout`,
      );
      // Notify the user via WebSockets
      notify({
        event: "NO_MATCH_FOUND",
        room: userId,
        payload: { message: "We couldn't find a match for you in time." },
      });
    }
  } catch (error) {
    console.error(
      `Error handling matchmaking timeout for user ${job.data.userId}:`,
      error,
    );
    throw error; // rethrow the error to let BullMQ handle retries if configured
  }
};

export default handleMatchmakingTimeoutJob;
