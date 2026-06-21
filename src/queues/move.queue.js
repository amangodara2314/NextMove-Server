import { Queue } from "bullmq";
import connection from "../config/redis.js";
import queueOptions from "../constants/queue.js";

const moveQueue = new Queue("move", queueOptions);

export default moveQueue;
