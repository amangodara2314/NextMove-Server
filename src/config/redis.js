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
    return Math.min(times * 200, 5000);
  },
};

function createClient() {
  return connectionString
    ? new Redis(connectionString, commonOptions)
    : new Redis({ ...baseOptions, ...commonOptions });
}

const redis = createClient();
const pubClient = createClient();
const subClient = pubClient.duplicate();

for (const [name, client] of [
  ["main", redis],
  ["pub", pubClient],
  ["sub", subClient],
]) {
  client.on("connect", () => console.log(`Redis (${name}) connected`));
  client.on("error", (err) =>
    console.error(`Redis (${name}) error:`, err.message),
  );
}

export { pubClient, subClient };
export default redis;
