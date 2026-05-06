import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";

const handleSocketConnection = async (socket) => {
  const userId = socket.user.id;
  const key = REDIS_KEYS.userSockets(userId);
  await redis.sadd(key, socket.id);

  socket.on("disconnect", async () => {
    await redis.srem(key, socket.id);
    console.log("socket disconnected :", socket.id);
  });
};

export default handleSocketConnection;
