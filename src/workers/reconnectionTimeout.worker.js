import { Worker } from "bullmq";
import redis from "../config/redis.js";
import reconnectionTimeoutJob from "../jobs/reconnectionTimeout.job.js";

const reconnectionTimeoutWorker = new Worker(
  "reconnection-timeout",
  reconnectionTimeoutJob,
  {
    connection: redis,
    concurrency: 5,
  },
);

reconnectionTimeoutWorker.on("completed", (job) => {
  console.log("Reconnection timeout worked finished job with job id ", job.id);
});

reconnectionTimeoutWorker.on("failed", (job, err) => {
  console.log(
    `Failed reconnection timeout job with jobId ${job.id} with error: ${err.message}`,
  );
});

export default reconnectionTimeoutWorker;
