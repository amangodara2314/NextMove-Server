import Redis from "ioredis";

const connectionString = process.env.REDIS_URL;

const baseOptions = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: "default",
  password: process.env.REDIS_PASSWORD,
};

const redis = new Redis({
  ...baseOptions,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 200, 5000); // backoff, cap at 5s
  },
});

// Redis pub/sub configuration

const pubClient = new Redis(baseOptions);
const subClient = pubClient.duplicate();

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});
export { pubClient, subClient };
export default redis;
