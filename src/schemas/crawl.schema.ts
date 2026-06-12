import { z } from "zod";

// Réponses des APIs externes — validées avant insertion pour qu'un changement
// de format côté source produise un CrawlError exploitable, pas un crash.

export const DatamuseResponseSchema = z.array(
  z.object({
    word: z.string().min(1),
    score: z.number().optional(),
  })
);

export const FreeDictionaryResponseSchema = z.array(
  z.object({
    word: z.string().min(1),
    meanings: z
      .array(
        z.object({
          partOfSpeech: z.string().nullish(),
          definitions: z
            .array(z.object({ definition: z.string().min(1) }))
            .default([]),
        })
      )
      .default([]),
  })
);

export const WiktionaryResponseSchema = z.object({
  query: z
    .object({
      pages: z.record(
        z.string(),
        z.object({
          title: z.string().optional(),
          extract: z.string().optional(),
        })
      ),
    })
    .optional(),
});

export type DatamuseResponse = z.infer<typeof DatamuseResponseSchema>;
export type FreeDictionaryResponse = z.infer<typeof FreeDictionaryResponseSchema>;
export type WiktionaryResponse = z.infer<typeof WiktionaryResponseSchema>;
