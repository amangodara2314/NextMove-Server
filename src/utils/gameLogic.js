import { Chess } from "chess.js";
import { PlayerColor, GameStatus, GameResult } from "@prisma/client";
import calculatePlayerTime from "./calculatePlayerTime.js";
import { generateMovePayload, isPromotion } from "./move.js";
import AppError from "./AppError.js";
import { prepareDateForDb } from "./prepareDateForDb.js";

const assertVersionMatches = (game, clientVersion) => {
  if (Number(clientVersion) !== game.version) {
    throw new AppError("STALE_STATE", 409);
  }
};

const validateChessMove = (fen, { from, to, promotion }) => {
  const chess = new Chess(fen);
  const attemptedMove = {
    from,
    to,
    promotion: isPromotion(from, to, chess) ? (promotion ?? "q") : undefined,
  };
  const moveResult = chess.move(attemptedMove);
  if (!moveResult) {
    throw new AppError("Illegal move.", 400);
  }
  return { chess, moveResult };
};

const applyMoveToGameState = (
  game,
  chess,
  moveResult,
  timeSpent,
  timestamp,
) => {
  const now = Date.now();
  calculatePlayerTime(game, game.turn, now);
  game.lastMoveAt = prepareDateForDb(new Date(now));

  const move = generateMovePayload(
    game.version + 1,
    moveResult,
    chess,
    timeSpent,
    timestamp,
  );

  game.fen = chess.fen();
  game.version += 1;
  game.turn = moveResult.color === "w" ? PlayerColor.BLACK : PlayerColor.WHITE;

  return move;
};

// pure decision only — does NOT write to db/redis, just figures out the outcome
const determineGameEnd = (game, move, chess, moverColor) => {
  if (move.isCheckmate) {
    return {
      status: GameStatus.FINISHED,
      result: moverColor === "w" ? GameResult.WHITE : GameResult.BLACK,
    };
  }
  if (move.isStalemate || chess.isDraw()) {
    return { status: GameStatus.FINISHED, result: GameResult.DRAW };
  }
  if (game.whiteTimeLeft === 0) {
    return { status: GameStatus.TIMEOUT, result: GameResult.BLACK };
  }
  if (game.blackTimeLeft === 0) {
    return { status: GameStatus.TIMEOUT, result: GameResult.WHITE };
  }
  return null;
};

const buildResponse = (game, move) => {
  const response = {
    move,
    fen: game.fen,
    version: game.version,
    whiteTimeLeft: game.whiteTimeLeft,
    blackTimeLeft: game.blackTimeLeft,
  };
  if (game.status !== GameStatus.ACTIVE) {
    response.gameOver = true;
    response.gameStatus = game.status;
    response.gameResult = game.result;
  }
  return response;
};

export default {
  assertVersionMatches,
  validateChessMove,
  applyMoveToGameState,
  determineGameEnd,
  buildResponse,
};
