import Redis from "ioredis";
import connection from "../config/redis.js";
import redis from "../config/redis.js";

const queueOptions = {
  connection: redis.duplicate(), // Use a separate Redis connection for the queue
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export default queueOptions;
