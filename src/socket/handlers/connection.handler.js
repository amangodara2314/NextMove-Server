import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";

const handleSocketConnection = async (socket) => {
  const userId = socket.user.userId;
  const key = REDIS_KEYS.userSocket(userId);
  await redis.set(key, socket.id);

  // log the connected socket id and user id
  console.log("=== socket connected ==== :", socket.id);
  console.log("=== user === :", socket.user);
  console.log("=== user email === :", socket?.user?.email);

  socket.on("disconnect", async () => {
    await redis.del(key);
    console.log("===socket disconnected ==== :", socket.id);
  });
};

export default handleSocketConnection;
