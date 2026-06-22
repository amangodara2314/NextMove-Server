import { z } from "zod";

const squareRegex = /^[a-h][1-8]$/;

const createMove = z.object({
  gameId: z.string().uuid(),
  version: z.number().int().min(0),
  from: z.string().regex(squareRegex, "Invalid source square"),
  to: z.string().regex(squareRegex, "Invalid destination square"),
  promotion: z.enum(["q", "r", "b", "n"]).nullish(),
  version: z.number().min(0, "Incorrect game version"),
  timeSpent: z.number().int().min(0).max(7200),
  timestamp: z.coerce.date(),
});

export default createMove;
