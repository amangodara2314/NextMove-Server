import { Queue } from "bullmq";
import queueOptions from "../constants/queue.js";

const matchmakingTimeoutQueue = new Queue("matchmaking-timeout", queueOptions);

export default matchmakingTimeoutQueue;
