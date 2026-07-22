import gameRepository from "../modules/game/game.repository.js";

const handleMoveJob = async (job) => {
  const { move, updateGame } = job.data;

  const result = await gameRepository.createMove(move);
  if (updateGame) {
    await gameRepository.updateGame(move.gameId, updateGame);
  }

  console.log(
    `Move job ${job.id} processed: move ${move.san} for game ${move.gameId}`,
    result,
  );
};

export default handleMoveJob;
