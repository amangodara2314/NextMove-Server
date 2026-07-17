// generate redis keys by passing arguments
// for example getRedisKey("game","room",id) will return "game:room:9sdfva8asdkf"

const getRedisKey = (...args) => {
  return args.filter((v) => v !== undefined || v !== null).join(":");
};

const REDIS_KEYS = {
  matchmakingQueue: (timeControl) =>
    getRedisKey("matchmaking", "queue", timeControl),
  matchmakingJoinedAt: () => getRedisKey("matchmaking", "joinedAt"),
  userMatchmakingQueue: (userId) =>
    getRedisKey("user", userId, "matchmakingQueue"),
  userSocket: (userId) => getRedisKey("user", userId, "socket"),
  socketRateLimit: (userId) => getRedisKey("rate", "socket", userId),
  reservation: (reservationId) => getRedisKey("reservations", reservationId),
  game: (gameId) => getRedisKey("game", gameId),
  gameMoves: (gameId) => getRedisKey("game", gameId, "moves"),
  userActiveGame: (userId) => getRedisKey("activeGame", userId),
  lock: (resource, resourceId) => getRedisKey("lock", resource, resourceId),
};

export { REDIS_KEYS };
