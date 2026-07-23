import { GameResult, GameStatus, PlayerColor } from "@prisma/client";
import gameRepository from "../modules/game/game.repository.js";
import calculatePlayerTime from "../utils/calculatePlayerTime.js";
import playerTimeoutQueue from "../queues/playerTimeoutQueue.js";
import { endGame } from "../utils/game.js";
import { notify } from "../utils/notifier.js";

const handlePlayerTimeoutJob = async (job) => {
  try {
    const { gameId, turn } = job.data;

    // validations
    if (!gameId || !Object.values(PlayerColor).includes(turn)) {
      throw new Error("Missing gameId or invalid turn in job data");
    }

    let game = await gameRepository.getRedisGame(gameId);

    if (!game) {
      throw new Error(`Game with id:${gameId} does not exist`);
    }

    if (game.status !== GameStatus.ACTIVE) {
      throw new Error(
        `Game with id:${gameId} is not active, current status : ${game.status}`,
      );
    }

    if (game.turn !== turn) {
      throw new Error(
        `Game with id:${gameId} does not match the turn in the payload`,
      );
    }

    // calculate the players time
    calculatePlayerTime(game, turn);

    const isWhite = turn === PlayerColor.WHITE;

    const playerTime = isWhite
      ? parseInt(game.whiteTimeLeft)
      : parseInt(game.blackTimeLeft);

    // if the player still has time left then again add the job in the queue and return
    if (playerTime !== 0) {
      await playerTimeoutQueue.add(
        "player-timeout",
        { gameId, turn },
        { jobId: `clock:${gameId}`, delay: playerTime + 100 },
      );
      return;
    }

    // else end the game and notify both players
    const updatedGame = await endGame(
      game,
      GameStatus.TIMEOUT,
      isWhite ? GameResult.BLACK : GameResult.BLACK,
    );

    notify({
      event: "PLAYER_TIMEOUT",
      room: gameId,
      payload: { game: updatedGame },
    });
  } catch (error) {
    console.log("Error while processing player timeout job :", error);
    throw error;
  }
};

export default handlePlayerTimeoutJob;
