import { NextRequest, NextResponse } from 'next/server';
import { getAntonyms } from '@/lib/dicolink';
import { filterWordsByLexique } from '@/lib/lexique';
import { getDatamuseAntonyms } from '@/lib/datamuse';

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
    const data = await getAntonyms(word.trim());
    const filtered = filterWordsByLexique(data.results ?? [], {
      syllables: Number.isFinite(syllables) ? syllables : undefined,
      category: categoryParam || undefined,
    });

    // Fallback: if DicoLink (FR) returned nothing, try Datamuse (EN)
    if (filtered.results.length === 0) {
      const datamuse = await getDatamuseAntonyms(word.trim());
      if (datamuse.length > 0) {
        return NextResponse.json({
          word: word.trim(),
          results: datamuse,
          source: 'datamuse',
          availableSyllables: [],
          availableCategories: [],
        });
      }
    }

    return NextResponse.json({ ...data, ...filtered });
  } catch (err) {
    console.error('[/api/linguistic/antonyms]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
