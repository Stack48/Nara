import { z } from "zod";

// Limite : 2–3 alternatives max par phrase/mot
export const MAX_ALTERNATIVES = 3;

// POST /alternatives — génération IA
export const generateAlternativesSchema = z.object({
    phrase: z.string().min(1, "Phrase requise"),
    max: z.number().int().min(1).max(MAX_ALTERNATIVES).optional(),
});

// POST /alternatives/community — soumission manuelle
export const communityAlternativeSchema = z.object({
    phrase: z.string().min(1, "Phrase requise"),
    alternatives: z
        .array(z.string().min(1))
        .min(1, "Au moins une alternative requise")
        .max(MAX_ALTERNATIVES, `Maximum ${MAX_ALTERNATIVES} alternatives`),
});

export type GenerateAlternativesInput = z.infer<typeof generateAlternativesSchema>;
export type CommunityAlternativeInput = z.infer<typeof communityAlternativeSchema>;
