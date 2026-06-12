import "server-only";

/**
 * Real-time Datamuse API client — used as a fallback when French sources
 * (Lexique, DicoLink) return no results for English words.
 *
 * Datamuse is free, no auth required, ~100k requests/day.
 * We cache responses for 1 hour via Next.js fetch cache.
 */

const BASE_URL = "https://api.datamuse.com/words";

async function fetchDatamuse(
	params: string,
	limit = 8,
): Promise<string[]> {
	try {
		const url = `${BASE_URL}?${params}&max=${limit}`;
		const res = await fetch(url, {
			headers: { "User-Agent": "NARA-Dictionary/1.0" },
			next: { revalidate: 3600 },
		});

		if (!res.ok) return [];

		const data = (await res.json()) as Array<{ word: string; score?: number }>;
		return data.map((item) => item.word);
	} catch {
		return [];
	}
}

/** Rhymes: words that rhyme with the input (e.g. studying → undying, dying) */
export function getDatamuseRhymes(word: string, limit = 8) {
	return fetchDatamuse(`rel_rhy=${encodeURIComponent(word)}`, limit);
}

/** Synonyms: words with similar meaning via synonym relation */
export function getDatamuseSynonyms(word: string, limit = 8) {
	return fetchDatamuse(`rel_syn=${encodeURIComponent(word)}`, limit);
}

/** Antonyms: words with opposite meaning */
export function getDatamuseAntonyms(word: string, limit = 8) {
	return fetchDatamuse(`rel_ant=${encodeURIComponent(word)}`, limit);
}

/** Related / lexical field: words with similar meaning (broader than synonyms) */
export function getDatamuseRelated(word: string, limit = 8) {
	return fetchDatamuse(`ml=${encodeURIComponent(word)}`, limit);
}
