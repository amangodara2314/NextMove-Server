import { Queue } from "bullmq";
import queueOptions from "../constants/queue";

const matchmakingTimeoutQueue = new Queue("matchmaking-timeout", queueOptions);

export default matchmakingTimeoutQueue;
