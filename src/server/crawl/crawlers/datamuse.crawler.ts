import { prisma } from "@/lib/prisma";
import { safeFetchJson } from "@/server/crawl/utils/safe-fetch";
import { DatamuseResponseSchema } from "@/schemas/crawl.schema";
import type { CrawledEntry, CrawledRelation } from "@/server/crawl/crawl.service";

export type DatamuseCrawlResult = {
  entries: CrawledEntry[];
  relations: CrawledRelation[];
};

async function crawlDatamuse(
  seedWord: string,
  param: "rel_rhy" | "ml",
  category: "rhyme" | "related"
): Promise<DatamuseCrawlResult> {
  const url = `https://api.datamuse.com/words?${param}=${encodeURIComponent(seedWord)}&max=50`;

  const raw = await safeFetchJson<unknown>(url);
  if (raw === null) {
    return { entries: [], relations: [] };
  }

  const parsed = DatamuseResponseSchema.safeParse(raw);
  if (!parsed.success) {
    await prisma.crawlError.create({
      data: {
        source: "datamuse",
        word: seedWord,
        message: `Réponse invalide: ${parsed.error.issues[0]?.message}`,
        payload: raw as object,
      },
    });
    return { entries: [], relations: [] };
  }

  const entries = parsed.data.map((item) => ({
    word: item.word,
    definition: null,
    language: "en",
    category,
    source: "datamuse",
    sourceUrl: url,
  }));

  // La liaison seed → mot est ce qui rend les rimes exploitables dans le
  // lyrics-editor : sans elle on sait juste qu'un mot "est une rime de
  // quelque chose".
  const relations = parsed.data.map((item) => ({
    sourceWord: seedWord,
    targetWord: item.word,
    relation: category,
    language: "en",
    source: "datamuse",
    score: item.score ?? null,
  }));

  return { entries, relations };
}

export function crawlDatamuseRhymes(seedWord: string) {
  return crawlDatamuse(seedWord, "rel_rhy", "rhyme");
}

export function crawlDatamuseRelated(seedWord: string) {
  return crawlDatamuse(seedWord, "ml", "related");
}
