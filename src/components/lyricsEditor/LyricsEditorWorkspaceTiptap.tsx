"use client";

import type { JSONContent } from "@tiptap/core";
import {
	Check,
	CheckSquare,
	ChevronDown,
	ChevronRight,
	Copy,
	GripVertical,
	MessageSquare,
	Plus,
	Save,
	Search,
	SendHorizontal,
	Trash2,
} from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ChangeEvent,
	type CSSProperties,
	type DragEvent,
	type KeyboardEvent,
	type ReactElement,
} from "react";
import {
	LyricsInspector,
	type LyricsInspectorLookupRequest,
	type LyricsInspectorLookupTarget,
} from "@/components/lyricsEditor/LyricsInspector";
import type { LyricsFormat } from "@/components/lyricsEditor/LyricsHeader";
import {
	lyricsEditorCommentsStorageKey,
	lyricsEditorDocumentStorageKey,
} from "@/components/lyricsEditor/lyricsEditorStorage";
import TipTapLineEditor, {
	type TipTapCursorPresence,
	type TipTapLineUpdate,
	type TipTapTextSelection,
} from "@/components/lyricsEditor/TipTapLineEditor";
import {
	TrackPlayer,
	type TrackMarker,
} from "@/components/lyricsEditor/TrackPlayer";

type SectionKind = "untitled" | "intro" | "couplet" | "refrain" | "pont";

type TipTapLyricLine = {
	id: string;
	number: number;
	content: JSONContent;
	comments: number;
	text: string;
};

type TipTapSectionAlternative = {
	createdBy: string;
	id: string;
	label: string;
	lines: TipTapLyricLine[];
};

type TipTapLyricSection = {
	accentColor: string;
	activeAlternativeId: string | null;
	alternatives: TipTapSectionAlternative[];
	id: string;
	kind: SectionKind;
	title: string;
	lines: TipTapLyricLine[];
};

type TipTapLyricsDocument = {
	id: string;
	title: string;
	sections: TipTapLyricSection[];
	updatedAt: string | null;
};

type SaveState = "idle" | "saved";

type EditorToggleKey = "rhymes" | "annotation" | "syllables";

type SectionOptionKey = EditorToggleKey | "wordCount";

type EditorToggle = {
	key: EditorToggleKey;
	label: string;
	enabled: boolean;
};

type SectionOptions = Record<SectionOptionKey, boolean>;

type LineComment = {
	author: string;
	body: string;
	id: string;
	initial: string;
	time: string;
};

type LineCommentsById = Record<string, LineComment[]>;

type RhymeHighlight = {
	color: string;
	endIndex: number;
	key: string;
	startIndex: number;
	word: string;
};

type RhymeHighlightsByLineId = Record<string, RhymeHighlight>;

type SyllableWordPart = {
	count: number;
	id: string;
	kind: "word";
	text: string;
};

type SyllableSpacePart = {
	id: string;
	kind: "space";
	text: string;
};

type SyllablePart = SyllableWordPart | SyllableSpacePart;

type LineDragState = {
	lineId: string;
	sectionId: string;
};

type LineDropPlacement = "before" | "after";

type CaretPlacement = "start" | "end";

type LyricsEditorWorkspaceTiptapProps = {
	format: LyricsFormat;
	onFormatChange: (patch: Partial<LyricsFormat>) => void;
};

type SectionKindPickerProps = {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (kind: SectionKind) => void;
	onToggle: () => void;
	section: TipTapLyricSection;
};

type TextLookupSelection = {
	focusText?: string;
	from: number;
	lineId: string;
	mode: "lookup" | "transform";
	rawText: string;
	rect: TipTapTextSelection["rect"];
	sectionId: string;
	source: "focus" | "line";
	text: string;
	to: number;
};

type SearchMatchRange = {
	endIndex: number;
	startIndex: number;
};

type FocusSectionMarker = {
	id: string;
	initial: string;
	label: string;
	lineIndex: number;
};

type FocusTextModel = {
	markers: FocusSectionMarker[];
	text: string;
};

type RemotePresence = {
	color: string;
	cursorOffset: number | null;
	initial: string;
	lineId: string | null;
	name: string;
	projectId: string;
	sectionId: string | null;
	sessionId: string;
	updatedAt: number;
	userId: string;
};

type PresenceMessage =
	| {
			payload: RemotePresence;
			type: "presence:update";
	  }
	| {
			payload: {
				document: TipTapLyricsDocument;
				lineCommentsById: LineCommentsById;
				sourceSessionId: string;
				updatedAt: number;
			};
			type: "document:update";
	  }
	| {
			sessionId: string;
			type: "presence:leave";
	  };

type RemotePresenceBySessionId = Record<string, RemotePresence>;

type RealtimeSnapshot = {
	documentPayload:
		| Extract<PresenceMessage, { type: "document:update" }>["payload"]
		| null;
	presences: RemotePresence[];
};

const storageKey = lyricsEditorDocumentStorageKey;
const commentsStorageKey = lyricsEditorCommentsStorageKey;
const defaultTrackDurationSeconds = 270;
const sectionDragType = "application/x-nara-tiptap-section";
const lineDragType = "application/x-nara-tiptap-line";
const realtimeEndpoint = "/api/realtime/lyrics";
const presenceChannelName = "nara:lyrics-editor:presence";
const presenceHeartbeatDelayMs = 2200;
const networkPollDelayMs = 650;
const presenceStaleDelayMs = 7000;
const focusTextareaLineHeightPx = 24;
const focusTextareaTopPaddingPx = 48;
const focusTextareaLeftPaddingPx = 64;
const focusSectionLabelOffsetPx = 31;
const focusSectionSeparatorNewlineCount = 3;
const localPresenceUser = {
	color: "#DA069A",
	initial: "N",
	name: "Nilu",
	userId: "nilu",
} as const;

const editableSectionKinds: Exclude<SectionKind, "untitled">[] = [
	"intro",
	"couplet",
	"refrain",
	"pont",
];

const sectionKinds: SectionKind[] = ["untitled", ...editableSectionKinds];

const sectionLabels: Record<SectionKind, string> = {
	untitled: "UNTITLED",
	intro: "INTRO",
	couplet: "COUPLET",
	refrain: "REFRAIN",
	pont: "PONT",
};

const sectionAccentPalette: string[] = [
	"#DA069A",
	"#F4B84A",
	"#8B5CF6",
	"#6D7DFF",
	"#45D6C8",
	"#FF6B7A",
	"#A3E635",
	"#F97316",
	"#38BDF8",
	"#E879F9",
];

const rhymeAccentPalette: string[] = [
	"#FF5C72",
	"#B8F36B",
	"#8B5CF6",
	"#45D6C8",
	"#F4B84A",
	"#38BDF8",
];

const initialToggles: EditorToggle[] = [
	{ key: "rhymes", label: "Rimes", enabled: false },
	{ key: "annotation", label: "Annotation", enabled: true },
	{ key: "syllables", label: "Syllabes", enabled: false },
];

const defaultSectionOptions: SectionOptions = {
	rhymes: false,
	annotation: true,
	syllables: false,
	wordCount: true,
};

const sectionMenuToggleOrder: EditorToggleKey[] = [
	"rhymes",
	"syllables",
	"annotation",
];

