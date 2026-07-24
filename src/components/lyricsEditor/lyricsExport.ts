import type { AnalysisJobResult } from "@/hooks/useSimilarityAnalysis";


/**
 * [36-FE] Export des lyrics côté client : fabrique un fichier en mémoire
 * (Blob) et déclenche son téléchargement, sans rechargement de page.
 */

type ExportLine = { text: string };
type ExportSection = { title: string; lines: ExportLine[] };
type ExportableDocument = {
	title: string;
	sections: ExportSection[];
};

function triggerDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url); // libère la mémoire une fois le clic passé
}

function toSafeFilename(title: string): string {
	const safe = title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return safe || "lyrics";
}

export function exportLyricsAsTxt(doc: ExportableDocument): void {
	const content = doc.sections
		.map((section: ExportSection): string => {
			const lines = section.lines
				.map((line: ExportLine): string => line.text)
				.join("\n");

			return `[${section.title.toUpperCase()}]\n${lines}`;
		})
		.join("\n\n");

	const blob = new Blob([`${doc.title}\n\n${content}\n`], {
		type: "text/plain;charset=utf-8",
	});

	triggerDownload(blob, `${toSafeFilename(doc.title)}.txt`);
}

export function exportLyricsAsJson(
	doc: ExportableDocument,
	analysis: AnalysisJobResult | null,
): void {
	const payload = {
		title: doc.title,
		exportedAt: new Date().toISOString(),
		sections: doc.sections.map((section: ExportSection) => ({
			title: section.title,
			lines: section.lines.map((line: ExportLine): string => line.text),
		})),
		similarityAnalysis:
			analysis?.status === "COMPLETED"
				? {
						score: analysis.score,
						matches: (analysis.matches ?? [])
							.map((match) => ({
								...match,
								passages: match.passages.filter(
									(passage) => !passage.ignored,
								),
							}))
							.filter((match) => match.passages.length > 0),
					}
				: null,
	};

	const blob = new Blob([JSON.stringify(payload, null, 2)], {
		type: "application/json;charset=utf-8",
	});

	triggerDownload(blob, `${toSafeFilename(doc.title)}.json`);
}