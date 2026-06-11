"use client";

import "@/lib/amplify";

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
} from "./LyricsInspector";
import type { LyricsFormat } from "./LyricsHeader";
import {
	commentsStorageKey as lyricsEditorCommentsStorageKey,
	storageKey as lyricsEditorDocumentStorageKey,
	getLyricsTextColorCss,
	applyMarkToLineRange,
	getRangeMarkState,
	type LyricsMarkKey,
} from "./lyricsEditorStorage";
import TipTapLineEditor, {
	type TipTapCursorPresence,
	type TipTapLineUpdate,
	type TipTapTextSelection,
} from "./TipTapLineEditor";
import {
	TrackPlayer,
	type TrackMarker,
	type TrackMarkerCreatePayload,
} from "./TrackPlayer";
import FocusLyricsDocument, {
	type TextLookupSelection,
	type FocusFormatSelection,
	type RhymeHighlight,
	type RhymeHighlightsByLineId,
	type RemotePresence,
	normalizeComparableSelection,
	normalizeSelectedLookupWord,
	SearchHighlightOverlay,
	RhymeHighlightOverlay,
	RemoteCursorOverlay,
	getActualLineMappings,
	type FocusLineMapping,
} from "./FocusLyricsDocument";
import SelectionLookupToolbar from "./SelectionLookupToolbar";
import LineCommentOverlay from "./LineCommentOverlay";
import type { LineComment } from "./LineCommentOverlay";

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

export type SectionOptionKey = EditorToggleKey | "wordCount";

export type SectionOptions = Record<SectionOptionKey, boolean>;

type EditorToggle = {
	key: EditorToggleKey;
	label: string;
	enabled: boolean;
};

type LineCommentsById = Record<string, LineComment[]>;

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

type LyricsEditorWorkspaceProps = {
	format: LyricsFormat;
	onFormatChange: (patch: Partial<LyricsFormat>) => void;
	lyricsId?: string;
};

