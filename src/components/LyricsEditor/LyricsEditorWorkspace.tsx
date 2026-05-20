"use client";

import {
	AudioWaveform,
	Bot,
	CheckSquare,
	ChevronDown,
	ChevronRight,
	Copy,
	GripVertical,
	MessageSquare,
	MoreHorizontal,
	Plus,
	Save,
	SendHorizontal,
	Shuffle,
	Sparkles,
	Trash2,
	type LucideIcon,
} from "lucide-react";
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type ChangeEvent,
	type ClipboardEvent,
	type CSSProperties,
	type DragEvent,
	type KeyboardEvent,
	type MouseEvent,
	type ReactElement,
} from "react";
import type { LyricsFormat } from "@/components/LyricsEditor/LyricsHeader";

type SectionKind = "intro" | "couplet" | "refrain" | "pont";

type LyricLine = {
	id: string;
	number: number;
	text: string;
	comments: number;
};

type LyricSection = {
	id: string;
	kind: SectionKind;
	title: string;
	lines: LyricLine[];
};

type LyricsDocument = {
	id: string;
	title: string;
	sections: LyricSection[];
	updatedAt: string | null;
};

type EditorToggleKey = "rhymes" | "annotation" | "syllables";

type SectionOptionKey = EditorToggleKey | "wordCount";

type EditorToggle = {
	key: EditorToggleKey;
	label: string;
	enabled: boolean;
};

type SectionOptions = Record<SectionOptionKey, boolean>;

type InspectorField = {
	label: string;
	value: string;
};

type InspectorPanel = {
	id: string;
	title: string;
	icon: LucideIcon;
	fields: InspectorField[];
	chips: string[];
};

type RailTool = {
	id: string;
	label: string;
	icon: LucideIcon;
	active?: boolean;
};

type ChatTab = "chat" | "comments" | "inbox";

type ChatMessage = {
	id: string;
	author: string;
	body: string;
	time: string;
	align: "left" | "right";
};

type LineComment = {
	id: string;
	author: string;
	initial: string;
	body: string;
	time: string;
};

type LineCommentsById = Record<string, LineComment[]>;

type SyllableWordPart = {
	id: string;
	kind: "word";
	text: string;
	count: number;
};

type SyllableSpacePart = {
	id: string;
	kind: "space";
	text: string;
};

type SyllablePart = SyllableWordPart | SyllableSpacePart;

type SaveState = "idle" | "saved";

type LineDragState = {
	sectionId: string;
	lineId: string;
};

type LineDropPlacement = "before" | "after";

type LyricsEditorWorkspaceProps = {
	format: LyricsFormat;
};

type SectionKindPickerProps = {
	section: LyricSection;
	isOpen: boolean;
	onToggle: () => void;
	onClose: () => void;
	onSelect: (kind: SectionKind) => void;
};

const storageKey = "nara:lyrics-editor:my-way";
const commentsStorageKey = "nara:lyrics-editor:line-comments";
const sectionDragDataType = "application/x-nara-section";
const lineDragDataType = "application/x-nara-line";
const autoWrapGutterPx = 8;

let measureCanvas: HTMLCanvasElement | null = null;

const initialToggles: EditorToggle[] = [
	{ key: "rhymes", label: "Rimes", enabled: true },
	{ key: "annotation", label: "Annotation", enabled: true },
	{ key: "syllables", label: "Syllabes", enabled: true },
];

const defaultSectionOptions: SectionOptions = {
	rhymes: true,
	annotation: true,
	syllables: true,
	wordCount: true,
};

const sectionTypes: SectionKind[] = [
	"intro",
	"couplet",
	"refrain",
	"pont",
];

const sectionMenuToggleOrder: EditorToggleKey[] = [
	"rhymes",
	"syllables",
	"annotation",
];

const inspectorPanels: InspectorPanel[] = [
	{
		id: "rhymes",
		title: "Rimes",
		icon: AudioWaveform,
		fields: [
			{ label: "Mot", value: "Meilleur" },
			{ label: "Syllabes", value: "2" },
			{ label: "Category", value: "Adj." },
		],
		chips: ["Veilleur", "Chanteur", "Couleur"],
	},
	{
		id: "synonyms",
		title: "Synonymes",
		icon: Shuffle,
		fields: [{ label: "Mot", value: "ecrire" }],
		chips: ["Rediger", "Composer", "inscrire"],
	},
	{
		id: "antonyms",
		title: "Antonymes",
		icon: Shuffle,
		fields: [{ label: "Mot", value: "ecrire" }],
		chips: ["Annihiler", "annuler", "biffer"],
	},
	{
		id: "lexical",
		title: "Champs lexical",
		icon: Sparkles,
		fields: [{ label: "Theme", value: "La mer" }],
		chips: ["Vague", "Ocean", "Rivage"],
	},
];

const railTools: RailTool[] = [
	{ id: "wave", label: "Analyse vocale", icon: AudioWaveform, active: true },
	{ id: "shuffle", label: "Variantes", icon: Shuffle },
	{ id: "rhyme", label: "Rimes proches", icon: Sparkles },
	{ id: "lexical", label: "Champs lexical", icon: Bot },
];

const initialChatMessages: ChatMessage[] = [
	{
		id: "message-nilu",
		author: "Nilu",
		body: "Bonjour",
		time: "3:55 pm",
		align: "left",
	},
	{
		id: "message-soya",
		author: "Soya",
		body: "Sti",
		time: "3:55 pm",
		align: "right",
	},
];

function createInitialDocument(): LyricsDocument {
	return {
		id: "my-way",
		title: "My Way",
		updatedAt: null,
		sections: renumberDocument([
			{
				id: "intro",
				kind: "intro",
				title: "INTRO",
				lines: [
					{
						id: "intro-1",
						number: 1,
						text: "Sed ut perspiciatis unde omnis",
						comments: 2,
					},
					{
						id: "intro-2",
						number: 2,
						text: "Doloremque laudantium,",
						comments: 0,
					},
					{
						id: "intro-3",
						number: 3,
						text: "Iste natus error sit voluptatem accusantium",
						comments: 2,
					},
					{
						id: "intro-4",
						number: 4,
						text: "Totam rem aperiam, eaque ipsa veritatis",
						comments: 0,
					},
				],
			},
			{
				id: "couplet-1",
				kind: "couplet",
				title: "COUPLET 1",
				lines: [
					{
						id: "couplet-1-1",
						number: 5,
						text: "Sed ut perspiciatis unde omnis",
						comments: 0,
					},
					{
						id: "couplet-1-2",
						number: 6,
						text: "Doloremque laudantium,",
						comments: 0,
					},
					{
						id: "couplet-1-3",
						number: 7,
						text: "Iste natus error sit voluptatem accusantium",
						comments: 0,
					},
					{
						id: "couplet-1-4",
						number: 8,
						text: "Totam rem aperiam, eaque ipsa veritatis",
						comments: 0,
					},
				],
			},
			{
				id: "refrain",
				kind: "refrain",
				title: "REFRAIN",
				lines: [
					{
						id: "refrain-1",
						number: 9,
						text: "Sed ut perspiciatis unde omnis",
						comments: 0,
					},
					{
						id: "refrain-2",
						number: 10,
						text: "Doloremque laudantium,",
						comments: 0,
					},
					{
						id: "refrain-3",
						number: 11,
						text: "Iste natus error sit voluptatem accusantium",
						comments: 0,
					},
					{
						id: "refrain-4",
						number: 12,
						text: "Totam rem aperiam, eaque ipsa veritatis",
						comments: 0,
					},
				],
			},
		]),
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
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
		value === "intro" ||
		value === "couplet" ||
		value === "refrain" ||
		value === "pont"
	);
}

function isLyricLine(value: unknown): value is LyricLine {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.number === "number" &&
		typeof value.text === "string" &&
		typeof value.comments === "number"
	);
}

function isLyricSection(value: unknown): value is LyricSection {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		isSectionKind(value.kind) &&
		typeof value.title === "string" &&
		Array.isArray(value.lines) &&
		value.lines.every(isLyricLine)
	);
}

function isLyricsDocument(value: unknown): value is LyricsDocument {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.title === "string" &&
		(value.updatedAt === null || typeof value.updatedAt === "string") &&
		Array.isArray(value.sections) &&
		value.sections.every(isLyricSection)
	);
}

function parseStoredDocument(storedValue: string | null): LyricsDocument | null {
	if (!storedValue) {
		return null;
	}

	try {
		const parsedValue: unknown = JSON.parse(storedValue);
		return isLyricsDocument(parsedValue) ? parsedValue : null;
	} catch {
		return null;
	}
}

function parseStoredLineComments(storedValue: string | null): LineCommentsById | null {
	if (!storedValue) {
		return null;
	}

	try {
		const parsedValue: unknown = JSON.parse(storedValue);
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
		return window.localStorage ?? null;
	} catch {
		return null;
	}
}

function focusLineInputById(lineId: string): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	const nextInput: HTMLInputElement | null =
		window.document.querySelector<HTMLInputElement>(
			`input[data-line-id="${lineId}"]`,
		);

	if (!nextInput) {
		return false;
	}

	nextInput.focus();
	nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);

	return true;
}

