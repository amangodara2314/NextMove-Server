import gameRepository from "../modules/game/game.repository.js";

const updatePlayerConnection = async (
  userColor,
  gameId,
  isConnected = true,
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
  await gameRepository.updateRedisGame(gameId, updateData);
};

export { updatePlayerConnection };
