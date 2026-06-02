import type { JSONContent } from "@tiptap/core";
import type { LyricsFormat } from "./LyricsHeader";
export type { LyricsFormat };

export const storageKey = "nara:tiptap-lyrics-editor:my-way";
export const commentsStorageKey = "nara:tiptap-lyrics-editor:line-comments";

export type SectionKind = "untitled" | "intro" | "couplet" | "refrain" | "pont";

export const sectionLabels: Record<SectionKind, string> = {
	untitled: "Sans titre",
	intro: "Intro",
	couplet: "Couplet",
	refrain: "Refrain",
	pont: "Pont",
};

export type TipTapLyricLine = {
	id: string;
	number: number;
	content: JSONContent;
	comments: number;
	text: string;
};

export type TipTapSectionAlternative = {
	createdBy: string;
	id: string;
	label: string;
	lines: TipTapLyricLine[];
};

export type TipTapLyricSection = {
	accentColor: string;
	activeAlternativeId: string | null;
	alternatives: TipTapSectionAlternative[];
	id: string;
	kind: SectionKind;
	title: string;
	lines: TipTapLyricLine[];
};

export type TipTapLyricsDocument = {
	id: string;
	title: string;
	sections: TipTapLyricSection[];
	updatedAt: string | null;
};

export function createId(prefix: string): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getSectionAccentColor(index: number): string {
	const colors = [
		"#AA0063", // Pink/Magenta
		"#00AA90", // Teal
		"#AA7700", // Gold/Orange
		"#0055AA", // Blue
		"#7700AA", // Purple
	];
	return colors[index % colors.length];
}

// Generate a default document if nothing is in localStorage
export function createInitialDocument(): TipTapLyricsDocument {
	return {
		id: "my-way",
		title: "My Way",
		updatedAt: null,
		sections: [
			{
				accentColor: getSectionAccentColor(0),
				activeAlternativeId: null,
				alternatives: [],
				id: "intro-1",
				kind: "intro",
				title: "Intro",
				lines: [
					{
						id: createId("line"),
						number: 1,
						content: { type: "text", text: "Sed ut perspiciatis unde omnis" },
						comments: 0,
						text: "Sed ut perspiciatis unde omnis",
					},
					{
						id: createId("line"),
						number: 2,
						content: { type: "text", text: "Doloremque laudantium," },
						comments: 0,
						text: "Doloremque laudantium,",
					},
					{
						id: createId("line"),
						number: 3,
						content: { type: "text", text: "Totam rem aperiam, eaque ipsa veritatis" },
						comments: 0,
						text: "Totam rem aperiam, eaque ipsa veritatis",
					},
					{
						id: createId("line"),
						number: 4,
						content: { type: "text", text: "Iste natus error sit voluptatem accusantium" },
						comments: 0,
						text: "Iste natus error sit voluptatem accusantium",
					},
				],
			},
			{
				accentColor: getSectionAccentColor(1),
				activeAlternativeId: null,
				alternatives: [],
				id: "couplet-1",
				kind: "couplet",
				title: "Couplet",
				lines: [
					{
						id: createId("line"),
						number: 5,
						content: { type: "text", text: "Sed ut perspiciatis unde omnis" },
						comments: 0,
						text: "Sed ut perspiciatis unde omnis",
					},
					{
						id: createId("line"),
						number: 6,
						content: { type: "text", text: "Doloremque laudantium," },
						comments: 0,
						text: "Doloremque laudantium,",
					},
					{
						id: createId("line"),
						number: 7,
						content: { type: "text", text: "Totam rem aperiam, eaque ipsa veritatis" },
						comments: 0,
						text: "Totam rem aperiam, eaque ipsa veritatis",
					},
					{
						id: createId("line"),
						number: 8,
						content: { type: "text", text: "Iste natus error sit voluptatem accusantium" },
						comments: 0,
						text: "Iste natus error sit voluptatem accusantium",
					},
				],
			},
		],
	};
}

// Convert parsed structured sections to a single continuous TipTap JSON document
export function convertSectionsToTipTapJson(sections: TipTapLyricSection[]): JSONContent {
	const content: JSONContent[] = [];

	sections.forEach((section) => {
		// Add heading representing the section kind/title
		content.push({
			type: "heading",
			attrs: { level: 2 },
			content: [{ type: "text", text: `[${sectionLabels[section.kind] || section.title}]` }],
		});

		// Add lines inside this section
		const visibleLines = section.lines;
		visibleLines.forEach((line) => {
			if (line.content && typeof line.content === "object" && line.content.type) {
				// TipTap line content
				content.push({
					type: "paragraph",
					content: line.content.content || [{ type: "text", text: line.text }],
				});
			} else {
				content.push({
					type: "paragraph",
					content: line.text ? [{ type: "text", text: line.text }] : [],
				});
			}
		});

		// Add an empty paragraph as separator
		content.push({
			type: "paragraph",
			content: [],
		});
	});

	return {
		type: "doc",
		content: content,
	};
}