function createId(prefix: string): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return `${prefix}-${crypto.randomUUID()}`;
	}

	return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function createPresenceSessionId(): string {
	const cryptoApi: Crypto | undefined = globalThis.crypto;

	if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
		return cryptoApi.randomUUID();
	}

	return `presence-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function hexToRgbParts(hexColor: string): { b: number; g: number; r: number } {
	const normalizedColor = hexColor.replace("#", "").trim();
	const expandedColor =
		normalizedColor.length === 3
			? normalizedColor
					.split("")
					.map((character: string): string => character + character)
					.join("")
			: normalizedColor;
	const parsedColor = Number.parseInt(expandedColor, 16);

	if (Number.isNaN(parsedColor) || expandedColor.length !== 6) {
		return { b: 154, g: 6, r: 218 };
	}

	return {
		b: parsedColor & 255,
		g: (parsedColor >> 8) & 255,
		r: (parsedColor >> 16) & 255,
	};
}

function createPastelRhymeColor(hexColor: string, alpha: number): string {
	const { b, g, r } = hexToRgbParts(hexColor);
	const mixWithWhite = 0.42;
	const pastelRed = Math.round(r * (1 - mixWithWhite) + 243 * mixWithWhite);
	const pastelGreen = Math.round(g * (1 - mixWithWhite) + 244 * mixWithWhite);
	const pastelBlue = Math.round(b * (1 - mixWithWhite) + 246 * mixWithWhite);

	return `rgba(${pastelRed}, ${pastelGreen}, ${pastelBlue}, ${alpha})`;
}

function createParagraphContent(text = ""): JSONContent {
	return {
		type: "doc",
		content: [
			{
				type: "paragraph",
				content: text.length > 0 ? [{ type: "text", text }] : undefined,
			},
		],
	};
}

function createLine(prefix: string, text = ""): TipTapLyricLine {
	return {
		id: createId(prefix),
		number: 0,
		content: createParagraphContent(text),
		comments: 0,
		text,
	};
}

function cloneLineForSection(
	line: TipTapLyricLine,
	prefix: string,
): TipTapLyricLine {
	return {
		...line,
		id: createId(prefix),
		comments: 0,
		content: JSON.parse(JSON.stringify(line.content)) as JSONContent,
	};
}

function cloneLinesForSection(
	lines: TipTapLyricLine[],
	prefix: string,
): TipTapLyricLine[] {
	return lines.map(
		(line: TipTapLyricLine): TipTapLyricLine =>
			cloneLineForSection(line, prefix),
	);
}

function getActiveAlternative(
	section: TipTapLyricSection,
): TipTapSectionAlternative | null {
	return (
		section.alternatives.find(
			(alternative: TipTapSectionAlternative): boolean =>
				alternative.id === section.activeAlternativeId,
		) ?? null
	);
}

function getVisibleSectionLines(
	section: TipTapLyricSection,
): TipTapLyricLine[] {
	return getActiveAlternative(section)?.lines ?? section.lines;
}

function getSectionIdForLine(
	sections: TipTapLyricSection[],
	lineId: string | null,
): string | null {
	if (!lineId) {
		return null;
	}

	return (
		sections.find((section: TipTapLyricSection): boolean =>
			getVisibleSectionLines(section).some(
				(line: TipTapLyricLine): boolean => line.id === lineId,
			),
		)?.id ?? null
	);
}

function getVisibleLineById(
	sections: TipTapLyricSection[],
	lineId: string | null,
): TipTapLyricLine | null {
	if (!lineId) {
		return null;
	}

	for (const section of sections) {
		const line =
			getVisibleSectionLines(section).find(
				(sectionLine: TipTapLyricLine): boolean =>
					sectionLine.id === lineId,
			) ?? null;

		if (line) {
			return line;
		}
	}

	return null;
}

function preserveLocalFocusedLine(
	remoteDocument: TipTapLyricsDocument,
	localDocument: TipTapLyricsDocument,
	activeLineId: string | null,
): TipTapLyricsDocument {
	const localLine = getVisibleLineById(localDocument.sections, activeLineId);

	if (!activeLineId || !localLine) {
		return remoteDocument;
	}

	let didPreserveLine = false;
	const nextSections = remoteDocument.sections.map(
		(section: TipTapLyricSection): TipTapLyricSection => {
			const visibleLines = getVisibleSectionLines(section);

			if (
				!visibleLines.some(
					(line: TipTapLyricLine): boolean =>
						line.id === activeLineId,
				)
			) {
				return section;
			}

			didPreserveLine = true;
			return setVisibleSectionLines(
				section,
				visibleLines.map(
					(line: TipTapLyricLine): TipTapLyricLine =>
						line.id === activeLineId ? localLine : line,
				),
			);
		},
	);

	return didPreserveLine
		? {
				...remoteDocument,
				sections: nextSections,
			}
		: remoteDocument;
}

function createDocumentSyncSignature(
	document: TipTapLyricsDocument,
	lineCommentsById: LineCommentsById,
): string {
	return JSON.stringify({
		document,
		lineCommentsById,
	});
}

function setVisibleSectionLines(
	section: TipTapLyricSection,
	lines: TipTapLyricLine[],
): TipTapLyricSection {
	const activeAlternative = getActiveAlternative(section);

	if (!activeAlternative) {
		return { ...section, lines };
	}

	return {
		...section,
		alternatives: section.alternatives.map(
			(
				alternative: TipTapSectionAlternative,
			): TipTapSectionAlternative =>
				alternative.id === activeAlternative.id
					? { ...alternative, lines }
					: alternative,
		),
	};
}

function getSectionAccentColor(index: number): string {
	const safeIndex: number = Math.max(0, index);

	return (
		sectionAccentPalette[safeIndex % sectionAccentPalette.length] ??
		"#DA069A"
	);
}

function isStoredAccentColor(value: unknown): value is string {
	return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function createSection(
	kind: SectionKind,
	titleIndex: number,
	accentIndex = titleIndex - 1,
): TipTapLyricSection {
	return {
		accentColor: getSectionAccentColor(accentIndex),
		activeAlternativeId: null,
		alternatives: [],
		id: createId(kind),
		kind,
		title: `${sectionLabels[kind]}${kind === "couplet" && titleIndex > 1 ? ` ${titleIndex}` : ""}`,
		lines: [createLine(kind)],
	};
}

function createSectionFromText(
	kind: SectionKind,
	text: string,
	accentIndex: number,
): TipTapLyricSection {
	const lines: string[] = text
		.split(/\r?\n/)
		.map((lineText: string): string => lineText.trim())
		.filter((lineText: string): boolean => lineText.length > 0);
	const nextSection = createSection(kind, 1, accentIndex);

	return {
		...nextSection,
		lines:
			lines.length > 0
				? lines.map(
						(lineText: string): TipTapLyricLine =>
							createLine(kind, lineText),
					)
				: [createLine(kind)],
	};
}

function replaceLineText(line: TipTapLyricLine, text: string): TipTapLyricLine {
	return {
		...line,
		content: createParagraphContent(text),
		text,
	};
}

function createLinesFromPlainText(
	section: TipTapLyricSection,
	text: string,
): TipTapLyricLine[] {
	const sourceLines = getVisibleSectionLines(section);
	const rawLines = text.split(/\r?\n/);
	const nextLines = rawLines.map(
		(lineText: string, index: number): TipTapLyricLine => {
			const sourceLine = sourceLines[index];

			return sourceLine
				? replaceLineText(sourceLine, lineText)
				: createLine(section.kind, lineText);
		},
	);

	return nextLines.length > 0 ? nextLines : [createLine(section.kind)];
}

function getSectionPlainText(section: TipTapLyricSection): string {
	return getVisibleSectionLines(section)
		.map((line: TipTapLyricLine): string => line.text)
		.join("\n");
}

function createFocusTextModel(sections: TipTapLyricSection[]): FocusTextModel {
	let text = "";
	let lineIndex = 0;
	const markers: FocusSectionMarker[] = [];

	sections.forEach((section: TipTapLyricSection, index: number): void => {
		const sectionText = getSectionPlainText(section);

		markers.push({
			id: section.id,
			initial: getFocusSectionInitial(section.kind),
			label: getSectionLabel(section.kind),
			lineIndex,
		});

		text += sectionText;
		lineIndex += Math.max(1, sectionText.split(/\r?\n/).length);

		if (index < sections.length - 1) {
			text += "\n".repeat(focusSectionSeparatorNewlineCount);
			lineIndex += focusSectionSeparatorNewlineCount;
		}
	});

	return { markers, text };
}

function createFocusSectionMarkersFromText(
	text: string,
	sections: TipTapLyricSection[],
): FocusSectionMarker[] {
	const lines = text.replace(/\r\n/g, "\n").split("\n");
	const markers: FocusSectionMarker[] = [];
	let sectionIndex = 0;
	let isPreviousLineBlank = true;

	lines.forEach((line: string, lineIndex: number): void => {
		const hasContent = line.trim().length > 0;

		if (!hasContent) {
			isPreviousLineBlank = true;
			return;
		}

		if (isPreviousLineBlank) {
			const section = sections[sectionIndex];
			const kind: SectionKind = section?.kind ?? "untitled";

			markers.push({
				id: section?.id ?? `focus-section-${sectionIndex}`,
				initial: getFocusSectionInitial(kind),
				label: getSectionLabel(kind),
				lineIndex,
			});
			sectionIndex += 1;
		}

		isPreviousLineBlank = false;
	});

	return markers;
}

function splitFocusTextBlocks(text: string): string[] {
	return text
		.replace(/\r\n/g, "\n")
		.split(/\n{2,}/)
		.map((blockText: string): string => blockText.replace(/^\n+|\n+$/g, ""))
		.filter((blockText: string): boolean => blockText.trim().length > 0);
}

function createSectionsFromFocusText(
	text: string,
	sourceSections: TipTapLyricSection[],
	accentOffset: number,
): TipTapLyricSection[] {
	const blocks = splitFocusTextBlocks(text);

	if (blocks.length === 0) {
		return [];
	}

	return blocks.map(
		(blockText: string, index: number): TipTapLyricSection => {
			const sourceSection = sourceSections[index];

			if (sourceSection) {
				return setVisibleSectionLines(
					sourceSection,
					createLinesFromPlainText(sourceSection, blockText),
				);
			}

			return createSectionFromText(
				"untitled",
				blockText,
				accentOffset + index,
			);
		},
	);
}

function renumberDocument(
	sections: TipTapLyricSection[],
): TipTapLyricSection[] {
	let lineNumber = 1;
	const kindCounts: Record<SectionKind, number> = {
		untitled: 0,
		intro: 0,
		couplet: 0,
		refrain: 0,
		pont: 0,
	};

	return sections.map(
		(section: TipTapLyricSection, index: number): TipTapLyricSection => {
			kindCounts[section.kind] += 1;
			const title =
				kindCounts[section.kind] > 1
					? `${sectionLabels[section.kind]} ${kindCounts[section.kind]}`
					: sectionLabels[section.kind];
			const activeAlternative = getActiveAlternative(section);
			const visibleLines = getVisibleSectionLines(section).map(
				(line: TipTapLyricLine): TipTapLyricLine => ({
					...line,
					number: lineNumber++,
				}),
			);

			return {
				...section,
				accentColor:
					section.accentColor || getSectionAccentColor(index),
				title,
				lines: activeAlternative ? section.lines : visibleLines,
				alternatives: section.alternatives.map(
					(
						alternative: TipTapSectionAlternative,
					): TipTapSectionAlternative =>
						alternative.id === activeAlternative?.id
							? { ...alternative, lines: visibleLines }
							: alternative,
				),
			};
		},
	);
}

function createInitialDocument(): TipTapLyricsDocument {
	return {
		id: "my-way",
		title: "My Way",
		updatedAt: null,
		sections: renumberDocument([
			{
				accentColor: getSectionAccentColor(0),
				activeAlternativeId: null,
				alternatives: [],
				id: "intro",
				kind: "intro",
				title: "INTRO",
				lines: [
					createLine("intro", "Sed ut perspiciatis unde omnis"),
					createLine("intro", "Doloremque laudantium,"),
					createLine(
						"intro",
						"Iste natus error sit voluptatem accusantium",
					),
					createLine(
						"intro",
						"Totam rem aperiam, eaque ipsa veritatis",
					),
				],
			},
			{
				accentColor: getSectionAccentColor(1),
				activeAlternativeId: null,
				alternatives: [],
				id: "couplet-1",
				kind: "couplet",
				title: "COUPLET 1",
				lines: [
					createLine("couplet", "Sed ut perspiciatis unde omnis"),
					createLine("couplet", "Doloremque laudantium,"),
					createLine(
						"couplet",
						"Iste natus error sit voluptatem accusantium",
					),
					createLine(
						"couplet",
						"Totam rem aperiam, eaque ipsa veritatis",
					),
				],
			},
			{
				accentColor: getSectionAccentColor(2),
				activeAlternativeId: null,
				alternatives: [],
				id: "refrain",
				kind: "refrain",
				title: "REFRAIN",
				lines: [
					createLine("refrain", "Sed ut perspiciatis unde omnis"),
					createLine("refrain", "Doloremque laudantium,"),
					createLine(
						"refrain",
						"Iste natus error sit voluptatem accusantium",
					),
					createLine(
						"refrain",
						"Totam rem aperiam, eaque ipsa veritatis",
					),
				],
			},
		]),
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isRemotePresence(value: unknown): value is RemotePresence {
	return (
		isRecord(value) &&
		typeof value.sessionId === "string" &&
		typeof value.userId === "string" &&
		typeof value.name === "string" &&
		typeof value.initial === "string" &&
		typeof value.color === "string" &&
		(typeof value.cursorOffset === "number" ||
			value.cursorOffset === null) &&
		typeof value.projectId === "string" &&
		(typeof value.sectionId === "string" || value.sectionId === null) &&
		(typeof value.lineId === "string" || value.lineId === null) &&
		typeof value.updatedAt === "number"
	);
}

function parseRemoteDocument(value: unknown): TipTapLyricsDocument | null {
	if (!isRecord(value)) {
		return null;
	}

	return parseStoredDocument(JSON.stringify(value));
}

function isDocumentUpdatePayload(
	value: unknown,
): value is Extract<PresenceMessage, { type: "document:update" }>["payload"] {
	return (
		isRecord(value) &&
		typeof value.sourceSessionId === "string" &&
		typeof value.updatedAt === "number" &&
		parseRemoteDocument(value.document) !== null &&
		isLineCommentsById(value.lineCommentsById)
	);
}

function isPresenceMessage(value: unknown): value is PresenceMessage {
	if (!isRecord(value) || typeof value.type !== "string") {
		return false;
	}

	if (value.type === "presence:update") {
		return isRemotePresence(value.payload);
	}

	if (value.type === "document:update") {
		return isDocumentUpdatePayload(value.payload);
	}

	return (
		value.type === "presence:leave" && typeof value.sessionId === "string"
	);
}

function isRealtimeSnapshot(value: unknown): value is RealtimeSnapshot {
	return (
		isRecord(value) &&
		(value.documentPayload === null ||
			isDocumentUpdatePayload(value.documentPayload)) &&
		Array.isArray(value.presences) &&
		value.presences.every(isRemotePresence)
	);
}

function postRealtimeMessage(message: PresenceMessage): void {
	if (typeof window === "undefined") {
		return;
	}

	void fetch(realtimeEndpoint, {
		body: JSON.stringify(message),
		cache: "no-store",
		headers: {
			"Content-Type": "application/json",
		},
		method: "POST",
	}).catch((): void => undefined);
}

function isLineComment(value: unknown): value is LineComment {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.author === "string" &&
		typeof value.initial === "string" &&
		typeof value.body === "string" &&
		typeof value.time === "string"
	);
}

function isLineCommentsById(value: unknown): value is LineCommentsById {
	return (
		isRecord(value) &&
		Object.values(value).every(
			(comments: unknown): boolean =>
				Array.isArray(comments) && comments.every(isLineComment),
		)
	);
}

function isSectionKind(value: unknown): value is SectionKind {
	return (
		typeof value === "string" && sectionKinds.includes(value as SectionKind)
	);
}

function isJsonContent(value: unknown): value is JSONContent {
	return isRecord(value) && typeof value.type === "string";
}

function parseStoredLines(
	value: unknown,
	kind: SectionKind,
): TipTapLyricLine[] {
	if (!Array.isArray(value)) {
		return [createLine(kind)];
	}

	const lines = value
		.map((lineValue: unknown): TipTapLyricLine | null => {
			if (
				!isRecord(lineValue) ||
				typeof lineValue.id !== "string" ||
				!isJsonContent(lineValue.content)
			) {
				return null;
			}

			return {
				id: lineValue.id,
				number:
					typeof lineValue.number === "number" ? lineValue.number : 0,
				content: lineValue.content,
				comments:
					typeof lineValue.comments === "number"
						? lineValue.comments
						: 0,
				text: typeof lineValue.text === "string" ? lineValue.text : "",
			};
		})
		.filter(
			(line: TipTapLyricLine | null): line is TipTapLyricLine =>
				line !== null,
		);

	return lines.length > 0 ? lines : [createLine(kind)];
}

function parseStoredAlternatives(
	value: unknown,
	kind: SectionKind,
): TipTapSectionAlternative[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map(
			(
				alternativeValue: unknown,
				index: number,
			): TipTapSectionAlternative | null => {
				if (!isRecord(alternativeValue)) {
					return null;
				}

				return {
					createdBy:
						typeof alternativeValue.createdBy === "string"
							? alternativeValue.createdBy
							: "Equipe",
					id:
						typeof alternativeValue.id === "string"
							? alternativeValue.id
							: createId(`${kind}-alternative`),
					label:
						typeof alternativeValue.label === "string"
							? alternativeValue.label
							: `Alternative ${index + 1}`,
					lines: parseStoredLines(alternativeValue.lines, kind),
				};
			},
		)
		.filter(
			(
				alternative: TipTapSectionAlternative | null,
			): alternative is TipTapSectionAlternative => alternative !== null,
		);
}

function parseStoredDocument(
	value: string | null,
): TipTapLyricsDocument | null {
	if (!value) {
		return null;
	}

	try {
		const parsedValue: unknown = JSON.parse(value);

		if (!isRecord(parsedValue) || !Array.isArray(parsedValue.sections)) {
			return null;
		}

		const sections = parsedValue.sections
			.map(
				(
					sectionValue: unknown,
					index: number,
				): TipTapLyricSection | null => {
					if (
						!isRecord(sectionValue) ||
						!isSectionKind(sectionValue.kind) ||
						!Array.isArray(sectionValue.lines)
					) {
						return null;
					}

					const alternatives = parseStoredAlternatives(
						sectionValue.alternatives,
						sectionValue.kind,
					);
					const activeAlternativeId =
						typeof sectionValue.activeAlternativeId === "string" &&
						alternatives.some(
							(alternative: TipTapSectionAlternative): boolean =>
								alternative.id ===
								sectionValue.activeAlternativeId,
						)
							? sectionValue.activeAlternativeId
							: null;

					return {
						accentColor: isStoredAccentColor(
							sectionValue.accentColor,
						)
							? sectionValue.accentColor
							: getSectionAccentColor(index),
						activeAlternativeId,
						alternatives,
						id:
							typeof sectionValue.id === "string"
								? sectionValue.id
								: createId(sectionValue.kind),
						kind: sectionValue.kind,
						title:
							typeof sectionValue.title === "string"
								? sectionValue.title
								: sectionLabels[sectionValue.kind],
						lines: parseStoredLines(
							sectionValue.lines,
							sectionValue.kind,
						),
					};
				},
			)
			.filter(
				(
					section: TipTapLyricSection | null,
				): section is TipTapLyricSection => section !== null,
			);

		if (sections.length === 0) {
			return null;
		}

		return {
			id: typeof parsedValue.id === "string" ? parsedValue.id : "my-way",
			title:
				typeof parsedValue.title === "string"
					? parsedValue.title
					: "My Way",
			sections: renumberDocument(sections),
			updatedAt:
				typeof parsedValue.updatedAt === "string"
					? parsedValue.updatedAt
					: null,
		};
	} catch {
		return null;
	}
}

function parseStoredLineComments(
	value: string | null,
): LineCommentsById | null {
	if (!value) {
		return null;
	}

	try {
		const parsedValue: unknown = JSON.parse(value);

		return isLineCommentsById(parsedValue) ? parsedValue : null;
	} catch {
		return null;
	}
}

function getClientStorage(): Storage | null {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

function countWords(text: string): number {
	return text.trim().match(/\S+/g)?.length ?? 0;
}

function countSectionWords(section: TipTapLyricSection): number {
	return getVisibleSectionLines(section).reduce(
		(total: number, line: TipTapLyricLine): number =>
			total + countWords(line.text),
		0,
	);
}

function countDocumentWords(document: TipTapLyricsDocument): number {
	return document.sections.reduce(
		(total: number, section: TipTapLyricSection): number =>
			total + countSectionWords(section),
		0,
	);
}

function countApproximateSyllables(word: string): number {
	const cleanWord: string = word
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z]/g, "");

	if (!cleanWord) {
		return 0;
	}

	const vowelGroups: RegExpMatchArray | null = cleanWord.match(/[aeiouy]+/g);
	const baseCount: number = vowelGroups?.length ?? 1;
	const silentEnding: boolean =
		cleanWord.length > 3 && cleanWord.endsWith("e") && baseCount > 1;

	return Math.max(1, silentEnding ? baseCount - 1 : baseCount);
}

function getSyllableParts(text: string): SyllablePart[] {
	const parts: RegExpMatchArray | null = text.match(/\s+|\S+/g);

	if (!parts) {
		return [];
	}

	return parts.map((part: string, index: number): SyllablePart => {
		if (/^\s+$/.test(part)) {
			return {
				id: `space-${index}`,
				kind: "space",
				text: part,
			};
		}

		return {
			count: countApproximateSyllables(part),
			id: `word-${index}-${part}`,
			kind: "word",
			text: part,
		};
	});
}

function normalizeRhymeWord(word: string): string {
	return word
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]/g, "");
}

function getApproximatePhoneticWord(word: string): string {
	let phoneticWord = normalizeRhymeWord(word)
		.replace(/ph/g, "f")
		.replace(/qu/g, "k")
		.replace(/c(?=e|i|y)/g, "s")
		.replace(/([bcdfghjklmnpqrstvwxz])\1+/g, "$1");

	if (phoneticWord.endsWith("issent")) {
		phoneticWord = phoneticWord.replace(/issent$/, "is");
	}

	if (phoneticWord.endsWith("isse") || phoneticWord.endsWith("ice")) {
		phoneticWord = phoneticWord.slice(0, -1);
	}

	phoneticWord = phoneticWord
		.replace(/eaux$/, "o")
		.replace(/eau$/, "o")
		.replace(/aux$/, "o")
		.replace(/au$/, "o")
		.replace(/tion$/, "sion")
		.replace(/aient$/, "e")
		.replace(/ait$/, "e")
		.replace(/ais$/, "e")
		.replace(/er$/, "e")
		.replace(/ez$/, "e");

	if (phoneticWord.length > 3) {
		phoneticWord = phoneticWord.replace(/e$/, "");
	}

	return phoneticWord;
}

function getRhymeKey(word: string): string | null {
	const normalizedWord: string = getApproximatePhoneticWord(word);

	if (normalizedWord.length < 2) {
		return null;
	}

	const knownSoundEndings: string[] = [
		"sion",
		"ium",
		"isme",
		"age",
		"eur",
		"oir",
		"ais",
		"ait",
		"is",
		"in",
		"an",
		"on",
		"ou",
		"o",
		"e",
		"a",
		"i",
		"u",
	];
	const knownEnding: string | undefined = knownSoundEndings.find(
		(ending: string): boolean => normalizedWord.endsWith(ending),
	);

	if (knownEnding) {
		return knownEnding;
	}

	const finalSound: string | undefined =
		normalizedWord.match(/[aeiouy]+[^aeiouy]*$/)?.[0];
	const key: string =
		finalSound && finalSound.length >= 2
			? finalSound
			: normalizedWord.slice(-2);

	return key.length > 4 ? key.slice(-4) : key;
}

function getLineRhymeCandidate(
	line: TipTapLyricLine,
): (RhymeHighlight & { lineId: string }) | null {
	const wordMatches: RegExpMatchArray[] = Array.from(
		line.text.matchAll(/[\p{L}0-9'-]+/gu),
	);
	const lastWordMatch: RegExpMatchArray | undefined = wordMatches.at(-1);

	if (!lastWordMatch || typeof lastWordMatch.index !== "number") {
		return null;
	}

	const word = lastWordMatch[0];
	const key = getRhymeKey(word);

	if (!key) {
		return null;
	}

	return {
		color: "#FF5C72",
		endIndex: lastWordMatch.index + word.length,
		key,
		lineId: line.id,
		startIndex: lastWordMatch.index,
		word,
	};
}

function createRhymeHighlights(
	sections: TipTapLyricSection[],
): RhymeHighlightsByLineId {
	const candidates: Array<RhymeHighlight & { lineId: string }> =
		sections.flatMap(
			(
				section: TipTapLyricSection,
			): Array<RhymeHighlight & { lineId: string }> =>
				getVisibleSectionLines(section)
					.map(getLineRhymeCandidate)
					.filter(
						(
							candidate:
								| (RhymeHighlight & { lineId: string })
								| null,
						): candidate is RhymeHighlight & { lineId: string } =>
							candidate !== null,
					),
		);
	const countsByKey = new Map<string, number>();

	candidates.forEach(
		(candidate: RhymeHighlight & { lineId: string }): void => {
			countsByKey.set(
				candidate.key,
				(countsByKey.get(candidate.key) ?? 0) + 1,
			);
		},
	);

	const colorsByKey = new Map<string, string>();
	let colorIndex = 0;

	candidates.forEach(
		(candidate: RhymeHighlight & { lineId: string }): void => {
			if (
				(countsByKey.get(candidate.key) ?? 0) < 2 ||
				colorsByKey.has(candidate.key)
			) {
				return;
			}

			colorsByKey.set(
				candidate.key,
				rhymeAccentPalette[colorIndex % rhymeAccentPalette.length] ??
					"#FF5C72",
			);
			colorIndex += 1;
		},
	);

	return candidates.reduce(
		(
			highlightsByLineId: RhymeHighlightsByLineId,
			candidate: RhymeHighlight & { lineId: string },
		): RhymeHighlightsByLineId => {
			const color: string | undefined = colorsByKey.get(candidate.key);

			if (!color) {
				return highlightsByLineId;
			}

			return {
				...highlightsByLineId,
				[candidate.lineId]: {
					color,
					endIndex: candidate.endIndex,
					key: candidate.key,
					startIndex: candidate.startIndex,
					word: candidate.word,
				},
			};
		},
		{},
	);
}

function normalizeLookupTerm(value: string): string {
	return value.trim().replace(/\s+/g, " ").slice(0, 64);
}

function normalizeComparableSelection(value: string): string {
	return value.trim().replace(/\s+/g, " ");
}

function normalizeSelectedLookupWord(value: string): string | null {
	const trimmedValue: string = value.trim();

	if (trimmedValue.length === 0 || /\s/.test(trimmedValue)) {
		return null;
	}

	const wordMatch: RegExpMatchArray | null =
		trimmedValue.match(/[\p{L}\p{N}'-]+/u);
	const word: string | undefined = wordMatch?.[0];

	return word && word.length >= 2 ? word.slice(0, 64) : null;
}

function isLookupWordCharacter(character: string): boolean {
	return /[\p{L}\p{N}'-]/u.test(character);
}

function isLookupRangeBoundary(
	text: string,
	startIndex: number,
	endIndex: number,
): boolean {
	const previousCharacter: string = text[startIndex - 1] ?? "";
	const nextCharacter: string = text[endIndex] ?? "";

	return (
		(previousCharacter.length === 0 ||
			!isLookupWordCharacter(previousCharacter)) &&
		(nextCharacter.length === 0 || !isLookupWordCharacter(nextCharacter))
	);
}

function isSelectionOnFullTextLines(
	value: string,
	startIndex: number,
	endIndex: number,
): boolean {
	if (endIndex <= startIndex) {
		return false;
	}

	const selectedText = value.slice(startIndex, endIndex);

	if (normalizeComparableSelection(selectedText).length === 0) {
		return false;
	}

	const startsAtLineBoundary =
		startIndex === 0 || value[startIndex - 1] === "\n";
	const endsAtLineBoundary =
		endIndex === value.length || value[endIndex] === "\n";

	return startsAtLineBoundary && endsAtLineBoundary;
}

function createRectFromElement(
	element: HTMLElement,
	rowIndex = 0,
	topOffset = 0,
	lineHeightPx = 18,
): TipTapTextSelection["rect"] {
	const rect = element.getBoundingClientRect();
	const rowTop = rect.top + topOffset + Math.max(0, rowIndex) * lineHeightPx;
	const left = Math.min(rect.left + 300, rect.right - 10);

	return {
		bottom: rowTop + lineHeightPx,
		height: lineHeightPx,
		left,
		right: left + 1,
		top: rowTop,
		width: 1,
	};
}

function createSearchMatchRanges(
	text: string,
	lookupTerm: string,
): SearchMatchRange[] {
	const normalizedLookupTerm: string = normalizeLookupTerm(lookupTerm);

	if (normalizedLookupTerm.length < 2 || text.length === 0) {
		return [];
	}

	const lowerText: string = text.toLocaleLowerCase("fr-FR");
	const lowerLookupTerm: string =
		normalizedLookupTerm.toLocaleLowerCase("fr-FR");
	const ranges: SearchMatchRange[] = [];
	let searchIndex = 0;

	while (searchIndex < lowerText.length) {
		const matchIndex: number = lowerText.indexOf(
			lowerLookupTerm,
			searchIndex,
		);

		if (matchIndex === -1) {
			break;
		}

		const endIndex: number = matchIndex + lowerLookupTerm.length;

		if (isLookupRangeBoundary(text, matchIndex, endIndex)) {
			ranges.push({
				startIndex: matchIndex,
				endIndex,
			});
		}
		searchIndex = matchIndex + lowerLookupTerm.length;
	}

	return ranges;
}

function getLineStyle(format: LyricsFormat): CSSProperties {
	const numericFontSize = Number.parseInt(format.fontSize, 10);
	const fontSize = Number.isFinite(numericFontSize) ? numericFontSize : 16;

	return {
		fontFamily:
			format.fontFamily === "Arimo"
				? "var(--font-arimo)"
				: format.fontFamily,
		fontSize,
		fontWeight: 500,
		lineHeight:
			format.blockSize === "small"
				? 1.35
				: format.blockSize === "normal"
					? 1.55
					: 1.75,
		textAlign: format.align,
	};
}

function getSyllableMeasureStyle(format: LyricsFormat): CSSProperties {
	const numericFontSize: number = Number.parseInt(format.fontSize, 10);
	const measureHeight: number = Number.isFinite(numericFontSize)
		? Math.max(11, Math.min(18, numericFontSize * 0.62))
		: 11;
	const rowTopOffset: number = Number.isFinite(numericFontSize)
		? -Math.max(8, Math.min(13, numericFontSize * 0.3))
		: -8;

	return {
		...getLineStyle(format),
		height: `${measureHeight}px`,
		lineHeight: 1,
		overflow: "visible",
		top: `${rowTopOffset}px`,
		userSelect: "none",
		whiteSpace: "pre",
	};
}

function getSyllableNumberStyle(format: LyricsFormat): CSSProperties {
	const numericFontSize: number = Number.parseInt(format.fontSize, 10);
	const syllableFontSize: number = Number.isFinite(numericFontSize)
		? Math.max(8, Math.min(12, numericFontSize * 0.48))
		: 9;

	return {
		fontFamily:
			format.fontFamily === "Arimo"
				? "var(--font-arimo)"
				: format.fontFamily,
		fontSize: `${syllableFontSize}px`,
		fontStyle: "normal",
		fontWeight: 600,
		lineHeight: 1,
		userSelect: "none",
	};
}

function moveSection(
	sections: TipTapLyricSection[],
	sourceId: string,
	targetId: string,
): TipTapLyricSection[] {
	const sourceIndex = sections.findIndex(
		(section) => section.id === sourceId,
	);
	const targetIndex = sections.findIndex(
		(section) => section.id === targetId,
	);

	if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
		return sections;
	}

	const nextSections = [...sections];
	const [movedSection] = nextSections.splice(sourceIndex, 1);

	if (!movedSection) {
		return sections;
	}

	nextSections.splice(targetIndex, 0, movedSection);

	return renumberDocument(nextSections);
}

function moveLine(
	sections: TipTapLyricSection[],
	source: LineDragState,
	targetSectionId: string,
	targetLineId: string,
	placement: LineDropPlacement,
): TipTapLyricSection[] {
	if (
		source.sectionId === targetSectionId &&
		source.lineId === targetLineId
	) {
		return sections;
	}

	const sourceSection = sections.find(
		(section) => section.id === source.sectionId,
	);
	const movedLine = sourceSection
		? getVisibleSectionLines(sourceSection).find(
				(line: TipTapLyricLine): boolean => line.id === source.lineId,
			)
		: undefined;

	if (!movedLine) {
		return sections;
	}

	const sectionsWithoutLine = sections.map(
		(section: TipTapLyricSection): TipTapLyricSection => {
			if (section.id !== source.sectionId) {
				return section;
			}

			const lines = getVisibleSectionLines(section).filter(
				(line: TipTapLyricLine): boolean => line.id !== source.lineId,
			);

			return setVisibleSectionLines(
				section,
				lines.length > 0 ? lines : [createLine(section.kind)],
			);
		},
	);

	const nextSections = sectionsWithoutLine.map(
		(section: TipTapLyricSection): TipTapLyricSection => {
			if (section.id !== targetSectionId) {
				return section;
			}

			const visibleLines = getVisibleSectionLines(section);
			const targetIndex = visibleLines.findIndex(
				(line: TipTapLyricLine): boolean => line.id === targetLineId,
			);
			const insertIndex =
				targetIndex < 0
					? visibleLines.length
					: placement === "before"
						? targetIndex
						: targetIndex + 1;
			const lines = [...visibleLines];

			lines.splice(insertIndex, 0, movedLine);

			return setVisibleSectionLines(section, lines);
		},
	);

	return renumberDocument(nextSections);
}

function createSectionDragImage(sectionElement: HTMLElement): HTMLElement {
	const dragImage: HTMLElement = sectionElement.cloneNode(
		true,
	) as HTMLElement;
	const themeRoot: HTMLElement | null =
		sectionElement.closest<HTMLElement>(".nara-app");
	const themeStyles: CSSStyleDeclaration = window.getComputedStyle(
		themeRoot ?? window.document.documentElement,
	);
	const previewBackground: string =
		themeStyles.getPropertyValue("--nara-surface-raised").trim() ||
		"#17171C";
	const previewBorder: string =
		themeStyles.getPropertyValue("--nara-border-strong").trim() ||
		"#3A3A42";
	const previewText: string =
		themeStyles.getPropertyValue("--nara-text-primary").trim() || "#F3F4F6";
	const clonedEditors: NodeListOf<HTMLElement> =
		dragImage.querySelectorAll<HTMLElement>("[data-line-editor='true']");

	clonedEditors.forEach((editorElement: HTMLElement): void => {
		editorElement.contentEditable = "false";
	});

	dragImage.style.position = "fixed";
	dragImage.style.top = "-10000px";
	dragImage.style.left = "0";
	dragImage.style.width = `${Math.min(sectionElement.offsetWidth, 560)}px`;
	dragImage.style.pointerEvents = "none";
	dragImage.style.border = `1px solid ${previewBorder}`;
	dragImage.style.borderRadius = "10px";
	dragImage.style.background = previewBackground;
	dragImage.style.color = previewText;
	dragImage.style.boxShadow = "0 16px 34px rgba(17, 17, 19, 0.18)";
	dragImage.style.padding = "10px 12px";
	dragImage.style.opacity = "0.92";

	(themeRoot ?? window.document.body).appendChild(dragImage);

	return dragImage;
}

function removeDragImageAfterSnapshot(dragImage: HTMLElement): void {
	window.setTimeout((): void => {
		dragImage.remove();
	}, 180);
}

function createLineDragImage(lineElement: HTMLElement): HTMLElement {
	const dragImage: HTMLElement = lineElement.cloneNode(true) as HTMLElement;
	const themeRoot: HTMLElement | null =
		lineElement.closest<HTMLElement>(".nara-app");
	const themeStyles: CSSStyleDeclaration = window.getComputedStyle(
		themeRoot ?? window.document.documentElement,
	);
	const previewBackground: string =
		themeStyles.getPropertyValue("--nara-surface-raised").trim() ||
		"#17171C";
	const previewBorder: string =
		themeStyles.getPropertyValue("--nara-border-strong").trim() ||
		"#3A3A42";
	const previewText: string =
		themeStyles.getPropertyValue("--nara-text-primary").trim() || "#F3F4F6";
	const clonedEditor: HTMLElement | null =
		dragImage.querySelector<HTMLElement>("[data-line-editor='true']");

	if (clonedEditor) {
		clonedEditor.contentEditable = "false";
	}

	dragImage.style.position = "fixed";
	dragImage.style.top = "-10000px";
	dragImage.style.left = "0";
	dragImage.style.width = `${Math.min(lineElement.offsetWidth, 520)}px`;
	dragImage.style.pointerEvents = "none";
	dragImage.style.border = `1px solid ${previewBorder}`;
	dragImage.style.borderRadius = "8px";
	dragImage.style.background = previewBackground;
	dragImage.style.color = previewText;
	dragImage.style.boxShadow = "0 14px 30px rgba(17, 17, 19, 0.16)";
	dragImage.style.padding = "6px 8px";
	dragImage.style.opacity = "0.94";

	(themeRoot ?? window.document.body).appendChild(dragImage);

	return dragImage;
}

function getLineEditorElement(lineId: string): HTMLElement | null {
	if (typeof window === "undefined") {
		return null;
	}

	return window.document.querySelector<HTMLElement>(
		`[data-line-editor='true'][data-line-id="${lineId}"]`,
	);
}

function placeCaretInsideElement(
	element: HTMLElement,
	placement: CaretPlacement,
): void {
	const selection: Selection | null = window.getSelection();

	if (!selection) {
		return;
	}

	const range: Range = window.document.createRange();
	const paragraph: HTMLElement | null =
		placement === "start"
			? element.querySelector<HTMLElement>("p")
			: (Array.from(element.querySelectorAll<HTMLElement>("p")).at(-1) ??
				null);
	const target: HTMLElement = paragraph ?? element;

	range.selectNodeContents(target);
	range.collapse(placement === "start");
	selection.removeAllRanges();
	selection.addRange(range);
}

function focusLineEditor(
	lineId: string,
	placement: CaretPlacement = "end",
): boolean {
	const editorElement: HTMLElement | null = getLineEditorElement(lineId);

	if (!editorElement) {
		return false;
	}

	editorElement.focus();
	placeCaretInsideElement(editorElement, placement);

	return true;
}

function createTrackMarkers(
	sections: TipTapLyricSection[],
	customPositionsBySectionId: Record<string, number>,
	durationSeconds: number,
): TrackMarker[] {
	const safeDurationSeconds: number = Math.max(1, durationSeconds);

	return sections.map(
		(section: TipTapLyricSection, index: number): TrackMarker => {
			const defaultSeconds: number = Math.min(
				safeDurationSeconds - 1,
				16 + index * 15,
			);
			const positionPercent: number =
				customPositionsBySectionId[section.id] ??
				(defaultSeconds / safeDurationSeconds) * 100;
			const seconds: number =
				(safeDurationSeconds * positionPercent) / 100;
			const minutes: number = Math.floor(seconds / 60);
			const remainingSeconds: string = Math.round(seconds % 60)
				.toString()
				.padStart(2, "0");

			return {
				accentColor: section.accentColor,
				id: section.id,
				label: section.title,
				positionPercent,
				timeLabel: `${minutes}:${remainingSeconds}`,
			};
		},
	);
}

function getSectionLabel(kind: SectionKind): string {
	const labels: Record<SectionKind, string> = {
		untitled: "Untitled",
		intro: "Intro",
		couplet: "Couplet",
		refrain: "Refrain",
		pont: "Pont",
	};

	return labels[kind];
}

function getFocusSectionInitial(kind: SectionKind): string {
	const labels: Record<SectionKind, string> = {
		untitled: "U",
		intro: "I",
		couplet: "C",
		refrain: "R",
		pont: "P",
	};

	return labels[kind];
}

function SwitchTrack({ enabled }: { enabled: boolean }): ReactElement {
	return (
		<span
			aria-hidden="true"
			className={`relative h-[10px] w-[24px] shrink-0 overflow-hidden rounded-full border border-white/10 transition-colors duration-150 ${
				enabled ? "bg-[#D90097]" : "bg-[#4A4A52]"
			}`}
		>
			<span
				className="absolute top-1/2 h-[6px] w-[6px] -translate-y-1/2 rounded-full bg-[#F3F4F6] shadow-[0_0_0_1px_rgba(255,255,255,0.18)] transition-[left] duration-150"
				style={{ left: enabled ? "15px" : "2px" }}
			/>
		</span>
	);
}

function ToggleSwitch({
	toggle,
	onToggle,
}: {
	toggle: EditorToggle;
	onToggle: (key: EditorToggleKey) => void;
}): ReactElement {
	return (
		<button
			type="button"
			aria-pressed={toggle.enabled}
			onClick={(): void => onToggle(toggle.key)}
			className="inline-flex h-5 select-none items-center gap-[6px] rounded-[3px] text-[10px] font-semibold text-[#F3F4F6] outline-none transition-colors hover:text-white focus:outline-none focus-visible:outline-none"
		>
			<span>{toggle.label}</span>
			<SwitchTrack enabled={toggle.enabled} />
		</button>
	);
}

function MenuToggle({
	label,
	enabled,
	onToggle,
}: {
	label: string;
	enabled: boolean;
	onToggle: () => void;
}): ReactElement {
	return (
		<button
			type="button"
			aria-pressed={enabled}
			onClick={onToggle}
			className="flex h-5 w-full select-none items-center justify-between gap-8 rounded-[3px] text-[12px] text-[#F3F4F6] outline-none transition-colors hover:text-white focus:outline-none focus-visible:outline-none"
		>
			<span>{label}</span>
			<SwitchTrack enabled={enabled} />
		</button>
	);
}

function SectionVariantSwitcher({
	activeAlternativeId,
	alternatives,
	onDelete,
	onPromote,
	onSelect,
}: {
	activeAlternativeId: string | null;
	alternatives: TipTapSectionAlternative[];
	onDelete: (alternativeId: string) => void;
	onPromote: (alternativeId: string) => void;
	onSelect: (alternativeId: string | null) => void;
}): ReactElement {
	if (alternatives.length === 0) {
		return <></>;
	}

	return (
		<div
			aria-label="Versions de la section"
			className="flex h-6 items-center gap-1 rounded-[5px] border border-[#2C2C32] bg-[#18181D] p-0.5"
		>
			<button
				type="button"
				aria-pressed={activeAlternativeId === null}
				onClick={(): void => onSelect(null)}
				className={`h-5 rounded-[4px] px-2 text-[10px] font-semibold transition-colors ${
					activeAlternativeId === null
						? "bg-[#2A2A31] text-[#F3F4F6]"
						: "text-[#8C8C96] hover:bg-[#202027] hover:text-[#F3F4F6]"
				}`}
			>
				Base
			</button>
			{alternatives.map(
				(alternative: TipTapSectionAlternative): ReactElement => {
					const isActive: boolean =
						activeAlternativeId === alternative.id;

					return (
						<div
							key={alternative.id}
							className={`group/variant inline-flex h-5 items-center rounded-[4px] transition-colors ${
								isActive
									? "bg-[#2A2A31] text-[#F3F4F6]"
									: "text-[#8C8C96] hover:bg-[#202027] hover:text-[#F3F4F6]"
							}`}
						>
							<button
								type="button"
								aria-pressed={isActive}
								onClick={(): void => onSelect(alternative.id)}
								className="h-full px-2 text-[10px] font-semibold"
							>
								{alternative.label}
							</button>
							<span
								className={`flex h-full items-center gap-0.5 pr-1 transition-opacity group-hover/variant:opacity-100 group-focus-within/variant:opacity-100 ${
									isActive ? "opacity-80" : "opacity-0"
								}`}
							>
								<button
									type="button"
									aria-label={`Definir ${alternative.label} comme base`}
									onClick={(event): void => {
										event.stopPropagation();
										onPromote(alternative.id);
									}}
									className="inline-flex h-4 w-4 items-center justify-center rounded-[3px] text-[#8C8C96] transition-colors hover:bg-[#3A3A42] hover:text-[#F3F4F6]"
								>
									<Check size={10} strokeWidth={2.4} />
								</button>
								<button
									type="button"
									aria-label={`Supprimer ${alternative.label}`}
									onClick={(event): void => {
										event.stopPropagation();
										onDelete(alternative.id);
									}}
									className="inline-flex h-4 w-4 items-center justify-center rounded-[3px] text-[#8C8C96] transition-colors hover:bg-[#3A3A42] hover:text-[#F3F4F6]"
								>
									<Trash2 size={10} strokeWidth={2.1} />
								</button>
							</span>
						</div>
					);
				},
			)}
		</div>
	);
}
function SectionAddMenu({
	onAddSection,
	onAddLine,
}: {
	onAddSection: (kind: SectionKind) => void;
	onAddLine: () => void;
}): ReactElement {
	return (
		<div className="absolute left-8 top-5 z-30 w-[214px] rounded-[18px] border border-[#5A5A63] bg-[#2B2B31] px-4 py-5 shadow-[0_18px_36px_rgba(0,0,0,0.35)]">
			<div className="grid gap-2">
				{editableSectionKinds.map(
					(kind: Exclude<SectionKind, "untitled">): ReactElement => (
						<button
							key={kind}
							type="button"
							onClick={(): void => onAddSection(kind)}
							className="text-left text-[13px] font-medium text-[#F3F4F6] transition-colors hover:text-white"
						>
							{getSectionLabel(kind)}
						</button>
					),
				)}
			</div>
			<button
				type="button"
				onClick={onAddLine}
				className="mt-5 text-left text-[13px] font-medium text-[#F3F4F6] transition-colors hover:text-white"
			>
				Ajouter une ligne
			</button>
		</div>
	);
}

function SectionOptionsMenu({
	options,
	onToggleOption,
	onCreateAlternative,
	onDuplicate,
	onDelete,
	onValidate,
}: {
	options: SectionOptions;
	onToggleOption: (key: SectionOptionKey) => void;
	onCreateAlternative: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
	onValidate: () => void;
}): ReactElement {
	const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

	return (
		<div className="absolute left-8 top-5 z-30 flex items-start gap-3">
			<div className="w-[216px] rounded-[18px] border border-[#5A5A63] bg-[#2B2B31] px-4 py-4 shadow-[0_18px_36px_rgba(0,0,0,0.35)]">
				<div className="grid gap-1">
					{sectionMenuToggleOrder.map(
						(key: EditorToggleKey): ReactElement => {
							const label: Record<EditorToggleKey, string> = {
								rhymes: "Rimes",
								syllables: "Syllabes",
								annotation: "Annotation",
							};

							return (
								<MenuToggle
									key={key}
									label={label[key]}
									enabled={options[key]}
									onToggle={(): void => onToggleOption(key)}
								/>
							);
						},
					)}
					<MenuToggle
						label="Nombres de mots"
						enabled={options.wordCount}
						onToggle={(): void => onToggleOption("wordCount")}
					/>
				</div>

				<div className="my-3 h-px bg-[#666670]" />

				<div className="grid gap-2 text-[12px] text-[#F3F4F6]">
					<button
						type="button"
						onClick={onCreateAlternative}
						className="flex items-center justify-between text-left transition-colors hover:text-white"
					>
						Version alternative
						<Copy size={12} strokeWidth={1.8} />
					</button>
					<button
						type="button"
						onClick={onDuplicate}
						className="flex items-center justify-between text-left transition-colors hover:text-white"
					>
						Duplicate
						<Copy size={12} strokeWidth={1.8} />
					</button>
					<button
						type="button"
						onClick={onDelete}
						className="flex items-center justify-between text-left transition-colors hover:text-white"
					>
						Delete
						<Trash2 size={12} strokeWidth={1.8} />
					</button>
				</div>

				<div className="my-3 h-px bg-[#666670]" />

				<div className="grid gap-2 text-[12px] text-[#F3F4F6]">
					<button
						type="button"
						className="text-left transition-colors hover:text-white"
					>
						Global Comment
					</button>
					<button
						type="button"
						className="text-left transition-colors hover:text-white"
					>
						Comment
					</button>
				</div>

				<div className="my-3 h-px bg-[#666670]" />

				<div className="grid gap-2 text-[12px] text-[#F3F4F6]">
					<button
						type="button"
						aria-expanded={isHistoryOpen}
						onClick={(): void => {
							setIsHistoryOpen(
								(currentValue: boolean): boolean =>
									!currentValue,
							);
						}}
						className="flex items-center justify-between text-left transition-colors hover:text-white"
					>
						Derniere modification
						<ChevronRight size={13} strokeWidth={1.8} />
					</button>
					<button
						type="button"
						onClick={onValidate}
						className="flex items-center justify-between text-left transition-colors hover:text-white"
					>
						Valider la section
						<CheckSquare size={13} strokeWidth={1.8} />
					</button>
				</div>
			</div>

			{isHistoryOpen && (
				<div className="mt-[160px] hidden w-[244px] rounded-[18px] border border-[#5A5A63] bg-[#2B2B31] px-5 py-4 shadow-[0_18px_36px_rgba(0,0,0,0.35)] xl:block">
					<div className="flex items-center justify-between text-[13px] text-[#F3F4F6]">
						<span>Creer par Nilu</span>
						<span className="font-semibold text-[#A1A1AA]">
							17hours
						</span>
					</div>
					<div className="mt-4 text-[13px] text-[#F3F4F6]">
						Derniere modification
					</div>
					<div className="mt-3 flex items-center justify-between text-[13px]">
						<span className="flex items-center gap-2 text-[#F3F4F6]">
							<span className="h-2 w-2 rounded-full bg-white" />
							Maya
						</span>
						<span className="font-semibold text-[#A1A1AA]">
							2hours
						</span>
					</div>
				</div>
			)}
		</div>
	);
}

function SectionKindPicker({
	isOpen,
	onClose,
	onSelect,
	onToggle,
	section,
}: SectionKindPickerProps): ReactElement {
	const pickerRef = useRef<HTMLDivElement | null>(null);

	useEffect((): (() => void) | undefined => {
		if (!isOpen || typeof document === "undefined") {
			return undefined;
		}

		function handlePointerDown(event: globalThis.PointerEvent): void {
			const target: EventTarget | null = event.target;

			if (!(target instanceof Node)) {
				return;
			}

			if (!pickerRef.current?.contains(target)) {
				onClose();
			}
		}

		function handleKeyDown(event: globalThis.KeyboardEvent): void {
			if (event.key === "Escape") {
				onClose();
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return (): void => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	return (
		<div ref={pickerRef} className="relative inline-flex items-center">
			<h2 className="leading-none">
				<button
					type="button"
					aria-haspopup="listbox"
					aria-expanded={isOpen}
					onClick={onToggle}
					className="group inline-flex h-6 items-center gap-1 rounded-[4px] text-left text-[#F3F4F6] outline-none transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#6F6F78]"
				>
					<span className="text-[22px] font-bold uppercase leading-none">
						{section.title}
					</span>
					<ChevronDown
						size={13}
						strokeWidth={2}
						className={`text-[#777780] transition-transform duration-150 group-hover:text-[#F3F4F6] ${
							isOpen ? "rotate-180 text-[#F3F4F6]" : ""
						}`}
					/>
				</button>
			</h2>

			{isOpen && (
				<div
					role="listbox"
					aria-label="Type de section"
					className="absolute left-0 top-[calc(100%+7px)] z-40 w-[148px] overflow-hidden rounded-[10px] border border-[#4A4A52] bg-[#202026] p-1 shadow-[0_18px_34px_rgba(0,0,0,0.45)]"
				>
					{editableSectionKinds.map(
						(
							kind: Exclude<SectionKind, "untitled">,
						): ReactElement => {
							const isSelected: boolean = section.kind === kind;

							return (
								<button
									key={kind}
									type="button"
									role="option"
									aria-selected={isSelected}
									onClick={(): void => {
										onSelect(kind);
										onClose();
									}}
									className={`relative flex h-8 w-full items-center rounded-[6px] px-2.5 text-left text-[13px] font-semibold outline-none transition-colors ${
										isSelected
											? "bg-[#303039] text-[#F3F4F6]"
											: "text-[#C9C9CF] hover:bg-[#2A2A31] hover:text-white focus-visible:bg-[#2A2A31] focus-visible:text-white"
									}`}
								>
									{isSelected && (
										<span
											aria-hidden="true"
											className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[#F3F4F6]"
										/>
									)}
									<span>{getSectionLabel(kind)}</span>
								</button>
							);
						},
					)}
				</div>
			)}
		</div>
	);
}

function SearchHighlightOverlay({
	lineStyle,
	ranges,
	text,
}: {
	lineStyle: CSSProperties;
	ranges: SearchMatchRange[];
	text: string;
}): ReactElement {
	let cursorIndex = 0;
	const pieces: ReactElement[] = [];

	ranges.forEach((range: SearchMatchRange, index: number): void => {
		if (range.startIndex > cursorIndex) {
			pieces.push(
				<span key={`text-${index}`}>
					{text.slice(cursorIndex, range.startIndex)}
				</span>,
			);
		}

		pieces.push(
			<span
				key={`match-${range.startIndex}-${range.endIndex}`}
				className="rounded-[3px] bg-[#D90097]/25 shadow-[0_0_0_1px_rgba(217,0,151,0.16)]"
				style={{
					WebkitBoxDecorationBreak: "clone",
					boxDecorationBreak: "clone",
				}}
			>
				{text.slice(range.startIndex, range.endIndex)}
			</span>,
		);
		cursorIndex = range.endIndex;
	});

	if (cursorIndex < text.length) {
		pieces.push(<span key="text-end">{text.slice(cursorIndex)}</span>);
	}

	return (
		<div
			aria-hidden="true"
			contentEditable={false}
			className="pointer-events-none absolute left-0 right-0 top-0 z-0 select-none text-transparent"
			style={{
				...lineStyle,
				userSelect: "none",
				whiteSpace: "pre-wrap",
			}}
		>
			{pieces}
		</div>
	);
}

function RhymeHighlightOverlay({
	highlight,
	lineStyle,
	text,
}: {
	highlight: RhymeHighlight;
	lineStyle: CSSProperties;
	text: string;
}): ReactElement {
	const before = text.slice(0, highlight.startIndex);
	const word = text.slice(highlight.startIndex, highlight.endIndex);
	const after = text.slice(highlight.endIndex);

	return (
		<div
			aria-hidden="true"
			contentEditable={false}
			className="pointer-events-none absolute left-0 right-0 top-0 z-0 select-none text-transparent"
			style={{
				...lineStyle,
				userSelect: "none",
				whiteSpace: "pre-wrap",
			}}
		>
			{before}
			<span
				className="inline rounded-[4px] px-[2px]"
				style={{
					WebkitBoxDecorationBreak: "clone",
					backgroundColor: createPastelRhymeColor(
						highlight.color,
						0.32,
					),
					boxDecorationBreak: "clone",
					boxShadow: `0 0 0 1px ${createPastelRhymeColor(highlight.color, 0.18)}`,
				}}
			>
				{word}
			</span>
			{after}
		</div>
	);
}

function RemoteCursorOverlay({
	lineStyle,
	presences,
	text,
}: {
	lineStyle: CSSProperties;
	presences: RemotePresence[];
	text: string;
}): ReactElement {
	return (
		<div
			aria-hidden="true"
			contentEditable={false}
			className="pointer-events-none absolute left-0 right-0 top-0 z-30 select-none text-transparent"
			style={{
				...lineStyle,
				userSelect: "none",
				whiteSpace: "pre-wrap",
			}}
		>
			{presences.map(
				(presence: RemotePresence, index: number): ReactElement => {
					const cursorOffset: number = Math.min(
						Math.max(presence.cursorOffset ?? text.length, 0),
						text.length,
					);
					const beforeCursor = text.slice(0, cursorOffset);

					return (
						<span
							key={presence.sessionId}
							className="absolute left-0 top-0"
						>
							<span className="whitespace-pre-wrap text-transparent">
								{beforeCursor}
							</span>
							<span className="relative inline-block h-[1em] w-0 align-baseline">
								<span
									className="absolute -left-px top-[0.05em] h-[1.05em] w-[2px] rounded-full"
									style={{ backgroundColor: presence.color }}
								/>
								<span
									className="absolute left-[5px] rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
									style={{
										backgroundColor: presence.color,
										top: `${-22 - index * 18}px`,
									}}
								>
									{presence.name}
									{presences.length > 1
										? ` ${index + 1}`
										: ""}
								</span>
							</span>
						</span>
					);
				},
			)}
		</div>
	);
}

type FocusLineMapping = {
	line: TipTapLyricLine;
	section: TipTapLyricSection;
	lineIndex: number;
};

function getFocusLineMappings(
	sections: TipTapLyricSection[],
): FocusLineMapping[] {
	const mappings: FocusLineMapping[] = [];
	let currentLineIndex = 0;

	sections.forEach((section: TipTapLyricSection): void => {
		const visibleLines = getVisibleSectionLines(section);
		visibleLines.forEach((line: TipTapLyricLine): void => {
			mappings.push({
				line,
				section,
				lineIndex: currentLineIndex,
			});
			currentLineIndex++;
		});

		currentLineIndex += focusSectionSeparatorNewlineCount;
	});

	return mappings;
}

function FocusLyricsDocument({
	document,
	lineStyle,
	onDocumentTextChange,
	onSelectionChange,
	text,
	rhymeHighlightsByLineId,
	normalizedLookupTerm,
	remotePresences,
	showRhymes,
}: {
	document: TipTapLyricsDocument;
	lineStyle: CSSProperties;
	onDocumentTextChange: (text: string) => void;
	onSelectionChange: (selection: TextLookupSelection | null) => void;
	text: string;
	rhymeHighlightsByLineId: RhymeHighlightsByLineId;
	normalizedLookupTerm: string;
	remotePresences: RemotePresence[];
	showRhymes: boolean;
}): ReactElement {
	const focusSectionMarkers = useMemo(
		(): FocusSectionMarker[] =>
			createFocusSectionMarkersFromText(text, document.sections),
		[document.sections, text],
	);

	const mappings = useMemo(
		(): FocusLineMapping[] => getFocusLineMappings(document.sections),
		[document.sections],
	);

	function handleTextSelection(textarea: HTMLTextAreaElement): void {
		const startIndex = textarea.selectionStart;
		const endIndex = textarea.selectionEnd;

		if (startIndex === endIndex) {
			onSelectionChange(null);
			return;
		}

		const selectedText = textarea.value.slice(startIndex, endIndex);
		const selectedWord = normalizeSelectedLookupWord(selectedText);
		const rowIndex =
			textarea.value.slice(0, startIndex).split("\n").length - 1;
		const selectionRect = createRectFromElement(
			textarea,
			rowIndex,
			focusTextareaTopPaddingPx,
			focusTextareaLineHeightPx,
		);
		const fallbackSectionId = document.sections[0]?.id ?? "focus-document";
		const fallbackLineId = document.sections[0]
			? getVisibleSectionLines(document.sections[0])[0]?.id
			: null;

		if (isSelectionOnFullTextLines(textarea.value, startIndex, endIndex)) {
			onSelectionChange({
				focusText: textarea.value,
				from: startIndex,
				lineId: fallbackLineId ?? fallbackSectionId,
				mode: "transform",
				rawText: selectedText,
				rect: selectionRect,
				sectionId: fallbackSectionId,
				source: "focus",
				text: normalizeComparableSelection(selectedText),
				to: endIndex,
			});
			return;
		}

		if (!selectedWord) {
			onSelectionChange(null);
			return;
		}

		onSelectionChange({
			focusText: textarea.value,
			from: startIndex,
			lineId: fallbackLineId ?? fallbackSectionId,
			mode: "lookup",
			rawText: selectedText,
			rect: selectionRect,
			sectionId: fallbackSectionId,
			source: "focus",
			text: selectedWord,
			to: endIndex,
		});
	}

	const lineCount = Math.max(1, text.split(/\r?\n/).length);
	const textareaHeight = Math.max(
		240,
		lineCount * focusTextareaLineHeightPx + focusTextareaTopPaddingPx + 12,
	);

	const textareaLines = text.split("\n");

	return (
		<div className="relative w-full max-w-[820px] pt-2">
			{/* Focus Mode Overlays */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute left-0 right-0 top-2 select-none z-10"
				style={{
					height: textareaHeight,
				}}
			>
				{mappings.map(
					({ line, section, lineIndex }): ReactElement | null => {
						const rhymeHighlight = rhymeHighlightsByLineId[line.id];
						const visibleRhymeHighlight =
							showRhymes &&
							line.text.trim().length > 0 &&
							rhymeHighlight !== undefined
								? rhymeHighlight
								: null;
						const lineText = textareaLines[lineIndex] ?? line.text;
						const searchMatchRanges = createSearchMatchRanges(
							lineText,
							normalizedLookupTerm,
						);
						const remotePresencesForLine = remotePresences.filter(
							(presence: RemotePresence): boolean =>
								presence.sectionId === section.id &&
								presence.lineId === line.id,
						);

						if (
							!visibleRhymeHighlight &&
							searchMatchRanges.length === 0 &&
							remotePresencesForLine.length === 0
						) {
							return null;
						}

						const lineTop = lineIndex * focusTextareaLineHeightPx;

						return (
							<div
								key={line.id}
								className="absolute right-0"
								style={{
									left: focusTextareaLeftPaddingPx,
									top: focusTextareaTopPaddingPx + lineTop,
									height: focusTextareaLineHeightPx,
								}}
							>
								{searchMatchRanges.length > 0 && (
									<SearchHighlightOverlay
										lineStyle={lineStyle}
										ranges={searchMatchRanges}
										text={lineText}
									/>
								)}
								{visibleRhymeHighlight && (
									<RhymeHighlightOverlay
										highlight={visibleRhymeHighlight}
										lineStyle={lineStyle}
										text={lineText}
									/>
								)}
								{remotePresencesForLine.length > 0 && (
									<RemoteCursorOverlay
										lineStyle={lineStyle}
										presences={remotePresencesForLine}
										text={lineText}
									/>
								)}
							</div>
						);
					},
				)}
			</div>

			<div
				aria-hidden="true"
				className="pointer-events-none absolute left-0 top-2 select-none"
			>
				{focusSectionMarkers.map(
					(marker: FocusSectionMarker): ReactElement => {
						const labelTop = Math.max(
							0,
							focusTextareaTopPaddingPx +
								marker.lineIndex * focusTextareaLineHeightPx -
								focusSectionLabelOffsetPx,
						);

						return (
							<span
								key={marker.id}
								className="absolute text-[13px] font-medium leading-none text-[#767680]"
								style={{
									left: focusTextareaLeftPaddingPx,
									top: labelTop,
								}}
							>
								{marker.label}
							</span>
						);
					},
				)}
			</div>
			<textarea
				aria-label={`Lyrics ${document.title}`}
				value={text}
				onChange={(event: ChangeEvent<HTMLTextAreaElement>): void => {
					onSelectionChange(null);
					onDocumentTextChange(event.target.value);
				}}
				onKeyUp={(event): void => {
					handleTextSelection(event.currentTarget);
				}}
				onMouseUp={(event): void => {
					handleTextSelection(event.currentTarget);
				}}
				onSelect={(event): void => {
					handleTextSelection(event.currentTarget);
				}}
				spellCheck={false}
				className="block w-full resize-none overflow-hidden border-0 bg-transparent py-0 pr-0 text-[#F3F4F6] outline-none selection:bg-[#0B57D0] selection:text-white relative z-20"
				style={{
					...lineStyle,
					height: textareaHeight,
					minHeight: "calc(100dvh - 150px)",
					paddingLeft: focusTextareaLeftPaddingPx,
					paddingTop: focusTextareaTopPaddingPx,
				}}
			/>
		</div>
	);
}

function SelectionLookupToolbar({
	isFocusMode,
	onClose,
	onSearch,
	onTransformSelection,
	selection,
}: {
	isFocusMode: boolean;
	onClose: () => void;
	onSearch: (target: LyricsInspectorLookupTarget) => void;
	onTransformSelection: (kind: SectionKind) => void;
	selection: TextLookupSelection;
}): ReactElement {
	const viewportWidth: number =
		typeof window === "undefined" ? 1200 : window.innerWidth;
	const centerX: number = selection.rect.left + selection.rect.width / 2;
	const isTransformSelection: boolean =
		isFocusMode && selection.mode === "transform";
	const toolbarHalfWidth = isTransformSelection ? 184 : 244;
	const left: number = Math.min(
		Math.max(centerX, toolbarHalfWidth),
		viewportWidth - toolbarHalfWidth,
	);
	const top: number = Math.max(58, selection.rect.top - 42);

	return (
		<div
			role="toolbar"
			aria-label={`Actions pour ${selection.text}`}
			className="fixed z-[70] flex min-h-8 items-center gap-1 rounded-[7px] border border-[#3A3A42] bg-[#202027] px-1.5 py-1 shadow-[0_12px_28px_rgba(0,0,0,0.34)]"
			style={{ left, top, transform: "translateX(-50%)" }}
			onMouseDown={(event): void => event.preventDefault()}
		>
			<span className="flex max-w-[112px] items-center gap-1.5 truncate px-1.5 text-[11px] font-semibold text-[#F3F4F6]">
				<Search size={12} strokeWidth={1.8} />
				<span className="truncate">
					{isTransformSelection ? "Transformer" : selection.text}
				</span>
			</span>
			{isTransformSelection ? (
				<>
					{editableSectionKinds.map(
						(
							kind: Exclude<SectionKind, "untitled">,
						): ReactElement => (
							<button
								key={`transform-${kind}`}
								type="button"
								onClick={(): void => onTransformSelection(kind)}
								className="h-6 rounded-[4px] px-2 text-[10px] font-semibold text-[#F3F4F6] transition-colors hover:bg-[#2B2B31] hover:text-white"
							>
								{getSectionLabel(kind)}
							</button>
						),
					)}
				</>
			) : (
				<>
					<button
						type="button"
						onClick={(): void => onSearch("all")}
						className="h-6 rounded-[4px] px-2 text-[10px] font-semibold text-[#F3F4F6] transition-colors hover:bg-[#2B2B31] hover:text-white"
					>
						Tout
					</button>
					<button
						type="button"
						onClick={(): void => onSearch("rhymes")}
						className="h-6 rounded-[4px] px-2 text-[10px] font-semibold text-[#CFCFD6] transition-colors hover:bg-[#2B2B31] hover:text-white"
					>
						Rimes
					</button>
					<button
						type="button"
						onClick={(): void => onSearch("synonyms")}
						className="h-6 rounded-[4px] px-2 text-[10px] font-semibold text-[#CFCFD6] transition-colors hover:bg-[#2B2B31] hover:text-white"
					>
						Synonymes
					</button>
					<button
						type="button"
						onClick={(): void => onSearch("antonyms")}
						className="h-6 rounded-[4px] px-2 text-[10px] font-semibold text-[#CFCFD6] transition-colors hover:bg-[#2B2B31] hover:text-white"
					>
						Antonymes
					</button>
					<button
						type="button"
						onClick={(): void => onSearch("lexical")}
						className="h-6 rounded-[4px] px-2 text-[10px] font-semibold text-[#CFCFD6] transition-colors hover:bg-[#2B2B31] hover:text-white"
					>
						Champ
					</button>
				</>
			)}
			<button
				type="button"
				aria-label="Fermer la recherche"
				onClick={onClose}
				className="ml-1 h-6 rounded-[4px] px-1.5 text-[10px] font-semibold text-[#8C8C96] transition-colors hover:bg-[#2B2B31] hover:text-white"
			>
				Esc
			</button>
		</div>
	);
}

function LineCommentOverlay({
	comments,
	lineNumber,
	onAddComment,
	onClose,
}: {
	comments: LineComment[];
	lineNumber: number;
	onAddComment: (body: string) => void;
	onClose: () => void;
}): ReactElement {
	const [draft, setDraft] = useState<string>("");

	function handleSubmit(): void {
		const body = draft.trim();

		if (body.length === 0) {
			return;
		}

		onAddComment(body);
		setDraft("");
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
		if (event.key === "Enter") {
			event.preventDefault();
			handleSubmit();
			return;
		}

		if (event.key === "Escape") {
			onClose();
		}
	}

	return (
		<>
			<div
				aria-hidden="true"
				className="fixed inset-0 z-40"
				onClick={onClose}
			/>
			<div
				role="dialog"
				aria-label={`Commentaires sur la ligne ${lineNumber}`}
				className="absolute right-0 top-7 z-50 w-[494px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[18px] border border-[var(--nara-comment-border)] bg-[var(--nara-comment-bg)] px-4 py-4 shadow-[var(--nara-comment-shadow)]"
			>
				<div className="space-y-3">
					{comments.length > 0 ? (
						comments.map(
							(comment: LineComment): ReactElement => (
								<div
									key={comment.id}
									className="min-h-[76px] rounded-[8px] border border-[var(--nara-comment-card-border)] bg-[var(--nara-comment-card-bg)] px-3 py-2.5"
								>
									<div className="flex items-start gap-2.5">
										<span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--nara-comment-avatar-border)] bg-transparent text-[11px] font-medium text-[var(--nara-comment-text)]">
											{comment.initial}
										</span>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-3">
												<span className="text-[14px] font-semibold leading-6 text-[var(--nara-comment-text)]">
													{comment.author}
												</span>
												<span className="text-[11px] font-medium text-[var(--nara-comment-muted)]">
													{comment.time}
												</span>
											</div>
											<p className="mt-2 max-w-[270px] text-[10px] leading-[1.35] text-[var(--nara-comment-body)]">
												{comment.body}
											</p>
										</div>
									</div>
								</div>
							),
						)
					) : (
						<div className="rounded-[8px] border border-[var(--nara-comment-card-border)] bg-[var(--nara-comment-card-bg)] px-3 py-3 text-[12px] text-[var(--nara-comment-muted)]">
							Aucun commentaire sur cette ligne.
						</div>
					)}
				</div>

				<label className="mt-16 flex h-[34px] items-center gap-3 rounded-[7px] border border-[var(--nara-comment-border)] bg-[var(--nara-comment-input-bg)] px-2.5 transition-colors focus-within:border-[var(--nara-border-strong)]">
					<span className="sr-only">Ecrire un message</span>
					<input
						autoFocus
						value={draft}
						placeholder="Ecrire un message"
						onChange={(
							event: ChangeEvent<HTMLInputElement>,
						): void => setDraft(event.target.value)}
						onKeyDown={handleKeyDown}
						className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--nara-comment-text)] outline-none placeholder:text-[var(--nara-comment-muted)]"
					/>
					<button
						type="button"
						aria-label="Envoyer"
						onClick={handleSubmit}
						disabled={draft.trim().length === 0}
						className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-[var(--nara-comment-muted)] transition-colors hover:bg-[var(--nara-action-hover)] hover:text-[var(--nara-comment-text)] disabled:pointer-events-none disabled:opacity-45"
					>
						<SendHorizontal size={20} strokeWidth={1.5} />
					</button>
				</label>
			</div>
		</>
	);
}

export default function LyricsEditorWorkspaceTiptap({
	format,
	onFormatChange,
}: LyricsEditorWorkspaceTiptapProps): ReactElement {
	const [document, setDocument] = useState<TipTapLyricsDocument>(
		createInitialDocument,
	);
	const [lineCommentsById, setLineCommentsById] = useState<LineCommentsById>(
		{},
	);
	const [toggles, setToggles] = useState<EditorToggle[]>(initialToggles);
	const [saveState, setSaveState] = useState<SaveState>("idle");
	const [isDirty, setIsDirty] = useState<boolean>(false);
	const [draggedSectionId, setDraggedSectionId] = useState<string | null>(
		null,
	);
	const [draggedLine, setDraggedLine] = useState<LineDragState | null>(null);
	const [openAddMenuSectionId, setOpenAddMenuSectionId] = useState<
		string | null
	>(null);
	const [openOptionsMenuSectionId, setOpenOptionsMenuSectionId] = useState<
		string | null
	>(null);
	const [openKindMenuSectionId, setOpenKindMenuSectionId] = useState<
		string | null
	>(null);
	const [openCommentLineId, setOpenCommentLineId] = useState<string | null>(
		null,
	);
	const [activeLineId, setActiveLineId] = useState<string | null>(null);
	const [pendingFocusLineId, setPendingFocusLineId] = useState<string | null>(
		null,
	);
	const [sectionOptionsById, setSectionOptionsById] = useState<
		Record<string, SectionOptions>
	>({});
	const [hasVisibleInspectorPanels, setHasVisibleInspectorPanels] =
		useState<boolean>(true);
	const [lookupTerm, setLookupTerm] = useState<string | null>(null);
	const [focusDraftText, setFocusDraftText] = useState<string | null>(null);
	const [textLookupSelection, setTextLookupSelection] =
		useState<TextLookupSelection | null>(null);
	const [inspectorLookupRequest, setInspectorLookupRequest] =
		useState<LyricsInspectorLookupRequest | null>(null);
	const [isTrackPlaying, setIsTrackPlaying] = useState<boolean>(false);
	const [trackCurrentTimeSeconds, setTrackCurrentTimeSeconds] =
		useState<number>(0);
	const [trackDurationSeconds, setTrackDurationSeconds] = useState<number>(
		defaultTrackDurationSeconds,
	);
	const [trackVolumePercent, setTrackVolumePercent] = useState<number>(58);
	const [
		trackMarkerPositionsBySectionId,
		setTrackMarkerPositionsBySectionId,
	] = useState<Record<string, number>>({});
	const [remotePresencesBySessionId, setRemotePresencesBySessionId] =
		useState<RemotePresenceBySessionId>({});
	const presenceSessionIdRef = useRef<string>(createPresenceSessionId());
	const presenceChannelRef = useRef<BroadcastChannel | null>(null);
	const presenceDocumentRef = useRef<TipTapLyricsDocument>(document);
	const presenceActiveLineIdRef = useRef<string | null>(activeLineId);
	const presenceCursorRef = useRef<TipTapCursorPresence | null>(null);
	const lineCommentsRef = useRef<LineCommentsById>(lineCommentsById);
	const isApplyingRemoteDocumentRef = useRef<boolean>(false);
	const documentSyncSignatureRef = useRef<string>("");
	const lastLocalDocumentPublishedAtRef = useRef<number>(0);
	const lastPresenceDocumentAnnounceAtRef = useRef<number>(0);
	const hasLoadedStorageRef = useRef<boolean>(false);
	const shouldSkipInitialDocumentSyncRef = useRef<boolean>(true);
	const shouldSkipNextDocumentPublishRef = useRef<boolean>(false);
	const structuredFocusText = useMemo(
		(): string => createFocusTextModel(document.sections).text,
		[document.sections],
	);
	const wordCount = useMemo(
		(): number => countDocumentWords(document),
		[document],
	);
	const remotePresences = useMemo(
		(): RemotePresence[] =>
			Object.values(remotePresencesBySessionId)
				.filter(
					(presence: RemotePresence): boolean =>
						Date.now() - presence.updatedAt <
							presenceStaleDelayMs &&
						presence.projectId === document.id &&
						presence.lineId !== null,
				)
				.sort(
					(
						firstPresence: RemotePresence,
						secondPresence: RemotePresence,
					): number =>
						firstPresence.updatedAt - secondPresence.updatedAt,
				),
		[document.id, remotePresencesBySessionId],
	);
	const normalizedLookupTerm = useMemo(
		(): string =>
			normalizeLookupTerm(textLookupSelection?.text ?? lookupTerm ?? ""),
		[lookupTerm, textLookupSelection?.text],
	);
	const lineStyle = useMemo(
		(): CSSProperties => getLineStyle(format),
		[format],
	);
	const focusLineStyle = useMemo(
		(): CSSProperties => ({
			...lineStyle,
			fontFamily:
				'ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
			fontSize: 15,
			fontWeight: 500,
			letterSpacing: 0,
			lineHeight: `${focusTextareaLineHeightPx}px`,
			textAlign: "left",
		}),
		[lineStyle],
	);
	const editorLineStyle: CSSProperties = format.focusMode
		? focusLineStyle
		: lineStyle;
	const syllableMeasureStyle = useMemo(
		(): CSSProperties => getSyllableMeasureStyle(format),
		[format],
	);
	const syllableNumberStyle = useMemo(
		(): CSSProperties => getSyllableNumberStyle(format),
		[format],
	);
	const lineNumberColumnWidth = useMemo((): number => {
		const maxLineNumber: number = document.sections.reduce(
			(maxNumber: number, section: TipTapLyricSection): number =>
				getVisibleSectionLines(section).reduce(
					(lineMax: number, line: TipTapLyricLine): number =>
						Math.max(lineMax, line.number),
					maxNumber,
				),
			1,
		);
		const digitCount: number = maxLineNumber.toString().length;

		return Math.max(18, digitCount * 9 + 2);
	}, [document.sections]);
	const lineGridStyle = useMemo(
		(): CSSProperties => ({
			gridTemplateColumns: `${lineNumberColumnWidth}px minmax(0,1fr) 34px`,
		}),
		[lineNumberColumnWidth],
	);
	const focusLineGridStyle = useMemo(
		(): CSSProperties => ({
			gridTemplateColumns: "minmax(0,1fr)",
		}),
		[],
	);
	const rhymeHighlightsByLineId = useMemo(
		(): RhymeHighlightsByLineId => createRhymeHighlights(document.sections),
		[document.sections],
	);
	const lineFocusSignature = useMemo(
		(): string =>
			document.sections
				.flatMap((section: TipTapLyricSection): string[] =>
					getVisibleSectionLines(section).map(
						(line: TipTapLyricLine): string => line.id,
					),
				)
				.join("|"),
		[document.sections],
	);
	const trackMarkers = useMemo(
		(): TrackMarker[] =>
			createTrackMarkers(
				document.sections,
				trackMarkerPositionsBySectionId,
				trackDurationSeconds,
			),
		[
			document.sections,
			trackDurationSeconds,
			trackMarkerPositionsBySectionId,
		],
	);
	const shouldRenderInspectorTools: boolean = format.showInspectorTools;
	const shouldRenderTrackPanel: boolean =
		!format.focusMode && format.showTrackPanel;
	const workspaceGridTemplateClass = shouldRenderInspectorTools
		? hasVisibleInspectorPanels
			? format.focusMode
				? "xl:grid-cols-[minmax(0,1fr)_292px]"
				: "xl:grid-cols-[minmax(0,1fr)_320px]"
			: "xl:grid-cols-[minmax(0,1fr)_37px]"
		: "xl:grid-cols-[minmax(0,1fr)]";
	const publishPresenceFromRefs = useCallback((): void => {
		const channel = presenceChannelRef.current;
		const currentDocument = presenceDocumentRef.current;
		const currentCursor = presenceCursorRef.current;
		const lineId = currentCursor?.lineId ?? presenceActiveLineIdRef.current;
		const presence: RemotePresence = {
			...localPresenceUser,
			cursorOffset:
				currentCursor?.lineId === lineId
					? currentCursor.cursorOffset
					: null,
			lineId,
			projectId: currentDocument.id,
			sectionId:
				currentCursor?.lineId === lineId
					? currentCursor.sectionId
					: getSectionIdForLine(currentDocument.sections, lineId),
			sessionId: presenceSessionIdRef.current,
			updatedAt: Date.now(),
		};
		const message: PresenceMessage = {
			payload: presence,
			type: "presence:update",
		};

		channel?.postMessage(message);
		postRealtimeMessage(message);
	}, []);
	const publishDocumentFromRefs = useCallback((): void => {
		const channel = presenceChannelRef.current;

		if (!hasLoadedStorageRef.current) {
			return;
		}
		const publishedAt = Date.now();
		const message: PresenceMessage = {
			payload: {
				document: presenceDocumentRef.current,
				lineCommentsById: lineCommentsRef.current,
				sourceSessionId: presenceSessionIdRef.current,
				updatedAt: publishedAt,
			},
			type: "document:update",
		};

		lastLocalDocumentPublishedAtRef.current = publishedAt;
		channel?.postMessage(message);
		postRealtimeMessage(message);
	}, []);
	const applyRemoteDocumentPayload = useCallback(
		(
			payload: Extract<
				PresenceMessage,
				{ type: "document:update" }
			>["payload"],
			sessionId: string,
		): void => {
			const remoteDocument = parseRemoteDocument(payload.document);

			if (payload.sourceSessionId === sessionId || !remoteDocument) {
				return;
			}

			if (
				payload.updatedAt < lastLocalDocumentPublishedAtRef.current &&
				documentSyncSignatureRef.current.length > 0
			) {
				return;
			}

			const nextSignature = createDocumentSyncSignature(
				remoteDocument,
				payload.lineCommentsById,
			);

			if (documentSyncSignatureRef.current === nextSignature) {
				return;
			}

			isApplyingRemoteDocumentRef.current = true;
			documentSyncSignatureRef.current = nextSignature;
			const nextDocument = preserveLocalFocusedLine(
				remoteDocument,
				presenceDocumentRef.current,
				presenceActiveLineIdRef.current,
			);

			shouldSkipNextDocumentPublishRef.current = true;
			presenceDocumentRef.current = nextDocument;
			lineCommentsRef.current = payload.lineCommentsById;
			setDocument(nextDocument);
			setLineCommentsById(payload.lineCommentsById);
			setIsDirty(true);
			setSaveState("idle");
			window.setTimeout((): void => {
				isApplyingRemoteDocumentRef.current = false;
			}, 0);
		},
		[],
	);

	useEffect((): void => {
		presenceDocumentRef.current = document;
		presenceActiveLineIdRef.current = activeLineId;
		publishPresenceFromRefs();
	}, [activeLineId, document, publishPresenceFromRefs]);

	useEffect((): void => {
		lineCommentsRef.current = lineCommentsById;
	}, [lineCommentsById]);

	useEffect((): (() => void) | undefined => {
		if (
			typeof BroadcastChannel === "undefined" ||
			typeof window === "undefined"
		) {
			return undefined;
		}

		const channel = new BroadcastChannel(presenceChannelName);
		const sessionId = presenceSessionIdRef.current;
		presenceChannelRef.current = channel;

		channel.onmessage = (event: MessageEvent<unknown>): void => {
			if (!isPresenceMessage(event.data)) {
				return;
			}

			if (event.data.type === "document:update") {
				applyRemoteDocumentPayload(event.data.payload, sessionId);
				return;
			}

			if (event.data.type === "presence:leave") {
				const leavingSessionId = event.data.sessionId;

				if (leavingSessionId === sessionId) {
					return;
				}

				setRemotePresencesBySessionId(
					(
						currentPresences: RemotePresenceBySessionId,
					): RemotePresenceBySessionId => {
						const nextPresences: RemotePresenceBySessionId = {
							...currentPresences,
						};

						delete nextPresences[leavingSessionId];
						return nextPresences;
					},
				);
				return;
			}

			const remotePresence = event.data.payload;

			if (remotePresence.sessionId === sessionId) {
				return;
			}

			setRemotePresencesBySessionId(
				(
					currentPresences: RemotePresenceBySessionId,
				): RemotePresenceBySessionId => ({
					...currentPresences,
					[remotePresence.sessionId]: remotePresence,
				}),
			);
			publishDocumentFromRefs();
		};

		const heartbeatId = window.setInterval(
			publishPresenceFromRefs,
			presenceHeartbeatDelayMs,
		);
		const staleSweepId = window.setInterval((): void => {
			const now = Date.now();

			setRemotePresencesBySessionId(
				(
					currentPresences: RemotePresenceBySessionId,
				): RemotePresenceBySessionId =>
					Object.fromEntries(
						Object.entries(currentPresences).filter(
							([, presence]: [string, RemotePresence]): boolean =>
								now - presence.updatedAt < presenceStaleDelayMs,
						),
					) as RemotePresenceBySessionId,
			);
		}, presenceHeartbeatDelayMs);

		publishPresenceFromRefs();

		return (): void => {
			const leaveMessage: PresenceMessage = {
				sessionId,
				type: "presence:leave",
			};

			channel.postMessage(leaveMessage);
			postRealtimeMessage(leaveMessage);
			window.clearInterval(heartbeatId);
			window.clearInterval(staleSweepId);
			channel.close();
			presenceChannelRef.current = null;
		};
	}, [
		applyRemoteDocumentPayload,
		publishDocumentFromRefs,
		publishPresenceFromRefs,
	]);

	useEffect((): (() => void) | undefined => {
		if (typeof window === "undefined") {
			return undefined;
		}

		const sessionId = presenceSessionIdRef.current;
		let isStopped = false;

		async function pollRealtimeSnapshot(): Promise<void> {
			const projectId = presenceDocumentRef.current.id;
			const query = new URLSearchParams({
				projectId,
				sessionId,
			});

			try {
				const response = await fetch(
					`${realtimeEndpoint}?${query.toString()}`,
					{
						cache: "no-store",
					},
				);
				const snapshot: unknown = await response.json();

				if (isStopped || !isRealtimeSnapshot(snapshot)) {
					return;
				}

				if (snapshot.documentPayload) {
					applyRemoteDocumentPayload(
						snapshot.documentPayload,
						sessionId,
					);
				}

				setRemotePresencesBySessionId(
					(
						currentPresences: RemotePresenceBySessionId,
					): RemotePresenceBySessionId => {
						const nextPresences: RemotePresenceBySessionId = {
							...currentPresences,
						};
						const liveSessionIds = new Set<string>();

						snapshot.presences.forEach(
							(presence: RemotePresence): void => {
								if (presence.sessionId === sessionId) {
									return;
								}

								liveSessionIds.add(presence.sessionId);
								nextPresences[presence.sessionId] = presence;
							},
						);

						Object.entries(nextPresences).forEach(
							([presenceSessionId, presence]: [
								string,
								RemotePresence,
							]): void => {
								if (
									presence.projectId === projectId &&
									presenceSessionId !== sessionId &&
									!liveSessionIds.has(presenceSessionId) &&
									Date.now() - presence.updatedAt >
										presenceStaleDelayMs
								) {
									delete nextPresences[presenceSessionId];
								}
							},
						);

						return nextPresences;
					},
				);

				if (
					snapshot.presences.length > 0 &&
					Date.now() - lastPresenceDocumentAnnounceAtRef.current >
						3500
				) {
					lastPresenceDocumentAnnounceAtRef.current = Date.now();
					publishDocumentFromRefs();
				}
			} catch {
				// The editor still works locally when the dev server is not reachable.
			}
		}

		const pollId = window.setInterval((): void => {
			void pollRealtimeSnapshot();
		}, networkPollDelayMs);

		void pollRealtimeSnapshot();

		return (): void => {
			isStopped = true;
			window.clearInterval(pollId);
		};
	}, [applyRemoteDocumentPayload, publishDocumentFromRefs]);

	useEffect((): void => {
		const storage = getClientStorage();
		const storedDocument = parseStoredDocument(
			storage?.getItem(storageKey) ?? null,
		);
		const storedLineComments = parseStoredLineComments(
			storage?.getItem(commentsStorageKey) ?? null,
		);

		if (storedDocument) {
			setDocument(storedDocument);
		}

		if (storedLineComments) {
			setLineCommentsById(storedLineComments);
		}

		hasLoadedStorageRef.current = true;
	}, []);

	useEffect((): void => {
		if (
			!hasLoadedStorageRef.current ||
			isApplyingRemoteDocumentRef.current
		) {
			return;
		}

		const nextSignature = createDocumentSyncSignature(
			document,
			lineCommentsById,
		);

		if (shouldSkipInitialDocumentSyncRef.current) {
			shouldSkipInitialDocumentSyncRef.current = false;
			documentSyncSignatureRef.current = nextSignature;
			return;
		}

		if (shouldSkipNextDocumentPublishRef.current) {
			shouldSkipNextDocumentPublishRef.current = false;
			return;
		}

		if (documentSyncSignatureRef.current === nextSignature) {
			return;
		}

		documentSyncSignatureRef.current = nextSignature;
		publishDocumentFromRefs();
	}, [document, lineCommentsById, publishDocumentFromRefs]);

	useEffect((): (() => void) | undefined => {
		if (!pendingFocusLineId) {
			return undefined;
		}

		const lineIdToFocus: string = pendingFocusLineId;
		let frameId: number | null = null;
		let attempts = 0;

		function tryFocusPendingLine(): void {
			attempts += 1;

			if (focusLineEditor(lineIdToFocus, "end") || attempts >= 12) {
				setPendingFocusLineId(null);
				return;
			}

			frameId = window.requestAnimationFrame(tryFocusPendingLine);
		}

		frameId = window.requestAnimationFrame(tryFocusPendingLine);

		return (): void => {
			if (frameId !== null) {
				window.cancelAnimationFrame(frameId);
			}
		};
	}, [lineFocusSignature, pendingFocusLineId]);

	useEffect((): void => {
		if (format.focusMode) {
			setFocusDraftText(
				(currentDraftText: string | null): string =>
					currentDraftText ?? structuredFocusText,
			);
			return;
		}

		setFocusDraftText(null);
	}, [format.focusMode, structuredFocusText]);

	useEffect((): (() => void) | undefined => {
		if (!textLookupSelection || typeof window === "undefined") {
			return undefined;
		}

		function clearLookupSelection(): void {
			setTextLookupSelection(null);
		}

		function handleKeyDown(event: globalThis.KeyboardEvent): void {
			if (event.key === "Escape") {
				clearLookupSelection();
			}
		}

		window.addEventListener("resize", clearLookupSelection);
		window.addEventListener("scroll", clearLookupSelection, true);
		window.addEventListener("keydown", handleKeyDown);

		return (): void => {
			window.removeEventListener("resize", clearLookupSelection);
			window.removeEventListener("scroll", clearLookupSelection, true);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [textLookupSelection]);

	function updateDocument(nextDocument: TipTapLyricsDocument): void {
		setDocument({
			...nextDocument,
			sections: renumberDocument(nextDocument.sections),
		});
		setIsDirty(true);
		setSaveState("idle");
	}

	function getSectionOptions(sectionId: string): SectionOptions {
		return {
			...defaultSectionOptions,
			...(sectionOptionsById[sectionId] ?? {}),
		};
	}

	function handleToggleAddMenu(sectionId: string): void {
		setOpenOptionsMenuSectionId(null);
		setOpenKindMenuSectionId(null);
		setOpenAddMenuSectionId(
			(currentSectionId: string | null): string | null =>
				currentSectionId === sectionId ? null : sectionId,
		);
	}

	function handleToggleOptionsMenu(sectionId: string): void {
		setOpenAddMenuSectionId(null);
		setOpenKindMenuSectionId(null);
		setOpenOptionsMenuSectionId(
			(currentSectionId: string | null): string | null =>
				currentSectionId === sectionId ? null : sectionId,
		);
	}

	function handleToggleKindMenu(sectionId: string): void {
		setOpenAddMenuSectionId(null);
		setOpenOptionsMenuSectionId(null);
		setOpenKindMenuSectionId(
			(currentSectionId: string | null): string | null =>
				currentSectionId === sectionId ? null : sectionId,
		);
	}

	function handleToggleSectionOption(
		sectionId: string,
		key: SectionOptionKey,
	): void {
		setSectionOptionsById(
			(
				currentOptionsById: Record<string, SectionOptions>,
			): Record<string, SectionOptions> => {
				const currentOptions =
					currentOptionsById[sectionId] ?? defaultSectionOptions;

				return {
					...currentOptionsById,
					[sectionId]: {
						...currentOptions,
						[key]: !currentOptions[key],
					},
				};
			},
		);
	}

	const handleLineChange = useCallback(
		(sectionId: string, lineId: string, update: TipTapLineUpdate): void => {
			setDocument(
				(
					currentDocument: TipTapLyricsDocument,
				): TipTapLyricsDocument => ({
					...currentDocument,
					sections: currentDocument.sections.map(
						(section: TipTapLyricSection): TipTapLyricSection => {
							if (section.id !== sectionId) {
								return section;
							}

							const nextLines = getVisibleSectionLines(
								section,
							).map(
								(line: TipTapLyricLine): TipTapLyricLine =>
									line.id === lineId
										? {
												...line,
												content: update.content,
												text: update.text,
											}
										: line,
							);

							return setVisibleSectionLines(section, nextLines);
						},
					),
				}),
			);
			setIsDirty(true);
			setSaveState("idle");
		},
		[],
	);

	function handleFocusDocumentTextChange(text: string): void {
		setFocusDraftText(text);

		const nextSections = createSectionsFromFocusText(
			text,
			document.sections,
			0,
		);

		updateDocument({
			...document,
			sections:
				nextSections.length > 0
					? nextSections
					: [createSection("untitled", 1, 0)],
		});
	}

	function handleAddLineComment(lineId: string, body: string): void {
		const nextComment: LineComment = {
			author: "Nilu",
			body,
			id: createId(`comment-${lineId}`),
			initial: "N",
			time: "maintenant",
		};

		setLineCommentsById(
			(currentCommentsById: LineCommentsById): LineCommentsById => ({
				...currentCommentsById,
				[lineId]: [...(currentCommentsById[lineId] ?? []), nextComment],
			}),
		);

		updateDocument({
			...document,
			sections: document.sections.map(
				(section: TipTapLyricSection): TipTapLyricSection =>
					setVisibleSectionLines(
						section,
						getVisibleSectionLines(section).map(
							(line: TipTapLyricLine): TipTapLyricLine =>
								line.id === lineId
									? { ...line, comments: line.comments + 1 }
									: line,
						),
					),
			),
		});
	}

	function handleSave(): void {
		const storage = getClientStorage();
		const savedDocument: TipTapLyricsDocument = {
			...document,
			updatedAt: new Date().toISOString(),
		};

		storage?.setItem(storageKey, JSON.stringify(savedDocument));
		storage?.setItem(commentsStorageKey, JSON.stringify(lineCommentsById));
		setDocument(savedDocument);
		setIsDirty(false);
		setSaveState("saved");
		window.setTimeout((): void => setSaveState("idle"), 1400);
	}

	function handleToggle(key: EditorToggleKey): void {
		setToggles((currentToggles: EditorToggle[]): EditorToggle[] =>
			currentToggles.map(
				(toggle: EditorToggle): EditorToggle =>
					toggle.key === key
						? { ...toggle, enabled: !toggle.enabled }
						: toggle,
			),
		);
	}

	function handleLookupTermChange(nextLookupTerm: string): void {
		const nextNormalizedLookupTerm: string =
			normalizeLookupTerm(nextLookupTerm);

		setLookupTerm(
			nextNormalizedLookupTerm.length > 0 ? nextLookupTerm : null,
		);
		setTextLookupSelection(null);
	}

	function handleTextSelectionChange(
		selection: TipTapTextSelection | null,
	): void {
		if (!selection) {
			setTextLookupSelection(null);
			return;
		}

		const rawSelectionText: string = selection.text.trim();
		const sourceLine = getVisibleLineById(
			document.sections,
			selection.lineId,
		);
		const sourceLineText: string = sourceLine?.text ?? "";
		const isWholeLineSelection: boolean =
			format.focusMode &&
			normalizeComparableSelection(rawSelectionText).length > 0 &&
			normalizeComparableSelection(rawSelectionText) ===
				normalizeComparableSelection(sourceLineText);
		const normalizedSelectionText: string | null =
			normalizeSelectedLookupWord(selection.text);

		if (isWholeLineSelection) {
			setTextLookupSelection({
				from: selection.from,
				lineId: selection.lineId,
				mode: "transform",
				rawText: rawSelectionText,
				rect: selection.rect,
				sectionId: selection.sectionId,
				source: "line",
				text: normalizeComparableSelection(rawSelectionText),
				to: selection.to,
			});
			return;
		}

		if (!normalizedSelectionText) {
			setTextLookupSelection(null);
			return;
		}

		setTextLookupSelection({
			from: selection.from,
			lineId: selection.lineId,
			mode: "lookup",
			rawText: rawSelectionText,
			rect: selection.rect,
			sectionId: selection.sectionId,
			source: "line",
			text: normalizedSelectionText,
			to: selection.to,
		});
	}

	function handleCursorPresenceChange(presence: TipTapCursorPresence): void {
		presenceCursorRef.current = presence;
		setActiveLineId(presence.lineId);
		publishPresenceFromRefs();
	}

	function handleSearchSelectedText(
		target: LyricsInspectorLookupTarget,
	): void {
		if (!textLookupSelection) {
			return;
		}

		setLookupTerm(textLookupSelection.text);
		setInspectorLookupRequest({
			target,
			requestId: Date.now(),
			term: textLookupSelection.text,
		});

		setTextLookupSelection(null);
	}

	function handleTransformSelectionToSection(kind: SectionKind): void {
		if (!textLookupSelection) {
			return;
		}

		const selection = textLookupSelection;
		const sourceSectionIndex = document.sections.findIndex(
			(section: TipTapLyricSection): boolean =>
				section.id === selection.sectionId,
		);
		const sourceSection = document.sections[sourceSectionIndex];

		if (!sourceSection) {
			setTextLookupSelection(null);
			return;
		}

		if (selection.source === "focus") {
			const sourceText =
				selection.focusText ??
				createFocusTextModel(document.sections).text;
			setFocusDraftText(sourceText);

			const startIndex = Math.max(
				0,
				Math.min(sourceText.length, selection.from),
			);
			const endIndex = Math.max(
				startIndex,
				Math.min(sourceText.length, selection.to),
			);
			const selectedText = sourceText
				.slice(startIndex, endIndex)
				.replace(/^\n+|\n+$/g, "")
				.trimEnd();
			const beforeText = sourceText
				.slice(0, startIndex)
				.replace(/\n+$/g, "");
			const afterText = sourceText.slice(endIndex).replace(/^\n+/g, "");

			if (selectedText.trim().length === 0) {
				setTextLookupSelection(null);
				return;
			}

			const replacementSections: TipTapLyricSection[] = [];

			replacementSections.push(
				...createSectionsFromFocusText(
					beforeText,
					document.sections,
					0,
				),
			);

			const transformedSection = createSectionFromText(
				kind,
				selectedText,
				sourceSectionIndex + replacementSections.length,
			);
			replacementSections.push(transformedSection);

			replacementSections.push(
				...createSectionsFromFocusText(
					afterText,
					document.sections.slice(replacementSections.length),
					replacementSections.length,
				),
			);

			updateDocument({
				...document,
				sections:
					replacementSections.length > 0
						? replacementSections
						: [transformedSection],
			});
			setTextLookupSelection(null);
			return;
		}

		const visibleLines = getVisibleSectionLines(sourceSection);
		const sourceLineIndex = visibleLines.findIndex(
			(line: TipTapLyricLine): boolean => line.id === selection.lineId,
		);
		const sourceLine = visibleLines[sourceLineIndex];

		if (!sourceLine) {
			setTextLookupSelection(null);
			return;
		}

		const lineText: string = sourceLine.text;
		const startIndex: number = Math.max(
			0,
			Math.min(lineText.length, selection.from - 1),
		);
		const endIndex: number = Math.max(
			startIndex,
			Math.min(lineText.length, selection.to - 1),
		);
		const selectedText: string =
			lineText.slice(startIndex, endIndex).trim() ||
			selection.rawText.trim();

		if (selectedText.length === 0) {
			setTextLookupSelection(null);
			return;
		}

		const beforeText: string = lineText.slice(0, startIndex).trimEnd();
		const afterText: string = lineText.slice(endIndex).trimStart();
		const replacementLines: TipTapLyricLine[] = [];

		if (beforeText.length > 0) {
			replacementLines.push(replaceLineText(sourceLine, beforeText));
		}

		if (afterText.length > 0) {
			replacementLines.push(createLine(sourceSection.kind, afterText));
		}

		const nextVisibleLines: TipTapLyricLine[] = [...visibleLines];
		nextVisibleLines.splice(
			sourceLineIndex,
			1,
			...(replacementLines.length > 0
				? replacementLines
				: [createLine(sourceSection.kind)]),
		);

		const transformedSection = createSectionFromText(
			kind,
			selectedText,
			document.sections.length,
		);
		const nextSections = [...document.sections];

		nextSections[sourceSectionIndex] = setVisibleSectionLines(
			sourceSection,
			nextVisibleLines,
		);
		nextSections.splice(sourceSectionIndex + 1, 0, transformedSection);

		updateDocument({ ...document, sections: nextSections });
		setTextLookupSelection(null);
		setPendingFocusLineId(transformedSection.lines[0]?.id ?? null);
	}

	function handleAddLine(
		sectionId: string,
		afterLineId?: string,
		text = "",
	): void {
		let nextFocusLineId: string | null = null;
		const nextSections = document.sections.map(
			(section: TipTapLyricSection): TipTapLyricSection => {
				if (section.id !== sectionId) {
					return section;
				}

				const nextLine = createLine(section.kind, text);
				const lines = [...getVisibleSectionLines(section)];
				const insertIndex = afterLineId
					? lines.findIndex((line) => line.id === afterLineId) + 1
					: lines.length;

				lines.splice(Math.max(0, insertIndex), 0, nextLine);
				nextFocusLineId = nextLine.id;

				return setVisibleSectionLines(section, lines);
			},
		);

		updateDocument({ ...document, sections: nextSections });

		if (nextFocusLineId) {
			setPendingFocusLineId(nextFocusLineId);
		}
	}

	function handleDeleteLine(sectionId: string, lineId: string): void {
		let nextFocusLineId: string | null = null;
		const nextSections = document.sections.map(
			(section: TipTapLyricSection): TipTapLyricSection => {
				if (section.id !== sectionId) {
					return section;
				}

				const visibleLines = getVisibleSectionLines(section);
				const lineIndex = visibleLines.findIndex(
					(line) => line.id === lineId,
				);
				const nextFocusLine =
					visibleLines[lineIndex - 1] ?? visibleLines[lineIndex + 1];
				const lines = visibleLines.filter(
					(line: TipTapLyricLine): boolean => line.id !== lineId,
				);
				const fallbackLine = createLine(section.kind);

				nextFocusLineId = nextFocusLine?.id ?? fallbackLine.id;

				return setVisibleSectionLines(
					section,
					lines.length > 0 ? lines : [fallbackLine],
				);
			},
		);

		updateDocument({ ...document, sections: nextSections });

		if (nextFocusLineId) {
			setPendingFocusLineId(nextFocusLineId);
		}
	}

	function handlePasteLines(
		sectionId: string,
		lineId: string,
		lines: string[],
	): void {
		if (lines.length === 0) {
			return;
		}

		const nextSections = document.sections.map(
			(section: TipTapLyricSection): TipTapLyricSection => {
				if (section.id !== sectionId) {
					return section;
				}

				const visibleLines = getVisibleSectionLines(section);
				const lineIndex = visibleLines.findIndex(
					(line: TipTapLyricLine): boolean => line.id === lineId,
				);
				const pastedLines = lines.map(
					(lineText: string): TipTapLyricLine =>
						createLine(section.kind, lineText),
				);
				const nextLines = [...visibleLines];

				nextLines.splice(Math.max(0, lineIndex), 1, ...pastedLines);

				return setVisibleSectionLines(section, nextLines);
			},
		);

		updateDocument({ ...document, sections: nextSections });
	}

	function handleAddSection(afterSectionId: string, kind: SectionKind): void {
		const sameKindCount = document.sections.filter(
			(section) => section.kind === kind,
		).length;
		const nextSection = createSection(
			kind,
			sameKindCount + 1,
			document.sections.length,
		);
		const sectionIndex = document.sections.findIndex(
			(section) => section.id === afterSectionId,
		);
		const nextSections = [...document.sections];

		nextSections.splice(sectionIndex + 1, 0, nextSection);
		updateDocument({ ...document, sections: nextSections });
		setPendingFocusLineId(nextSection.lines[0]?.id ?? null);
		setOpenAddMenuSectionId(null);
		setOpenOptionsMenuSectionId(null);
	}

	function handleCreateSectionAlternative(sectionId: string): void {
		let nextFocusLineId: string | null = null;
		const nextSections = document.sections.map(
			(section: TipTapLyricSection): TipTapLyricSection => {
				if (section.id !== sectionId) {
					return section;
				}

				const nextAlternativeIndex: number =
					section.alternatives.length + 1;
				const nextAlternative: TipTapSectionAlternative = {
					createdBy: "Collaborateur",
					id: createId(`${section.kind}-alternative`),
					label: `Alternative ${nextAlternativeIndex}`,
					lines: cloneLinesForSection(
						getVisibleSectionLines(section),
						`${section.kind}-alternative`,
					),
				};

				nextFocusLineId = nextAlternative.lines[0]?.id ?? null;

				return {
					...section,
					activeAlternativeId: nextAlternative.id,
					alternatives: [...section.alternatives, nextAlternative],
				};
			},
		);

		updateDocument({ ...document, sections: nextSections });
		setOpenOptionsMenuSectionId(null);
		setOpenAddMenuSectionId(null);
		setOpenKindMenuSectionId(null);

		if (nextFocusLineId) {
			setPendingFocusLineId(nextFocusLineId);
		}
	}

	function handleSelectSectionAlternative(
		sectionId: string,
		alternativeId: string | null,
	): void {
		updateDocument({
			...document,
			sections: document.sections.map(
				(section: TipTapLyricSection): TipTapLyricSection => {
					if (section.id !== sectionId) {
						return section;
					}

					const nextAlternativeId: string | null =
						alternativeId &&
						section.alternatives.some(
							(alternative: TipTapSectionAlternative): boolean =>
								alternative.id === alternativeId,
						)
							? alternativeId
							: null;

					return {
						...section,
						activeAlternativeId: nextAlternativeId,
					};
				},
			),
		});
		setOpenOptionsMenuSectionId(null);
		setOpenAddMenuSectionId(null);
	}

	function handlePromoteSectionAlternative(
		sectionId: string,
		alternativeId: string,
	): void {
		let nextFocusLineId: string | null = null;
		const nextSections = document.sections.map(
			(section: TipTapLyricSection): TipTapLyricSection => {
				if (section.id !== sectionId) {
					return section;
				}

				const promotedAlternative = section.alternatives.find(
					(alternative: TipTapSectionAlternative): boolean =>
						alternative.id === alternativeId,
				);

				if (!promotedAlternative) {
					return section;
				}

				const oldBaseAlternative: TipTapSectionAlternative = {
					createdBy: "Base",
					id: createId(`${section.kind}-base`),
					label: "Ancienne base",
					lines: section.lines,
				};
				nextFocusLineId = promotedAlternative.lines[0]?.id ?? null;

				return {
					...section,
					activeAlternativeId: null,
					alternatives: [
						...section.alternatives.filter(
							(alternative: TipTapSectionAlternative): boolean =>
								alternative.id !== alternativeId,
						),
						oldBaseAlternative,
					],
					lines: promotedAlternative.lines,
				};
			},
		);

		updateDocument({ ...document, sections: nextSections });
		setOpenOptionsMenuSectionId(null);
		setOpenAddMenuSectionId(null);
		setOpenCommentLineId(null);

		if (nextFocusLineId) {
			setPendingFocusLineId(nextFocusLineId);
		}
	}

	function handleDeleteSectionAlternative(
		sectionId: string,
		alternativeId: string,
	): void {
		let deletedLineIds: string[] = [];
		const nextSections = document.sections.map(
			(section: TipTapLyricSection): TipTapLyricSection => {
				if (section.id !== sectionId) {
					return section;
				}

				const deletedAlternative = section.alternatives.find(
					(alternative: TipTapSectionAlternative): boolean =>
						alternative.id === alternativeId,
				);

				if (!deletedAlternative) {
					return section;
				}

				deletedLineIds = deletedAlternative.lines.map(
					(line: TipTapLyricLine): string => line.id,
				);

				return {
					...section,
					activeAlternativeId:
						section.activeAlternativeId === alternativeId
							? null
							: section.activeAlternativeId,
					alternatives: section.alternatives.filter(
						(alternative: TipTapSectionAlternative): boolean =>
							alternative.id !== alternativeId,
					),
				};
			},
		);

		updateDocument({ ...document, sections: nextSections });

		if (deletedLineIds.length > 0) {
			setLineCommentsById(
				(currentCommentsById: LineCommentsById): LineCommentsById => {
					const nextCommentsById: LineCommentsById = {
						...currentCommentsById,
					};

					deletedLineIds.forEach((lineId: string): void => {
						delete nextCommentsById[lineId];
					});

					return nextCommentsById;
				},
			);
		}

		setOpenOptionsMenuSectionId(null);
		setOpenAddMenuSectionId(null);
		setOpenCommentLineId(null);
	}

	function handleDuplicateSection(sectionId: string): void {
		const sectionIndex = document.sections.findIndex(
			(section) => section.id === sectionId,
		);
		const sourceSection = document.sections[sectionIndex];

		if (!sourceSection) {
			return;
		}

		const duplicatedSection: TipTapLyricSection = {
			...sourceSection,
			activeAlternativeId: null,
			accentColor: getSectionAccentColor(document.sections.length),
			alternatives: [],
			id: createId(sourceSection.kind),
			lines: cloneLinesForSection(
				getVisibleSectionLines(sourceSection),
				sourceSection.kind,
			),
		};
		const nextSections = [...document.sections];

		nextSections.splice(sectionIndex + 1, 0, duplicatedSection);
		updateDocument({ ...document, sections: nextSections });
		setOpenOptionsMenuSectionId(null);
	}

	function handleDeleteSection(sectionId: string): void {
		if (document.sections.length <= 1) {
			setOpenOptionsMenuSectionId(null);
			return;
		}

		updateDocument({
			...document,
			sections: document.sections.filter(
				(section: TipTapLyricSection): boolean =>
					section.id !== sectionId,
			),
		});
		setOpenOptionsMenuSectionId(null);
	}

	function handleSectionKindChange(
		sectionId: string,
		kind: SectionKind,
	): void {
		updateDocument({
			...document,
			sections: document.sections.map(
				(section: TipTapLyricSection): TipTapLyricSection =>
					section.id === sectionId ? { ...section, kind } : section,
			),
		});
		setOpenKindMenuSectionId(null);
	}

	function handleSectionDrop(targetSectionId: string): void {
		if (!draggedSectionId) {
			return;
		}

		updateDocument({
			...document,
			sections: moveSection(
				document.sections,
				draggedSectionId,
				targetSectionId,
			),
		});
		setDraggedSectionId(null);
	}

	function handleLineDrop(
		targetSectionId: string,
		targetLineId: string,
		placement: LineDropPlacement,
	): void {
		if (!draggedLine) {
			return;
		}

		updateDocument({
			...document,
			sections: moveLine(
				document.sections,
				draggedLine,
				targetSectionId,
				targetLineId,
				placement,
			),
		});
		setDraggedLine(null);
	}

	function handleMoveFocus(
		lineId: string,
		direction: "next" | "previous",
	): void {
		const editors = Array.from(
			window.document.querySelectorAll<HTMLElement>(
				"[data-line-editor='true']",
			),
		);
		const currentIndex = editors.findIndex(
			(editor) => editor.dataset.lineId === lineId,
		);
		const targetIndex =
			direction === "next" ? currentIndex + 1 : currentIndex - 1;
		const targetLineId: string | undefined =
			editors[targetIndex]?.dataset.lineId;

		if (targetLineId) {
			focusLineEditor(targetLineId, "end");
		}
	}

	function handleTrackCurrentTimeChange(seconds: number): void {
		setTrackCurrentTimeSeconds(
			Math.max(0, Math.min(trackDurationSeconds, seconds)),
		);
	}

	function handleTrackMarkerPositionChange(
		sectionId: string,
		positionPercent: number,
	): void {
		setTrackMarkerPositionsBySectionId(
			(
				currentPositions: Record<string, number>,
			): Record<string, number> => ({
				...currentPositions,
				[sectionId]: Math.round(positionPercent * 10) / 10,
			}),
		);
	}

	const showRhymes =
		toggles.find((toggle) => toggle.key === "rhymes")?.enabled ?? false;
	const showAnnotations =
		toggles.find((toggle) => toggle.key === "annotation")?.enabled ?? true;
	const showSyllables =
		toggles.find((toggle) => toggle.key === "syllables")?.enabled ?? false;

	return (
		<div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#17171C]">
			<div
				className={`grid min-h-0 flex-1 grid-cols-1 overflow-hidden ${workspaceGridTemplateClass}`}
			>
				<main className="min-h-0 overflow-y-auto bg-[#17171C]">
					<div
						className={`flex min-h-full flex-col ${
							format.focusMode
								? "px-[clamp(24px,7vw,128px)] py-3"
								: "px-6 py-3 lg:px-8"
						}`}
					>
						<div
							className={`flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between ${
								format.focusMode ? "mb-10" : "mb-8"
							}`}
						>
							<div className="flex items-center gap-3">
								<h1 className="text-[17px] font-bold text-[#F3F4F6]">
									{document.title}
								</h1>
								<button
									type="button"
									onClick={handleSave}
									className="inline-flex h-6 items-center gap-1.5 rounded-[4px] border border-[#2C2C32] px-2 text-[10px] font-semibold text-[#F3F4F6] transition-colors hover:border-[#4A4A52] hover:bg-[#1C1C22]"
								>
									<Save size={12} strokeWidth={1.8} />
									{saveState === "saved"
										? "Sauvegarde"
										: "Sauvegarder"}
								</button>
								{isDirty && (
									<span className="text-[10px] font-medium text-[#A1A1AA]">
										Modifie
									</span>
								)}
							</div>

							<div className="flex flex-wrap items-center justify-end gap-4">
								{toggles.map(
									(toggle: EditorToggle): ReactElement => (
										<ToggleSwitch
											key={toggle.key}
											toggle={toggle}
											onToggle={handleToggle}
										/>
									),
								)}
								<span className="text-[10px] font-bold text-[#F3F4F6]">
									{wordCount} mots
								</span>
							</div>
						</div>

						{format.focusMode ? (
							<FocusLyricsDocument
								document={document}
								lineStyle={editorLineStyle}
								text={focusDraftText ?? structuredFocusText}
								onDocumentTextChange={
									handleFocusDocumentTextChange
								}
								onSelectionChange={setTextLookupSelection}
								rhymeHighlightsByLineId={
									rhymeHighlightsByLineId
								}
								normalizedLookupTerm={normalizedLookupTerm}
								remotePresences={remotePresences}
								showRhymes={showRhymes}
							/>
						) : (
							<div className="w-full max-w-[1120px]">
								{document.sections.map(
									(
										section: TipTapLyricSection,
									): ReactElement => (
										<section
											key={section.id}
											data-tiptap-section="true"
											onDragOver={(
												event: DragEvent<HTMLElement>,
											): void => {
												if (
													event.dataTransfer.types.includes(
														sectionDragType,
													)
												) {
													event.preventDefault();
												}
											}}
											onDrop={(
												event: DragEvent<HTMLElement>,
											): void => {
												if (
													event.dataTransfer.types.includes(
														sectionDragType,
													)
												) {
													event.preventDefault();
													handleSectionDrop(
														section.id,
													);
												}
											}}
											className={`relative ${
												format.focusMode
													? "mb-5"
													: "mb-8"
											} ${draggedSectionId === section.id ? "opacity-50" : "opacity-100"}`}
										>
											{!format.focusMode &&
												openAddMenuSectionId ===
													section.id && (
													<SectionAddMenu
														onAddSection={(
															kind: SectionKind,
														): void => {
															handleAddSection(
																section.id,
																kind,
															);
														}}
														onAddLine={(): void => {
															handleAddLine(
																section.id,
															);
															setOpenAddMenuSectionId(
																null,
															);
														}}
													/>
												)}
											{!format.focusMode &&
												openOptionsMenuSectionId ===
													section.id && (
													<SectionOptionsMenu
														options={getSectionOptions(
															section.id,
														)}
														onToggleOption={(
															key: SectionOptionKey,
														): void => {
															handleToggleSectionOption(
																section.id,
																key,
															);
														}}
														onCreateAlternative={(): void =>
															handleCreateSectionAlternative(
																section.id,
															)
														}
														onDuplicate={(): void =>
															handleDuplicateSection(
																section.id,
															)
														}
														onDelete={(): void =>
															handleDeleteSection(
																section.id,
															)
														}
														onValidate={(): void =>
															setOpenOptionsMenuSectionId(
																null,
															)
														}
													/>
												)}
											<div className="buttons mb-2 flex h-auto flex-row items-center gap-2">
												{format.focusMode && (
													<div className="absolute left-0 top-0 flex h-5 w-8 items-center justify-center text-[11px] font-medium text-[#D6D6DD]">
														{getFocusSectionInitial(
															section.kind,
														)}
													</div>
												)}
												{!format.focusMode && (
													<>
														<button
															type="button"
															aria-expanded={
																openAddMenuSectionId ===
																section.id
															}
															onClick={(): void =>
																handleToggleAddMenu(
																	section.id,
																)
															}
															className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-[5px] text-[#38383C] transition-colors hover:bg-[#202027] hover:text-[#F3F4F6]"
														>
															<Plus
																size={20}
																strokeWidth={
																	1.8
																}
															/>
														</button>
														<button
															type="button"
															aria-label="Options et deplacement de la section"
															aria-expanded={
																openOptionsMenuSectionId ===
																section.id
															}
															draggable
															onClick={(): void =>
																handleToggleOptionsMenu(
																	section.id,
																)
															}
															onDragStart={(
																event: DragEvent<HTMLButtonElement>,
															): void => {
																const sectionElement: HTMLElement | null =
																	event.currentTarget.closest<HTMLElement>(
																		"[data-tiptap-section='true']",
																	);
																const dragImage: HTMLElement | null =
																	sectionElement
																		? createSectionDragImage(
																				sectionElement,
																			)
																		: null;

																setDraggedSectionId(
																	section.id,
																);
																setDraggedLine(
																	null,
																);
																setOpenAddMenuSectionId(
																	null,
																);
																setOpenOptionsMenuSectionId(
																	null,
																);
																setOpenKindMenuSectionId(
																	null,
																);
																event.dataTransfer.effectAllowed =
																	"move";
																event.dataTransfer.setData(
																	sectionDragType,
																	section.id,
																);
																event.dataTransfer.setData(
																	"text/plain",
																	section.id,
																);

																if (dragImage) {
																	event.dataTransfer.setDragImage(
																		dragImage,
																		44,
																		24,
																	);
																	removeDragImageAfterSnapshot(
																		dragImage,
																	);
																}
															}}
															onDragEnd={(): void =>
																setDraggedSectionId(
																	null,
																)
															}
															className="inline-flex h-5 w-5 cursor-grab items-center justify-center rounded-[5px] text-[#38383C] transition-colors hover:bg-[#202027] hover:text-[#F3F4F6] active:cursor-grabbing"
														>
															<GripVertical
																size={20}
																strokeWidth={
																	1.8
																}
															/>
														</button>
														<span
															className="h-2.5 w-2.5 rounded-full"
															style={{
																backgroundColor:
																	section.accentColor,
															}}
														/>
														<SectionKindPicker
															isOpen={
																openKindMenuSectionId ===
																section.id
															}
															onClose={(): void =>
																setOpenKindMenuSectionId(
																	null,
																)
															}
															onSelect={(
																kind: SectionKind,
															): void =>
																handleSectionKindChange(
																	section.id,
																	kind,
																)
															}
															onToggle={(): void =>
																handleToggleKindMenu(
																	section.id,
																)
															}
															section={section}
														/>
														{getSectionOptions(
															section.id,
														).wordCount && (
															<span className="text-[13px] font-medium text-[var(--nara-word-count)]">
																{countSectionWords(
																	section,
																)}{" "}
																mots
															</span>
														)}
														<SectionVariantSwitcher
															activeAlternativeId={
																section.activeAlternativeId
															}
															alternatives={
																section.alternatives
															}
															onDelete={(
																alternativeId: string,
															): void =>
																handleDeleteSectionAlternative(
																	section.id,
																	alternativeId,
																)
															}
															onPromote={(
																alternativeId: string,
															): void =>
																handlePromoteSectionAlternative(
																	section.id,
																	alternativeId,
																)
															}
															onSelect={(
																alternativeId:
																	| string
																	| null,
															): void =>
																handleSelectSectionAlternative(
																	section.id,
																	alternativeId,
																)
															}
														/>
													</>
												)}
											</div>

											<div
												aria-label="zone de texte"
												className={
													format.focusMode
														? "ml-[72px] h-auto w-auto border-l-0 px-0 py-0"
														: "ml-[59px] h-auto w-auto border-l-2 border-[#38383C] px-4 py-2"
												}
											>
												{getVisibleSectionLines(
													section,
												).map(
													(
														line: TipTapLyricLine,
													): ReactElement => {
														const sectionOptions =
															getSectionOptions(
																section.id,
															);
														const shouldShowRhymes: boolean =
															!format.focusMode &&
															(showRhymes ||
																sectionOptions.rhymes);
														const shouldShowAnnotations: boolean =
															!format.focusMode &&
															(showAnnotations ||
																sectionOptions.annotation);
														const shouldShowSyllables: boolean =
															!format.focusMode &&
															(showSyllables ||
																sectionOptions.syllables);
														const lineComments =
															lineCommentsById[
																line.id
															] ?? [];
														const lineCommentCount: number =
															Math.max(
																line.comments,
																lineComments.length,
															);
														const rhymeHighlight:
															| RhymeHighlight
															| undefined =
															rhymeHighlightsByLineId[
																line.id
															];
														const visibleRhymeHighlight: RhymeHighlight | null =
															shouldShowRhymes &&
															line.text.trim()
																.length > 0 &&
															rhymeHighlight !==
																undefined
																? rhymeHighlight
																: null;
														const searchMatchRanges: SearchMatchRange[] =
															createSearchMatchRanges(
																line.text,
																normalizedLookupTerm,
															);
														const remotePresencesForLine: RemotePresence[] =
															remotePresences.filter(
																(
																	presence: RemotePresence,
																): boolean =>
																	presence.sectionId ===
																		section.id &&
																	presence.lineId ===
																		line.id,
															);

														return (
															<div
																key={line.id}
																data-tiptap-line="true"
																onDragOver={(
																	event: DragEvent<HTMLDivElement>,
																): void => {
																	if (
																		event.dataTransfer.types.includes(
																			lineDragType,
																		)
																	) {
																		event.preventDefault();
																	}
																}}
																onDrop={(
																	event: DragEvent<HTMLDivElement>,
																): void => {
																	if (
																		event.dataTransfer.types.includes(
																			lineDragType,
																		)
																	) {
																		event.preventDefault();
																		const rect =
																			event.currentTarget.getBoundingClientRect();
																		const placement: LineDropPlacement =
																			event.clientY <
																			rect.top +
																				rect.height /
																					2
																				? "before"
																				: "after";
																		handleLineDrop(
																			section.id,
																			line.id,
																			placement,
																		);
																	}
																}}
																className={`group/line relative grid min-w-0 items-center text-[#F3F4F6] transition-colors ${
																	format.focusMode
																		? "min-h-[18px] gap-0 rounded-[3px] px-0 py-[1px] hover:bg-transparent focus-within:bg-transparent"
																		: "-mx-2 min-h-[28px] gap-2 rounded-[5px] px-2 py-1 hover:bg-[#202027] focus-within:bg-[#202027]"
																} ${
																	draggedLine?.lineId ===
																	line.id
																		? "opacity-45"
																		: "opacity-100"
																}`}
																style={
																	format.focusMode
																		? focusLineGridStyle
																		: lineGridStyle
																}
															>
																{!format.focusMode && (
																	<button
																		type="button"
																		aria-label="Numero de ligne et deplacer ligne"
																		draggable
																		onDragStart={(
																			event: DragEvent<HTMLButtonElement>,
																		): void => {
																			const nextDraggedLine: LineDragState =
																				{
																					sectionId:
																						section.id,
																					lineId: line.id,
																				};
																			const lineElement: HTMLElement | null =
																				event.currentTarget.closest<HTMLElement>(
																					"[data-tiptap-line='true']",
																				);
																			const dragImage: HTMLElement | null =
																				lineElement
																					? createLineDragImage(
																							lineElement,
																						)
																					: null;

																			event.stopPropagation();
																			setDraggedLine(
																				nextDraggedLine,
																			);
																			setDraggedSectionId(
																				null,
																			);
																			setOpenAddMenuSectionId(
																				null,
																			);
																			setOpenOptionsMenuSectionId(
																				null,
																			);
																			setOpenKindMenuSectionId(
																				null,
																			);
																			event.dataTransfer.effectAllowed =
																				"move";
																			event.dataTransfer.setData(
																				lineDragType,
																				JSON.stringify(
																					nextDraggedLine,
																				),
																			);
																			event.dataTransfer.setData(
																				"text/plain",
																				line.id,
																			);

																			if (
																				dragImage
																			) {
																				event.dataTransfer.setDragImage(
																					dragImage,
																					24,
																					18,
																				);
																				removeDragImageAfterSnapshot(
																					dragImage,
																				);
																			}
																		}}
																		onDragEnd={(): void =>
																			setDraggedLine(
																				null,
																			)
																		}
																		className="inline-flex h-6 w-full cursor-grab select-none items-center justify-end rounded-[3px] pr-0.5 text-right text-[16px] font-medium leading-none tabular-nums text-[#F3F4F6] transition-colors hover:bg-[#222228] hover:text-white group-hover/line:text-white active:cursor-grabbing"
																	>
																		{
																			line.number
																		}
																	</button>
																)}
																<div className="relative min-w-0">
																	{searchMatchRanges.length >
																		0 && (
																		<SearchHighlightOverlay
																			lineStyle={
																				editorLineStyle
																			}
																			ranges={
																				searchMatchRanges
																			}
																			text={
																				line.text
																			}
																		/>
																	)}
																	{visibleRhymeHighlight && (
																		<RhymeHighlightOverlay
																			highlight={
																				visibleRhymeHighlight
																			}
																			lineStyle={
																				editorLineStyle
																			}
																			text={
																				line.text
																			}
																		/>
																	)}
																	{shouldShowSyllables &&
																		line.text.trim()
																			.length >
																			0 && (
																			<div
																				data-syllable-row="true"
																				className="pointer-events-none absolute left-0 right-0 select-none text-transparent"
																				style={
																					syllableMeasureStyle
																				}
																			>
																				{getSyllableParts(
																					line.text,
																				).map(
																					(
																						part: SyllablePart,
																					): ReactElement =>
																						part.kind ===
																						"space" ? (
																							<span
																								key={
																									part.id
																								}
																								aria-hidden="true"
																								className="select-none whitespace-pre"
																							>
																								{
																									part.text
																								}
																							</span>
																						) : (
																							<span
																								key={
																									part.id
																								}
																								className="relative inline-block select-none whitespace-pre text-transparent"
																							>
																								<span
																									aria-hidden="true"
																									className="absolute inset-x-0 top-0 select-none text-center text-[#A1A1AA]"
																									style={
																										syllableNumberStyle
																									}
																								>
																									{
																										part.count
																									}
																								</span>
																								{
																									part.text
																								}
																							</span>
																						),
																				)}
																			</div>
																		)}
																	<TipTapLineEditor
																		content={
																			line.content
																		}
																		format={
																			format
																		}
																		isActive={
																			activeLineId ===
																			line.id
																		}
																		lineId={
																			line.id
																		}
																		lineNumber={
																			line.number
																		}
																		sectionId={
																			section.id
																		}
																		style={
																			editorLineStyle
																		}
																		onFocus={(): void =>
																			setActiveLineId(
																				line.id,
																			)
																		}
																		onFormatSnapshotChange={
																			onFormatChange
																		}
																		onChange={(
																			update: TipTapLineUpdate,
																		): void => {
																			handleLineChange(
																				section.id,
																				line.id,
																				update,
																			);
																		}}
																		onEnter={(): void =>
																			handleAddLine(
																				section.id,
																				line.id,
																			)
																		}
																		onBackspaceEmptyAtStart={(): void =>
																			handleDeleteLine(
																				section.id,
																				line.id,
																			)
																		}
																		onMoveFocus={(
																			direction,
																		): void =>
																			handleMoveFocus(
																				line.id,
																				direction,
																			)
																		}
																		onPasteLines={(
																			lines: string[],
																		): void =>
																			handlePasteLines(
																				section.id,
																				line.id,
																				lines,
																			)
																		}
																		onCursorPresenceChange={
																			handleCursorPresenceChange
																		}
																		onTextSelectionChange={
																			handleTextSelectionChange
																		}
																	/>
																	{remotePresencesForLine.length >
																		0 && (
																		<RemoteCursorOverlay
																			lineStyle={
																				editorLineStyle
																			}
																			presences={
																				remotePresencesForLine
																			}
																			text={
																				line.text
																			}
																		/>
																	)}
																</div>
																{!format.focusMode &&
																shouldShowAnnotations ? (
																	<div className="relative flex justify-end select-none">
																		<button
																			type="button"
																			aria-label={
																				lineCommentCount >
																				0
																					? `${lineCommentCount} commentaires sur la ligne ${line.number}`
																					: `Ajouter un commentaire sur la ligne ${line.number}`
																			}
																			aria-expanded={
																				openCommentLineId ===
																				line.id
																			}
																			onClick={(): void =>
																				setOpenCommentLineId(
																					openCommentLineId ===
																						line.id
																						? null
																						: line.id,
																				)
																			}
																			className={`mt-0.5 grid h-5 w-[34px] grid-cols-[14px_12px] items-center justify-end gap-1 rounded-[3px] text-[11px] transition-[color,opacity,background-color] hover:bg-[#222228] hover:text-white ${
																				openCommentLineId ===
																				line.id
																					? "bg-[#222228] text-white opacity-100"
																					: lineCommentCount >
																						  0
																						? "text-[#D6D6DD] opacity-100"
																						: "text-[#6F6F78] opacity-0 group-hover/line:opacity-100 focus-visible:opacity-100"
																			}`}
																		>
																			<MessageSquare
																				size={
																					12
																				}
																				strokeWidth={
																					1.8
																				}
																			/>
																			<span
																				className={
																					lineCommentCount >
																					0
																						? "opacity-100"
																						: "opacity-0"
																				}
																			>
																				{
																					lineCommentCount
																				}
																			</span>
																		</button>
																		{openCommentLineId ===
																			line.id && (
																			<LineCommentOverlay
																				comments={
																					lineComments
																				}
																				lineNumber={
																					line.number
																				}
																				onAddComment={(
																					body: string,
																				): void => {
																					handleAddLineComment(
																						line.id,
																						body,
																					);
																				}}
																				onClose={(): void =>
																					setOpenCommentLineId(
																						null,
																					)
																				}
																			/>
																		)}
																	</div>
																) : (
																	!format.focusMode && (
																		<span />
																	)
																)}
															</div>
														);
													},
												)}
											</div>

											{!format.focusMode && (
												<div className="ml-[59px] mt-2 flex items-center gap-2 px-4">
													<button
														type="button"
														onClick={(): void =>
															handleAddLine(
																section.id,
															)
														}
														className="inline-flex h-7 items-center gap-2 rounded-[5px] px-2 text-[13px] font-medium text-[#A1A1AA] transition-colors hover:bg-[#202027] hover:text-[#F3F4F6]"
													>
														<Plus
															size={15}
															strokeWidth={1.8}
														/>
														Ajouter une ligne
													</button>
													<button
														type="button"
														onClick={(): void =>
															handleDuplicateSection(
																section.id,
															)
														}
														className="inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-[#2C2C32] px-2 text-[11px] font-semibold text-[#F3F4F6] transition-colors hover:border-[#4A4A52] hover:bg-[#202027]"
													>
														<Copy
															size={12}
															strokeWidth={1.8}
														/>
														Dupliquer
													</button>
													<button
														type="button"
														onClick={(): void =>
															handleCreateSectionAlternative(
																section.id,
															)
														}
														className="inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-[#2C2C32] px-2 text-[11px] font-semibold text-[#F3F4F6] transition-colors hover:border-[#4A4A52] hover:bg-[#202027]"
													>
														<Copy
															size={12}
															strokeWidth={1.8}
														/>
														Alternative
													</button>
													<button
														type="button"
														onClick={(): void =>
															setOpenOptionsMenuSectionId(
																null,
															)
														}
														className="inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-[#2C2C32] px-2 text-[11px] font-semibold text-[#F3F4F6] transition-colors hover:border-[#4A4A52] hover:bg-[#202027]"
													>
														<CheckSquare
															size={12}
															strokeWidth={1.8}
														/>
														Valider
													</button>
													<button
														type="button"
														onClick={(): void =>
															handleDeleteSection(
																section.id,
															)
														}
														className="inline-flex h-7 items-center justify-center rounded-[5px] border border-[#2C2C32] px-2 text-[#A1A1AA] transition-colors hover:border-[#4A4A52] hover:bg-[#202027] hover:text-[#F3F4F6]"
													>
														<Trash2
															size={12}
															strokeWidth={1.8}
														/>
													</button>
												</div>
											)}
										</section>
									),
								)}
							</div>
						)}
					</div>
				</main>

				{shouldRenderInspectorTools && (
					<div className="min-h-0">
						<LyricsInspector
							lookupRequest={inspectorLookupRequest}
							onLookupTermChange={handleLookupTermChange}
							onVisibilityChange={setHasVisibleInspectorPanels}
						/>
					</div>
				)}
			</div>

			{textLookupSelection && (
				<SelectionLookupToolbar
					selection={textLookupSelection}
					onClose={(): void => setTextLookupSelection(null)}
					onSearch={handleSearchSelectedText}
					isFocusMode={format.focusMode}
					onTransformSelection={handleTransformSelectionToSection}
				/>
			)}

			{shouldRenderTrackPanel && (
				<TrackPlayer
					currentTimeSeconds={trackCurrentTimeSeconds}
					durationSeconds={trackDurationSeconds}
					isPlaying={isTrackPlaying}
					markers={trackMarkers}
					onCurrentTimeChange={handleTrackCurrentTimeChange}
					onDurationChange={(seconds: number): void => {
						if (Number.isFinite(seconds) && seconds > 0) {
							setTrackDurationSeconds(seconds);
						}
					}}
					onMarkerPositionChange={handleTrackMarkerPositionChange}
					onPlaybackEnd={(): void => setIsTrackPlaying(false)}
					onTogglePlay={(): void =>
						setIsTrackPlaying(
							(currentValue: boolean): boolean => !currentValue,
						)
					}
					onVolumeChange={(volumePercent: number): void =>
						setTrackVolumePercent(
							Math.max(0, Math.min(100, volumePercent)),
						)
					}
					volumePercent={trackVolumePercent}
				/>
			)}
		</div>
	);
}