function createId(prefix: string): string {
	return `${prefix}-${Date.now().toString(36)}-${Math.random()
		.toString(36)
		.slice(2, 7)}`;
}

function createBlankLine(prefix: string): LyricLine {
	return {
		id: createId(`${prefix}-line`),
		number: 0,
		text: "",
		comments: 0,
	};
}

function getMeasureContext(): CanvasRenderingContext2D | null {
	if (typeof window === "undefined") {
		return null;
	}

	measureCanvas ??= window.document.createElement("canvas");

	return measureCanvas.getContext("2d");
}

function getRenderedTextWidth(text: string, inputElement: HTMLInputElement): number {
	const context: CanvasRenderingContext2D | null = getMeasureContext();

	if (!context) {
		return text.length * 8;
	}

	const computedStyle: CSSStyleDeclaration =
		window.getComputedStyle(inputElement);
	context.font =
		computedStyle.font ||
		`${computedStyle.fontStyle} ${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;

	return context.measureText(text).width;
}

function findAutoWrapSplitIndex(
	value: string,
	inputElement: HTMLInputElement,
): number | null {
	const availableWidth: number = Math.max(
		40,
		inputElement.clientWidth - autoWrapGutterPx,
	);

	if (getRenderedTextWidth(value, inputElement) <= availableWidth) {
		return null;
	}

	let low = 1;
	let high = value.length - 1;
	let fitIndex = 1;

	while (low <= high) {
		const middle: number = Math.floor((low + high) / 2);
		const candidate: string = value.slice(0, middle);

		if (getRenderedTextWidth(candidate, inputElement) <= availableWidth) {
			fitIndex = middle;
			low = middle + 1;
		} else {
			high = middle - 1;
		}
	}

	const fittedText: string = value.slice(0, fitIndex);
	const whitespaceMatches: RegExpMatchArray | null = fittedText.match(/\s+/g);
	const lastWhitespace: string | undefined = whitespaceMatches?.at(-1);

	if (lastWhitespace) {
		const whitespaceIndex: number = fittedText.lastIndexOf(lastWhitespace);

		if (whitespaceIndex > 0) {
			return whitespaceIndex + lastWhitespace.length;
		}
	}

	return fitIndex > 0 && fitIndex < value.length ? fitIndex : null;
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
			id: `word-${index}-${part}`,
			kind: "word",
			text: part,
			count: countApproximateSyllables(part),
		};
	});
}

function createSectionDragImage(sectionElement: HTMLElement): HTMLElement {
	const dragImage: HTMLElement = sectionElement.cloneNode(true) as HTMLElement;
	const sourceInputs: NodeListOf<HTMLInputElement> =
		sectionElement.querySelectorAll("input");
	const clonedInputs: NodeListOf<HTMLInputElement> =
		dragImage.querySelectorAll("input");

	clonedInputs.forEach((input: HTMLInputElement, index: number): void => {
		input.value = sourceInputs[index]?.value ?? input.value;
		input.setAttribute("readonly", "true");
	});

	dragImage.style.position = "fixed";
	dragImage.style.top = "-10000px";
	dragImage.style.left = "0";
	dragImage.style.width = `${Math.min(sectionElement.offsetWidth, 560)}px`;
	dragImage.style.pointerEvents = "none";
	dragImage.style.border = "1px solid #3A3A42";
	dragImage.style.borderRadius = "10px";
	dragImage.style.background = "#17171C";
	dragImage.style.boxShadow = "0 16px 34px rgba(0, 0, 0, 0.35)";
	dragImage.style.padding = "10px 12px";
	dragImage.style.opacity = "0.92";

	window.document.body.appendChild(dragImage);

	return dragImage;
}

function createLineDragImage(lineElement: HTMLElement): HTMLElement {
	const dragImage: HTMLElement = lineElement.cloneNode(true) as HTMLElement;
	const sourceInput: HTMLInputElement | null =
		lineElement.querySelector<HTMLInputElement>("input");
	const clonedInput: HTMLInputElement | null =
		dragImage.querySelector<HTMLInputElement>("input");

	if (sourceInput && clonedInput) {
		clonedInput.value = sourceInput.value;
		clonedInput.setAttribute("readonly", "true");
	}

	dragImage.style.position = "fixed";
	dragImage.style.top = "-10000px";
	dragImage.style.left = "0";
	dragImage.style.width = `${Math.min(lineElement.offsetWidth, 520)}px`;
	dragImage.style.pointerEvents = "none";
	dragImage.style.border = "1px solid #3A3A42";
	dragImage.style.borderRadius = "8px";
	dragImage.style.background = "#17171C";
	dragImage.style.boxShadow = "0 14px 30px rgba(0, 0, 0, 0.32)";
	dragImage.style.padding = "6px 8px";
	dragImage.style.opacity = "0.94";

	window.document.body.appendChild(dragImage);

	return dragImage;
}

function isLineDragState(value: unknown): value is LineDragState {
	return (
		isRecord(value) &&
		typeof value.sectionId === "string" &&
		typeof value.lineId === "string"
	);
}

function parseLineDragState(value: string): LineDragState | null {
	if (!value) {
		return null;
	}

	try {
		const parsedValue: unknown = JSON.parse(value);
		return isLineDragState(parsedValue) ? parsedValue : null;
	} catch {
		return null;
	}
}

function eventHasDataType(event: DragEvent<HTMLElement>, dataType: string): boolean {
	return Array.from(event.dataTransfer.types).includes(dataType);
}

function countWordsFromText(text: string): number {
	const trimmedText: string = text.trim();

	if (!trimmedText) {
		return 0;
	}

	return trimmedText.split(/\s+/).length;
}

function countSectionWords(section: LyricSection): number {
	return section.lines.reduce(
		(total: number, line: LyricLine): number =>
			total + countWordsFromText(line.text),
		0,
	);
}

function countDocumentWords(document: LyricsDocument): number {
	return document.sections.reduce(
		(total: number, section: LyricSection): number =>
			total + countSectionWords(section),
		0,
	);
}

function renumberDocument(sections: LyricSection[]): LyricSection[] {
	// 1. Renommer les lignes séquentiellement
	let nextNumber = 1;
	const lineRenumbered = sections.map(
		(section: LyricSection): LyricSection => ({
			...section,
			lines: section.lines.map(
				(line: LyricLine): LyricLine => ({
					...line,
					number: nextNumber++,
				}),
			),
		}),
	);

	// 2. Recalculer les titres des sections selon leur type
	const counts: Record<SectionKind, number> = {
		intro: 0,
		couplet: 0,
		refrain: 0,
		pont: 0,
	};
	lineRenumbered.forEach((s) => {
		counts[s.kind] = (counts[s.kind] || 0) + 1;
	});

	const trackers: Record<SectionKind, number> = {
		intro: 0,
		couplet: 0,
		refrain: 0,
		pont: 0,
	};

	return lineRenumbered.map((section: LyricSection): LyricSection => {
		trackers[section.kind]++;
		const index = trackers[section.kind];
		const total = counts[section.kind];

		const numberedTitle: Record<SectionKind, string> = {
			intro: total > 1 ? `INTRO ${index}` : "INTRO",
			couplet: total > 1 ? `COUPLET ${index}` : "COUPLET",
			refrain: total > 1 ? `REFRAIN ${index}` : "REFRAIN",
			pont: total > 1 ? `PONT ${index}` : "PONT",
		};

		return {
			...section,
			title: numberedTitle[section.kind],
		};
	});
}

function getSectionLabel(kind: SectionKind): string {
	const labels: Record<SectionKind, string> = {
		intro: "Intro",
		couplet: "Couplet",
		refrain: "Refrain",
		pont: "Pont",
	};

	return labels[kind];
}

function createSection(kind: SectionKind, index: number): LyricSection {
	const numberedTitle: Record<SectionKind, string> = {
		intro: index > 1 ? `INTRO ${index}` : "INTRO",
		couplet: `COUPLET ${index}`,
		refrain: index > 1 ? `REFRAIN ${index}` : "REFRAIN",
		pont: index > 1 ? `PONT ${index}` : "PONT",
	};

	return {
		id: createId(kind),
		kind,
		title: numberedTitle[kind],
		lines: [createBlankLine(kind)],
	};
}

function reorderSections(
	sections: LyricSection[],
	sourceId: string,
	targetId: string,
): LyricSection[] {
	const sourceIndex: number = sections.findIndex(
		(section: LyricSection): boolean => section.id === sourceId,
	);
	const targetIndex: number = sections.findIndex(
		(section: LyricSection): boolean => section.id === targetId,
	);

	if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
		return sections;
	}

	const nextSections: LyricSection[] = [...sections];
	const [movedSection]: LyricSection[] = nextSections.splice(sourceIndex, 1);
	nextSections.splice(targetIndex, 0, movedSection);

	return renumberDocument(nextSections);
}

function moveLineBetweenSections(
	sections: LyricSection[],
	source: LineDragState,
	targetSectionId: string,
	targetLineId: string | null,
	placement: LineDropPlacement,
): LyricSection[] {
	if (source.sectionId === targetSectionId && source.lineId === targetLineId) {
		return sections;
	}

	const sourceSection: LyricSection | undefined = sections.find(
		(section: LyricSection): boolean => section.id === source.sectionId,
	);
	const targetExists: boolean = sections.some(
		(section: LyricSection): boolean => section.id === targetSectionId,
	);
	const movedLine: LyricLine | undefined = sourceSection?.lines.find(
		(line: LyricLine): boolean => line.id === source.lineId,
	);

	if (!sourceSection || !targetExists || !movedLine) {
		return sections;
	}

	const sectionsWithoutMovedLine: LyricSection[] = sections.map(
		(section: LyricSection): LyricSection => {
			if (section.id !== source.sectionId) {
				return section;
			}

			const nextLines: LyricLine[] = section.lines.filter(
				(line: LyricLine): boolean => line.id !== source.lineId,
			);
			const shouldKeepEmptySourceEditable: boolean =
				nextLines.length === 0 && targetSectionId !== source.sectionId;

			return {
				...section,
				lines: shouldKeepEmptySourceEditable
					? [createBlankLine(section.id)]
					: nextLines,
			};
		},
	);

	const nextSections: LyricSection[] = sectionsWithoutMovedLine.map(
		(section: LyricSection): LyricSection => {
			if (section.id !== targetSectionId) {
				return section;
			}

			const targetLines: LyricLine[] = [...section.lines];
			const targetIndex: number =
				targetLineId === null
					? targetLines.length
					: targetLines.findIndex(
							(line: LyricLine): boolean => line.id === targetLineId,
						);
			const insertIndex: number =
				targetIndex === -1 || targetLineId === null
					? targetLines.length
					: targetIndex + (placement === "after" ? 1 : 0);

			targetLines.splice(insertIndex, 0, movedLine);

			return {
				...section,
				lines: targetLines,
			};
		},
	);

	return renumberDocument(nextSections);
}

function getLineStyle(format: LyricsFormat): CSSProperties {
	const textDecoration: string[] = [];
	const numericFontSize: number = Number.parseInt(format.fontSize, 10);
	const scaledFontSize: number = Number.isFinite(numericFontSize)
		? Math.max(12, numericFontSize)
		: 16;

	if (format.underline) {
		textDecoration.push("underline");
	}

	if (format.strike) {
		textDecoration.push("line-through");
	}

	return {
		fontFamily:
			format.fontFamily === "Arimo" ? "var(--font-arimo)" : format.fontFamily,
		fontSize: `${scaledFontSize}px`,
		fontStyle: format.italic ? "italic" : "normal",
		fontWeight: format.bold ? 700 : 600,
		lineHeight:
			format.blockSize === "small"
				? 1.2
				: format.blockSize === "normal"
					? 1.35
					: 1.5,
		textAlign: format.align,
		textDecoration: textDecoration.length > 0 ? textDecoration.join(" ") : "none",
	};
}

function getSyllableMeasureStyle(format: LyricsFormat): CSSProperties {
	const numericFontSize: number = Number.parseInt(format.fontSize, 10);
	const measureHeight: number = Number.isFinite(numericFontSize)
		? Math.max(11, Math.min(18, numericFontSize * 0.62))
		: 11;

	return {
		...getLineStyle(format),
		height: `${measureHeight}px`,
		lineHeight: 1,
		overflow: "visible",
		whiteSpace: "pre",
		userSelect: "none",
	};
}

function getSyllableNumberStyle(format: LyricsFormat): CSSProperties {
	const numericFontSize: number = Number.parseInt(format.fontSize, 10);
	const syllableFontSize: number = Number.isFinite(numericFontSize)
		? Math.max(8, Math.min(12, numericFontSize * 0.48))
		: 9;

	return {
		fontFamily:
			format.fontFamily === "Arimo" ? "var(--font-arimo)" : format.fontFamily,
		fontSize: `${syllableFontSize}px`,
		fontStyle: "normal",
		fontWeight: 600,
		lineHeight: 1,
		userSelect: "none",
	};
}

const initialLineComments: LineComment[] = [
	{
		id: "lc-1",
		author: "Nilu",
		initial: "N",
		body: "Se serait pas mieux meris a la place de omnis ?",
		time: "3min",
	},
	{
		id: "lc-2",
		author: "Soya",
		initial: "S",
		body: "Moi je suis pour.",
		time: "2min",
	},
];

const initialLineCommentsById: LineCommentsById = {
	"intro-1": initialLineComments,
	"intro-3": initialLineComments.map(
		(comment: LineComment): LineComment => ({
			...comment,
			id: `${comment.id}-intro-3`,
		}),
	),
};

function LineCommentOverlay({
	lineNumber,
	comments,
	onAddComment,
	onClose,
}: {
	lineNumber: number;
	comments: LineComment[];
	onAddComment: (body: string) => void;
	onClose: () => void;
}): ReactElement {
	const [draft, setDraft] = useState<string>("");

	function handleSubmit(): void {
		const nextBody: string = draft.trim();

		if (nextBody.length === 0) {
			return;
		}

		onAddComment(nextBody);
		setDraft("");
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
		if (event.key === "Enter") {
			event.preventDefault();
			handleSubmit();
		}
		if (event.key === "Escape") {
			onClose();
		}
	}

	return (
		<>
			{/* Backdrop transparent pour fermer au clic extérieur */}
			<div
				aria-hidden="true"
				className="fixed inset-0 z-40"
				onClick={onClose}
			/>
			{/* Panneau flottant */}
			<div
				role="dialog"
				aria-label={`Commentaires sur la ligne ${lineNumber}`}
				className="absolute right-0 top-7 z-50 w-[494px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[18px] border border-[#666670] bg-[#2B2B31] px-4 py-4 shadow-[0_14px_28px_rgba(0,0,0,0.22)]"
			>
				{/* Liste des commentaires */}
				<div className="space-y-3">
					{comments.map(
						(comment: LineComment): ReactElement => (
							<div
								key={comment.id}
								className="min-h-[76px] rounded-[8px] border border-[#5A5A63] bg-[#2B2B31] px-3 py-2.5"
							>
								<div className="flex items-start gap-2.5">
									<span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#72727B] bg-transparent text-[11px] font-medium text-[#CFCFD6]">
										{comment.initial}
									</span>
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-3">
											<span className="text-[14px] font-semibold leading-6 text-[#F3F4F6]">
												{comment.author}
											</span>
											<span className="text-[11px] font-medium text-[#8C8C96]">
												{comment.time}
											</span>
										</div>
										<p className="mt-2 max-w-[270px] text-[10px] leading-[1.35] text-[#D6D6DD]">
											{comment.body}
										</p>
									</div>
								</div>
							</div>
						),
					)}
				</div>

				{/* Champ de saisie */}
				<div className="mt-16">
					<label className="flex h-[34px] items-center gap-3 rounded-[7px] border border-[#666670] bg-transparent px-2.5 transition-colors focus-within:border-[#8A8A94]">
						<span className="sr-only">Ecrire un message</span>
						<input
							autoFocus
							value={draft}
							placeholder="Ecrire un message"
							onChange={(e: ChangeEvent<HTMLInputElement>): void => setDraft(e.target.value)}
							onKeyDown={handleKeyDown}
							className="min-w-0 flex-1 bg-transparent text-[13px] text-[#F3F4F6] outline-none placeholder:text-[#B8B8C0]"
						/>
						<button
							type="button"
							aria-label="Envoyer"
							onClick={handleSubmit}
							className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-[#8F8F98] transition-colors hover:bg-[#33333A] hover:text-[#F3F4F6] disabled:pointer-events-none disabled:text-[#666670]"
							disabled={draft.trim().length === 0}
						>
							<SendHorizontal size={20} strokeWidth={1.5} />
						</button>
					</label>
				</div>
			</div>
		</>
	);
}


function SwitchTrack({
	enabled,
}: {
	enabled: boolean;
}): ReactElement {
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
			onClick={() => onToggle(toggle.key)}
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
				{sectionTypes.map(
					(kind: SectionKind): ReactElement => (
						<button
							key={kind}
							type="button"
							onClick={() => onAddSection(kind)}
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
	onDuplicate,
	onDelete,
	onValidate,
}: {
	options: SectionOptions;
	onToggleOption: (key: SectionOptionKey) => void;
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
									onToggle={() => onToggleOption(key)}
								/>
							);
						},
					)}
					<MenuToggle
						label="Nombres de mots"
						enabled={options.wordCount}
						onToggle={() => onToggleOption("wordCount")}
					/>
				</div>

				<div className="my-3 h-px bg-[#666670]" />

				<div className="grid gap-2 text-[12px] text-[#F3F4F6]">
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
					<button type="button" className="text-left transition-colors hover:text-white">
						Global Comment
					</button>
					<button type="button" className="text-left transition-colors hover:text-white">
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
								(currentValue: boolean): boolean => !currentValue,
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
						<span className="font-semibold text-[#A1A1AA]">17hours</span>
					</div>
					<div className="mt-4 text-[13px] text-[#F3F4F6]">
						Derniere modification
					</div>
					<div className="mt-3 flex items-center justify-between text-[13px]">
						<span className="flex items-center gap-2 text-[#F3F4F6]">
							<span className="h-2 w-2 rounded-full bg-white" />
							Maya
						</span>
						<span className="font-semibold text-[#A1A1AA]">2hours</span>
					</div>
				</div>
			)}
		</div>
	);
}

function SectionKindPicker({
	section,
	isOpen,
	onToggle,
	onClose,
	onSelect,
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
					<span className="text-[20px] font-semibold uppercase leading-none">
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
					{sectionTypes.map(
						(kind: SectionKind): ReactElement => {
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

function LyricSectionBlock({
	section,
	isLast,
	isDragging,
	format,
	lineNumberColumnWidth,
	globalToggles,
	sectionOptions,
	isAddMenuOpen,
	isOptionsMenuOpen,
	onToggleAddMenu,
	onToggleOptionsMenu,
	onAddSection,
	onAddLine,
	onInsertLineAfter,
	onLineChange,
	onLineAutoWrap,
	onToggleSectionOption,
	onDuplicate,
	onDelete,
	onValidate,
	onDragStart,
	onDragEnd,
	onDrop,
	draggedLine,
	onLineDelete,
	onLineDragStart,
	onLineDragEnd,
	onLineDrop,
	selectedLineIds,
	lineCommentsById,
	onLineSelect,
	onClearSelection,
	onLinePaste,
	onAddLineComment,
	onSectionKindChange,
}: {
	section: LyricSection;
	isLast: boolean;
	isDragging: boolean;
	format: LyricsFormat;
	lineNumberColumnWidth: number;
	globalToggles: EditorToggle[];
	sectionOptions: SectionOptions;
	isAddMenuOpen: boolean;
	isOptionsMenuOpen: boolean;
	onToggleAddMenu: (sectionId: string) => void;
	onToggleOptionsMenu: (sectionId: string) => void;
	onAddSection: (sectionId: string, kind: SectionKind) => void;
	onAddLine: (sectionId: string) => void;
	onInsertLineAfter: (sectionId: string, lineId: string) => void;
	onLineChange: (sectionId: string, lineId: string, value: string) => void;
	onLineAutoWrap: (
		sectionId: string,
		lineId: string,
		currentText: string,
		overflowText: string,
	) => void;
	onToggleSectionOption: (sectionId: string, key: SectionOptionKey) => void;
	onDuplicate: (sectionId: string) => void;
	onDelete: (sectionId: string) => void;
	onValidate: (sectionId: string) => void;
	onDragStart: (event: DragEvent<HTMLButtonElement>, sectionId: string) => void;
	onDragEnd: () => void;
	onDrop: (event: DragEvent<HTMLElement>, sectionId: string) => void;
	draggedLine: LineDragState | null;
	onLineDelete: (sectionId: string, lineId: string) => void;
	onLineDragStart: (
		event: DragEvent<HTMLButtonElement>,
		sectionId: string,
		lineId: string,
	) => void;
	onLineDragEnd: () => void;
	onLineDrop: (
		event: DragEvent<HTMLElement>,
		targetSectionId: string,
		targetLineId: string | null,
		placement: LineDropPlacement,
	) => void;
	selectedLineIds: Set<string>;
	lineCommentsById: LineCommentsById;
	onLineSelect: (lineId: string, shiftKey: boolean) => void;
	onClearSelection: () => void;
	onLinePaste: (sectionId: string, lineId: string, lines: string[]) => void;
	onAddLineComment: (lineId: string, body: string) => void;
	onSectionKindChange: (sectionId: string, newKind: SectionKind) => void;
}): ReactElement {
	const [openCommentLineId, setOpenCommentLineId] = useState<string | null>(null);
	const [isKindMenuOpen, setIsKindMenuOpen] = useState<boolean>(false);
	const lineStyle: CSSProperties = getLineStyle(format);
	const syllableMeasureStyle: CSSProperties = getSyllableMeasureStyle(format);
	const syllableNumberStyle: CSSProperties = getSyllableNumberStyle(format);
	const lineGridStyle: CSSProperties = {
		gridTemplateColumns: `${lineNumberColumnWidth}px minmax(0,1fr) 34px`,
	};
	const wordCount: number = countSectionWords(section);
	const showSyllables: boolean = sectionOptions.syllables && globalToggles.some(
		(toggle: EditorToggle): boolean =>
			toggle.key === "syllables" && toggle.enabled,
	);
	const showAnnotations: boolean =
		sectionOptions.annotation &&
		globalToggles.some(
			(toggle: EditorToggle): boolean =>
				toggle.key === "annotation" && toggle.enabled,
		);

	function handleDragOver(event: DragEvent<HTMLElement>): void {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}

	function handleLineDragOver(event: DragEvent<HTMLElement>): void {
		if (!eventHasDataType(event, lineDragDataType) && !draggedLine) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer.dropEffect = "move";
	}

	return (
		<section
			data-lyrics-section="true"
			className={`relative transition-opacity ${isLast ? "pb-3" : "pb-9"} ${
				isDragging ? "opacity-70" : "opacity-100"
			}`}
			onDragOver={handleDragOver}
			onDrop={(event: DragEvent<HTMLElement>): void => {
				if (eventHasDataType(event, lineDragDataType)) {
					return;
				}

				onDrop(event, section.id);
			}}
		>
			{isAddMenuOpen && (
				<SectionAddMenu
					onAddSection={(kind: SectionKind): void => {
						onAddSection(section.id, kind);
					}}
					onAddLine={() => onAddLine(section.id)}
				/>
			)}

			{isOptionsMenuOpen && (
				<SectionOptionsMenu
					options={sectionOptions}
					onToggleOption={(key: SectionOptionKey): void => {
						onToggleSectionOption(section.id, key);
					}}
					onDuplicate={() => onDuplicate(section.id)}
					onDelete={() => onDelete(section.id)}
					onValidate={() => onValidate(section.id)}
				/>
			)}

			<div className="flex items-center gap-2">
				<button
					type="button"
					aria-expanded={isAddMenuOpen}
					aria-label={`Ouvrir le menu d'ajout pour ${section.title}`}
					onClick={() => onToggleAddMenu(section.id)}
					className="inline-flex h-5 w-5 items-center justify-center rounded-[3px] text-[#38383C] transition-colors hover:bg-[#222228] hover:text-[#F3F4F6]"
				>
					<Plus size={20} strokeWidth={1.7} />
				</button>
				<button
					type="button"
					draggable
					aria-expanded={isOptionsMenuOpen}
					aria-label={`Options et deplacement de ${section.title}`}
					onClick={() => onToggleOptionsMenu(section.id)}
					onDragStart={(event: DragEvent<HTMLButtonElement>): void => {
						onDragStart(event, section.id);
					}}
					onDragEnd={onDragEnd}
					className="inline-flex h-5 w-5 cursor-grab items-center justify-center rounded-[3px] text-[#38383C] transition-colors active:cursor-grabbing hover:bg-[#222228] hover:text-[#F3F4F6]"
				>
					<GripVertical size={20} strokeWidth={1.7} />
				</button>
				<span className="h-2 w-2 shrink-0 rounded-full bg-[#DA069A]" />
				<SectionKindPicker
					section={section}
					isOpen={isKindMenuOpen}
					onToggle={(): void => {
						setIsKindMenuOpen((currentValue: boolean): boolean => !currentValue);
					}}
					onClose={(): void => {
						setIsKindMenuOpen(false);
					}}
					onSelect={(kind: SectionKind): void => {
						onSectionKindChange(section.id, kind);
					}}
				/>
				{sectionOptions.wordCount && (
					<span className="text-[13px] font-medium leading-none text-[#38383C]">
						{wordCount} mots
					</span>
				)}
			</div>

			<div className="ml-[58px] mt-2 border-l-2 border-[#38383C] px-4 py-2">
				<div
					className="space-y-2"
					onDragOver={handleLineDragOver}
					onDrop={(event: DragEvent<HTMLElement>): void => {
						if (!eventHasDataType(event, lineDragDataType) && !draggedLine) {
							return;
						}

						onLineDrop(event, section.id, null, "after");
					}}
				>
					{section.lines.map(
						(line: LyricLine): ReactElement => {
							const lineComments: LineComment[] = lineCommentsById[line.id] ?? [];
							const lineCommentCount: number = Math.max(
								line.comments,
								lineComments.length,
							);

							return (
							<div
								key={line.id}
								data-lyrics-line="true"
								className={`group/line grid min-h-[28px] items-center gap-3 rounded-[4px] transition-all ${
									draggedLine?.lineId === line.id ? "opacity-45" : "opacity-100"
								} ${
									selectedLineIds.has(line.id)
										? "bg-[#2C2C48] ring-1 ring-[#6060AA]/40"
										: ""
								}`}
								style={lineGridStyle}
								onDragOver={handleLineDragOver}
								onDrop={(event: DragEvent<HTMLElement>): void => {
									if (!eventHasDataType(event, lineDragDataType) && !draggedLine) {
										return;
									}

									const targetRect: DOMRect =
										event.currentTarget.getBoundingClientRect();
									const placement: LineDropPlacement =
										event.clientY > targetRect.top + targetRect.height / 2
											? "after"
											: "before";

									onLineDrop(event, section.id, line.id, placement);
								}}
							>
								<button
									type="button"
									draggable
									aria-label={`Ligne ${line.number} — cliquer pour sélectionner, glisser pour déplacer`}
									onClick={(e: MouseEvent<HTMLButtonElement>): void => {
										e.preventDefault();
										onLineSelect(line.id, e.shiftKey);
									}}
									onDragStart={(event: DragEvent<HTMLButtonElement>): void => {
										onLineDragStart(event, section.id, line.id);
									}}
									onDragEnd={onLineDragEnd}
									className={`inline-flex h-6 w-full cursor-grab items-center justify-end rounded-[3px] pr-0.5 text-right text-[16px] font-medium leading-none tabular-nums transition-colors hover:bg-[#222228] hover:text-white active:cursor-grabbing select-none ${
										selectedLineIds.has(line.id) ? "text-white" : "text-[#F3F4F6]"
									}`}
								>
									{line.number}
								</button>
								<div className="relative min-w-0 select-none">
									{showSyllables && line.text.trim().length > 0 && (
										<div
											data-syllable-row="true"
											className="pointer-events-none absolute bottom-full left-0 right-0 text-transparent select-none"
											style={syllableMeasureStyle}
										>
											{getSyllableParts(line.text).map(
												(part: SyllablePart): ReactElement =>
													part.kind === "space" ? (
														<span
															key={part.id}
															aria-hidden="true"
															className="whitespace-pre select-none"
														>
															{part.text}
														</span>
													) : (
														<span
															key={part.id}
															className="relative inline-block whitespace-pre text-transparent select-none"
														>
															<span
																aria-hidden="true"
																className="absolute inset-x-0 top-0 text-center text-[#A1A1AA] select-none"
																style={syllableNumberStyle}
															>
																{part.count}
															</span>
															{part.text}
														</span>
													),
											)}
										</div>
									)}
									<input
										data-line-id={line.id}
										value={line.text}
										spellCheck={false}
										onFocus={onClearSelection}
										onPaste={(event: ClipboardEvent<HTMLInputElement>): void => {
											const raw: string = event.clipboardData.getData("text/plain");
											const parts: string[] = raw
												.split(/\r?\n/)
												.map((l: string) => l.trimEnd())
												.filter((l: string) => l.length > 0);
											if (parts.length <= 1) return; // comportement natif pour texte simple
											event.preventDefault();
											onLinePaste(section.id, line.id, parts);
										}}
										onChange={(event: ChangeEvent<HTMLInputElement>): void => {
											const inputElement: HTMLInputElement = event.currentTarget;
											const nextValue: string = inputElement.value;
											const isTypingAtEnd: boolean =
												(inputElement.selectionStart ?? nextValue.length) ===
													nextValue.length &&
												(inputElement.selectionEnd ?? nextValue.length) ===
													nextValue.length;
											const isGrowing: boolean = nextValue.length > line.text.length;

											if (isTypingAtEnd && isGrowing) {
												const splitIndex: number | null =
													findAutoWrapSplitIndex(nextValue, inputElement);

												if (splitIndex !== null) {
													const currentText: string = nextValue
														.slice(0, splitIndex)
														.trimEnd();
													const overflowText: string = nextValue
														.slice(splitIndex)
														.trimStart();

													if (currentText && overflowText) {
														onLineAutoWrap(
															section.id,
															line.id,
															currentText,
															overflowText,
														);
														return;
													}
												}
											}

											onLineChange(section.id, line.id, nextValue);
										}}
										onKeyDown={(event: KeyboardEvent<HTMLInputElement>): void => {
											if (event.key === "Enter") {
												event.preventDefault();
												onInsertLineAfter(section.id, line.id);
												return;
											}

											if (event.key === "ArrowDown" || event.key === "ArrowUp") {
												if (typeof window === "undefined") return;
												const allInputs = Array.from(
													window.document.querySelectorAll<HTMLInputElement>(
														"input[data-line-id]",
													),
												);
												const currentIndex = allInputs.findIndex(
													(el) => el.dataset.lineId === line.id,
												);
												if (currentIndex === -1) return;

												const targetIndex =
													event.key === "ArrowDown"
														? currentIndex + 1
														: currentIndex - 1;
												const targetInput = allInputs[targetIndex];
												if (!targetInput) return;

												event.preventDefault();
												targetInput.focus();
												const pos =
													event.key === "ArrowDown"
														? 0
														: targetInput.value.length;
												targetInput.setSelectionRange(pos, pos);
												return;
											}

											if (
												event.key === "Backspace" &&
												event.currentTarget.selectionStart === 0 &&
												event.currentTarget.selectionEnd === 0 &&
												line.text.length === 0
											) {
												event.preventDefault();
												onLineDelete(section.id, line.id);
											}
										}}
										className="min-h-[24px] w-full bg-transparent text-[#F3F4F6] outline-none transition-colors placeholder:text-[#38383C] focus-visible:text-white"
										style={lineStyle}
										placeholder="Ecrire une ligne"
									/>
								</div>
								<div className="relative flex justify-end select-none">
									{showAnnotations ? (
										<button
											type="button"
											aria-label={
												lineCommentCount > 0
													? `${lineCommentCount} commentaires sur la ligne ${line.number}`
													: `Ajouter un commentaire sur la ligne ${line.number}`
											}
											aria-expanded={openCommentLineId === line.id}
											onClick={() => setOpenCommentLineId(
												openCommentLineId === line.id ? null : line.id
											)}
											className={`grid h-5 w-[34px] grid-cols-[14px_12px] items-center justify-end gap-1 rounded-[3px] text-[11px] transition-[color,opacity,background-color] hover:bg-[#222228] hover:text-white select-none ${
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
												className="justify-self-end"
											/>
											<span
												className={`justify-self-start tabular-nums ${
													lineCommentCount > 0 ? "opacity-100" : "opacity-0"
												}`}
												aria-hidden={lineCommentCount === 0}
											>
												{lineCommentCount > 0 ? lineCommentCount : 0}
											</span>
										</button>
									) : (
										<span aria-hidden="true" />
									)}
									{openCommentLineId === line.id && (
										<LineCommentOverlay
											lineNumber={line.number}
											comments={lineComments}
											onAddComment={(body: string): void => {
												onAddLineComment(line.id, body);
											}}
											onClose={() => setOpenCommentLineId(null)}
										/>
									)}
								</div>
							</div>
							);
						},
					)}
				</div>
			</div>
		</section>
	);
}

function InspectorPanelCard({ panel }: { panel: InspectorPanel }): ReactElement {
	const Icon: LucideIcon = panel.icon;

	return (
		<section className="border-b border-[#2C2C32] p-2.5">
			<div className="mb-2 flex items-center gap-2">
				<Icon size={13} strokeWidth={1.8} className="text-[#F3F4F6]" />
				<h3 className="text-[12px] font-bold text-[#F3F4F6]">{panel.title}</h3>
			</div>

			<div
				className={`grid gap-1.5 ${
					panel.fields.length > 1 ? "grid-cols-[1fr_55px_58px]" : "grid-cols-1"
				}`}
			>
				{panel.fields.map(
					(field: InspectorField): ReactElement => (
						<label key={`${panel.id}-${field.label}`} className="grid gap-1">
							<span className="text-[10px] font-medium text-[#F3F4F6]">
								{field.label}
							</span>
							<input
								readOnly
								value={field.value}
								className="h-5 rounded-[2px] border border-[#A1A1AA] bg-transparent px-2 text-[9px] text-[#F3F4F6] outline-none"
							/>
						</label>
					),
				)}
			</div>

			<div className="mt-2 flex items-center gap-1.5">
				{panel.chips.map(
					(chip: string): ReactElement => (
						<button
							key={`${panel.id}-${chip}`}
							type="button"
							className="h-5 rounded-[2px] bg-[#2C2C32] px-2 text-[9px] font-medium text-[#F3F4F6] transition-colors hover:bg-[#3A3A42]"
						>
							{chip}
						</button>
					),
				)}
				<button
					type="button"
					aria-label={`Plus d'options pour ${panel.title}`}
					className="ml-auto inline-flex h-5 w-6 items-center justify-center rounded-[2px] bg-[#2C2C32] text-[#F3F4F6] transition-colors hover:bg-[#3A3A42]"
				>
					<MoreHorizontal size={12} strokeWidth={1.8} />
				</button>
			</div>

			<button
				type="button"
				className="mt-2 flex w-full items-center justify-end gap-1 text-[9px] font-medium text-[#F3F4F6] transition-colors hover:text-white"
			>
				Voir plus
				<ChevronRight size={10} strokeWidth={1.8} />
			</button>
		</section>
	);
}

function UtilityRail(): ReactElement {
	return (
		<nav className="flex w-9 shrink-0 flex-col items-center gap-2 border-l border-[#2C2C32] pt-3">
			{railTools.map(
				(tool: RailTool): ReactElement => {
					const Icon: LucideIcon = tool.icon;

					return (
						<button
							key={tool.id}
							type="button"
							aria-label={tool.label}
							aria-pressed={tool.active ?? false}
							className={`inline-flex h-7 w-7 items-center justify-center rounded-[5px] border text-[#A1A1AA] transition-colors hover:text-white ${
								tool.active
									? "border-[#3A3A42] bg-[#2C2C32] text-[#F3F4F6]"
									: "border-transparent bg-[#17171C]"
							}`}
						>
							<Icon size={15} strokeWidth={1.8} />
						</button>
					);
				},
			)}
		</nav>
	);
}

function DiscussionPanel(): ReactElement {
	const [activeTab, setActiveTab] = useState<ChatTab>("chat");
	const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
	const [draftMessage, setDraftMessage] = useState<string>("");

	const tabs: { id: ChatTab; label: string }[] = [
		{ id: "chat", label: "Chat" },
		{ id: "comments", label: "Commentaires" },
		{ id: "inbox", label: "Inbox" },
	];

	function sendMessage(): void {
		const trimmedMessage: string = draftMessage.trim();

		if (!trimmedMessage) {
			return;
		}

		setMessages(
			(currentMessages: ChatMessage[]): ChatMessage[] => [
				...currentMessages,
				{
					id: createId("message"),
					author: "Soya",
					body: trimmedMessage,
					time: "maintenant",
					align: "right",
				},
			],
		);
		setDraftMessage("");
	}

	function handleMessageKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
		if (event.key === "Enter") {
			event.preventDefault();
			sendMessage();
		}
	}

	return (
		<section className="border-t border-[#2C2C32] bg-[#17171C]">
			<div className="px-2.5 pt-2">
				<h3 className="text-[12px] font-bold text-[#F3F4F6]">
					Commentaire & discussion
				</h3>
				<div className="mt-2 flex items-center gap-4 border-b border-[#2C2C32]">
					{tabs.map(
						(tab: { id: ChatTab; label: string }): ReactElement => (
							<button
								key={tab.id}
								type="button"
								aria-pressed={activeTab === tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`pb-1.5 text-[10px] font-medium transition-colors ${
									activeTab === tab.id
										? "border-b border-[#F3F4F6] text-[#F3F4F6]"
										: "text-[#A1A1AA] hover:text-white"
								}`}
							>
								{tab.label}
							</button>
						),
					)}
				</div>
			</div>

			<div className="flex h-[130px] flex-col justify-between px-2.5 py-2">
				<div className="space-y-2 overflow-y-auto pr-1">
					{messages.map(
						(message: ChatMessage): ReactElement => (
							<div
								key={message.id}
								className={`flex ${message.align === "right" ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-[78%] ${
										message.align === "right"
											? "text-right"
											: "grid grid-cols-[22px_minmax(0,1fr)] gap-2"
									}`}
								>
									{message.align === "left" && (
										<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#D80096] text-[8px] font-bold text-white">
											NL
										</span>
									)}
									<div>
										<div className="flex items-center gap-2 text-[9px] text-[#A1A1AA]">
											<span className="font-bold text-[#F3F4F6]">
												{message.author}
											</span>
											<span>{message.time}</span>
										</div>
										<p className="mt-1 rounded-[4px] bg-[#2C2C32] px-3 py-1.5 text-[10px] text-[#F3F4F6]">
											{message.body}
										</p>
									</div>
								</div>
							</div>
						),
					)}
				</div>

				<label className="mt-2 flex h-6 items-center gap-2 bg-[#2C2C32] px-2">
					<span className="sr-only">Ecrire un message</span>
					<input
						value={draftMessage}
						placeholder="Ecrire un message"
						onChange={(event: ChangeEvent<HTMLInputElement>): void => {
							setDraftMessage(event.target.value);
						}}
						onKeyDown={handleMessageKeyDown}
						className="min-w-0 flex-1 bg-transparent text-[10px] text-[#F3F4F6] outline-none placeholder:text-[#A1A1AA]"
					/>
					<button
						type="button"
						aria-label="Envoyer le message"
						onClick={sendMessage}
						className="inline-flex h-5 w-5 items-center justify-center text-[#F3F4F6] transition-colors hover:text-white"
					>
						<SendHorizontal size={13} strokeWidth={1.8} />
					</button>
				</label>
			</div>
		</section>
	);
}

function InspectorColumn(): ReactElement {
	return (
		<aside className="flex h-full min-h-0 border-l border-[#2C2C32] bg-[#17171C]">
			<div className="flex min-h-0 w-[284px] flex-col">
				<div className="min-h-0 flex-1 overflow-y-auto">
					{inspectorPanels.map(
						(panel: InspectorPanel): ReactElement => (
							<InspectorPanelCard key={panel.id} panel={panel} />
						),
					)}
				</div>
				<DiscussionPanel />
			</div>
			<UtilityRail />
		</aside>
	);
}

export default function LyricsEditorWorkspace({
	format,
}: LyricsEditorWorkspaceProps): ReactElement {
	const [document, setDocument] = useState<LyricsDocument>(createInitialDocument);
	const [lineCommentsById, setLineCommentsById] =
		useState<LineCommentsById>(initialLineCommentsById);
	const [toggles, setToggles] = useState<EditorToggle[]>(initialToggles);
	const [sectionOptionsById, setSectionOptionsById] = useState<
		Record<string, SectionOptions>
	>({});
	const [saveState, setSaveState] = useState<SaveState>("idle");
	const [isDirty, setIsDirty] = useState<boolean>(false);
	const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
	const [draggedLine, setDraggedLine] = useState<LineDragState | null>(null);
	const [openAddMenuSectionId, setOpenAddMenuSectionId] = useState<
		string | null
	>(null);
	const [openOptionsMenuSectionId, setOpenOptionsMenuSectionId] = useState<
		string | null
	>(null);
	const [pendingFocusLineId, setPendingFocusLineId] = useState<string | null>(
		null,
	);
	const [selectedLineIds, setSelectedLineIds] = useState<Set<string>>(new Set());
	const [anchorLineId, setAnchorLineId] = useState<string | null>(null);

	const wordCount: number = useMemo(
		(): number => countDocumentWords(document),
		[document],
	);
	const lineNumberColumnWidth: number = useMemo((): number => {
		const maxLineNumber: number = document.sections.reduce(
			(currentMax: number, section: LyricSection): number =>
				section.lines.reduce(
					(lineMax: number, line: LyricLine): number =>
						Math.max(lineMax, line.number),
					currentMax,
				),
			1,
		);
		const digitCount: number = maxLineNumber.toString().length;

		return Math.max(32, Math.min(84, digitCount * 10 + 14));
	}, [document.sections]);

	useEffect((): void => {
		const storage: Storage | null = getClientStorage();
		const storedDocument: LyricsDocument | null = parseStoredDocument(
			storage?.getItem(storageKey) ?? null,
		);
		const storedLineComments: LineCommentsById | null = parseStoredLineComments(
			storage?.getItem(commentsStorageKey) ?? null,
		);

		if (storedLineComments) {
			setLineCommentsById(storedLineComments);
		}

		if (storedDocument) {
			setDocument({
				...storedDocument,
				sections: renumberDocument(storedDocument.sections),
			});
		}
	}, []);

	useEffect((): (() => void) | void => {
		if (!pendingFocusLineId) {
			return;
		}

		let timeoutId: number | null = null;

		function focusPendingLine(): void {
			if (!focusLineInputById(pendingFocusLineId)) {
				timeoutId = window.setTimeout(focusPendingLine, 0);
				return;
			}

			setPendingFocusLineId(null);
		}

		const frameId: number = window.requestAnimationFrame((): void => {
			focusPendingLine();
		});

		return (): void => {
			window.cancelAnimationFrame(frameId);

			if (timeoutId !== null) {
				window.clearTimeout(timeoutId);
			}
		};
	}, [pendingFocusLineId, document]);

	// ── Copier / couper les lignes sélectionnées ──────────────────────────
	useEffect((): (() => void) => {
		function handleGlobalKeyDown(event: globalThis.KeyboardEvent): void {
			const isCopy = (event.ctrlKey || event.metaKey) && event.key === "c";
			const isCut  = (event.ctrlKey || event.metaKey) && event.key === "x";

			if ((!isCopy && !isCut) || selectedLineIds.size === 0) return;

			// Collecter le texte dans l'ordre DOM
			const allLines: LyricLine[] = document.sections.flatMap(
				(s: LyricSection) => s.lines,
			);
			const selectedText: string = allLines
				.filter((l: LyricLine) => selectedLineIds.has(l.id))
				.map((l: LyricLine) => l.text)
				.join("\n");

			void navigator.clipboard.writeText(selectedText);

			if (isCut) {
				// Supprimer toutes les lignes sélectionnées
				const nextSections: LyricSection[] = renumberDocument(
					document.sections.map((section: LyricSection): LyricSection => ({
						...section,
						lines: section.lines.filter(
							(line: LyricLine) => !selectedLineIds.has(line.id),
						).length > 0
							? section.lines.filter((l: LyricLine) => !selectedLineIds.has(l.id))
							: [createBlankLine(section.id)],
					})),
				);
				setSelectedLineIds(new Set());
				setAnchorLineId(null);
				updateDocument({ ...document, sections: nextSections });
			}
		}

		window.addEventListener("keydown", handleGlobalKeyDown);
		return () => window.removeEventListener("keydown", handleGlobalKeyDown);
	}, [selectedLineIds, document]);

	function handleLineSelect(lineId: string, shiftKey: boolean): void {
		if (shiftKey && anchorLineId) {
			// Sélection par plage via l'ordre DOM
			const allInputs = Array.from(
				window.document.querySelectorAll<HTMLInputElement>("input[data-line-id]"),
			);
			const allIds: string[] = allInputs
				.map((el) => el.dataset.lineId ?? "")
				.filter(Boolean);
			const anchorIdx = allIds.indexOf(anchorLineId);
			const targetIdx = allIds.indexOf(lineId);
			if (anchorIdx === -1 || targetIdx === -1) return;
			const [from, to] = anchorIdx < targetIdx
				? [anchorIdx, targetIdx]
				: [targetIdx, anchorIdx];
			setSelectedLineIds(new Set(allIds.slice(from, to + 1)));
		} else {
			setSelectedLineIds(new Set([lineId]));
			setAnchorLineId(lineId);
		}
	}

	function handleClearSelection(): void {
		if (selectedLineIds.size > 0) {
			setSelectedLineIds(new Set());
			setAnchorLineId(null);
		}
	}

	function updateDocument(nextDocument: LyricsDocument): void {
		setDocument(nextDocument);
		setIsDirty(true);
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

	function getSectionOptions(sectionId: string): SectionOptions {
		return {
			...defaultSectionOptions,
			...(sectionOptionsById[sectionId] ?? {}),
		};
	}

	function handleToggleSectionOption(
		sectionId: string,
		key: SectionOptionKey,
	): void {
		setSectionOptionsById(
			(currentOptions: Record<string, SectionOptions>): Record<
				string,
				SectionOptions
			> => {
				const sectionOptions: SectionOptions = {
					...defaultSectionOptions,
					...(currentOptions[sectionId] ?? {}),
				};

				return {
					...currentOptions,
					[sectionId]: {
						...sectionOptions,
						[key]: !sectionOptions[key],
					},
				};
			},
		);
	}

	function handleToggleAddMenu(sectionId: string): void {
		setOpenOptionsMenuSectionId(null);
		setOpenAddMenuSectionId(
			(currentSectionId: string | null): string | null =>
				currentSectionId === sectionId ? null : sectionId,
		);
	}

	function handleToggleOptionsMenu(sectionId: string): void {
		setOpenAddMenuSectionId(null);
		setOpenOptionsMenuSectionId(
			(currentSectionId: string | null): string | null =>
				currentSectionId === sectionId ? null : sectionId,
		);
	}

	function handleAddSectionAfter(sectionId: string, kind: SectionKind): void {
		const nextIndex: number =
			document.sections.filter(
				(section: LyricSection): boolean => section.kind === kind,
			).length + 1;
		const targetIndex: number = document.sections.findIndex(
			(section: LyricSection): boolean => section.id === sectionId,
		);
		const nextSections: LyricSection[] = [...document.sections];
		const insertIndex: number =
			targetIndex === -1 ? nextSections.length : targetIndex + 1;

		nextSections.splice(insertIndex, 0, createSection(kind, nextIndex));

		updateDocument({
			...document,
			sections: renumberDocument(nextSections),
		});
		setOpenAddMenuSectionId(null);
	}

	function handleAddLine(sectionId: string): void {
		let insertedLineId: string | null = null;

		updateDocument({
			...document,
			sections: renumberDocument(
				document.sections.map(
					(section: LyricSection): LyricSection => {
						if (section.id !== sectionId) {
							return section;
						}

						const insertedLine: LyricLine = createBlankLine(section.id);
						insertedLineId = insertedLine.id;

						return {
							...section,
							lines: [...section.lines, insertedLine],
						};
					},
				),
			),
		});
		setOpenAddMenuSectionId(null);

		if (insertedLineId) {
			setPendingFocusLineId(insertedLineId);
			window.setTimeout((): void => {
				if (insertedLineId) {
					focusLineInputById(insertedLineId);
				}
			}, 20);
		}
	}

	function handleInsertLineAfter(sectionId: string, lineId: string): void {
		let insertedLineId: string | null = null;

		updateDocument({
			...document,
			sections: renumberDocument(
				document.sections.map(
					(section: LyricSection): LyricSection => {
						if (section.id !== sectionId) {
							return section;
						}

						const lineIndex: number = section.lines.findIndex(
							(line: LyricLine): boolean => line.id === lineId,
						);
						const nextLines: LyricLine[] = [...section.lines];
						const insertIndex: number =
							lineIndex === -1 ? nextLines.length : lineIndex + 1;
						const insertedLine: LyricLine = createBlankLine(section.id);

						nextLines.splice(insertIndex, 0, insertedLine);
						insertedLineId = insertedLine.id;

						return {
							...section,
							lines: nextLines,
						};
					},
				),
			),
		});

		if (insertedLineId) {
			setPendingFocusLineId(insertedLineId);
			window.setTimeout((): void => {
				if (insertedLineId) {
					focusLineInputById(insertedLineId);
				}
			}, 20);
		}
	}

	function handleDeleteLine(sectionId: string, lineId: string): void {
		let focusLineId: string | null = null;
		let didDeleteLine: boolean = false;

		const nextSections: LyricSection[] = document.sections.map(
			(section: LyricSection): LyricSection => {
				if (section.id !== sectionId || section.lines.length <= 1) {
					return section;
				}

				const lineIndex: number = section.lines.findIndex(
					(line: LyricLine): boolean => line.id === lineId,
				);

				if (lineIndex === -1) {
					return section;
				}

				const nextLines: LyricLine[] = section.lines.filter(
					(line: LyricLine): boolean => line.id !== lineId,
				);
				const nextFocusLine: LyricLine | undefined =
					nextLines[Math.max(0, lineIndex - 1)] ?? nextLines[lineIndex];

				didDeleteLine = true;
				focusLineId = nextFocusLine?.id ?? null;

				return {
					...section,
					lines: nextLines,
				};
			},
		);

		if (!didDeleteLine) {
			return;
		}

		updateDocument({
			...document,
			sections: renumberDocument(nextSections),
		});

		if (focusLineId) {
			setPendingFocusLineId(focusLineId);
		}
	}

	function handleLineChange(
		sectionId: string,
		lineId: string,
		value: string,
	): void {
		updateDocument({
			...document,
			sections: document.sections.map(
				(section: LyricSection): LyricSection =>
					section.id === sectionId
						? {
								...section,
								lines: section.lines.map(
									(line: LyricLine): LyricLine =>
										line.id === lineId ? { ...line, text: value } : line,
								),
							}
						: section,
			),
		});
	}

	function handleLineAutoWrap(
		sectionId: string,
		lineId: string,
		currentText: string,
		overflowText: string,
	): void {
		let insertedLineId: string | null = null;

		updateDocument({
			...document,
			sections: renumberDocument(
				document.sections.map(
					(section: LyricSection): LyricSection => {
						if (section.id !== sectionId) {
							return section;
						}

						const lineIndex: number = section.lines.findIndex(
							(line: LyricLine): boolean => line.id === lineId,
						);

						if (lineIndex === -1) {
							return section;
						}

						const insertedLine: LyricLine = {
							...createBlankLine(section.id),
							text: overflowText,
						};
						const nextLines: LyricLine[] = section.lines.map(
							(line: LyricLine): LyricLine =>
								line.id === lineId ? { ...line, text: currentText } : line,
						);

						insertedLineId = insertedLine.id;
						nextLines.splice(lineIndex + 1, 0, insertedLine);

						return {
							...section,
							lines: nextLines,
						};
					},
				),
			),
		});

		if (insertedLineId) {
			setPendingFocusLineId(insertedLineId);
			window.setTimeout((): void => {
				if (insertedLineId) {
					focusLineInputById(insertedLineId);
				}
			}, 90);
		}
	}

	function handleDragStart(
		event: DragEvent<HTMLButtonElement>,
		sectionId: string,
	): void {
		setDraggedSectionId(sectionId);
		setDraggedLine(null);
		setOpenAddMenuSectionId(null);
		setOpenOptionsMenuSectionId(null);
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData(sectionDragDataType, sectionId);
		event.dataTransfer.setData("text/plain", sectionId);

		const sectionElement: HTMLElement | null =
			event.currentTarget.closest<HTMLElement>("[data-lyrics-section='true']");

		if (!sectionElement) {
			return;
		}

		const dragImage: HTMLElement = createSectionDragImage(sectionElement);
		event.dataTransfer.setDragImage(dragImage, 44, 24);
		window.setTimeout((): void => {
			dragImage.remove();
		}, 0);
	}

	function handleDrop(event: DragEvent<HTMLElement>, targetSectionId: string): void {
		event.preventDefault();
		const sourceSectionId: string =
			event.dataTransfer.getData(sectionDragDataType) ||
			event.dataTransfer.getData("text/plain") ||
			draggedSectionId ||
			"";

		if (!sourceSectionId || sourceSectionId === targetSectionId) {
			return;
		}

		updateDocument({
			...document,
			sections: reorderSections(
				document.sections,
				sourceSectionId,
				targetSectionId,
			),
		});
		setDraggedSectionId(null);
	}

	function handleDragEnd(): void {
		setDraggedSectionId(null);
	}

	function handleLineDragStart(
		event: DragEvent<HTMLButtonElement>,
		sectionId: string,
		lineId: string,
	): void {
		const nextDraggedLine: LineDragState = { sectionId, lineId };

		event.stopPropagation();
		setDraggedLine(nextDraggedLine);
		setDraggedSectionId(null);
		setOpenAddMenuSectionId(null);
		setOpenOptionsMenuSectionId(null);
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData(lineDragDataType, JSON.stringify(nextDraggedLine));
		event.dataTransfer.setData("text/plain", lineId);

		const lineElement: HTMLElement | null =
			event.currentTarget.closest<HTMLElement>("[data-lyrics-line='true']");

		if (!lineElement) {
			return;
		}

		const dragImage: HTMLElement = createLineDragImage(lineElement);
		event.dataTransfer.setDragImage(dragImage, 24, 18);
		window.setTimeout((): void => {
			dragImage.remove();
		}, 0);
	}

	function handleLineDrop(
		event: DragEvent<HTMLElement>,
		targetSectionId: string,
		targetLineId: string | null,
		placement: LineDropPlacement,
	): void {
		event.preventDefault();
		event.stopPropagation();

		const sourceLine: LineDragState | null =
			parseLineDragState(event.dataTransfer.getData(lineDragDataType)) ??
			draggedLine;

		if (!sourceLine) {
			return;
		}

		const nextSections: LyricSection[] = moveLineBetweenSections(
			document.sections,
			sourceLine,
			targetSectionId,
			targetLineId,
			placement,
		);

		if (nextSections === document.sections) {
			setDraggedLine(null);
			return;
		}

		updateDocument({
			...document,
			sections: nextSections,
		});
		setDraggedLine(null);
		setPendingFocusLineId(sourceLine.lineId);
	}

	function handleLineDragEnd(): void {
		setDraggedLine(null);
	}

	function handleDuplicateSection(sectionId: string): void {
		const sourceIndex: number = document.sections.findIndex(
			(section: LyricSection): boolean => section.id === sectionId,
		);

		if (sourceIndex === -1) {
			return;
		}

		const sourceSection: LyricSection = document.sections[sourceIndex];
		const duplicatedSection: LyricSection = {
			...sourceSection,
			id: createId(`${sourceSection.kind}-copy`),
			title: `${sourceSection.title} COPY`,
			lines: sourceSection.lines.map(
				(line: LyricLine): LyricLine => ({
					...line,
					id: createId(`${sourceSection.id}-line`),
					number: 0,
				}),
			),
		};
		const nextSections: LyricSection[] = [...document.sections];

		nextSections.splice(sourceIndex + 1, 0, duplicatedSection);
		updateDocument({
			...document,
			sections: renumberDocument(nextSections),
		});
		setOpenOptionsMenuSectionId(null);
	}

	function handleDeleteSection(sectionId: string): void {
		if (document.sections.length <= 1) {
			setOpenOptionsMenuSectionId(null);
			return;
		}

		updateDocument({
			...document,
			sections: renumberDocument(
				document.sections.filter(
					(section: LyricSection): boolean => section.id !== sectionId,
				),
			),
		});
		setOpenOptionsMenuSectionId(null);
	}

	function handleValidateSection(): void {
		setOpenOptionsMenuSectionId(null);
	}

	function handleSectionKindChange(sectionId: string, newKind: SectionKind): void {
		const nextSections = document.sections.map(
			(section: LyricSection): LyricSection =>
				section.id === sectionId
					? { ...section, kind: newKind }
					: section,
		);
		updateDocument({
			...document,
			sections: renumberDocument(nextSections),
		});
	}

	function handleLinePaste(
		sectionId: string,
		lineId: string,
		pastedLines: string[],
	): void {
		if (pastedLines.length === 0) return;

		let lastInsertedId: string | null = null;

		updateDocument({
			...document,
			sections: renumberDocument(
				document.sections.map((section: LyricSection): LyricSection => {
					if (section.id !== sectionId) return section;

					const lineIndex: number = section.lines.findIndex(
						(l: LyricLine) => l.id === lineId,
					);
					if (lineIndex === -1) return section;

					const nextLines: LyricLine[] = [...section.lines];
					// Mettre à jour la ligne courante avec la première partie
					nextLines[lineIndex] = { ...nextLines[lineIndex], text: pastedLines[0] };

					// Insérer les lignes suivantes après
					const newLines: LyricLine[] = pastedLines.slice(1).map(
						(text: string): LyricLine => ({ ...createBlankLine(section.id), text }),
					);
					if (newLines.length > 0) {
						lastInsertedId = newLines[newLines.length - 1].id;
						nextLines.splice(lineIndex + 1, 0, ...newLines);
					}

					return { ...section, lines: nextLines };
				}),
			),
		});

		if (lastInsertedId) {
			setPendingFocusLineId(lastInsertedId);
		}
	}

	function handleAddLineComment(lineId: string, body: string): void {
		const nextComment: LineComment = {
			id: createId(`comment-${lineId}`),
			author: "Nilu",
			initial: "N",
			body,
			time: "maintenant",
		};

		setLineCommentsById(
			(currentCommentsById: LineCommentsById): LineCommentsById => {
				const nextLineComments: LineComment[] = [
					...(currentCommentsById[lineId] ?? []),
					nextComment,
				];

				return {
					...currentCommentsById,
					[lineId]: nextLineComments,
				};
			},
		);

		updateDocument({
			...document,
			sections: document.sections.map(
				(section: LyricSection): LyricSection => ({
					...section,
					lines: section.lines.map(
						(line: LyricLine): LyricLine =>
							line.id === lineId
								? { ...line, comments: line.comments + 1 }
								: line,
					),
				}),
			),
		});
	}

	function handleSave(): void {
		const storage: Storage | null = getClientStorage();
		const savedDocument: LyricsDocument = {
			...document,
			updatedAt: new Date().toISOString(),
		};

		storage?.setItem(storageKey, JSON.stringify(savedDocument));
		storage?.setItem(commentsStorageKey, JSON.stringify(lineCommentsById));
		setDocument(savedDocument);
		setIsDirty(false);
		setSaveState("saved");

		window.setTimeout((): void => {
			setSaveState("idle");
		}, 1400);
	}

	return (
		<div
			data-lyrics-workspace="true"
			className="grid h-full min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]"
		>
			<main className="min-h-0 overflow-y-auto bg-[#17171C]">
				<div className="flex min-h-full flex-col px-6 py-3 lg:px-8">
					<div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
								{saveState === "saved" ? "Sauvegarde" : "Sauvegarder"}
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

					<div className="w-full max-w-[1120px]">
						{document.sections.map(
							(section: LyricSection, index: number): ReactElement => (
								<LyricSectionBlock
									key={section.id}
									section={section}
									isLast={index === document.sections.length - 1}
									isDragging={draggedSectionId === section.id}
									format={format}
									lineNumberColumnWidth={lineNumberColumnWidth}
									globalToggles={toggles}
									sectionOptions={getSectionOptions(section.id)}
									isAddMenuOpen={openAddMenuSectionId === section.id}
									isOptionsMenuOpen={openOptionsMenuSectionId === section.id}
									draggedLine={draggedLine}
									selectedLineIds={selectedLineIds}
									lineCommentsById={lineCommentsById}
									onLineSelect={handleLineSelect}
									onClearSelection={handleClearSelection}
									onToggleAddMenu={handleToggleAddMenu}
									onToggleOptionsMenu={handleToggleOptionsMenu}
									onAddSection={handleAddSectionAfter}
									onAddLine={handleAddLine}
									onInsertLineAfter={handleInsertLineAfter}
									onLineDelete={handleDeleteLine}
									onLineChange={handleLineChange}
									onLineAutoWrap={handleLineAutoWrap}
									onLinePaste={handleLinePaste}
									onAddLineComment={handleAddLineComment}
									onToggleSectionOption={handleToggleSectionOption}
									onDuplicate={handleDuplicateSection}
									onDelete={handleDeleteSection}
									onValidate={handleValidateSection}
									onSectionKindChange={handleSectionKindChange}
									onDragStart={handleDragStart}
									onDragEnd={handleDragEnd}
									onDrop={handleDrop}
									onLineDragStart={handleLineDragStart}
									onLineDragEnd={handleLineDragEnd}
									onLineDrop={handleLineDrop}
								/>
							),
						)}
					</div>
				</div>
			</main>

			<div className="min-h-0">
				<InspectorColumn />
			</div>
		</div>
	);
}
