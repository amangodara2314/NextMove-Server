import { Queue } from "bullmq";
import queueOptions from "../constants/queue.js";

const moveQueue = new Queue("move", queueOptions);

export default moveQueue;
