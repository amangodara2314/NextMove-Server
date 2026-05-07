// generate redis keys by passing arguments
// for example getRedisKey("game","room",id) will return "game:room:9sdfva8asdkf"

const getRedisKey = (...args) => {
  return args.filter((v) => v !== undefined || v !== null).join(":");
};

const REDIS_KEYS = {
  matchmakingQueue: () => getRedisKey("matchmaking", "queue"),
  matchmakingJoinedAt: () => getRedisKey("matchmaking", "joinedAt"),
  userSockets: (userId) => getRedisKey("user", userId, "sockets"),
  socketRateLimit: (userId) => getRedisKey("rate", "socket", userId),
};

export { REDIS_KEYS };
