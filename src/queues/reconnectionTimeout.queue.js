import { Queue } from "bullmq";
import queueOptions from "../constants/queue.js";

const reconnectionTimeoutQueue = new Queue(
  "reconnection-timeout",
  queueOptions,
);

export default reconnectionTimeoutQueue;
