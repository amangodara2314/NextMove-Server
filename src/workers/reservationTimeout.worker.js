import redis from "../config/redis.js";
import handleReservationTimeoutJob from "../jobs/reservationTimeout.job.js";
import { Worker } from "bullmq";

const reservationTimeoutWorker = new Worker(
  "reservation-timeout",
  handleReservationTimeoutJob,
  {
    concurrency: 5,
    connection: redis,
  },
);

reservationTimeoutWorker.on("completed", (job) => {
  console.log(
    `Completed reservation timeout job for reservation ${job.data.reservationId}`,
  );
});

reservationTimeoutWorker.on("failed", (job, err) => {
  console.log(
    `Failed reservation timeout job for reservation ${job.data.reservationId} with error: ${err.message}`,
  );
});

export default reservationTimeoutWorker;
