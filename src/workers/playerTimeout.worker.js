import { Worker } from "bullmq";
import redis from "../config/redis";
import handlePlayerTimeoutJob from "../jobs/playerTimeout.job";

const playerTimeoutWorker = new Worker(
  "player-timeout",
  handlePlayerTimeoutJob,
  {
    connection: redis,
    concurrency: 5,
  },
);

playerTimeoutWorker.on("completed", (job) => {
  console.log(
    `Player timeout worker has finished the job for the game ${job?.data?.gameId}`,
  );
});

playerTimeoutWorker.on("failed", (job) => {
  console.log(
    `Player timeout worker has failed to complete the job for the game ${job?.data?.gameId}`,
  );
});

export default playerTimeoutWorker;
