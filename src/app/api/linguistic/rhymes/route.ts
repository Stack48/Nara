import { NextRequest, NextResponse } from 'next/server';
import { getRhymes } from '@/lib/lexique';

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get('word');

  if (!word || word.trim().length === 0) {
    return NextResponse.json({ error: 'Missing word parameter' }, { status: 400 });
  }

  try {
    const data = await getRhymes(word.trim());
    return NextResponse.json(data);
  } catch (err) {
    console.error('[/api/linguistic/rhymes]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
