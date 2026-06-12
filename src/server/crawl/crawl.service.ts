import { prisma } from "@/lib/prisma";
import { normalizeWord } from "@/server/crawl/utils/normalize-word";

export type CrawledEntry = {
  word: string;
  definition?: string | null;
  language: string;
  category?: string | null;
  partOfSpeech?: string | null;
  source: string;
  sourceUrl?: string | null;
};

export type CrawledRelation = {
  sourceWord: string;
  targetWord: string;
  relation: string;
  language: string;
  source: string;
  score?: number | null;
};

export type InsertResult = {
  inserted: number;
  skipped: number;
  failed: number;
};

// Dédup déléguée à PostgreSQL via @@unique([normalized, language, source]) :
// createMany + skipDuplicates = 1 requête au lieu de findUnique+create par mot.
export async function insertDictionaryEntries(
  entries: CrawledEntry[],
  options?: { dryRun?: boolean }
): Promise<InsertResult> {
  const rows = [];
  let skipped = 0;

  for (const entry of entries) {
    const normalized = normalizeWord(entry.word);

    if (!normalized || normalized.length < 2) {
      skipped++;
      continue;
    }

    rows.push({
      word: entry.word.trim(),
      normalized,
      definition: entry.definition ?? null,
      language: entry.language,
      category: entry.category ?? null,
      partOfSpeech: entry.partOfSpeech ?? null,
      source: entry.source,
      sourceUrl: entry.sourceUrl ?? null,
      status: "not_verified",
    });
  }

  if (options?.dryRun) {
    return { inserted: rows.length, skipped, failed: 0 };
  }

  if (rows.length === 0) {
    return { inserted: 0, skipped, failed: 0 };
  }

  try {
    const result = await prisma.dictionaryEntry.createMany({
      data: rows,
      skipDuplicates: true,
    });

    return {
      inserted: result.count,
      skipped: skipped + (rows.length - result.count),
      failed: 0,
    };
  } catch (error) {
    await prisma.crawlError.create({
      data: {
        source: rows[0]?.source ?? "unknown",
        message: error instanceof Error ? error.message : "Unknown insert error",
      },
    });

    return { inserted: 0, skipped, failed: rows.length };
  }
}

// Relations seed → mot (rimes, mots associés). Mots normalisés des deux
// côtés pour que le lookup depuis le lyrics-editor matche.
export async function insertDictionaryRelations(
  relations: CrawledRelation[],
  options?: { dryRun?: boolean }
): Promise<InsertResult> {
  const rows = [];
  let skipped = 0;

  for (const rel of relations) {
    const sourceWord = normalizeWord(rel.sourceWord);
    const targetWord = normalizeWord(rel.targetWord);

    if (!sourceWord || !targetWord || sourceWord === targetWord) {
      skipped++;
      continue;
    }

    rows.push({
      sourceWord,
      targetWord,
      relation: rel.relation,
      language: rel.language,
      source: rel.source,
      score: rel.score ?? null,
    });
  }

  if (options?.dryRun) {
    return { inserted: rows.length, skipped, failed: 0 };
  }

  if (rows.length === 0) {
    return { inserted: 0, skipped, failed: 0 };
  }

  try {
    const result = await prisma.dictionaryRelation.createMany({
      data: rows,
      skipDuplicates: true,
    });

    return {
      inserted: result.count,
      skipped: skipped + (rows.length - result.count),
      failed: 0,
    };
  } catch (error) {
    await prisma.crawlError.create({
      data: {
        source: rows[0]?.source ?? "unknown",
        message: error instanceof Error ? error.message : "Unknown relation insert error",
      },
    });

    return { inserted: 0, skipped, failed: rows.length };
  }
}
