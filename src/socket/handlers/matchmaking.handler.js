import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";

const handleMatchmakingEvents = (socket) => {
  socket.on("CANCEL_MATCHMAKING", async (data) => {
    try {
      const userId = socket.user.userId;
      const userMatchmakingQueueKey = REDIS_KEYS.userMatchmakingQueue(userId);
      const userQueue = await redis.get(userMatchmakingQueueKey);
      console.log(
        `User ${userId} is cancelling matchmaking for queue ${userQueue}`,
      );
      if (!userQueue) {
        console.info(
          `User ${userId} is not in matchmaking queue, no need to cancel`,
        );
        return;
      }

      console.log(
        `User ${userId} is cancelling matchmaking for queue ${userQueue}`,
      );

      const queueKey = REDIS_KEYS.matchmakingQueue(userQueue);
      const joinedAtKey = REDIS_KEYS.matchmakingJoinedAt();

      await Promise.all([
        redis.zrem(queueKey, userId),
        redis.zrem(joinedAtKey, userId),
        redis.del(userMatchmakingQueueKey),
      ]);
    } catch (error) {
      console.error("[CANCEL_MATCHMAKING] error", {
        error,
        data,
        socketId: socket.id,
        user: socket.user && socket.user.userId,
      });
    }
  });
};

export default handleMatchmakingEvents;
