import "dotenv/config";
import matchmakingTimeoutWorker from "./matchmakingTimeout.worker.js";
import reservationTimeoutWorker from "./reservationTimeout.worker.js";
import moveWorker from "./move.worker.js";

console.log("Workers started");
