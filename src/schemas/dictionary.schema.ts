import { z } from "zod";

export const CreateWordSchema = z.object({
  word: z.string().trim().min(1, "Le mot est requis"),
  description: z.string().trim().min(1, "La description est requise"),
  synonyms: z.string().trim().nullish().transform((v) => v || null),
  antonyms: z.string().trim().nullish().transform((v) => v || null),
  category: z.enum(["genre_musical", "argot", "geographie", "standard"]).nullish().transform((v) => v || null),
  language: z.string().trim().nullish().transform((v) => v || null),
});

export const UpdateWordSchema = z.object({
  word: z.string().trim().min(1, "Le mot ne peut pas être vide").optional(),
  description: z.string().trim().min(1, "La description ne peut pas être vide").optional(),
  synonyms: z.string().trim().nullish().transform((v) => v || null),
  antonyms: z.string().trim().nullish().transform((v) => v || null),
  category: z.enum(["genre_musical", "argot", "geographie", "standard"]).nullish().transform((v) => v || null),
  language: z.string().trim().nullish().transform((v) => v || null),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export const VoteSchema = z.object({
  value: z.number().refine((v) => v === 1 || v === -1, {
    message: "La valeur du vote doit être 1 ou -1",
  }),
});

export type CreateWordInput = z.infer<typeof CreateWordSchema>;
export type UpdateWordInput = z.infer<typeof UpdateWordSchema>;
export type VoteInput = z.infer<typeof VoteSchema>;
