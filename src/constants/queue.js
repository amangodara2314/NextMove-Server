import Redis from "ioredis";
import connection from "../config/redis.js";
import redis from "../config/redis.js";

const queueOptions = {
  connection: redis,
  streams: {
    maxLenEvents: 0, // STOPS the expensive XTRIM writes seen in your logs
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: {
      count: 100,
    },
  },
};

export default queueOptions;
