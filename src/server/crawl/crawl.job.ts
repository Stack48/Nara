import { prisma } from "@/lib/prisma";
import {
  crawlDatamuseRhymes,
  crawlDatamuseRelated,
} from "@/server/crawl/crawlers/datamuse.crawler";
import { crawlFreeDictionary } from "@/server/crawl/crawlers/free-dictionary.crawler";
import { crawlWiktionary } from "@/server/crawl/crawlers/wiktionary.crawler";
import {
  insertDictionaryEntries,
  insertDictionaryRelations,
} from "@/server/crawl/crawl.service";
import { sleep } from "@/server/crawl/utils/sleep";

// Limite serverless Vercel : ne jamais traiter plus de MAX_SEEDS_PER_RUN
// mots par exécution. Le curseur (CrawlState via dernier CrawlLog) permet
// à chaque run cron de reprendre où le précédent s'est arrêté.
const MAX_SEEDS_PER_RUN = 20;

const FALLBACK_FRENCH_SEEDS = [
  "amour", "nuit", "rêve", "voix", "rythme",
  "mélodie", "couplet", "refrain", "flow", "studio", "punchline",
];

const FALLBACK_ENGLISH_SEEDS = [
  "love", "night", "dream", "voice", "rhythm",
  "melody", "verse", "chorus", "flow", "studio",
];

export type CrawlJobOptions = {
  dryRun?: boolean;
  maxSeeds?: number;
};

export type CrawlJobResult = {
  inserted: number;
  skipped: number;
  failed: number;
  seedsProcessed: number;
  dryRun: boolean;
};

// Les mots approuvés par la communauté sont les meilleurs seeds : le crawl
// enrichit ce que les utilisateurs demandent déjà.
async function getSeeds(maxSeeds: number) {
  const approved = await prisma.wordSuggestion.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: maxSeeds,
    select: { word: true, language: true },
  });

  const french = approved
    .filter((s) => !s.language || s.language === "fr")
    .map((s) => s.word);
  const english = approved
    .filter((s) => s.language === "en")
    .map((s) => s.word);

  return {
    french: french.length > 0 ? french : FALLBACK_FRENCH_SEEDS,
    english: english.length > 0 ? english : FALLBACK_ENGLISH_SEEDS,
  };
}

export async function runDictionaryCrawlJob(
  options: CrawlJobOptions = {}
): Promise<CrawlJobResult> {
  const dryRun = options.dryRun ?? false;
  const maxSeeds = options.maxSeeds ?? MAX_SEEDS_PER_RUN;

  const log = dryRun
    ? null
    : await prisma.crawlLog.create({
        data: { source: "all", status: "running" },
      });

  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  let seedsProcessed = 0;

  try {
    const seeds = await getSeeds(maxSeeds);
    const englishBudget = Math.min(seeds.english.length, Math.ceil(maxSeeds / 2));
    const frenchBudget = Math.min(seeds.french.length, maxSeeds - englishBudget);

    for (const word of seeds.english.slice(0, englishBudget)) {
      const rhymes = await crawlDatamuseRhymes(word);
      const related = await crawlDatamuseRelated(word);
      const entries = [
        ...rhymes.entries,
        ...related.entries,
        ...(await crawlFreeDictionary(word)),
      ];

      const result = await insertDictionaryEntries(entries, { dryRun });
      const relResult = await insertDictionaryRelations(
        [...rhymes.relations, ...related.relations],
        { dryRun }
      );
      inserted += result.inserted + relResult.inserted;
      skipped += result.skipped + relResult.skipped;
      failed += result.failed + relResult.failed;
      seedsProcessed++;

      await sleep(500);
    }

    for (const word of seeds.french.slice(0, frenchBudget)) {
      const entries = await crawlWiktionary(word);

      const result = await insertDictionaryEntries(entries, { dryRun });
      inserted += result.inserted;
      skipped += result.skipped;
      failed += result.failed;
      seedsProcessed++;

      await sleep(700);
    }

    if (log) {
      await prisma.crawlLog.update({
        where: { id: log.id },
        data: {
          status: failed > 0 ? "partial" : "success",
          inserted,
          skipped,
          failed,
          message: `${seedsProcessed} seeds traités`,
          endedAt: new Date(),
        },
      });
    }

    return { inserted, skipped, failed, seedsProcessed, dryRun };
  } catch (error) {
    if (log) {
      await prisma.crawlLog.update({
        where: { id: log.id },
        data: {
          status: "failed",
          inserted,
          skipped,
          failed: failed + 1,
          message: error instanceof Error ? error.message : "Unknown error",
          endedAt: new Date(),
        },
      });
    }

    throw error;
  }
}
