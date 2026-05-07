const eventGuard = (socket) => {
  return async (packet, next) => {
    // check if the user is present
    const [event, data] = packet;
    const user = socket.user;
    if (!user) {
      return next(new Error("Unauthenticated"));
    }

    // check if the user.id matches the packet's data.userId

    if (data?.userId && data.userId !== user.userId) {
      next(new Error("User spoofing detected"));
    }

    next();
  };
};

export default eventGuard;
