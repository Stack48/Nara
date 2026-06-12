import { NextRequest, NextResponse } from 'next/server';
import { getRhymes } from '@/lib/lexique';
import { prisma } from '@/lib/prisma';
import { normalizeWord } from '@/server/crawl/utils/normalize-word';
import { getDatamuseRhymes } from '@/lib/datamuse';

// Rimes crawlées (DictionaryRelation, source datamuse, EN). Complète le
// Lexique FR : un mot anglais absent du TSV Lexique trouve quand même
// ses rimes si un crawl est passé dessus.
async function getCrawledRhymes(word: string, limit: number) {
  const normalized = normalizeWord(word);
  if (!normalized) return [];

  const relations = await prisma.dictionaryRelation.findMany({
    where: { sourceWord: normalized, relation: 'rhyme' },
    orderBy: { score: 'desc' },
    take: limit,
    select: { targetWord: true },
  });

  return relations.map((r) => r.targetWord);
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const word = params.get('word');

  if (!word || word.trim().length === 0) {
    return NextResponse.json({ error: 'Missing word parameter' }, { status: 400 });
  }

  const syllablesParam = params.get('syllables');
  const categoryParam = params.get('category');
  const syllables = syllablesParam ? parseInt(syllablesParam, 10) : undefined;

  try {
    const data = await getRhymes(word.trim(), 8, {
      syllables: Number.isFinite(syllables) ? syllables : undefined,
      category: categoryParam || undefined,
    });

    if (data.results.length === 0) {
      // Fallback 1: crawled rhymes from DB (previous Datamuse batch crawls)
      const crawled = await getCrawledRhymes(word.trim(), 8);
      if (crawled.length > 0) {
        return NextResponse.json({ ...data, results: crawled, source: 'crawl' });
      }

      // Fallback 2: live Datamuse API (English words not in Lexique FR or crawl DB)
      const datamuse = await getDatamuseRhymes(word.trim(), 8);
      if (datamuse.length > 0) {
        return NextResponse.json({ ...data, results: datamuse, source: 'datamuse' });
      }
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[/api/linguistic/rhymes]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
