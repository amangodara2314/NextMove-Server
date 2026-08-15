const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function getRatingType(timeControl) {
  if (timeControl.startsWith("BULLET")) return "BULLET";
  if (timeControl.startsWith("BLITZ")) return "BLITZ";
  if (timeControl.startsWith("RAPID")) return "RAPID";

  throw new Error(`Unsupported time control: ${timeControl}`);
}

export { INITIAL_FEN, getRatingType };
