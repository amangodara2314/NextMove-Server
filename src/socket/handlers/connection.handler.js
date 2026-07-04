import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import reconnectionTimeoutQueue from "../../queues/reconnectionTimeout.queue.js";

const handleSocketConnection = async (socket) => {
  const userId = socket.user.userId;
  const socketKey = REDIS_KEYS.userSocket(userId);
  const activeGameKey = REDIS_KEYS.userActiveGame(userId);

  await redis.set(socketKey, socket.id);

  // log the connected socket id and user id
  console.log("=== socket connected ==== :", socket.id);
  console.log("=== user === :", socket.user);
  console.log("=== user email === :", socket?.user?.email);

  socket.on("disconnect", async () => {
    await redis.del(socketKey);
    const activeGameId = await redis.get(activeGameKey);
    console.log("disconnecting socket had active game id:", activeGameId);
    if (activeGameId) {
      await reconnectionTimeoutQueue.add("reconnection-timeout", {
        userId,
        gameId: activeGameId,
      });
    }
    console.log("===socket disconnected ==== :", socket.id);
  });
};

export default handleSocketConnection;
