import { Worker } from "bullmq";
import handleMatchmakingTimeout from "../jobs/matchmakingTimeout.job";
import redis from "../config/redis";

const matchmakingTimeoutWorker = new Worker(
  "matchmaking-timeout",
  handleMatchmakingTimeout,
  {
    concurrency: 5,
    connection: redis,
  },
);
