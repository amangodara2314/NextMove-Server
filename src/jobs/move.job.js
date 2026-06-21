import gameRepository from "../modules/game/game.repository.js";

const handleMoveJob = async (job) => {
  const data = job.data;

  const result = await gameRepository.createMove(data);

  console.log(
    `Move job ${job.id} processed: move ${data.san} for game ${data.gameId}`,
    result,
  );
};

export default handleMoveJob;
