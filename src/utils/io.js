const handleSocketEvents = (io) => {
  io.on("connection", (socket) => {
    console.log("new socket connection :", socket.id);
  });
};

export default handleSocketEvents;
