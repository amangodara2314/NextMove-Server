import { TimeControl } from "../../../prisma/generated/client.ts";
import { z } from "zod";

const matchmakingSchema = z.object({
  body: z.object({
    timeControl: z.nativeEnum(TimeControl),
  }),
});

export default matchmakingSchema;
