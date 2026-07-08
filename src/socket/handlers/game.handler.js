import redis from "../../config/redis.js";
import { REDIS_KEYS } from "../../constants/keys.js";
import gameRepository from "../../modules/game/game.repository.js";

const handleGame = async (socket) => {
  socket.on("JOIN_GAME", async (data, callback) => {
    try {
      const { gameId } = data;
      console.info(
        `User ${socket.user.userId} is trying to join game ${gameId}`,
      );
      // Validate gameId
      if (!gameId) {
        throw new Error("Game ID is required.");
      }

      // Fetch the current game state from Redis
      const gameKey = REDIS_KEYS.game(gameId);
      const game = await gameRepository.getRedisGame(gameId);

      if (!game) {
        throw new Error("Game state not found.");
      }

      // check if the game is active
      if (game && game.status !== "ACTIVE") {
        return;
      }

      // check if the user is a player in the game
      const userId = socket.user.userId;
      if (game.white !== userId && game.black !== userId) {
        throw new Error("You are not a player in this game.");
      }

      // Join the game room
      socket.join(gameId);
      console.log(`User ${userId} joined game ${gameId}`);

      callback?.({
        success: true,
      });

      // the connection timeout job is yet to be implemented
    } catch (error) {
      console.log(error);
      callback?.({
        success: false,
        message: error.message || "An error occurred while joining the game.",
      });
    }
  });
};

export default handleGame;
