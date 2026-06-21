import { Worker } from "bullmq";
import redis from "../config/redis.js";
import handleMoveJob from "../jobs/move.job.js";

const moveWorker = new Worker("move", handleMoveJob, {
  connection: redis,
  concurrency: 5,
});

moveWorker.on("completed", (job) => {
  console.log(`Completed move job ${job.id}`);
});

moveWorker.on("failed", (job, err) => {
  console.log(`Move job ${job?.id} failed:`, err.message);
});

moveWorker.on("error", (err) => {
  // Not job-related — internal/connection errors (e.g. Redis blips)
  console.error("Worker connection error:", err.message);
});

export default moveWorker;
