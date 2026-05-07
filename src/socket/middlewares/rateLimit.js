import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";

const rateLimitSocket = (socket) => {
  return async (packet, next) => {
    const userId = socket.user.userId;
    const key = REDIS_KEYS.socketRateLimit(userId);
    // increment the user's socket event by one
    const count = await redis.incr(key);

    // if this is the first event triggered by user then expire the event count in 1 second
    if (count == 1) {
      await redis.expire(key, 1);
    }

    // if count is more than SOCKET_RATE_LIMIT then throw error
    if (count > 20) {
      next(new Error("Too many requests"));
    }

    next();
  };
};

export default rateLimitSocket;
