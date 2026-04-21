import { z } from "zod";

export const UserInputSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  name: z.string().trim().nullish().transform((v) => v || null),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  createdAt: z.string(),
});

export type UserInput = z.infer<typeof UserInputSchema>;
export type User = z.infer<typeof UserSchema>;
