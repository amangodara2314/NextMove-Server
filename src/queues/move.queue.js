import { Queue } from "bullmq";
import connection from "../config/redis";
import queueOptions from "../constants/queue";

const moveQueue = new Queue("move-queue", queueOptions);

export default moveQueue;
