import PIECE_MAP from "../constants/pieces.js";
import { prepareDateForDb } from "./prepareDateForDb.js";

const isPromotion = (from, to, chess) => {
  const piece = chess.get(from);
  if (!piece || piece.type !== "p") return false;
  const toRank = to[1];
  return (
    (piece.color === "w" && toRank === "8") ||
    (piece.color === "b" && toRank === "1")
  );
};

const generateMovePayload = (version, result, chess, timeSpent, timestamp) => {
  return {
    moveNumber: version,
    piece: PIECE_MAP[result.piece],
    player: result.color === "w" ? "WHITE" : "BLACK",
    from: result.from,
    to: result.to,
    captured: result.captured ? PIECE_MAP[result.captured] : null,
    promotion: result.promotion ? PIECE_MAP[result.promotion] : null,
    castle: result.flags.includes("k")
      ? "KINGSIDE"
      : result.flags.includes("q")
        ? "QUEENSIDE"
        : null,
    fenAfter: chess.fen(),
    san: result.san,
    uci: `${result.from}${result.to}${result.promotion ?? ""}`,
    timeSpent: timeSpent,
    timestamp: prepareDateForDb(timestamp),
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
  };
};

export { isPromotion, generateMovePayload };