// Check if a line is a section heading like "[Intro]" or "[Refrain]"
export function parseSectionKindFromText(text: string): { kind: SectionKind; title: string } | null {
	const trimmed = text.trim();
	if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
		const label = trimmed.slice(1, -1).trim();
		const lowerLabel = label.toLowerCase();

		for (const [kind, name] of Object.entries(sectionLabels)) {
			if (lowerLabel === name.toLowerCase() || lowerLabel === kind) {
				return { kind: kind as SectionKind, title: name };
			}
		}
		return { kind: "untitled", title: label };
	}
	return null;
}

// Convert a single TipTap JSON document back to structured sections and lines
export function convertTipTapJsonToSections(
	doc: JSONContent,
	existingSections: TipTapLyricSection[] = []
): TipTapLyricSection[] {
	const sections: TipTapLyricSection[] = [];
	let currentSection: TipTapLyricSection | null = null;
	let lineCounter = 1;

	const nodes = doc.content || [];

	for (const node of nodes) {
		const nodeText = getTextFromNode(node);

		// Check if this node is a heading or fits "[SectionName]" format
		const sectionMatch =
			node.type === "heading"
				? parseSectionHeadingText(nodeText)
				: parseSectionKindFromText(nodeText);

		if (sectionMatch) {
			// Save current section before starting a new one
			if (currentSection && currentSection.lines.length > 0) {
				sections.push(currentSection);
			}

			// Find matching section in existing sections to preserve details (id, accentColor, alternatives)
			const existing = existingSections.find(
				(s) => s.kind === sectionMatch.kind && !sections.some((added) => added.id === s.id)
			);

			currentSection = {
				accentColor: existing?.accentColor || getSectionAccentColor(sections.length),
				activeAlternativeId: existing?.activeAlternativeId || null,
				alternatives: existing?.alternatives || [],
				id: existing?.id || createId("section"),
				kind: sectionMatch.kind,
				title: sectionMatch.title,
				lines: [],
			};
		} else {
			// It is a line/paragraph
			if (!currentSection) {
				// Autocreate an untitled section if text starts before any header
				currentSection = {
					accentColor: getSectionAccentColor(0),
					activeAlternativeId: null,
					alternatives: [],
					id: createId("section"),
					kind: "untitled",
					title: "Sans titre",
					lines: [],
				};
			}

			// Add line if node has text content or if it's not a blank paragraph separating sections
			// If it's a completely blank paragraph and currentSection has lines, we skip it to keep clean spacing
			if (nodeText.trim().length > 0 || (node.content && node.content.length > 0)) {
				currentSection.lines.push({
					id: createId("line"),
					number: lineCounter++,
					content: node,
					comments: 0,
					text: nodeText,
				});
			}
		}
	}

	if (currentSection && currentSection.lines.length > 0) {
		sections.push(currentSection);
	}

	return sections;
}

function getTextFromNode(node: JSONContent): string {
	if (!node.content) return "";
	return node.content
		.map((child) => child.text || "")
		.join("");
}

function parseSectionHeadingText(text: string): { kind: SectionKind; title: string } | null {
	const cleanText = text.replace(/[\[\]]/g, "").trim();
	const lower = cleanText.toLowerCase();

	for (const [kind, name] of Object.entries(sectionLabels)) {
		if (lower === name.toLowerCase() || lower === kind) {
			return { kind: kind as SectionKind, title: name };
		}
	}
	return { kind: "untitled", title: cleanText };
}

export function getLyricsTextColorCss(
	format: Pick<LyricsFormat, "textColor" | "textOpacity">,
): string {
	const hex = format.textColor.replace(/^#/, "");
	let r = 243, g = 244, b = 246; // default
	if (hex.length === 3) {
		r = parseInt(hex[0] + hex[0], 16);
		g = parseInt(hex[1] + hex[1], 16);
		b = parseInt(hex[2] + hex[2], 16);
	} else if (hex.length === 6) {
		r = parseInt(hex.slice(0, 2), 16);
		g = parseInt(hex.slice(2, 4), 16);
		b = parseInt(hex.slice(4, 6), 16);
	}
	const opacity = Math.max(0, Math.min(100, format.textOpacity));
	if (opacity >= 100) {
		return `#${hex.toUpperCase()}`;
	}
	return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

