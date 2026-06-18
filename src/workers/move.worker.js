import { Worker } from "bullmq";
import redis from "../config/redis";
import handleMove from "../jobs/move.job";

const moveWorker = new Worker("move", handleMove, {
  connection: redis,
  concurrency: 5,
});

moveWorker.on("completed", (job) => {
  console.log(`Completed make move job`);
});

moveWorker.on("error", (job) => {
  console.log(`Failed to complete make move job`);
});

export default moveWorker;
