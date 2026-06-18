import crypto from "crypto";
import redis from "../config/redis.js";

/**
 * Acquire Lock
 * @param {String} key - Lock key
 * @param {Number} ttl - Time to live in seconds
 */

const acquireLock = async (key, ttl = 30) => {
  const lockId = crypto.randomUUID();
  const result = await redis.set(key, lockId, "NX", "PX", ttl);

  if (result === "OK") {
    return lockId; // Lock acquired successfully
  }
  return null; // Failed to acquire lock
};

export default acquireLock;
