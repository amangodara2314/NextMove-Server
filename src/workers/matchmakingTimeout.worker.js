import { Worker } from "bullmq";
import handleMatchmakingTimeoutJob from "../jobs/matchmakingTimeout.job.js";
import redis from "../config/redis.js";

const matchmakingTimeoutWorker = new Worker(
  "matchmaking-timeout",
  handleMatchmakingTimeoutJob,
  {
    concurrency: 5,
    connection: redis.duplicate(),
  },
);

matchmakingTimeoutWorker.on("completed", (job) => {
  console.log(`Completed matchmaking timeout job for user ${job.data.userId}`);
});

matchmakingTimeoutWorker.on("failed", (job, err) => {
  console.log(
    `Failed matchmaking timeout job for user ${job.data.userId} with error: ${err.message}`,
  );
});

export default matchmakingTimeoutWorker;
