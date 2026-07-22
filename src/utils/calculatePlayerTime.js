import { PlayerColor } from "@prisma/client";

const calculatePlayerTime = (game, playerColor, now = Date.now()) => {
  const lastMoveAt =
    game.version === 0
      ? new Date(game.createdAt).getTime()
      : new Date(game.lastMoveAt).getTime();

  const timeTakenByPlayer = now - lastMoveAt;

  // update players time in game state

  if (game.turn === PlayerColor.WHITE) {
    game.whiteTimeLeft = Math.max(0, game.whiteTimeLeft - timeTakenByPlayer);
  } else {
    game.blackTimeLeft = Math.max(0, game.blackTimeLeft - timeTakenByPlayer);
  }
};

export default calculatePlayerTime;
