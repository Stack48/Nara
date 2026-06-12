import { prisma } from "@/lib/prisma";
import { safeFetchJson } from "@/server/crawl/utils/safe-fetch";
import { WiktionaryResponseSchema } from "@/schemas/crawl.schema";
import type { CrawledEntry } from "@/server/crawl/crawl.service";

export async function crawlWiktionary(word: string): Promise<CrawledEntry[]> {
  const url =
    `https://fr.wiktionary.org/w/api.php?action=query&prop=extracts&explaintext=true&format=json&titles=${encodeURIComponent(word)}&origin=*`;

  const raw = await safeFetchJson<unknown>(url);
  if (raw === null) {
    return [];
  }

  const parsed = WiktionaryResponseSchema.safeParse(raw);
  if (!parsed.success) {
    await prisma.crawlError.create({
      data: {
        source: "wiktionary",
        word,
        message: `Réponse invalide: ${parsed.error.issues[0]?.message}`,
        payload: raw as object,
      },
    });
    return [];
  }

  const pages = parsed.data.query?.pages ?? {};
  const entries: CrawledEntry[] = [];

  for (const page of Object.values(pages)) {
    if (!page.extract) continue;

    entries.push({
      word,
      definition: page.extract.slice(0, 1200),
      language: "fr",
      category: "definition",
      partOfSpeech: null,
      source: "wiktionary",
      sourceUrl: `https://fr.wiktionary.org/wiki/${encodeURIComponent(word)}`,
    });
  }

  return entries;
}
