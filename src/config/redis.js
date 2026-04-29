import Redis from "ioredis";

const connectionString = process.env.REDIS_URL;

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,

  tls: {
    rejectUnauthorized: false,
  },
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default redis;
