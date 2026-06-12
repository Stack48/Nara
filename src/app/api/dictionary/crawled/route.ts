import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/errors";
import { normalizeWord } from "@/server/crawl/utils/normalize-word";

// Définitions crawlées (DictionaryEntry) pour le panel dictionnaire du
// lyrics-editor. Lecture seule, séparé du canal communautaire WordSuggestion.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    if (!search) {
      return NextResponse.json({ items: [] });
    }

    const normalized = normalizeWord(search);
    if (!normalized) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.dictionaryEntry.findMany({
      where: {
        normalized: { startsWith: normalized },
        definition: { not: null },
      },
      orderBy: [{ normalized: "asc" }, { source: "asc" }],
      take: 20,
      select: {
        id: true,
        word: true,
        definition: true,
        language: true,
        category: true,
        partOfSpeech: true,
        source: true,
        sourceUrl: true,
        status: true,
      },
    });

    return NextResponse.json({ items });
  } catch (e) {
    return handleError(e);
  }
}
