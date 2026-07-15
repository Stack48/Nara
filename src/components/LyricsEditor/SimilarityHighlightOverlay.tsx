"use client";

import type { CSSProperties, ReactElement } from "react";

export type SimilarityHighlightRange = {
	endIndex: number;
	startIndex: number;
};

type SimilarityHighlightOverlayProps = {
	lineStyle: CSSProperties;
	ranges: SimilarityHighlightRange[];
	text: string;
};

/**
 * [36-FE] Surligne les passages détectés comme similaires sur une ligne.
 * Même mécanique que SearchHighlightOverlay : un calque de texte transparent
 * derrière l'éditeur, où seuls les segments concernés reçoivent un fond.
 */
export function SimilarityHighlightOverlay({
	lineStyle,
	ranges,
	text,
}: SimilarityHighlightOverlayProps): ReactElement {
	const sortedRanges = [...ranges].sort(
		(a, b) => a.startIndex - b.startIndex,
	);
	const segments: ReactElement[] = [];
	let cursor = 0;

	sortedRanges.forEach(
		(range: SimilarityHighlightRange, index: number): void => {
			const start = Math.max(cursor, range.startIndex);
			const end = Math.min(text.length, range.endIndex);

			if (start > cursor) {
				segments.push(
					<span key={`plain-${index}`}>
						{text.slice(cursor, start)}
					</span>,
				);
			}

			if (end > start) {
				segments.push(
					<span
						key={`match-${index}`}
						className="rounded-[3px] bg-[#f59e0b]/25 box-decoration-clone"
					>
						{text.slice(start, end)}
					</span>,
				);
			}

			cursor = Math.max(cursor, end);
		},
	);

	if (cursor < text.length) {
		segments.push(<span key="plain-tail">{text.slice(cursor)}</span>);
	}

	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 select-none whitespace-pre-wrap text-transparent"
			style={lineStyle}
		>
			{segments}
		</div>
	);
}