import "server-only";
import type { LinguisticResult } from "./linguistic.types";

const API_KEY = process.env.DICOLINK_API_KEY;

type DicoEndpoint = "synonymes" | "antonymes" | "champlexical";

async function fetchDicoLink(
	word: string,
	endpoint: DicoEndpoint,
	limit = 8,
): Promise<LinguisticResult> {
	if (!API_KEY) {
		return { word, results: [], error: "DICOLINK_API_KEY is not set" };
	}

	const isRapidAPI = API_KEY.length === 50 && API_KEY.includes("emsh");

	const baseUrl = isRapidAPI
		? "https://dicolink.p.rapidapi.com/mot"
		: "https://api.dicolink.com/v1/mot";

	const url = isRapidAPI
		? `${baseUrl}/${encodeURIComponent(word)}/${endpoint}?limite=${limit}`
		: `${baseUrl}/${encodeURIComponent(word)}/${endpoint}?limite=${limit}&api_key=${API_KEY}`;

	const headers: Record<string, string> = isRapidAPI
		? {
				"x-rapidapi-key": API_KEY,
				"x-rapidapi-host": "dicolink.p.rapidapi.com",
			}
		: {};

	try {
		const res = await fetch(url, {
			headers,
			next: { revalidate: 3600 },
		});

		if (!res.ok) {
			return {
				word,
				results: [],
				error: `DicoLink error: ${res.status}`,
			};
		}

		const data = await res.json();

		if (
			data &&
			typeof data === "object" &&
			!Array.isArray(data) &&
			data.error
		) {
			return {
				word,
				results: [],
				error: data.error,
			};
		}
		const primaryKey =
			endpoint === "synonymes"
				? "synonyme"
				: endpoint === "antonymes"
					? "antonyme"
					: "champlexical";

		const keysToTry = [primaryKey, "mot"];

		const results = Array.isArray(data)
			? data
					.map((item: Record<string, string>) => {
						for (const k of keysToTry) {
							if (item[k]) return item[k];
						}
						return null;
					})
					.filter(Boolean)
			: [];

		return {
			word,
			results,
		};
	} catch (err) {
		return {
			word,
			results: [],
			error:
				err instanceof Error
					? err.message
					: "Unknown DicoLink fetch error",
		};
	}
}

export const getSynonyms = (word: string) => fetchDicoLink(word, "synonymes");
export const getAntonyms = (word: string) => fetchDicoLink(word, "antonymes");
export const getLexicalField = (word: string) =>
	fetchDicoLink(word, "champlexical");
