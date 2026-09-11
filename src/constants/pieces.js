import { PieceType } from "../../prisma/generated/client.ts";
const PIECE_MAP = {
  p: PieceType.PAWN,
  n: PieceType.KNIGHT,
  b: PieceType.BISHOP,
  r: PieceType.ROOK,
  q: PieceType.QUEEN,
  k: PieceType.KING,
};

export default PIECE_MAP;
