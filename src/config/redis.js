import Redis from "ioredis";

const connectionString = process.env.REDIS_URL;

// const options = {
//   tls: {
//     rejectUnauthorized: false,
//   },
// };

const redis = new Redis(connectionString, {
  maxRetriesPerRequest: null, // required for BullMQ
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export default redis;
