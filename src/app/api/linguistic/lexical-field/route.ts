import { NextRequest, NextResponse } from 'next/server';
import { getLexicalField } from '@/lib/dicolink';
import { filterWordsByLexique } from '@/lib/lexique';

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
    const data = await getLexicalField(word.trim());
    const filtered = filterWordsByLexique(data.results ?? [], {
      syllables: Number.isFinite(syllables) ? syllables : undefined,
      category: categoryParam || undefined,
    });
    return NextResponse.json({ ...data, ...filtered });
  } catch (err) {
    console.error('[/api/linguistic/lexical-field]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
