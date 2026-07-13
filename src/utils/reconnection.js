import { io } from "../app.js";
import gameRepository from "../modules/game/game.repository.js";

const updatePlayerConnection = async (
  userColor,
  gameId,
  isConnected = true,
  game = {},
) => {
  if (!userColor || !gameId) return;
  const updateData = {};
  if (userColor === "WHITE") {
    updateData.whiteConnected = isConnected;
    updateData.whiteDisconnectedAt = isConnected ? "" : String(Date.now());
  } else {
    updateData.blackConnected = isConnected;
    updateData.blackDisconnectedAt = isConnected ? "" : String(Date.now());
  }
  // update the player connection state in redis
  await gameRepository.updateRedisGame(gameId, updateData);
  // notify the opponent if the user went offline
  if (!isConnected) {
    io.to(gameId).emit("PLAYER_DISCONNECTED", updateData);
  }
  return updateData;
};

export { updatePlayerConnection };
