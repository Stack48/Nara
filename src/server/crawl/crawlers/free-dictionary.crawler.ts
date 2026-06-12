import { prisma } from "@/lib/prisma";
import { safeFetchJson } from "@/server/crawl/utils/safe-fetch";
import { FreeDictionaryResponseSchema } from "@/schemas/crawl.schema";
import type { CrawledEntry } from "@/server/crawl/crawl.service";

export async function crawlFreeDictionary(word: string): Promise<CrawledEntry[]> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

  // L'API répond 404 pour un mot inconnu — safeFetchJson rend null, on skip.
  const raw = await safeFetchJson<unknown>(url);
  if (raw === null) {
    return [];
  }

  const parsed = FreeDictionaryResponseSchema.safeParse(raw);
  if (!parsed.success) {
    await prisma.crawlError.create({
      data: {
        source: "free_dictionary",
        word,
        message: `Réponse invalide: ${parsed.error.issues[0]?.message}`,
        payload: raw as object,
      },
    });
    return [];
  }

  const entries: CrawledEntry[] = [];

  for (const item of parsed.data) {
    for (const meaning of item.meanings) {
      for (const def of meaning.definitions) {
        entries.push({
          word: item.word,
          definition: def.definition,
          language: "en",
          category: "definition",
          partOfSpeech: meaning.partOfSpeech ?? null,
          source: "free_dictionary",
          sourceUrl: url,
        });
      }
    }
  }

  return entries;
}
