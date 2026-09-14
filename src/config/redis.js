import Redis from "ioredis";

const connectionString = process.env.REDIS_URL;

const baseOptions = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
  username: "default",
  password: process.env.REDIS_PASSWORD,
};

const commonOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 200, 5000); // backoff, cap at 5s
  },
};

const redis = connectionString
  ? new Redis(connectionString, commonOptions)
  : new Redis({ ...baseOptions, ...commonOptions });

// Redis pub/sub configuration

const pubClient = connectionString
  ? new Redis(connectionString)
  : new Redis(baseOptions);
const subClient = pubClient.duplicate();

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});
export { pubClient, subClient };
export default redis;
