import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";

const handleMatchmakingEvents = (socket) => {
  socket.on("CANCEL_MATCHMAKING", async (data) => {
    try {
      console.log("[CANCEL_MATCHMAKING] received", {
        data,
        socketId: socket.id,
        user: socket.user && socket.user.userId,
      });
      const userId = socket.user.userId;
      const userMatchmakingQueueKey = REDIS_KEYS.userMatchmakingQueue(userId);
      const userQueue = await redis.get(userMatchmakingQueueKey);
      if (!userQueue) {
        console.log("User does not exists in this the queue ", userQueue);
        return;
      }
      const queueKey = REDIS_KEYS.matchmakingQueue(userQueue);
      const joinedAtKey = REDIS_KEYS.matchmakingJoinedAt();

      console.log(
        `[CANCEL_MATCHMAKING] user ${userId} is cancelling matchmaking`,
      );

      await Promise.all([
        redis.zrem(queueKey, userId),
        redis.zrem(joinedAtKey, userId),
        redis.del(userMatchmakingQueueKey),
      ]);

      console.log(
        `[CANCEL_MATCHMAKING] user ${userId} has been removed from matchmaking queue`,
      );
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
