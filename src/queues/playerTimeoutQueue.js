import { Queue } from "bullmq";
import queueOptions from "../constants/queue.js";

const playerTimeoutQueue = new Queue("player-timeout", queueOptions);

export default playerTimeoutQueue;
