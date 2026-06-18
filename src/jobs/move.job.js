import gameRepository from "../modules/game/game.repository";

const handleMove = async (job) => {
  const { move } = job.data;

  await gameRepository.createMove(move);
};

export default handleMove;
