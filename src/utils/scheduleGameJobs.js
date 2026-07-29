import { GameStatus, PlayerColor } from "@prisma/client";
import moveQueue from "../queues/move.queue.js";
import playerTimeoutQueue from "../queues/playerTimeoutQueue.js";

const scheduleGameJobs = async (gameId, move, game) => {
  const jobId = `clock_${gameId}`;
  await playerTimeoutQueue.remove(jobId);

  const updateGame = {
    whiteTimeLeft: Number(game.whiteTimeLeft),
    blackTimeLeft: Number(game.blackTimeLeft),
    lastMoveAt: game.lastMoveAt,
  };

  const jobs = [
    moveQueue.add("move", {
      move: { ...move, gameId },
      updateGame: game.status === GameStatus.ACTIVE ? updateGame : undefined,
      shouldCleanUpRedis: game.status !== GameStatus.ACTIVE,
      cleanUpData:
        game.status !== GameStatus.ACTIVE
          ? { gameId, white: game.white, black: game.black }
          : undefined,
    }),
  ];

  if (game.status === GameStatus.ACTIVE) {
    jobs.push(
      playerTimeoutQueue.add(
        "player-timeout",
        { gameId, turn: game.turn },
        {
          jobId,
          delay:
            (game.turn === PlayerColor.WHITE
              ? game.whiteTimeLeft
              : game.blackTimeLeft) + 10,
        },
      ),
    );
  }

  await Promise.all(jobs);
};

export { scheduleGameJobs };
