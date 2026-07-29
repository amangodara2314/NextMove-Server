import gameRepository from "../modules/game/game.repository.js";

const handleMoveJob = async (job) => {
  const { move, updateGame, shouldCleanUpRedis, cleanUpData } = job.data;

  const result = await gameRepository.createMove(move);

  if (updateGame) {
    await gameRepository.updateGame(move.gameId, updateGame);
  }

  if (shouldCleanUpRedis && cleanUpData) {
    const { gameId, white, black } = cleanUpData;
    await gameRepository.cleanUpRedisKeys(gameId, white, black);
  }

  console.log(
    `Move job ${job.id} processed: move ${move.san} for game ${move.gameId}`,
    result,
  );
};

export default handleMoveJob;
