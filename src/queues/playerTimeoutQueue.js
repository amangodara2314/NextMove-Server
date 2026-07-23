import { Queue } from "bullmq";
import queueOptions from "../constants/queue";

const playerTimeoutQueue = new Queue("player-timeout", queueOptions);

export default playerTimeoutQueue;