type SectionKindPickerProps = {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (kind: SectionKind) => void;
	onToggle: () => void;
	section: TipTapLyricSection;
	isFocusMode?: boolean;
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

function getVisibleLinesForSection(
	section: TipTapLyricSection,
): TipTapLyricLine[] {
	const activeAlternative = getActiveAlternative(section);
	if (activeAlternative) {
		return [...section.lines, ...activeAlternative.lines];
	}
	return section.lines;
}

function getLinesForLineId(
	section: TipTapLyricSection,
	lineId: string | undefined | null,
): {
	lines: TipTapLyricLine[];
	updateSection: (
		section: TipTapLyricSection,
		nextLines: TipTapLyricLine[],
	) => TipTapLyricSection;
} {
	const activeAlternative = getActiveAlternative(section);

	if (lineId) {
		const isInBase = section.lines.some((line) => line.id === lineId);
		if (isInBase) {
			return {
				lines: section.lines,
				updateSection: (sec, next) => ({ ...sec, lines: next }),
			};
		}

		for (const alt of section.alternatives) {
			if (alt.lines.some((line) => line.id === lineId)) {
				return {
					lines: alt.lines,
					updateSection: (sec, next) => ({
						...sec,
						alternatives: sec.alternatives.map((a) =>
							a.id === alt.id ? { ...a, lines: next } : a,
						),
					}),
				};
			}
		}
	}

	if (activeAlternative) {
		return {
			lines: activeAlternative.lines,
			updateSection: (sec, next) => ({
				...sec,
				alternatives: sec.alternatives.map((alt) =>
					alt.id === activeAlternative.id
						? { ...alt, lines: next }
						: alt,
				),
			}),
		};
	}

	return {
		lines: section.lines,
		updateSection: (sec, next) => ({ ...sec, lines: next }),
	};
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
			getVisibleLinesForSection(section).some(
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
			getVisibleLinesForSection(section).find(
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

			if (!sourceLine) {
				return createLine(section.kind, lineText);
			}

			// Keep existing content (and its marks) when the text is
			// untouched; rebuilding would wipe bold/italic/color marks.
			return sourceLine.text === lineText
				? sourceLine
				: replaceLineText(sourceLine, lineText);
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
			lineIndex += focusSectionSeparatorNewlineCount - 1;
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

			const sectionStartLineNumber = lineNumber;

			const numberedBaseLines = section.lines.map(
				(line: TipTapLyricLine): TipTapLyricLine => ({
					...line,
					number: lineNumber++,
				}),
			);

			const numberedAlternatives = section.alternatives.map(
				(
					alternative: TipTapSectionAlternative,
				): TipTapSectionAlternative => {
					let alternativeLineNumber = sectionStartLineNumber;
					return {
						...alternative,
						lines: alternative.lines.map(
							(line: TipTapLyricLine): TipTapLyricLine => ({
								...line,
								number: alternativeLineNumber++,
							}),
						),
					};
				},
			);

			return {
				...section,
				accentColor:
					section.accentColor || getSectionAccentColor(index),
				title,
				lines: numberedBaseLines,
				alternatives: numberedAlternatives,
			};
		},
	);
}

function createInitialDocument(): TipTapLyricsDocument {
    return {
        id: "new",
        title: "Sans titre",
        updatedAt: null,
        sections: renumberDocument([
            {
                accentColor: getSectionAccentColor(0),
                activeAlternativeId: null,
                alternatives: [],
                id: "couplet-1",
                kind: "couplet",
                title: "COUPLET",
                lines: [createLine("couplet")],
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
		"#202027";
	const previewBorder: string =
		themeStyles.getPropertyValue("--nara-border-strong").trim() ||
		"#4A4A52";
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
	dragImage.style.boxShadow = "0 16px 34px rgba(0, 0, 0, 0.45)";
	dragImage.style.padding = "10px 12px";
	dragImage.style.opacity = "1";

	(themeRoot ?? window.document.body).appendChild(dragImage);

	return dragImage;
}

function removeDragImageAfterSnapshot(dragImage: HTMLElement): void {
	window.setTimeout((): void => {
		dragImage.style.top = "-10000px";
	}, 0);
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
		"#202027";
	const previewBorder: string =
		themeStyles.getPropertyValue("--nara-border-strong").trim() ||
		"#4A4A52";
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
	dragImage.style.boxShadow = "0 14px 30px rgba(0, 0, 0, 0.4)";
	dragImage.style.padding = "6px 8px";
	dragImage.style.opacity = "1";

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
			className={`relative h-[15px] w-[34px] shrink-0 overflow-hidden rounded-full border border-white/10 transition-colors duration-150 ${
				enabled ? "bg-[#F2C4B0]" : "bg-[#4A4A52]"
			}`}
		>
			<span
				className="absolute top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full bg-[#000000] shadow-[0_0_0_1px_rgba(255,255,255,0.18)] transition-[left] duration-150"
				style={{ left: enabled ? "20px" : "2px" }}
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
export function SectionAddMenu({
	onAddSection,
	onAddLine,
}: {
	onAddSection: (kind: SectionKind) => void;
	onAddLine: () => void;
}): ReactElement {
	return (
		<div className="section-menu-container w-[214px] z-40 rounded-[18px] border border-[#5A5A63] bg-[#2B2B31] px-4 py-5 shadow-[0_18px_36px_rgba(0,0,0,0.35)]">
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

export function SectionOptionsMenu({
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
		<div className="section-menu-container flex items-start gap-3">
			<div className="w-[216px] rounded-[18px] z-50 border border-[#5A5A63] bg-[#2B2B31] px-4 py-4 shadow-[0_18px_36px_rgba(0,0,0,0.35)]">
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
	isFocusMode = false,
}: SectionKindPickerProps): ReactElement {
	const pickerRef = useRef<HTMLDivElement | null>(null);

	useEffect((): (() => void) | undefined => {
		if (!isOpen || typeof window === "undefined") {
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

		window.document.addEventListener("pointerdown", handlePointerDown);
		window.document.addEventListener("keydown", handleKeyDown);

		return (): void => {
			window.document.removeEventListener(
				"pointerdown",
				handlePointerDown,
			);
			window.document.removeEventListener("keydown", handleKeyDown);
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
					className={
						isFocusMode
							? "group inline-flex h-5 items-center gap-0.5 rounded-[4px] text-left text-[#6F6F78] hover:text-[#F3F4F6] outline-none transition-colors"
							: "group inline-flex h-6 items-center gap-1 rounded-[4px] text-left text-[#F3F4F6] outline-none transition-colors hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#6F6F78]"
					}
				>
					<span
						className={
							isFocusMode
								? "text-[13px] font-medium uppercase leading-none tracking-wider"
								: "text-[22px] font-bold uppercase leading-none"
						}
					>
						{section.title}
					</span>
					{!isFocusMode && (
						<ChevronDown
							size={13}
							strokeWidth={2}
							className={`text-[#777780] transition-transform duration-150 group-hover:text-[#F3F4F6] ${
								isOpen ? "rotate-180 text-[#F3F4F6]" : ""
							}`}
						/>
					)}
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

export default function LyricsEditorWorkspace({
	format,
	onFormatChange,
	lyricsId,
}: LyricsEditorWorkspaceProps): ReactElement {
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
	const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(
		null,
	);
	const [draggedHeight, setDraggedHeight] = useState<number>(0);
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
	const [sectionCommentsById, setSectionCommentsById] = useState<
		Record<string, LineComment[]>
	>({});
	const [openCommentSectionId, setOpenCommentSectionId] = useState<
		string | null
	>(null);
	const [activeLineId, setActiveLineId] = useState<string | null>(null);
	const [pendingFocusLineId, setPendingFocusLineId] = useState<string | null>(
		null,
	);
	const [sectionOptionsById, setSectionOptionsById] = useState<
		Record<string, SectionOptions>
	>({});
	const [, setHasVisibleInspectorPanels] = useState<boolean>(true);
	const [lookupTerm, setLookupTerm] = useState<string | null>(null);
	const [focusDraftText, setFocusDraftText] = useState<string | null>(null);
	const [textLookupSelection, setTextLookupSelection] =
		useState<TextLookupSelection | null>(null);
	const [focusFormatSelection, setFocusFormatSelection] =
		useState<FocusFormatSelection | null>(null);
	const focusFormatSyncRef = useRef<boolean>(false);
	const previousFocusFormatRef = useRef({
		bold: format.bold,
		italic: format.italic,
		strike: format.strike,
		textColor: format.textColor,
		textOpacity: format.textOpacity,
		underline: format.underline,
	});
	const [inspectorLookupRequest, setInspectorLookupRequest] =
		useState<LyricsInspectorLookupRequest | null>(null);
	const [isTrackPlaying, setIsTrackPlaying] = useState<boolean>(false);
	const [isTrackPanelCollapsed, setIsTrackPanelCollapsed] =
		useState<boolean>(false);
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
	// User-authored annotations on the timeline (independent of sections).
	const [customTrackMarkers, setCustomTrackMarkers] = useState<TrackMarker[]>(
		[],
	);
	const [remotePresencesBySessionId, setRemotePresencesBySessionId] =
		useState<RemotePresenceBySessionId>({});
	const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
	const presenceSessionIdRef = useRef<string>(createPresenceSessionId());

	useEffect((): (() => void) | undefined => {
		if (!openOptionsMenuSectionId && !openAddMenuSectionId) {
			return undefined;
		}

		function handlePointerDown(event: globalThis.PointerEvent): void {
			const target: EventTarget | null = event.target;

			if (!(target instanceof Element)) {
				return;
			}

			if (
				!target.closest(".section-menu-container") &&
				!target.closest(
					"[aria-label='Options et deplacement de la section']",
				) &&
				!target.closest("[aria-label='Ajouter section']")
			) {
				setOpenOptionsMenuSectionId(null);
				setOpenAddMenuSectionId(null);
			}
		}

		function handleKeyDown(event: globalThis.KeyboardEvent): void {
			if (event.key === "Escape") {
				setOpenOptionsMenuSectionId(null);
				setOpenAddMenuSectionId(null);
			}
		}

		window.document.addEventListener("pointerdown", handlePointerDown);
		window.document.addEventListener("keydown", handleKeyDown);

		return (): void => {
			window.document.removeEventListener(
				"pointerdown",
				handlePointerDown,
			);
			window.document.removeEventListener("keydown", handleKeyDown);
		};
	}, [openOptionsMenuSectionId, openAddMenuSectionId]);
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
					getVisibleLinesForSection(section).map(
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
	const shouldRenderTrackPanel: boolean = format.showTrackPanel;
	const workspaceGridTemplateClass = "xl:grid-cols-[minmax(0,1fr)]";
	const publishPresenceFromRefs = useCallback((): void => {}, []);
	const publishDocumentFromRefs = useCallback((): void => {}, []);
	const applyRemoteDocumentPayload = useCallback((): void => {}, []);

	useEffect((): void => {
		const loadDocument = async () => {
			if (lyricsId) {
				try {
					const { getCurrentUser } = await import("aws-amplify/auth");
					const user = await getCurrentUser();
					const res = await fetch(`/api/lyrics/${lyricsId}`, {
						headers: { "x-cognito-id": user.userId },
					});
					if (res.ok) {
						const data = await res.json();
						const parsedDoc = parseStoredDocument(JSON.stringify(data.content));
						if (parsedDoc) {
							console.log("Setting document:", parsedDoc);
							setDocument(parsedDoc);
						} else {
							setDocument({
								...createInitialDocument(),
								id: data.id,
								title: data.title,
							});
						}
					}
				} catch (err) {
					console.error("Erreur chargement lyrics:", err);
				}
			}
			hasLoadedStorageRef.current = true;
		};

		loadDocument();
	}, [lyricsId]);

	useEffect((): void => {
		if (!hasLoadedStorageRef.current) {
			return;
		}
		setIsDirty(true);
		setSaveState("idle");
	}, [document, lineCommentsById]);

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

							const { lines, updateSection } = getLinesForLineId(
								section,
								lineId,
							);
							const nextLines = lines.map(
								(line: TipTapLyricLine): TipTapLyricLine =>
									line.id === lineId
										? {
												...line,
												content: update.content,
												text: update.text,
											}
										: line,
							);

							return updateSection(section, nextLines);
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

	function getFocusSelectionLineRanges(selection: FocusFormatSelection): Array<{
		from: number;
		line: TipTapLyricLine;
		section: TipTapLyricSection;
		to: number;
	}> {
		const focusText = (
			selection.focusText ?? focusDraftTextOrStructured
		).replace(/\r\n/g, "\n");
		const mappings: FocusLineMapping[] = getActualLineMappings(
			focusText,
			document.sections,
		);
		const rows = focusText.split("\n");
		const rowStarts: number[] = [];
		let offset = 0;

		rows.forEach((row: string): void => {
			rowStarts.push(offset);
			offset += row.length + 1;
		});

		const ranges: Array<{
			from: number;
			line: TipTapLyricLine;
			section: TipTapLyricSection;
			to: number;
		}> = [];

		mappings.forEach(({ line, section, lineIndex }): void => {
			const rowText = rows[lineIndex] ?? "";
			const rowStart = rowStarts[lineIndex];
			const rowEnd = rowStart + rowText.length;
			const from = Math.max(selection.from, rowStart);
			const to = Math.min(selection.to, rowEnd);

			// Skip lines outside the selection or out of sync with the
			// document (mid-typing divergence).
			if (from >= to || rowText !== line.text) {
				return;
			}

			ranges.push({
				from: from - rowStart,
				line,
				section,
				to: to - rowStart,
			});
		});

		return ranges;
	}

	// Sync the toolbar toggle states with the marks of the current focus
	// selection, so clicking B/I/S/U toggles in the expected direction.
	useEffect((): void => {
		if (!format.focusMode || !focusFormatSelection) {
			return;
		}

		const ranges = getFocusSelectionLineRanges(focusFormatSelection);

		if (ranges.length === 0) {
			return;
		}

		let bold = true;
		let italic = true;
		let strike = true;
		let underline = true;

		ranges.forEach(({ line, from, to }): void => {
			const state = getRangeMarkState(line.content, from, to);
			bold = bold && state.bold;
			italic = italic && state.italic;
			strike = strike && state.strike;
			underline = underline && state.underline;
		});

		if (
			bold !== format.bold ||
			italic !== format.italic ||
			strike !== format.strike ||
			underline !== format.underline
		) {
			focusFormatSyncRef.current = true;
			onFormatChange({ bold, italic, strike, underline });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [focusFormatSelection]);

	// Apply toolbar format changes to the focus-mode text selection.
	useEffect((): void => {
		const previous = previousFocusFormatRef.current;

		previousFocusFormatRef.current = {
			bold: format.bold,
			italic: format.italic,
			strike: format.strike,
			textColor: format.textColor,
			textOpacity: format.textOpacity,
			underline: format.underline,
		};

		if (focusFormatSyncRef.current) {
			focusFormatSyncRef.current = false;
			return;
		}

		if (!format.focusMode || !focusFormatSelection) {
			return;
		}

		const patches: Array<
			| { key: LyricsMarkKey; value: boolean }
			| { key: "color"; value: string | null }
		> = [];

		(["bold", "italic", "strike", "underline"] as LyricsMarkKey[]).forEach(
			(key: LyricsMarkKey): void => {
				if (previous[key] !== format[key]) {
					patches.push({ key, value: format[key] });
				}
			},
		);

		if (
			previous.textColor !== format.textColor ||
			previous.textOpacity !== format.textOpacity
		) {
			patches.push({ key: "color", value: getLyricsTextColorCss(format) });
		}

		if (patches.length === 0) {
			return;
		}

		const ranges = getFocusSelectionLineRanges(focusFormatSelection);

		if (ranges.length === 0) {
			return;
		}

		const rangeByLineId = new Map(
			ranges.map((range) => [range.line.id, range]),
		);
		const nextSections = document.sections.map(
			(section: TipTapLyricSection): TipTapLyricSection =>
				setVisibleSectionLines(
					section,
					getVisibleSectionLines(section).map(
						(line: TipTapLyricLine): TipTapLyricLine => {
							const range = rangeByLineId.get(line.id);

							if (!range) {
								return line;
							}

							let content = line.content;

							patches.forEach((patch): void => {
								content = applyMarkToLineRange(
									content,
									range.from,
									range.to,
									patch,
								);
							});

							return { ...line, content };
						},
					),
				),
		);

		updateDocument({ ...document, sections: nextSections });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		format.bold,
		format.italic,
		format.strike,
		format.underline,
		format.textColor,
		format.textOpacity,
	]);

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

	function handleToggleSectionComment(sectionId: string): void {
		setOpenCommentSectionId(
			(current: string | null): string | null =>
				current === sectionId ? null : sectionId,
		);
	}

	function handleAddSectionComment(sectionId: string, body: string): void {
		const nextComment: LineComment = {
			author: "Nilu",
			body,
			id: createId(`section-comment-${sectionId}`),
			initial: "N",
			time: "maintenant",
		};

		setSectionCommentsById(
			(
				current: Record<string, LineComment[]>,
			): Record<string, LineComment[]> => ({
				...current,
				[sectionId]: [...(current[sectionId] ?? []), nextComment],
			}),
		);
	}

	async function handleSave(isCheckpoint: boolean = false): Promise<void> {
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

		if (lyricsId) {
			const { getCurrentUser } = await import("aws-amplify/auth");
			try {
				const user = await getCurrentUser();
				await fetch(`/api/lyrics/${lyricsId}`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						"x-cognito-id": user.userId,
					},
					body: JSON.stringify({ content: savedDocument }),
				});
			} catch (err) {
				console.error("Save to API failed:", err);
			}
		}
	}

	// Auto-save toutes les 5 secondes en cas de modifications non sauvegardées
	useEffect(() => {
		if (!isDirty) return;
		const timer = setTimeout(() => {
			handleSave(false);
		}, 5000);
		return () => clearTimeout(timer);
	}, [document, isDirty]);

	console.log("Current document sections:", document.sections.length);

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
				const { lines: sectionLines, updateSection } =
					getLinesForLineId(section, afterLineId);
				const lines = [...sectionLines];
				const insertIndex = afterLineId
					? lines.findIndex((line) => line.id === afterLineId) + 1
					: lines.length;

				lines.splice(Math.max(0, insertIndex), 0, nextLine);
				nextFocusLineId = nextLine.id;

				return updateSection(section, lines);
			},
		);

		updateDocument({ ...document, sections: nextSections });
		setFocusDraftText(null);

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

				const { lines: sectionLines, updateSection } =
					getLinesForLineId(section, lineId);
				const lineIndex = sectionLines.findIndex(
					(line) => line.id === lineId,
				);
				const nextFocusLine =
					sectionLines[lineIndex - 1] ?? sectionLines[lineIndex + 1];
				const lines = sectionLines.filter(
					(line: TipTapLyricLine): boolean => line.id !== lineId,
				);
				const fallbackLine = createLine(section.kind);

				nextFocusLineId = nextFocusLine?.id ?? fallbackLine.id;

				return updateSection(
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

				const { lines: sectionLines, updateSection } =
					getLinesForLineId(section, lineId);
				const lineIndex = sectionLines.findIndex(
					(line: TipTapLyricLine): boolean => line.id === lineId,
				);
				const pastedLines = lines.map(
					(lineText: string): TipTapLyricLine =>
						createLine(section.kind, lineText),
				);
				const nextLines = [...sectionLines];

				nextLines.splice(Math.max(0, lineIndex), 1, ...pastedLines);

				return updateSection(section, nextLines);
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
		setFocusDraftText(null);
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
		setFocusDraftText(null);
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
		setFocusDraftText(null);
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
		setFocusDraftText(null);
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
		setDragOverSectionId(null);
		setDraggedHeight(0);
		setFocusDraftText(null);
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

	function formatTrackTimeLabel(seconds: number): string {
		const safe = Math.max(0, seconds);
		const minutes = Math.floor(safe / 60);
		const rest = Math.round(safe % 60)
			.toString()
			.padStart(2, "0");
		return `${minutes}:${rest}`;
	}

	function handleTrackMarkerPositionChange(
		markerId: string,
		positionPercent: number,
	): void {
		const rounded = Math.round(positionPercent * 10) / 10;

		// Custom annotation markers carry their own position + time label.
		setCustomTrackMarkers((current: TrackMarker[]): TrackMarker[] =>
			current.some((marker) => marker.id === markerId)
				? current.map((marker) =>
						marker.id === markerId
							? {
									...marker,
									positionPercent: rounded,
									timeLabel: formatTrackTimeLabel(
										(trackDurationSeconds * rounded) / 100,
									),
								}
							: marker,
					)
				: current,
		);

		setTrackMarkerPositionsBySectionId(
			(
				currentPositions: Record<string, number>,
			): Record<string, number> => ({
				...currentPositions,
				[markerId]: rounded,
			}),
		);
	}

	function handleTrackMarkerCreate(
		payload: TrackMarkerCreatePayload,
	): void {
		const positionPercent = Math.round(payload.positionPercent * 10) / 10;
		const seconds = (trackDurationSeconds * positionPercent) / 100;

		setCustomTrackMarkers((current: TrackMarker[]): TrackMarker[] => [
			...current,
			{
				accentColor: "#DA069A",
				id: createId("track-marker"),
				label: payload.label.trim() || "Annotation",
				positionPercent,
				timeLabel: formatTrackTimeLabel(seconds),
			},
		]);
	}

	const showRhymes =
		toggles.find((toggle) => toggle.key === "rhymes")?.enabled ?? false;
	const showAnnotations =
		toggles.find((toggle) => toggle.key === "annotation")?.enabled ?? true;
	const showSyllables =
		toggles.find((toggle) => toggle.key === "syllables")?.enabled ?? false;

	function renderSectionTextZone(
		section: TipTapLyricSection,
		lines: TipTapLyricLine[],
		isAlternative: boolean,
	): ReactElement {
		return (
			<div
				aria-label={
					isAlternative
						? "zone de texte alternative"
						: "zone de texte"
				}
				className={
					format.focusMode
						? "ml-[72px] h-auto w-auto border-l-0 px-0 py-0"
						: isAlternative
							? "h-auto w-auto px-4 py-2"
							: "ml-[59px] h-auto w-auto border-l-2 border-[#38383C] px-4 py-2"
				}
				onMouseDown={(
					event: React.MouseEvent<HTMLDivElement>,
				): void => {
					const target = event.target as HTMLElement;
					if (
						target.closest("button") ||
						target.closest("[data-line-editor='true']") ||
						target.closest("[contenteditable='true']") ||
						target.closest(".section-menu-container") ||
						target.closest(".section-handles-container")
					) {
						return;
					}

					const lastLine = lines.at(-1);
					if (lastLine) {
						event.preventDefault();
						focusLineEditor(lastLine.id, "end");
					}
				}}
			>
				{lines.map((line: TipTapLyricLine): ReactElement => {
					const sectionOptions = getSectionOptions(section.id);
					const shouldShowRhymes: boolean =
						!format.focusMode &&
						(showRhymes || sectionOptions.rhymes);
					const shouldShowAnnotations: boolean =
						!format.focusMode &&
						(showAnnotations || sectionOptions.annotation);
					const shouldShowSyllables: boolean =
						!format.focusMode &&
						(showSyllables || sectionOptions.syllables);
					const lineComments = lineCommentsById[line.id] ?? [];
					const lineCommentCount: number = Math.max(
						line.comments,
						lineComments.length,
					);
					const rhymeHighlight: RhymeHighlight | undefined =
						rhymeHighlightsByLineId[line.id];
					const visibleRhymeHighlight: RhymeHighlight | null =
						shouldShowRhymes &&
						line.text.trim().length > 0 &&
						rhymeHighlight !== undefined
							? rhymeHighlight
							: null;
					const searchMatchRanges: SearchMatchRange[] =
						createSearchMatchRanges(
							line.text,
							normalizedLookupTerm,
						);
					const remotePresencesForLine: RemotePresence[] =
						remotePresences.filter(
							(presence: RemotePresence): boolean =>
								presence.sectionId === section.id &&
								presence.lineId === line.id,
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
									event.dataTransfer.dropEffect = "move";
								} else if (
									event.dataTransfer.types.includes(
										sectionDragType,
									)
								) {
									event.preventDefault();
									event.dataTransfer.dropEffect = "move";
									if (draggedSectionId) {
										setDragOverSectionId(section.id);
									}
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
										rect.top + rect.height / 2
											? "before"
											: "after";
									handleLineDrop(
										section.id,
										line.id,
										placement,
									);
								} else if (
									event.dataTransfer.types.includes(
										sectionDragType,
									)
								) {
									event.preventDefault();
									handleSectionDrop(section.id);
								}
							}}
							className={`group/line relative grid min-w-0 items-center text-[#F3F4F6] transition-colors ${
								format.focusMode
									? "min-h-[18px] gap-0 rounded-[3px] px-0 py-[1px] hover:bg-transparent focus-within:bg-transparent"
									: "-mx-2 min-h-[28px] gap-2 rounded-[5px] px-2 py-1 hover:bg-[#202027] focus-within:bg-[#202027]"
							} ${
								draggedLine?.lineId === line.id
									? "opacity-45"
									: "opacity-100"
							}`}
							style={
								format.focusMode
									? focusLineGridStyle
									: lineGridStyle
							}
						>
							{!format.focusMode && !isAlternative && (
								<button
									type="button"
									aria-label="Numero de ligne et deplacer ligne"
									draggable
									onDragStart={(
										event: DragEvent<HTMLButtonElement>,
									): void => {
										const nextDraggedLine: LineDragState = {
											sectionId: section.id,
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
										setDraggedLine(nextDraggedLine);
										setDraggedSectionId(null);
										setOpenAddMenuSectionId(null);
										setOpenOptionsMenuSectionId(null);
										setOpenKindMenuSectionId(null);
										event.dataTransfer.effectAllowed =
											"move";
										event.dataTransfer.setData(
											lineDragType,
											JSON.stringify(nextDraggedLine),
										);
										event.dataTransfer.setData(
											"text/plain",
											line.id,
										);

										if (dragImage) {
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
									onDragEnd={(): void => setDraggedLine(null)}
									className="inline-flex h-6 w-full cursor-grab select-none items-center justify-end rounded-[3px] pr-0.5 text-right text-[16px] font-medium leading-none tabular-nums text-[#F3F4F6] transition-colors hover:bg-[#222228] hover:text-white group-hover/line:text-white active:cursor-grabbing"
								>
									{line.number}
								</button>
							)}
							<div className="relative min-w-0">
								{searchMatchRanges.length > 0 && (
									<SearchHighlightOverlay
										lineStyle={editorLineStyle}
										ranges={searchMatchRanges}
										text={line.text}
									/>
								)}
								{visibleRhymeHighlight && (
									<RhymeHighlightOverlay
										highlight={visibleRhymeHighlight}
										lineStyle={editorLineStyle}
										text={line.text}
									/>
								)}
								{shouldShowSyllables &&
									line.text.trim().length > 0 && (
										<div
											data-syllable-row="true"
											className="pointer-events-none absolute left-0 right-0 select-none text-transparent"
											style={syllableMeasureStyle}
										>
											{getSyllableParts(line.text).map(
												(
													part: SyllablePart,
												): ReactElement =>
													part.kind === "space" ? (
														<span
															key={part.id}
															aria-hidden="true"
															className="select-none whitespace-pre"
														>
															{part.text}
														</span>
													) : (
														<span
															key={part.id}
															className="relative inline-block select-none whitespace-pre text-transparent"
														>
															<span
																aria-hidden="true"
																className="absolute inset-x-0 top-0 select-none text-center text-[#A1A1AA]"
																style={
																	syllableNumberStyle
																}
															>
																{part.count}
															</span>
															{part.text}
														</span>
													),
											)}
										</div>
									)}
								<TipTapLineEditor
									content={line.content}
									format={format}
									isActive={activeLineId === line.id}
									lineId={line.id}
									lineNumber={line.number}
									sectionId={section.id}
									style={editorLineStyle}
									onFocus={(): void =>
										setActiveLineId(line.id)
									}
									onFormatSnapshotChange={onFormatChange}
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
										handleAddLine(section.id, line.id)
									}
									onBackspaceEmptyAtStart={(): void =>
										handleDeleteLine(section.id, line.id)
									}
									onMoveFocus={(direction): void =>
										handleMoveFocus(line.id, direction)
									}
									onPasteLines={(lines: string[]): void =>
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
								{remotePresencesForLine.length > 0 && (
									<RemoteCursorOverlay
										lineStyle={editorLineStyle}
										presences={remotePresencesForLine}
										text={line.text}
									/>
								)}
							</div>
							{!format.focusMode && shouldShowAnnotations ? (
								<div className="relative flex justify-end select-none">
									<button
										type="button"
										aria-label={
											lineCommentCount > 0
												? `${lineCommentCount} commentaires sur la ligne ${line.number}`
												: `Ajouter un commentaire sur la ligne ${line.number}`
										}
										aria-expanded={
											openCommentLineId === line.id
										}
										onClick={(): void =>
											setOpenCommentLineId(
												openCommentLineId === line.id
													? null
													: line.id,
											)
										}
										className={`mt-0.5 grid h-5 w-[34px] grid-cols-[14px_12px] items-center justify-end gap-1 rounded-[3px] text-[11px] transition-[color,opacity,background-color] hover:bg-[#222228] hover:text-white ${
											openCommentLineId === line.id
												? "bg-[#222228] text-white opacity-100"
												: lineCommentCount > 0
													? "text-[#D6D6DD] opacity-100"
													: "text-[#6F6F78] opacity-0 group-hover/line:opacity-100 focus-visible:opacity-100"
										}`}
									>
										<MessageSquare
											size={12}
											strokeWidth={1.8}
										/>
										<span
											className={
												lineCommentCount > 0
													? "opacity-100"
													: "opacity-0"
											}
										>
											{lineCommentCount}
										</span>
									</button>
									{openCommentLineId === line.id && (
										<LineCommentOverlay
											comments={lineComments}
											lineNumber={line.number}
											onAddComment={(
												body: string,
											): void => {
												handleAddLineComment(
													line.id,
													body,
												);
											}}
											onClose={(): void =>
												setOpenCommentLineId(null)
											}
										/>
									)}
								</div>
							) : (
								!format.focusMode && <span />
							)}
						</div>
					);
				})}
			</div>
		);
	}

	const hasAnyActiveAlternative = useMemo(
		(): boolean =>
			document.sections.some(
				(section: TipTapLyricSection): boolean =>
					getActiveAlternative(section) !== null,
			),
		[document.sections],
	);

	const focusDraftTextOrStructured = focusDraftText ?? structuredFocusText;

	const focusSectionMarkers = useMemo(
		(): FocusSectionMarker[] =>
			createFocusSectionMarkersFromText(
				focusDraftTextOrStructured,
				document.sections,
			),
		[document.sections, focusDraftTextOrStructured],
	);

	const focusLineCount = Math.max(
		1,
		focusDraftTextOrStructured.split(/\r?\n/).length,
	);

	const focusFontSize =
		typeof editorLineStyle?.fontSize === "number"
			? editorLineStyle.fontSize
			: typeof editorLineStyle?.fontSize === "string"
				? Number.parseInt(editorLineStyle.fontSize, 10) || 16
				: 16;

	const focusLineHeightMultiplier =
		typeof editorLineStyle?.lineHeight === "number"
			? editorLineStyle.lineHeight
			: typeof editorLineStyle?.lineHeight === "string"
				? Number.parseFloat(editorLineStyle.lineHeight) || 1.55
				: 1.55;

	const dynamicLineHeight = focusFontSize * focusLineHeightMultiplier;

	const focusSectionRanges = useMemo(() => {
		return focusSectionMarkers.map((marker, index) => {
			const startLine = marker.lineIndex;
			const endLine =
				index < focusSectionMarkers.length - 1
					? focusSectionMarkers[index + 1].lineIndex
					: focusLineCount;
			return {
				marker,
				startLine,
				endLine,
				heightLines: endLine - startLine,
			};
		});
	}, [focusSectionMarkers, focusLineCount]);

	const getSectionTransform = (secId: string): string => {
		if (
			!draggedSectionId ||
			!dragOverSectionId ||
			draggedSectionId === secId
		) {
			return "none";
		}
		const idxs = document.sections.map((s) => s.id);
		const draggedIdx = idxs.indexOf(draggedSectionId);
		const hoverIdx = idxs.indexOf(dragOverSectionId);
		const currentIdx = idxs.indexOf(secId);

		if (draggedIdx === -1 || hoverIdx === -1 || currentIdx === -1) {
			return "none";
		}

		if (draggedIdx < hoverIdx) {
			if (currentIdx > draggedIdx && currentIdx <= hoverIdx) {
				return `translateY(-${draggedHeight}px)`;
			}
		} else if (draggedIdx > hoverIdx) {
			if (currentIdx >= hoverIdx && currentIdx < draggedIdx) {
				return `translateY(${draggedHeight}px)`;
			}
		}
		return "none";
	};

	const handleWorkspaceClick = (
		event: React.MouseEvent<HTMLElement>,
	): void => {
		const target = event.target as HTMLElement;
		if (
			target.closest("button") ||
			target.closest("[data-line-editor='true']") ||
			target.closest("[contenteditable='true']") ||
			target.closest("textarea") ||
			target.closest(".section-menu-container") ||
			target.closest(".section-handles-container") ||
			target.closest("[aria-label='zone de texte']") ||
			target.closest("[aria-label='zone de texte alternative']")
		) {
			return;
		}

		if (format.focusMode) {
			const textarea =
				window.document.querySelector<HTMLTextAreaElement>("textarea");
			if (textarea) {
				event.preventDefault();
				textarea.focus();
				textarea.setSelectionRange(
					textarea.value.length,
					textarea.value.length,
				);
			}
			return;
		}

		const lastSection = document.sections.at(-1);
		if (!lastSection) return;
		const lastLine = getVisibleSectionLines(lastSection).at(-1);
		if (!lastLine) return;

		event.preventDefault();
		focusLineEditor(lastLine.id, "end");
	};

	return (
		<div className="nara-app relative flex h-full min-h-0 flex-1 flex-col overflow-hidden ">
			<div
				className={`grid min-h-0 flex-1 grid-cols-1 overflow-hidden ${workspaceGridTemplateClass}`}
			>
				<main
					className="min-h-0 overflow-y-auto "
					onMouseDown={handleWorkspaceClick}
				>
					<div
						className={`flex min-h-full flex-col ${
							format.focusMode
								? "px-[clamp(16px,3.8vw,72px)] py-0"
								: "px-6 py-3 lg:px-8"
						} ${
							shouldRenderTrackPanel
								? isTrackPanelCollapsed
									? "pb-[88px]"
									: "pb-[216px] lg:pb-[126px]"
								: ""
						}`}
					>
						<div
							className={`sticky top-[64px] z-[40] flex items-center justify-between gap-3 mt-[64px] rounded-bl-2xl rounded-br-2xl px-4 py-2 bg-[#0D0D10]/55 backdrop-blur-xl ${
								format.focusMode ? "mb-7" : "mb-6"
							}`}
						>
							<div className="flex items-center gap-3">
								{isEditingTitle ? (
									<input
										type="text"
										value={document.title}
										autoFocus
										onChange={(e) => {
											setDocument({ ...document, title: e.target.value });
										}}
										onBlur={async () => {
											setIsEditingTitle(false);
											if (!lyricsId) return;
											try {
												const { getCurrentUser } = await import("aws-amplify/auth");
												const user = await getCurrentUser();
												await fetch(`/api/songs/${lyricsId}/rename`, {
													method: "PATCH",
													headers: {
														"Content-Type": "application/json",
														"x-cognito-id": user.userId,
													},
													body: JSON.stringify({ title: document.title }),
												});
												window.dispatchEvent(new CustomEvent("nara-data-updated"));
											} catch (err) {
												console.error("Rename error:", err);
											}
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.currentTarget.blur();
											}
										}}
										className="whitespace-nowrap text-[15px] font-bold text-[#F3F4F6] bg-transparent border-none outline-none focus:border-b focus:border-neutral-600 cursor-text w-auto"
									/>
								) : (
									<h1 
										className="whitespace-nowrap text-[15px] font-bold text-[#F3F4F6] cursor-text hover:text-white transition-colors"
										onDoubleClick={() => setIsEditingTitle(true)}
										title="Double-cliquez pour renommer"
									>
										{document.title}
									</h1>
								)}
								<button
									type="button"
									onClick={() => handleSave(true)}
									className="inline-flex h-6 items-center gap-1.5 rounded-[4px] border border-[#2C2C32] px-2 text-[10px] font-semibold text-[#F3F4F6] transition-colors hover:border-[#4A4A52] hover:bg-[#202027]"
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

						{format.focusMode && !hasAnyActiveAlternative ? (
							<FocusLyricsDocument
								document={document}
								lineStyle={editorLineStyle}
								text={focusDraftText ?? structuredFocusText}
								onDocumentTextChange={
									handleFocusDocumentTextChange
								}
								onSelectionChange={setTextLookupSelection}
								onFormatSelectionChange={
									setFocusFormatSelection
								}
								rhymeHighlightsByLineId={
									rhymeHighlightsByLineId
								}
								normalizedLookupTerm={normalizedLookupTerm}
								remotePresences={remotePresences}
								showRhymes={showRhymes}
								openAddMenuSectionId={openAddMenuSectionId}
								openOptionsMenuSectionId={
									openOptionsMenuSectionId
								}
								onToggleAddMenu={handleToggleAddMenu}
								onToggleOptionsMenu={handleToggleOptionsMenu}
								getSectionOptions={getSectionOptions}
								handleToggleSectionOption={
									handleToggleSectionOption
								}
								handleCreateSectionAlternative={
									handleCreateSectionAlternative
								}
								handleDuplicateSection={handleDuplicateSection}
								handleDeleteSection={handleDeleteSection}
								handleAddSection={handleAddSection}
								handleAddLine={handleAddLine}
								setOpenAddMenuSectionId={
									setOpenAddMenuSectionId
								}
								setOpenOptionsMenuSectionId={
									setOpenOptionsMenuSectionId
								}
								draggedSectionId={draggedSectionId}
								dragOverSectionId={dragOverSectionId}
								draggedHeight={draggedHeight}
								setDraggedSectionId={setDraggedSectionId}
								setDragOverSectionId={setDragOverSectionId}
								setDraggedHeight={setDraggedHeight}
								handleSectionDrop={handleSectionDrop}
								sectionCommentsById={sectionCommentsById}
								openCommentSectionId={openCommentSectionId}
								onToggleSectionComment={
									handleToggleSectionComment
								}
								onAddSectionComment={handleAddSectionComment}
							/>
						) : (
							<div className="w-full max-w-[1120px]">
								{document.sections.map(
									(
										section: TipTapLyricSection,
									): ReactElement => {
										const activeAlternative =
											getActiveAlternative(section);
										const isSideBySide =
											!!activeAlternative;
										const isBaseLinesEmpty =
											section.lines.length === 0 ||
											section.lines.every(
												(line) =>
													line.text.trim().length ===
													0,
											);
										const otherAlternative =
											activeAlternative
												? section.alternatives.find(
														(alt) =>
															alt.id !==
															activeAlternative.id,
													)
												: null;
										const showOtherAlternativeInBase =
											format.focusMode &&
											isBaseLinesEmpty &&
											!!otherAlternative;
										const baseColumnLines =
											showOtherAlternativeInBase &&
											otherAlternative
												? otherAlternative.lines
												: section.lines;

										if (format.focusMode) {
											return (
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
															event.dataTransfer.dropEffect =
																"move";
															if (
																draggedSectionId
															) {
																setDragOverSectionId(
																	section.id,
																);
															}
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
													className="relative group mb-5"
												>
													<div
														style={{
															transform:
																getSectionTransform(
																	section.id,
																),
															transition:
																draggedSectionId
																	? "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
																	: "none",
															opacity:
																draggedSectionId ===
																section.id
																	? 0
																	: 1,
														}}
													>
														{/* Section title/picker at the top: small grey label above lyrics */}
														{(section.kind !==
															"untitled" ||
															section.alternatives
																.length >
																0) && (
															<div className="mb-1 ml-[59px] px-4 flex h-5 items-center gap-2">
																<SectionKindPicker
																	isFocusMode={
																		true
																	}
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
																	section={
																		section
																	}
																/>
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
															</div>
														)}

														{/* Absolutely positioned hover handles aligned next to the section title */}
														<div
															className={`absolute left-0 flex h-6 flex-row items-center gap-1 transition-opacity duration-150 ${
																section.kind !==
																	"untitled" ||
																section
																	.alternatives
																	.length > 0
																	? "top-0"
																	: "top-2"
															} ${
																openAddMenuSectionId ===
																	section.id ||
																openOptionsMenuSectionId ===
																	section.id
																	? "opacity-100"
																	: "opacity-0 group-hover:opacity-100"
															}`}
														>
															<button
																type="button"
																aria-label="Ajouter section"
																aria-expanded={
																	openAddMenuSectionId ===
																	section.id
																}
																onClick={(): void =>
																	handleToggleAddMenu(
																		section.id,
																	)
																}
																className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-[5px] text-[#38383C] hover:bg-[#202027] hover:text-[#F3F4F6]"
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
																	if (
																		sectionElement
																	) {
																		setDraggedHeight(
																			sectionElement.offsetHeight +
																				20,
																		); // mb-5 gap (20px)
																	}
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
																	if (
																		dragImage
																	) {
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
																onDragEnd={(): void => {
																	setDraggedSectionId(
																		null,
																	);
																	setDragOverSectionId(
																		null,
																	);
																	setDraggedHeight(
																		0,
																	);
																}}
																className="inline-flex h-5 w-5 cursor-grab items-center justify-center rounded-[5px] text-[#38383C] hover:bg-[#202027] hover:text-[#F3F4F6] active:cursor-grabbing"
															>
																<GripVertical
																	size={20}
																	strokeWidth={
																		1.8
																	}
																/>
															</button>
														</div>

														{/* Overlays/menus */}
														{openAddMenuSectionId ===
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

														{openOptionsMenuSectionId ===
															section.id && (
															<SectionOptionsMenu
																options={getSectionOptions(
																	section.id,
																)}
																onToggleOption={(
																	key: SectionOptionKey,
																): void =>
																	handleToggleSectionOption(
																		section.id,
																		key,
																	)
																}
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

														{/* Columns */}
														{isSideBySide ? (
															<div
																className="grid gap-8"
																style={{
																	gridTemplateColumns: `repeat(${1 + section.alternatives.length}, minmax(0, 1fr))`,
																}}
															>
																{/* Column 1: Base Lyrics */}
																<div>
																	{renderSectionTextZone(
																		section,
																		section.lines,
																		false,
																	)}
																</div>
																{/* Other Columns: All Alternatives */}
																{section.alternatives.map(
																	(alt) => (
																		<div
																			key={
																				alt.id
																			}
																		>
																			<div className="mb-1 flex h-5 items-center px-4">
																				<span className="text-[13px] font-medium text-[#6F6F78] uppercase tracking-wider">
																					{
																						section.title
																					}{" "}
																					-{" "}
																					{
																						alt.label
																					}
																				</span>
																			</div>
																			{renderSectionTextZone(
																				section,
																				alt.lines,
																				true,
																			)}
																		</div>
																	),
																)}
															</div>
														) : (
															/* Single Column: Base Lyrics */
															renderSectionTextZone(
																section,
																getVisibleSectionLines(
																	section,
																),
																false,
															)
														)}
													</div>
												</section>
											);
										}

										// OTHERWISE, NORMAL LAYOUT MODE
										const isSideBySideNormal =
											activeAlternative &&
											!format.focusMode;
										return (
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
														event.dataTransfer.dropEffect =
															"move";
														if (draggedSectionId) {
															setDragOverSectionId(
																section.id,
															);
														}
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
												className={`relative group ${
													format.focusMode
														? "mb-5"
														: "mb-8"
												}`}
											>
												<div
													style={{
														transform:
															getSectionTransform(
																section.id,
															),
														transition:
															draggedSectionId
																? "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
																: "none",
														opacity:
															draggedSectionId ===
															section.id
																? 0
																: 1,
													}}
												>
													{isSideBySide ? (
														<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
															{/* Column 1: Base Lyrics */}
															<div>
																<div className="buttons mb-2 flex h-auto flex-row items-center gap-2">
																	<div className="relative inline-flex">
																		<button
																			type="button"
																			aria-label="Ajouter section"
																			aria-expanded={
																				openAddMenuSectionId ===
																				section.id
																			}
																			onClick={(): void =>
																				handleToggleAddMenu(
																					section.id,
																				)
																			}
																			className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-[5px] text-[#38383C] transition-opacity duration-150 hover:bg-[#202027] hover:text-[#F3F4F6] ${
																				openAddMenuSectionId ===
																					section.id ||
																				openOptionsMenuSectionId ===
																					section.id
																					? "opacity-100"
																					: "opacity-0 group-hover:opacity-100"
																			}`}
																		>
																			<Plus
																				size={
																					20
																				}
																				strokeWidth={
																					1.8
																				}
																			/>
																		</button>
																		{!format.focusMode &&
																			openAddMenuSectionId ===
																				section.id && (
																				<div className="absolute left-0 top-full z-50 mt-1">
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
																				</div>
																			)}
																	</div>
																	<div className="relative inline-flex">
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
																				if (
																					sectionElement
																				) {
																					setDraggedHeight(
																						sectionElement.offsetHeight +
																							32,
																					); // mb-8 gap (32px)
																				}

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

																				if (
																					dragImage
																				) {
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
																			onDragEnd={(): void => {
																				setDraggedSectionId(
																					null,
																				);
																				setDragOverSectionId(
																					null,
																				);
																				setDraggedHeight(
																					0,
																				);
																			}}
																			className={`inline-flex h-5 w-5 cursor-grab items-center justify-center rounded-[5px] text-[#38383C] transition-opacity duration-150 hover:bg-[#202027] hover:text-[#F3F4F6] active:cursor-grabbing ${
																				openAddMenuSectionId ===
																					section.id ||
																				openOptionsMenuSectionId ===
																					section.id
																					? "opacity-100"
																					: "opacity-0 group-hover:opacity-100"
																			}`}
																		>
																			<GripVertical
																				size={
																					20
																				}
																				strokeWidth={
																					1.8
																				}
																			/>
																		</button>
																		{!format.focusMode &&
																			openOptionsMenuSectionId ===
																				section.id && (
																				<div className="absolute left-0 top-full z-50 mt-1">
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
																				</div>
																			)}
																	</div>
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
																		section={
																			section
																		}
																	/>
																	{getSectionOptions(
																		section.id,
																	)
																		.wordCount && (
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
																</div>

																{/* Menus were moved inside relative wrappers */}

																{renderSectionTextZone(
																	section,
																	section.lines,
																	false,
																)}

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
																			size={
																				15
																			}
																			strokeWidth={
																				1.8
																			}
																		/>
																		Ajouter
																		une
																		ligne
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
																			size={
																				12
																			}
																			strokeWidth={
																				1.8
																			}
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
																			size={
																				12
																			}
																			strokeWidth={
																				1.8
																			}
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
																			size={
																				12
																			}
																			strokeWidth={
																				1.8
																			}
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
																			size={
																				12
																			}
																			strokeWidth={
																				1.8
																			}
																		/>
																	</button>
																</div>
															</div>

															{/* Column 2: Alternative Lyrics */}
															<div>
																<div className="mb-2 flex h-6 items-center">
																	<span className="text-[13px] font-medium text-[#6F6F78]">
																		{
																			section.title
																		}{" "}
																		-{" "}
																		{
																			activeAlternative.label
																		}
																	</span>
																</div>

																{renderSectionTextZone(
																	section,
																	activeAlternative.lines,
																	true,
																)}

																<div className="mt-2 flex items-center gap-2 px-4">
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
																			size={
																				15
																			}
																			strokeWidth={
																				1.8
																			}
																		/>
																		Ajouter
																		une
																		ligne
																	</button>
																</div>
															</div>
														</div>
													) : (
														<>
															{/* Menus were moved inside relative wrappers */}
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
																		<div className="relative inline-flex">
																			<button
																				type="button"
																				aria-label="Ajouter section"
																				aria-expanded={
																					openAddMenuSectionId ===
																					section.id
																				}
																				onClick={(): void =>
																					handleToggleAddMenu(
																						section.id,
																					)
																				}
																				className={`inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-[5px] text-[#38383C] transition-opacity duration-150 hover:bg-[#202027] hover:text-[#F3F4F6] ${
																					openAddMenuSectionId ===
																						section.id ||
																					openOptionsMenuSectionId ===
																						section.id
																						? "opacity-100"
																						: "opacity-0 group-hover:opacity-100"
																				}`}
																			>
																				<Plus
																					size={
																						20
																					}
																					strokeWidth={
																						1.8
																					}
																				/>
																			</button>
																			{!format.focusMode &&
																				openAddMenuSectionId ===
																					section.id && (
																					<div className="absolute left-0 top-full z-50 mt-1">
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
																					</div>
																				)}
																		</div>
																		<div className="relative inline-flex">
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
																					if (
																						sectionElement
																					) {
																						setDraggedHeight(
																							sectionElement.offsetHeight +
																								32,
																						); // mb-8 gap (32px)
																					}

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

																					if (
																						dragImage
																					) {
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
																				onDragEnd={(): void => {
																					setDraggedSectionId(
																						null,
																					);
																					setDragOverSectionId(
																						null,
																					);
																					setDraggedHeight(
																						0,
																					);
																				}}
																				className={`inline-flex h-5 w-5 cursor-grab items-center justify-center rounded-[5px] text-[#38383C] transition-opacity duration-150 hover:bg-[#202027] hover:text-[#F3F4F6] active:cursor-grabbing ${
																					openAddMenuSectionId ===
																						section.id ||
																					openOptionsMenuSectionId ===
																						section.id
																						? "opacity-100"
																						: "opacity-0 group-hover:opacity-100"
																				}`}
																			>
																				<GripVertical
																					size={
																						20
																					}
																					strokeWidth={
																						1.8
																					}
																				/>
																			</button>
																			{!format.focusMode &&
																				openOptionsMenuSectionId ===
																					section.id && (
																					<div className="absolute left-0 top-full z-50 mt-1">
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
																					</div>
																				)}
																		</div>
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
																			section={
																				section
																			}
																		/>
																		{getSectionOptions(
																			section.id,
																		)
																			.wordCount && (
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

															{renderSectionTextZone(
																section,
																getVisibleSectionLines(
																	section,
																),
																false,
															)}

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
																			size={
																				15
																			}
																			strokeWidth={
																				1.8
																			}
																		/>
																		Ajouter
																		une
																		ligne
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
																			size={
																				12
																			}
																			strokeWidth={
																				1.8
																			}
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
																			size={
																				12
																			}
																			strokeWidth={
																				1.8
																			}
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
																			size={
																				12
																			}
																			strokeWidth={
																				1.8
																			}
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
																			size={
																				12
																			}
																			strokeWidth={
																				1.8
																			}
																		/>
																	</button>
																</div>
															)}
														</>
													)}
												</div>
											</section>
										);
									},
								)}
							</div>
						)}
					</div>
				</main>
			</div>

			{shouldRenderInspectorTools && (
				<div className="pointer-events-none absolute right-2 top-[120px] bottom-[120px] z-[70] flex justify-end">
					<div className="pointer-events-auto flex min-h-0">
						<LyricsInspector
							lookupRequest={inspectorLookupRequest}
							onLookupTermChange={handleLookupTermChange}
							onVisibilityChange={setHasVisibleInspectorPanels}
						/>
					</div>
				</div>
			)}

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
					markers={[...trackMarkers, ...customTrackMarkers]}
					onCollapsedChange={setIsTrackPanelCollapsed}
					onCurrentTimeChange={handleTrackCurrentTimeChange}
					onDurationChange={(seconds: number): void => {
						if (Number.isFinite(seconds) && seconds > 0) {
							setTrackDurationSeconds(seconds);
						}
					}}
					onMarkerCreate={handleTrackMarkerCreate}
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
