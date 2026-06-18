// generate redis keys by passing arguments
// for example getRedisKey("game","room",id) will return "game:room:9sdfva8asdkf"

const getRedisKey = (...args) => {
  return args.filter((v) => v !== undefined || v !== null).join(":");
};

const REDIS_KEYS = {
  matchmakingQueue: () => getRedisKey("matchmaking", "queue"),
  matchmakingJoinedAt: () => getRedisKey("matchmaking", "joinedAt"),
  userSocket: (userId) => getRedisKey("user", userId, "socket"),
  socketRateLimit: (userId) => getRedisKey("rate", "socket", userId),
  reservation: (reservationId) => getRedisKey("reservations", reservationId),
  userState: (userId) => getRedisKey("user", userId, "state"),
  game: (gameId) => getRedisKey("game", gameId),
  gameMoves: (gameId) => getRedisKey("game", gameId, "moves"),
  lock: (resource, resourceId) => getRedisKey("lock", resource, resourceId),
};

export { REDIS_KEYS };
