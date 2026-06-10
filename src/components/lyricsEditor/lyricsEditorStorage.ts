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

export type LyricsMarkKey = "bold" | "italic" | "strike" | "underline";

export type LineMarkSegment = {
	bold: boolean;
	color: string | null;
	italic: boolean;
	strike: boolean;
	text: string;
	underline: boolean;
};

type MarkList = NonNullable<JSONContent["marks"]>;

function readMarksState(
	marks: MarkList | undefined,
): Omit<LineMarkSegment, "text"> {
	const state: Omit<LineMarkSegment, "text"> = {
		bold: false,
		color: null,
		italic: false,
		strike: false,
		underline: false,
	};

	(marks ?? []).forEach((mark): void => {
		if (mark.type === "bold") state.bold = true;
		if (mark.type === "italic") state.italic = true;
		if (mark.type === "strike") state.strike = true;
		if (mark.type === "underline") state.underline = true;
		if (mark.type === "textStyle") {
			const color = mark.attrs?.color;
			state.color = typeof color === "string" ? color : null;
		}
	});

	return state;
}

// Line content comes in several shapes across the app: the TipTap doc
// shape `{type:"doc",content:[{type:"paragraph",content:[textNodes]}]}`,
// a bare paragraph, or the legacy/default `{type:"text",text}`. Normalize
// all of them to a flat list of text nodes so the mark helpers work
// regardless of how the line was created.
function getParagraphTextNodes(content: JSONContent): JSONContent[] {
	if (content.type === "text") {
		return [content];
	}

	if (content.type === "paragraph") {
		return (content.content ?? []).filter(
			(node): boolean => node.type === "text",
		);
	}

	const paragraph = content.content?.find(
		(node): boolean => node.type === "paragraph",
	);

	if (paragraph?.content) {
		return paragraph.content.filter(
			(node): boolean => node.type === "text",
		);
	}

	// Last resort: any object carrying a `text` field.
	return typeof content.text === "string" ? [content] : [];
}

export function getLineMarkSegments(content: JSONContent): LineMarkSegment[] {
	return getParagraphTextNodes(content).map(
		(node): LineMarkSegment => ({
			...readMarksState(node.marks),
			text: node.text ?? "",
		}),
	);
}

export function lineContentHasMarks(content: JSONContent): boolean {
	return getParagraphTextNodes(content).some(
		(node): boolean => (node.marks?.length ?? 0) > 0,
	);
}

export function getRangeMarkState(
	content: JSONContent,
	from: number,
	to: number,
): Omit<LineMarkSegment, "text"> {
	const state: Omit<LineMarkSegment, "text"> = {
		bold: true,
		color: null,
		italic: true,
		strike: true,
		underline: true,
	};
	let covered = false;
	let cursor = 0;

	getParagraphTextNodes(content).forEach((node): void => {
		const nodeText = node.text ?? "";
		const nodeStart = cursor;
		const nodeEnd = cursor + nodeText.length;
		cursor = nodeEnd;

		if (nodeEnd <= from || nodeStart >= to) {
			return;
		}

		covered = true;
		const nodeState = readMarksState(node.marks);
		state.bold = state.bold && nodeState.bold;
		state.italic = state.italic && nodeState.italic;
		state.strike = state.strike && nodeState.strike;
		state.underline = state.underline && nodeState.underline;
		state.color = nodeState.color;
	});

	if (!covered) {
		return {
			bold: false,
			color: null,
			italic: false,
			strike: false,
			underline: false,
		};
	}

	return state;
}

function cloneMarks(marks: MarkList | undefined): MarkList {
	return marks ? (JSON.parse(JSON.stringify(marks)) as MarkList) : [];
}

function applyMarkPatch(
	marks: MarkList | undefined,
	patch:
		| { key: LyricsMarkKey; value: boolean }
		| { key: "color"; value: string | null },
): MarkList {
	const nextMarks = cloneMarks(marks);

	if (patch.key === "color") {
		const withoutTextStyle = nextMarks.filter(
			(mark): boolean => mark.type !== "textStyle",
		);

		if (patch.value !== null) {
			withoutTextStyle.push({
				type: "textStyle",
				attrs: { color: patch.value },
			});
		}

		return withoutTextStyle;
	}

	const withoutKey = nextMarks.filter(
		(mark): boolean => mark.type !== patch.key,
	);

	if (patch.value) {
		withoutKey.push({ type: patch.key });
	}

	return withoutKey;
}

export function applyMarkToLineRange(
	content: JSONContent,
	from: number,
	to: number,
	patch:
		| { key: LyricsMarkKey; value: boolean }
		| { key: "color"; value: string | null },
): JSONContent {
	const textNodes = getParagraphTextNodes(content);

	if (textNodes.length === 0) {
		return content;
	}

	const nextNodes: JSONContent[] = [];
	let cursor = 0;

	textNodes.forEach((node): void => {
		const nodeText = node.text ?? "";
		const nodeStart = cursor;
		const nodeEnd = cursor + nodeText.length;
		cursor = nodeEnd;

		if (nodeEnd <= from || nodeStart >= to || nodeText.length === 0) {
			nextNodes.push(node);
			return;
		}

		const sliceFrom = Math.max(from, nodeStart) - nodeStart;
		const sliceTo = Math.min(to, nodeEnd) - nodeStart;

		if (sliceFrom > 0) {
			nextNodes.push({ ...node, text: nodeText.slice(0, sliceFrom) });
		}

		const markedMarks = applyMarkPatch(node.marks, patch);

		nextNodes.push({
			...node,
			marks: markedMarks.length > 0 ? markedMarks : undefined,
			text: nodeText.slice(sliceFrom, sliceTo),
		});

		if (sliceTo < nodeText.length) {
			nextNodes.push({ ...node, text: nodeText.slice(sliceTo) });
		}
	});

	// Always emit a canonical TipTap doc so downstream readers (overlay,
	// TipTap editor) get a consistent shape, even when the input was the
	// legacy `{type:"text"}` form.
	return {
		type: "doc",
		content: [
			{
				type: "paragraph",
				content: nextNodes,
			},
		],
	};
}

