import { z } from "zod";

const authBodySchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(4, "Password length must be more than 4 characters")
    .max(100),
  username: z
    .string()
    .min(3, "Username length must be more than 3 characters")
    .max(50),
});

export const createUserSchema = z.object({
  body: authBodySchema,
});

export const loginUserSchema = z.object({
  body: authBodySchema.omit({ username: true }),
});
