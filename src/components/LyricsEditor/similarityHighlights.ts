import type { JSONContent } from "@tiptap/core";
import type { ReferenceMatch } from "@/hooks/useSimilarityAnalysis";
import type { SimilarityHighlightRange } from "./SimilarityHighlightOverlay";

/**
 * [36-FE] Traduit les positions du moteur de similarité (indices de MOTS sur
 * le texte NORMALISÉ produit par extractTipTapText) en plages de CARACTÈRES
 * sur le texte original de chaque ligne, pour le surlignage.
 *
 * Contrat à respecter scrupuleusement (voir extract-text.ts côté serveur) :
 * - parcours : sections dans l'ordre → lignes de base → alternatives ;
 * - chaque nœud texte TipTap est joint par un espace → segmenté isolément ;
 * - normalisation : minuscules, accents retirés, tout caractère hors [a-z0-9]
 *   devient séparateur (une apostrophe coupe donc un mot en deux).
 */

type LineLike = {
	id: string;
	text: string;
	content: JSONContent;
};

type SectionLike = {
	lines: LineLike[];
	alternatives: { lines: LineLike[] }[];
};

type WordPosition = {
	lineId: string;
	startIndex: number;
	endIndex: number;
};

// Reproduit la normalisation du serveur, caractère par caractère.
function isNormalizedWordChar(character: string): boolean {
	const normalized = character
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");

	return /^[a-z0-9]$/.test(normalized);
}

// Extrait les nœuds texte d'une ligne dans l'ordre du document TipTap.
function collectTextNodes(node: unknown, out: string[]): void {
	if (!node || typeof node !== "object") return;

	if (Array.isArray(node)) {
		node.forEach((child: unknown): void => collectTextNodes(child, out));
		return;
	}

	const record = node as Record<string, unknown>;

	if (record.type === "text" && typeof record.text === "string") {
		out.push(record.text);
	}

	if (record.content) collectTextNodes(record.content, out);
}

// Pour une ligne : la liste de ses mots normalisés, chacun avec sa plage de
// caractères dans line.text (= concaténation des nœuds texte).
function collectLineWordPositions(line: LineLike): WordPosition[] {
	const textNodes: string[] = [];
	collectTextNodes(line.content, textNodes);

	const positions: WordPosition[] = [];
	let nodeOffset = 0;

	textNodes.forEach((nodeText: string): void => {
		let wordStart = -1;

		for (let i = 0; i <= nodeText.length; i++) {
			const isWord =
				i < nodeText.length && isNormalizedWordChar(nodeText[i]);

			if (isWord && wordStart === -1) {
				wordStart = i;
			} else if (!isWord && wordStart !== -1) {
				positions.push({
					lineId: line.id,
					startIndex: nodeOffset + wordStart,
					endIndex: nodeOffset + i,
				});
				wordStart = -1;
			}
		}

		nodeOffset += nodeText.length;
	});

	return positions;
}

// L'index global : le k-ième mot du texte analysé → sa position dans une ligne.
function collectDocumentWordPositions(
	sections: SectionLike[],
): WordPosition[] {
	const positions: WordPosition[] = [];

	sections.forEach((section: SectionLike): void => {
		section.lines.forEach((line: LineLike): void => {
			positions.push(...collectLineWordPositions(line));
		});
		section.alternatives.forEach((alternative): void => {
			alternative.lines.forEach((line: LineLike): void => {
				positions.push(...collectLineWordPositions(line));
			});
		});
	});

	return positions;
}

export function computeSimilarityHighlights(
	sections: SectionLike[],
	matches: ReferenceMatch[],
): Record<string, SimilarityHighlightRange[]> {
	const wordPositions = collectDocumentWordPositions(sections);
	const rangesByLineId: Record<string, SimilarityHighlightRange[]> = {};

	matches.forEach((match: ReferenceMatch): void => {
		match.passages.forEach((passage): void => {
			if (passage.ignored) return;

			let current: (SimilarityHighlightRange & { lineId: string }) | null =
				null;

			for (
				let wordIndex = passage.inputWordStart;
				wordIndex < passage.inputWordEnd;
				wordIndex++
			) {
				const word = wordPositions[wordIndex];
				if (!word) continue; // le document a changé depuis l'analyse

				if (current && current.lineId === word.lineId) {
					// Étend la plage : couvre aussi les espaces entre mots.
					current.endIndex = Math.max(current.endIndex, word.endIndex);
				} else {
					if (current) {
						(rangesByLineId[current.lineId] ??= []).push({
							startIndex: current.startIndex,
							endIndex: current.endIndex,
						});
					}
					current = {
						lineId: word.lineId,
						startIndex: word.startIndex,
						endIndex: word.endIndex,
					};
				}
			}

			if (current) {
				(rangesByLineId[current.lineId] ??= []).push({
					startIndex: current.startIndex,
					endIndex: current.endIndex,
				});
			}
		});
	});

	return rangesByLineId;
}