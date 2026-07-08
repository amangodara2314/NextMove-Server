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
    updateData.whiteDisconnectedAt = isConnected ? null : Date.now();
  } else {
    updateData.blackConnected = isConnected;
    updateData.blackDisconnectedAt = isConnected ? null : Date.now();
  }
  await gameRepository.updateRedisGame(gameId, updateData);
};

export { updatePlayerConnection };
