const luaScript = `
-- KEYS[1] = matchmaking queue key 
-- KEYS[2] = joinedAt queue key 

-- ARGV[1] = userId 
-- ARGV[2] = rating
-- ARGV[3] = now (timestamp in ms)
-- ARGV[4] = range (rating range)
-- ARGV[5] = timeout (ms)

local queueKey = KEYS[1]
local joinedAtKey = KEYS[2]

local userId = ARGV[1]
local rating = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local range = tonumber(ARGV[4])
local timeout = tonumber(ARGV[5])

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
        return candidate
    end
end

-- add user if not already present
local exists = redis.call("ZSCORE", queueKey, userId)

if not exists then 
    redis.call("ZADD", queueKey, rating, userId)
    redis.call("ZADD", joinedAtKey, now, userId)
end

return nil
`;

export default luaScript;
