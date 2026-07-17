const matchmakingLuaScript = `
-- KEYS[1] = matchmaking queue key 
-- KEYS[2] = joinedAt queue key 
-- KEYS[3] = user matchmaking queue key

-- ARGV[1] = userId 
-- ARGV[2] = rating
-- ARGV[3] = now (timestamp in ms)
-- ARGV[4] = range (rating range)
-- ARGV[5] = timeout (ms)

local queueKey = KEYS[1]
local joinedAtKey = KEYS[2]
local userMatchmakingQueueKey = KEYS[3]
local userId = ARGV[1]
local rating = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local range = tonumber(ARGV[4])
local timeout = tonumber(ARGV[5])
local timeControl = ARGV[6]

-- Check if user is already in a match or reservation


-- Remove expired keys 

local expired = redis.call("ZRANGEBYSCORE", joinedAtKey, 0, now - timeout)

for i = 1, #expired do
    local p = expired[i]
    redis.call("ZREM",queueKey, p)
end

redis.call("ZREMRANGEBYSCORE", joinedAtKey, 0, now - timeout)

-- Find opponent in rating range

local minScore = rating - range
local maxScore = rating + range

local candidates = redis.call("ZRANGEBYSCORE", queueKey,minScore, maxScore, "LIMIT", 0, 5) 

for i = 1, #candidates do
    local candidate = candidates[i]

    if candidate ~= userId then 
        -- match found
        redis.call("ZREM", queueKey, candidate)
        redis.call("ZREM", joinedAtKey, candidate)
        redis.call("DEL", userMatchmakingQueueKey)
        return candidate
    end
end

-- add user if not already present
local exists = redis.call("ZSCORE", queueKey, userId)

if not exists then 
    redis.call("ZADD", queueKey, rating, userId)
    redis.call("ZADD", joinedAtKey, now, userId)
    redis.call("SET", userMatchmakingQueueKey, timeControl, "PX", timeout)
end

return nil
`;

const reservationLuaScript = `
-- KEYS[1] = reservation key
-- ARGV[1] = userId
-- ARGV[2] = current timestamp (ms)
-- ARGV[3] = reservation ttl (seconds)

local key = KEYS[1]

if redis.call("EXISTS", key) == 0 then
    return {
        "NOT_FOUND"
    }
end

local reservation = redis.call("HGETALL", key)

local data = {}

for i = 1, #reservation, 2 do
    data[reservation[i]] = reservation[i + 1]
end

local createdAt = tonumber(data.createdAt)

if createdAt and createdAt < (tonumber(ARGV[2]) - tonumber(ARGV[3]) * 1000) then
    return {
        "EXPIRED"
    }
end

local userId = ARGV[1]

if data.player1 == userId then
    redis.call("HSET", key, "player1Ack", "true")
elseif data.player2 == userId then
    redis.call("HSET", key, "player2Ack", "true")
else
    return {
        "INVALID_PLAYER"
    }
end

local player1Ack = redis.call("HGET", key, "player1Ack")
local player2Ack = redis.call("HGET", key, "player2Ack")

if player1Ack == "true" and player2Ack == "true" then
    redis.call("DEL", key)

    return {
        "READY",
        data.player1,
        data.player2,
        data.timeControl
    }
end

return {
    "WAITING"
}
`;

const cancelMatchmakingLuaScript = `
-- KEYS[1] = matchmaking queue (ZSET)
-- KEYS[2] = matchmaking joinedAt (HASH)

-- ARGV[1] = userId

local removed = redis.call("ZREM", KEYS[1], ARGV[1])

if removed == 1 then
    redis.call("HDEL", KEYS[2], ARGV[1])
end

return removed
`;

export {
  matchmakingLuaScript,
  reservationLuaScript,
  cancelMatchmakingLuaScript,
};
