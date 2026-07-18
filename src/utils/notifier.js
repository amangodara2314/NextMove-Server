import { Emitter } from "@socket.io/redis-emitter";
import { pubClient } from "../config/redis.js";

const emitter = new Emitter(pubClient);

function notify({ event, room, payload = {} }) {
  emitter.to(room).emit(event, payload);
  console.log(`Notification sent to room ${room} for event ${event}`, payload);
}

export { notify };
