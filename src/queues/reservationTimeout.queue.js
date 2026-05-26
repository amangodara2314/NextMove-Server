import { Queue } from "bullmq";
import queueOptions from "../constants/queue.js";

const reservationTimeoutQueue = new Queue("reservation-timeout", queueOptions);

export default reservationTimeoutQueue;
