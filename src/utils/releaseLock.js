import redis from "../config/redis.js";

const releaseLock = async (lockKey, lockValue) => {
  if (!lockKey || !lockValue) {
    return;
  }

  const script = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;

  await redis.eval(script, 1, lockKey, lockValue);
};

export default releaseLock;
