"use client";

import {
	Fragment,
	useMemo,
	useState,
	useEffect,
	useRef,
	useCallback,
	type ReactElement,
	type CSSProperties,
	type ChangeEvent,
	type DragEvent,
} from "react";
import {
	getLineMarkSegments,
	lineContentHasMarks,
	type LineMarkSegment,
	type TipTapLyricsDocument,
	type TipTapLyricLine,
	type TipTapLyricSection,
	type LyricsFormat,
	type SectionKind,
} from "./lyricsEditorStorage";
import { Plus, GripVertical, MessageSquare } from "lucide-react";
import {
	SectionAddMenu,
	SectionOptionsMenu,
	type SectionOptions,
	type SectionOptionKey,
} from "./LyricsEditorWorkspace";
import LineCommentOverlay, { type LineComment } from "./LineCommentOverlay";

export type SearchMatchRange = {
	startIndex: number;
	endIndex: number;
};

export type FocusSectionMarker = {
	id: string;
	initial: string;
	label: string;
	lineIndex: number;
};

export type FocusFormatSelection = {
	focusText: string;
	from: number;
	to: number;
};

export type TextLookupSelection = {
	focusText?: string;
	from: number;
	lineId: string;
	mode: "lookup" | "transform";
	rawText: string;
	rect: {
		bottom: number;
		height: number;
		left: number;
		right: number;
		top: number;
		width: number;
	};
	sectionId: string;
	source: "focus" | "line";
	text: string;
	to: number;
};

export type RemotePresence = {
	cursorOffset: number | null;
	lineId: string | null;
	projectId: string;
	sectionId: string | null;
	sessionId: string;
	updatedAt: number;
	color: string;
	name: string;
};

export type RhymeHighlight = {
	color: string;
	endIndex: number;
	key: string;
	startIndex: number;
	word: string;
};

export type RhymeHighlightsByLineId = Record<string, RhymeHighlight>;

export type FocusLineMapping = {
	line: TipTapLyricLine;
	section: TipTapLyricSection;
	lineIndex: number;
};

export const focusTextareaTopPaddingPx = 36;
export const focusTextareaLeftPaddingPx = 58;
const focusSectionSeparatorNewlineCount = 3;

function getSectionLabel(kind: SectionKind): string {
	const labels: Record<SectionKind, string> = {
		untitled: "Sans titre",
		intro: "Intro",
		couplet: "Couplet",
		refrain: "Refrain",
		pont: "Pont",
	};
	return labels[kind];
}

function getFocusSectionInitial(kind: SectionKind): string {
	const labels: Record<SectionKind, string> = {
		untitled: "S",
		intro: "I",
		couplet: "C",
		refrain: "R",
		pont: "P",
	};
	return labels[kind];
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

function normalizeLookupTerm(value: string): string {
	return value.trim().replace(/\s+/g, " ").slice(0, 64);
}

export function normalizeComparableSelection(value: string): string {
	return value.trim().replace(/\s+/g, " ");
}

export function normalizeSelectedLookupWord(value: string): string | null {
	const trimmedValue: string = value.trim();

	if (trimmedValue.length === 0 || /\s/.test(trimmedValue)) {
		return null;
	}

	const wordMatch: RegExpMatchArray | null =
		trimmedValue.match(/[\p{L}\p{N}'-]+/u);
	const word: string | undefined = wordMatch?.[0];

	return word && word.length >= 2 ? word.slice(0, 64) : null;
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
): TextLookupSelection["rect"] {
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

function createFocusSectionDragImage(
	label: string,
	lines: string[],
	fontFamily?: string,
	fontSize?: string,
): HTMLElement {
	const dragImage = window.document.createElement("div");
	dragImage.style.position = "fixed";
	dragImage.style.top = "0";
	dragImage.style.left = "0";
	dragImage.style.zIndex = "-1000";
	dragImage.style.pointerEvents = "none";
	dragImage.style.color = "#F3F4F6";
	dragImage.style.opacity = "1";

	// Add label
	const labelEl = window.document.createElement("div");
	labelEl.innerText = label;
	labelEl.style.fontSize = "13px";
	labelEl.style.fontWeight = "500";
	labelEl.style.color = "#767680";
	labelEl.style.textTransform = "uppercase";
	labelEl.style.marginBottom = "6px";
	dragImage.appendChild(labelEl);

	// Add lines
	lines.forEach((lineText) => {
		const lineEl = window.document.createElement("div");
		lineEl.innerText = lineText || " ";
		lineEl.style.fontFamily = fontFamily ?? "Georgia, serif";
		lineEl.style.fontSize = fontSize ?? "18px";
		lineEl.style.lineHeight = "1.5";
		lineEl.style.minHeight = "1.5em";
		dragImage.appendChild(lineEl);
	});

	window.document.body.appendChild(dragImage);
	return dragImage;
}

function removeFocusSectionDragImage(dragImage: HTMLElement): void {
	window.setTimeout(() => {
		dragImage.style.top = "-10000px";
	}, 0);
	window.setTimeout(() => {
		dragImage.remove();
	}, 180);
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

function getVisibleSectionLines(
	section: TipTapLyricSection,
): TipTapLyricLine[] {
	return section.lines;
}

export function getActualLineMappings(
	text: string,
	sections: TipTapLyricSection[],
): FocusLineMapping[] {
	const mappings: FocusLineMapping[] = [];
	const rawLines = text.replace(/\r\n/g, "\n").split("\n");

	let currentSectionIdx = 0;
	let lineInCurrentSectionIdx = 0;
	let isNewSection = true;

	for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
		const lineText = rawLines[lineIndex];
		const isBlank = lineText.trim().length === 0;

		if (isBlank) {
			isNewSection = true;
			continue;
		}

		if (isNewSection) {
			if (lineInCurrentSectionIdx > 0) {
				currentSectionIdx++;
			}
			lineInCurrentSectionIdx = 0;
			isNewSection = false;
		}

		const section = sections[currentSectionIdx];
		if (section) {
			const visibleLines = getVisibleSectionLines(section);
			const line = visibleLines[lineInCurrentSectionIdx];
			if (line) {
				mappings.push({
					line,
					section,
					lineIndex,
				});
			}
		}
		lineInCurrentSectionIdx++;
	}

	return mappings;
}

export function createFocusSectionMarkersFromText(
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

export function SearchHighlightOverlay({
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

const focusEditorBackgroundColor = "#0D0D10";
const focusDefaultTextColor = "#F3F4F6";

export function FormatMarksOverlay({
	lineStyle,
	segments,
}: {
	lineStyle: CSSProperties;
	segments: LineMarkSegment[];
}): ReactElement {
	return (
		<div
			aria-hidden="true"
			contentEditable={false}
			className="pointer-events-none absolute left-0 right-0 top-0 select-none text-transparent"
			style={{
				...lineStyle,
				userSelect: "none",
				whiteSpace: "pre-wrap",
			}}
		>
			{segments.map(
				(segment: LineMarkSegment, index: number): ReactElement => {
					const hasMark =
						segment.bold ||
						segment.italic ||
						segment.strike ||
						segment.underline ||
						segment.color !== null;

					if (!hasMark) {
						return <span key={index}>{segment.text}</span>;
					}

					const effectiveColor =
						segment.color ?? focusDefaultTextColor;
					const style: CSSProperties = {};

					// Recolor: opaque glyphs drawn 1:1 over the textarea
					// text (same font metrics, zero drift).
					if (segment.color !== null || segment.italic) {
						style.color = effectiveColor;
					}

					// Faux bold via shadows: thickens without changing
					// glyph advance widths, so the mirror stays aligned
					// with the textarea.
					if (segment.bold) {
						style.textShadow = `0.6px 0 0 ${effectiveColor}, -0.6px 0 0 ${effectiveColor}, 0 0.4px 0 ${effectiveColor}`;
					}

					// Faux italic via skew: visual-only transform, no
					// layout impact. Opaque background hides the upright
					// glyphs of the textarea underneath.
					if (segment.italic) {
						style.display = "inline-block";
						style.transform = "skewX(-10deg)";
						style.backgroundColor = focusEditorBackgroundColor;
					}

					const decorations: string[] = [];
					if (segment.underline) decorations.push("underline");
					if (segment.strike) decorations.push("line-through");
					if (decorations.length > 0) {
						style.textDecorationLine = decorations.join(" ");
						style.textDecorationColor = effectiveColor;
						style.textDecorationThickness = "1.5px";
					}

					return (
						<span key={index} style={style}>
							{segment.text}
						</span>
					);
				},
			)}
		</div>
	);
}

export function RhymeHighlightOverlay({
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

export function RemoteCursorOverlay({
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

export default function FocusLyricsDocument({
	document,
	lineStyle,
	onDocumentTextChange,
	onSelectionChange,
	onFormatSelectionChange,
	text,
	rhymeHighlightsByLineId,
	normalizedLookupTerm,
	remotePresences = [],
	showRhymes,
	openAddMenuSectionId,
	openOptionsMenuSectionId,
	onToggleAddMenu,
	onToggleOptionsMenu,
	getSectionOptions,
	handleToggleSectionOption,
	handleCreateSectionAlternative,
	handleDuplicateSection,
	handleDeleteSection,
	handleAddSection,
	handleAddLine,
	setOpenAddMenuSectionId,
	setOpenOptionsMenuSectionId,
	draggedSectionId,
	dragOverSectionId,
	draggedHeight,
	setDraggedSectionId,
	setDragOverSectionId,
	setDraggedHeight,
	handleSectionDrop,
	sectionCommentsById,
	openCommentSectionId,
	onToggleSectionComment,
	onAddSectionComment,
}: {
	document: TipTapLyricsDocument;
	lineStyle: CSSProperties;
	onDocumentTextChange: (text: string) => void;
	onSelectionChange: (selection: TextLookupSelection | null) => void;
	onFormatSelectionChange: (selection: FocusFormatSelection | null) => void;
	text: string;
	rhymeHighlightsByLineId: RhymeHighlightsByLineId;
	normalizedLookupTerm: string;
	remotePresences?: RemotePresence[];
	showRhymes: boolean;
	openAddMenuSectionId: string | null;
	openOptionsMenuSectionId: string | null;
	onToggleAddMenu: (sectionId: string) => void;
	onToggleOptionsMenu: (sectionId: string) => void;
	getSectionOptions: (sectionId: string) => SectionOptions;
	handleToggleSectionOption: (
		sectionId: string,
		key: SectionOptionKey,
	) => void;
	handleCreateSectionAlternative: (sectionId: string) => void;
	handleDuplicateSection: (sectionId: string) => void;
	handleDeleteSection: (sectionId: string) => void;
	handleAddSection: (sectionId: string, kind: SectionKind) => void;
	handleAddLine: (sectionId: string) => void;
	setOpenAddMenuSectionId: (sectionId: string | null) => void;
	setOpenOptionsMenuSectionId: (sectionId: string | null) => void;
	draggedSectionId: string | null;
	dragOverSectionId: string | null;
	draggedHeight: number;
	setDraggedSectionId: (id: string | null) => void;
	setDragOverSectionId: (id: string | null) => void;
	setDraggedHeight: (height: number) => void;
	handleSectionDrop: (targetSectionId: string) => void;
	sectionCommentsById: Record<string, LineComment[]>;
	openCommentSectionId: string | null;
	onToggleSectionComment: (sectionId: string) => void;
	onAddSectionComment: (sectionId: string, body: string) => void;
}): ReactElement {
	const containerRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(
		null,
	);
	const [hoveredLineIdx, setHoveredLineIdx] = useState<number | null>(null);
	const [draggedLineIdx, setDraggedLineIdx] = useState<number | null>(null);
	const [dragOverLineIdx, setDragOverLineIdx] = useState<number | null>(null);
	const [lineDropPlacement, setLineDropPlacement] = useState<
		"before" | "after"
	>("before");

	const activeGripLineIdx =
		draggedLineIdx !== null ? draggedLineIdx : hoveredLineIdx;

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

	// Close Section Add Menu and Options Menu when clicking outside or pressing Escape
	useEffect(() => {
		if (
			openAddMenuSectionId === null &&
			openOptionsMenuSectionId === null
		) {
			return;
		}

		function handlePointerDown(event: globalThis.PointerEvent): void {
			const target = event.target;
			if (!(target instanceof Node)) return;

			const menuContainer = window.document.querySelector(
				".section-menu-container",
			);
			const handlesContainer = window.document.querySelector(
				".section-handles-container",
			);

			if (
				menuContainer &&
				!menuContainer.contains(target) &&
				(!handlesContainer || !handlesContainer.contains(target))
			) {
				setOpenAddMenuSectionId(null);
				setOpenOptionsMenuSectionId(null);
			}
		}

		function handleKeyDown(event: globalThis.KeyboardEvent): void {
			if (event.key === "Escape") {
				setOpenAddMenuSectionId(null);
				setOpenOptionsMenuSectionId(null);
			}
		}

		window.document.addEventListener("pointerdown", handlePointerDown);
		window.document.addEventListener("keydown", handleKeyDown);
		return () => {
			window.document.removeEventListener(
				"pointerdown",
				handlePointerDown,
			);
			window.document.removeEventListener("keydown", handleKeyDown);
		};
	}, [
		openAddMenuSectionId,
		openOptionsMenuSectionId,
		setOpenAddMenuSectionId,
		setOpenOptionsMenuSectionId,
	]);

	const fontSize =
		typeof lineStyle?.fontSize === "number"
			? lineStyle.fontSize
			: typeof lineStyle?.fontSize === "string"
				? Number.parseInt(lineStyle.fontSize, 10) || 16
				: 16;

	const lineHeightMultiplier =
		typeof lineStyle?.lineHeight === "number"
			? lineStyle.lineHeight
			: typeof lineStyle?.lineHeight === "string"
				? Number.parseFloat(lineStyle.lineHeight) || 1.55
				: 1.55;

	const dynamicLineHeightPx = fontSize * lineHeightMultiplier;
	const dynamicSectionLabelOffsetPx = dynamicLineHeightPx + 7;

	const computedLineStyle = useMemo((): CSSProperties => {
		return {
			...lineStyle,
			lineHeight: `${dynamicLineHeightPx}px`,
		};
	}, [lineStyle, dynamicLineHeightPx]);

	const focusSectionMarkers = useMemo(
		(): FocusSectionMarker[] =>
			createFocusSectionMarkersFromText(text, document.sections),
		[document.sections, text],
	);

	const mappings = useMemo(
		(): FocusLineMapping[] =>
			getActualLineMappings(text, document.sections),
		[text, document.sections],
	);

	const lineCount = Math.max(1, text.split(/\r?\n/).length);

	const focusSectionRanges = useMemo(() => {
		return focusSectionMarkers.map((marker, index) => {
			const startLine = marker.lineIndex;
			const endLine =
				index < focusSectionMarkers.length - 1
					? focusSectionMarkers[index + 1].lineIndex
					: lineCount;
			return {
				marker,
				startLine,
				endLine,
				heightLines: endLine - startLine,
			};
		});
	}, [focusSectionMarkers, lineCount]);

	function handleTextSelection(textarea: HTMLTextAreaElement): void {
		const startIndex = textarea.selectionStart;
		const endIndex = textarea.selectionEnd;

		if (startIndex === endIndex) {
			onSelectionChange(null);
			// Keep the last format selection sticky on collapse — clicking
			// a toolbar button blurs the textarea and collapses the
			// selection; clearing here would drop the format target before
			// the toggle applies. It is cleared on text edits (onChange).
			return;
		}

		// Always report the raw range for toolbar formatting, even when
		// the selection is not a valid dictionary lookup word.
		onFormatSelectionChange({
			focusText: textarea.value,
			from: startIndex,
			to: endIndex,
		});

		const selectedText = textarea.value.slice(startIndex, endIndex);
		const selectedWord = normalizeSelectedLookupWord(selectedText);
		const rowIndex =
			textarea.value.slice(0, startIndex).split("\n").length - 1;
		const selectionRect = createRectFromElement(
			textarea,
			rowIndex,
			focusTextareaTopPaddingPx,
			dynamicLineHeightPx,
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

	const textareaHeight = Math.max(
		220,
		lineCount * dynamicLineHeightPx + focusTextareaTopPaddingPx + 10,
	);

	const textareaLines = text.split("\n");

	return (
		<div
			ref={containerRef}
			className="relative w-full max-w-[880px]"
			onMouseMove={(event) => {
				const textarea = textareaRef.current;
				if (!textarea) return;
				const rect = textarea.getBoundingClientRect();
				const relativeY =
					event.clientY -
					rect.top -
					focusTextareaTopPaddingPx +
					textarea.scrollTop;

				if (relativeY < -30) {
					setHoveredSectionId(null);
					setHoveredLineIdx(null);
					return;
				}

				const hoveredLineIndex = Math.floor(
					relativeY / dynamicLineHeightPx,
				);
				const lines = text.split("\n");

				// Calculate section hover using hover bands
				let activeId: string | null = null;
				for (let i = focusSectionMarkers.length - 1; i >= 0; i--) {
					const marker = focusSectionMarkers[i];
					let hoverStartLine = 0;
					if (i > 0) {
						let emptyLineCount = 0;
						let idx = marker.lineIndex - 1;
						while (idx >= 0 && lines[idx]?.trim().length === 0) {
							emptyLineCount++;
							idx--;
						}
						hoverStartLine = marker.lineIndex - emptyLineCount;
					}

					if (hoveredLineIndex >= hoverStartLine) {
						activeId = marker.id;
						break;
					}
				}

				// Fallback for Intro when hovering above line 0 but below -30px
				if (
					activeId === null &&
					focusSectionMarkers[0] &&
					relativeY >= -30
				) {
					activeId = focusSectionMarkers[0].id;
				}

				setHoveredSectionId(activeId);

				// Line hover detection (only if not dragging).
				// Skip while a mouse button is pressed so the grip does
				// not jump to another line between mousedown and the
				// native dragstart.
				if (event.buttons !== 0) {
					return;
				}
				if (!draggedSectionId && draggedLineIdx === null) {
					if (
						hoveredLineIndex >= 0 &&
						hoveredLineIndex < lines.length &&
						lines[hoveredLineIndex].trim().length > 0
					) {
						setHoveredLineIdx(hoveredLineIndex);
					} else {
						setHoveredLineIdx(null);
					}
				} else {
					setHoveredLineIdx(null);
				}
			}}
			onMouseLeave={() => {
				setHoveredSectionId(null);
				setHoveredLineIdx(null);
			}}
			onDragOver={(event: DragEvent<HTMLDivElement>): void => {
				const isDraggingLine = event.dataTransfer.types.includes(
					"application/x-nara-line-idx",
				);
				if (isDraggingLine) {
					event.preventDefault();

					const textarea = textareaRef.current;
					if (!textarea) return;
					const rect = textarea.getBoundingClientRect();
					const relativeY =
						event.clientY -
						rect.top -
						focusTextareaTopPaddingPx +
						textarea.scrollTop;
					const lineIndex = Math.max(
						0,
						Math.floor(relativeY / dynamicLineHeightPx),
					);

					setDragOverLineIdx(lineIndex);

					const lineTop =
						focusTextareaTopPaddingPx +
						lineIndex * dynamicLineHeightPx;
					const midPoint = lineTop + dynamicLineHeightPx / 2;
					const cursorY =
						event.clientY - rect.top + textarea.scrollTop;

					setLineDropPlacement(
						cursorY < midPoint ? "before" : "after",
					);
				}
			}}
			onDrop={(event: DragEvent<HTMLDivElement>): void => {
				const isDraggingLine = event.dataTransfer.types.includes(
					"application/x-nara-line-idx",
				);
				if (isDraggingLine) {
					event.preventDefault();

					const rawIdx = event.dataTransfer.getData(
						"application/x-nara-line-idx",
					);
					const srcIdx = parseInt(rawIdx, 10);
					if (isNaN(srcIdx)) return;

					const textarea = textareaRef.current;
					if (!textarea) return;
					const rect = textarea.getBoundingClientRect();
					const relativeY =
						event.clientY -
						rect.top -
						focusTextareaTopPaddingPx +
						textarea.scrollTop;
					const destIdx = Math.max(
						0,
						Math.floor(relativeY / dynamicLineHeightPx),
					);
					const lineTop =
						focusTextareaTopPaddingPx +
						destIdx * dynamicLineHeightPx;
					const midPoint = lineTop + dynamicLineHeightPx / 2;
					const cursorY =
						event.clientY - rect.top + textarea.scrollTop;
					const placement =
						cursorY < midPoint ? "before" : "after";

					const lines = text.split("\n");
					const draggedLineContent = lines[srcIdx];
					const newLines = [...lines];
					newLines.splice(srcIdx, 1);

					let insertIdx: number;
					if (srcIdx < destIdx) {
						insertIdx =
							placement === "before" ? destIdx - 1 : destIdx;
					} else {
						insertIdx =
							placement === "before" ? destIdx : destIdx + 1;
					}

					newLines.splice(
						Math.max(0, Math.min(newLines.length, insertIdx)),
						0,
						draggedLineContent,
					);

					onDocumentTextChange(newLines.join("\n"));
					setDraggedLineIdx(null);
					setDragOverLineIdx(null);
				}
			}}
		>
			{/* Focus Mode Overlays */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute left-0 right-0 top-0 select-none z-10"
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

						const lineTop = lineIndex * dynamicLineHeightPx;

						return (
							<div
								key={line.id}
								className="absolute right-0"
								style={{
									left: focusTextareaLeftPaddingPx,
									top: focusTextareaTopPaddingPx + lineTop,
									height: dynamicLineHeightPx,
									transform: getSectionTransform(section.id),
									transition: draggedSectionId
										? "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
										: "none",
									opacity:
										draggedSectionId === section.id ? 0 : 1,
								}}
							>
								{searchMatchRanges.length > 0 && (
									<SearchHighlightOverlay
										lineStyle={computedLineStyle}
										ranges={searchMatchRanges}
										text={lineText}
									/>
								)}
								{visibleRhymeHighlight && (
									<RhymeHighlightOverlay
										highlight={visibleRhymeHighlight}
										lineStyle={computedLineStyle}
										text={lineText}
									/>
								)}
								{remotePresencesForLine.length > 0 && (
									<RemoteCursorOverlay
										lineStyle={computedLineStyle}
										presences={remotePresencesForLine}
										text={lineText}
									/>
								)}
							</div>
						);
					},
				)}
				{draggedLineIdx !== null && dragOverLineIdx !== null && (
					<div
						className="absolute right-0 h-[2px] bg-[#767680] transition-[top] duration-75 z-35"
						style={{
							left: focusTextareaLeftPaddingPx,
							top:
								focusTextareaTopPaddingPx +
								dragOverLineIdx * dynamicLineHeightPx +
								(lineDropPlacement === "after"
									? dynamicLineHeightPx
									: 0) -
								1,
						}}
					/>
				)}
			</div>

			<div
				aria-hidden="true"
				className="pointer-events-none absolute left-0 top-0 select-none"
			>
				{focusSectionMarkers.map(
					(marker: FocusSectionMarker): ReactElement => {
						const lines = text.split("\n");
						let emptyLineCount = 0;
						let idx = marker.lineIndex - 1;
						while (idx >= 0 && lines[idx].trim().length === 0) {
							emptyLineCount++;
							idx--;
						}

						let labelTop = 0;
						if (marker.lineIndex === 0) {
							labelTop = Math.max(
								0,
								focusTextareaTopPaddingPx - 26,
							);
						} else if (emptyLineCount === 1) {
							labelTop =
								focusTextareaTopPaddingPx +
								marker.lineIndex * dynamicLineHeightPx -
								dynamicLineHeightPx +
								(dynamicLineHeightPx - 13) / 2;
						} else {
							labelTop =
								focusTextareaTopPaddingPx +
								marker.lineIndex * dynamicLineHeightPx -
								dynamicSectionLabelOffsetPx;
						}
						labelTop = Math.max(0, labelTop);

						return (
							<span
								key={marker.id}
								className="absolute text-[13px] font-medium leading-none text-[#767680] whitespace-nowrap"
								style={{
									left: focusTextareaLeftPaddingPx,
									top: labelTop,
									transform: getSectionTransform(marker.id),
									transition: draggedSectionId
										? "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
										: "none",
									opacity:
										draggedSectionId === marker.id ? 0 : 1,
								}}
							>
								{marker.label}
							</span>
						);
					},
				)}
			</div>

			{/* Section Hover Overlay Zones */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute left-0 right-0 top-0 select-none z-30"
				style={{
					height: textareaHeight,
				}}
			>
				{focusSectionRanges.map(
					({ marker, startLine, heightLines }) => {
						const sectionTop =
							focusTextareaTopPaddingPx +
							startLine * dynamicLineHeightPx;
						const sectionHeight = heightLines * dynamicLineHeightPx;
						const isVisible =
							hoveredSectionId === marker.id ||
							openAddMenuSectionId === marker.id ||
							openOptionsMenuSectionId === marker.id;

						// Compute emptyLineCount to align handles with the section title label
						const lines = text.split("\n");
						let emptyLineCount = 0;
						let idx = startLine - 1;
						while (idx >= 0 && lines[idx].trim().length === 0) {
							emptyLineCount++;
							idx--;
						}

						let labelTop = 0;
						if (startLine === 0) {
							labelTop = Math.max(
								0,
								focusTextareaTopPaddingPx - 26,
							);
						} else if (emptyLineCount === 1) {
							labelTop =
								focusTextareaTopPaddingPx +
								startLine * dynamicLineHeightPx -
								dynamicLineHeightPx +
								(dynamicLineHeightPx - 13) / 2;
						} else {
							labelTop =
								focusTextareaTopPaddingPx +
								startLine * dynamicLineHeightPx -
								dynamicSectionLabelOffsetPx;
						}

						const handlesTop = labelTop - sectionTop - 4;

						const sectionComments =
							sectionCommentsById[marker.id] ?? [];
						const isCommentOpen =
							openCommentSectionId === marker.id;

						return (
							<Fragment key={marker.id}>
							<div
								className="absolute left-0"
								onDragOver={(
									event: DragEvent<HTMLDivElement>,
								): void => {
									event.preventDefault();
									event.dataTransfer.dropEffect = "move";
									if (draggedSectionId) {
										setDragOverSectionId(marker.id);
									}
								}}
								onDrop={(
									event: DragEvent<HTMLDivElement>,
								): void => {
									event.preventDefault();
									handleSectionDrop(marker.id);
								}}
								style={{
									top: sectionTop,
									height: sectionHeight,
									width: draggedSectionId ? "100%" : "58px",
									pointerEvents: "auto",
									opacity:
										draggedSectionId === marker.id ? 0 : 1,
								}}
							>
								{/* Hover handles */}
								<div
									className={`section-handles-container absolute left-3 flex h-6 flex-row items-center gap-1 transition-opacity duration-150 ${
										isVisible &&
										openOptionsMenuSectionId !== marker.id &&
										openAddMenuSectionId !== marker.id
											? "opacity-100"
											: "opacity-0 pointer-events-none"
									}`}
									style={{
										top: `${handlesTop}px`,
									}}
								>
									<button
										type="button"
										aria-label="Ajouter section"
										aria-expanded={
											openAddMenuSectionId === marker.id
										}
										onClick={(): void =>
											onToggleAddMenu(marker.id)
										}
										className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-[5px] text-[#38383C] hover:bg-[#202027] hover:text-[#F3F4F6]"
									>
										<Plus size={20} strokeWidth={1.8} />
									</button>
									<button
										type="button"
										aria-label="Options et deplacement de la section"
										aria-expanded={
											openOptionsMenuSectionId ===
											marker.id
										}
										draggable
										onClick={(): void =>
											onToggleOptionsMenu(marker.id)
										}
										onDragStart={(
											event: DragEvent<HTMLButtonElement>,
										): void => {
											const height =
												heightLines *
												dynamicLineHeightPx;
											setDraggedSectionId(marker.id);
											setDraggedHeight(height + 20); // mb-5 gap (20px)
											setDragOverSectionId(null);
											event.dataTransfer.effectAllowed =
												"move";
											event.dataTransfer.setData(
												"application/x-nara-section-id",
												marker.id,
											);

											// Create custom drag image preview
											const linesText = text.split("\n");
											const sectionLines =
												linesText.slice(
													startLine,
													startLine + heightLines,
												);
											const dragImg =
												createFocusSectionDragImage(
													marker.label,
													sectionLines,
													computedLineStyle.fontFamily,
													computedLineStyle.fontSize
														? String(
																computedLineStyle.fontSize,
															)
														: undefined,
												);
											const _reflow =
												dragImg.offsetHeight;
											event.dataTransfer.setDragImage(
												dragImg,
												24,
												24,
											);
											removeFocusSectionDragImage(
												dragImg,
											);
										}}
										onDragEnd={(): void => {
											setDraggedSectionId(null);
											setDragOverSectionId(null);
											setDraggedHeight(0);
										}}
										className="inline-flex h-5 w-5 cursor-grab items-center justify-center rounded-[5px] text-[#38383C] hover:bg-[#202027] hover:text-[#F3F4F6] active:cursor-grabbing"
									>
										<GripVertical
											size={20}
											strokeWidth={1.8}
										/>
									</button>
								</div>

								{/* Add Menu */}
								{openAddMenuSectionId === marker.id && (
									<div className="section-menu-container absolute left-0 top-0 z-50">
										<SectionAddMenu
											onAddSection={(
												kind: SectionKind,
											): void => {
												handleAddSection(
													marker.id,
													kind,
												);
											}}
											onAddLine={(): void => {
												handleAddLine(marker.id);
												setOpenAddMenuSectionId(null);
											}}
										/>
									</div>
								)}

								{/* Options Menu */}
								{openOptionsMenuSectionId === marker.id && (
									<div className="section-menu-container absolute left-0 top-0 z-50">
										<SectionOptionsMenu
											options={getSectionOptions(
												marker.id,
											)}
											onToggleOption={(
												key: SectionOptionKey,
											): void =>
												handleToggleSectionOption(
													marker.id,
													key,
												)
											}
											onCreateAlternative={(): void =>
												handleCreateSectionAlternative(
													marker.id,
												)
											}
											onDuplicate={(): void =>
												handleDuplicateSection(
													marker.id,
												)
											}
											onDelete={(): void =>
												handleDeleteSection(marker.id)
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

							{/* Section message button (right gutter) */}
							<div
								className="absolute z-40"
								style={{
									top: sectionTop + 2,
									right: 0,
									transform: getSectionTransform(marker.id),
									transition: draggedSectionId
										? "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
										: "none",
									opacity:
										draggedSectionId === marker.id ? 0 : 1,
								}}
							>
								<button
									type="button"
									aria-label={`Messages de la section ${marker.label}`}
									aria-expanded={isCommentOpen}
									onClick={(): void =>
										onToggleSectionComment(marker.id)
									}
									className={`pointer-events-auto inline-flex h-7 items-center gap-1.5 rounded-[7px] px-2 text-[#767680] transition-all duration-150 hover:bg-[#202027] hover:text-[#F3F4F6] ${
										isCommentOpen
											? "bg-[#202027] text-[#F3F4F6] opacity-100"
											: isVisible ||
												  sectionComments.length > 0
												? "opacity-100"
												: "pointer-events-none opacity-0"
									}`}
								>
									<MessageSquare size={16} strokeWidth={1.8} />
									{sectionComments.length > 0 && (
										<span className="text-[12px] font-semibold leading-none">
											{sectionComments.length}
										</span>
									)}
								</button>

								{isCommentOpen && (
									<LineCommentOverlay
										comments={sectionComments}
										title={`Messages — ${marker.label}`}
										emptyLabel="Aucun message sur cette section."
										className="absolute right-0 top-9 z-50 w-[420px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[18px] border border-[var(--nara-comment-border)] bg-[var(--nara-comment-bg)] px-4 py-4 shadow-[var(--nara-comment-shadow)]"
										onAddComment={(body: string): void =>
											onAddSectionComment(
												marker.id,
												body,
											)
										}
										onClose={(): void =>
											onToggleSectionComment(marker.id)
										}
									/>
								)}
							</div>
						</Fragment>
						);
					},
				)}
			</div>

			{/* Mirrored Animated Sections Overlay (Visible only when dragging a section) */}
			{draggedSectionId && (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute left-0 right-0 top-0 select-none z-15"
					style={{
						height: textareaHeight,
						fontFamily: computedLineStyle.fontFamily,
						fontSize: computedLineStyle.fontSize,
						fontWeight: computedLineStyle.fontWeight,
						fontStyle: computedLineStyle.fontStyle,
					}}
				>
					{focusSectionRanges.map(
						({ marker, startLine, heightLines }) => {
							const sectionTop =
								focusTextareaTopPaddingPx +
								startLine * dynamicLineHeightPx;
							const sectionHeight =
								heightLines * dynamicLineHeightPx;
							const transform = getSectionTransform(marker.id);

							// Get the lines belonging to this section from the text
							const lines = text.split("\n");
							const sectionLines = lines.slice(
								startLine,
								startLine + heightLines,
							);

							return (
								<div
									key={`mirror-${marker.id}`}
									className="absolute right-0"
									style={{
										left: focusTextareaLeftPaddingPx,
										top: sectionTop,
										height: sectionHeight,
										transform,
										transition:
											"transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
										opacity:
											draggedSectionId === marker.id
												? 0
												: 1,
									}}
								>
									{sectionLines.map((lineText, idx) => {
										const lineTop =
											idx * dynamicLineHeightPx;
										return (
											<div
												key={idx}
												className="absolute left-0 right-0 text-[#F3F4F6]"
												style={{
													top: lineTop,
													height: dynamicLineHeightPx,
													lineHeight: `${dynamicLineHeightPx}px`,
												}}
											>
												{lineText}
											</div>
										);
									})}
								</div>
							);
						},
					)}
				</div>
			)}

			{activeGripLineIdx !== null && (
				<button
					type="button"
					aria-label="Deplacer la ligne"
					draggable
					onDragStart={(
						event: DragEvent<HTMLButtonElement>,
					): void => {
						const lineIdx = activeGripLineIdx;
						// Defer state update: hiding the source element
						// synchronously during dragstart cancels the
						// native drag in Chrome.
						window.setTimeout((): void => {
							setDraggedLineIdx(lineIdx);
							setDragOverLineIdx(null);
						}, 0);

						event.dataTransfer.effectAllowed = "move";
						event.dataTransfer.setData(
							"application/x-nara-line-idx",
							String(activeGripLineIdx),
						);

						// Create custom drag image preview for the line
						const lines = text.split("\n");
						const lineText = lines[activeGripLineIdx] || "";

						const dragImg = window.document.createElement("div");
						dragImg.style.position = "fixed";
						dragImg.style.top = "0";
						dragImg.style.left = "0";
						dragImg.style.zIndex = "-1000";
						dragImg.style.pointerEvents = "none";
						dragImg.style.color = "#F3F4F6";
						dragImg.style.fontFamily =
							computedLineStyle.fontFamily ?? "Georgia, serif";
						dragImg.style.fontSize = computedLineStyle.fontSize
							? String(computedLineStyle.fontSize)
							: "18px";
						dragImg.innerText = lineText.trim();

						window.document.body.appendChild(dragImg);
						const _reflow = dragImg.offsetHeight;
						event.dataTransfer.setDragImage(dragImg, 15, 10);
						window.setTimeout(() => {
							dragImg.style.top = "-10000px";
						}, 0);
						window.setTimeout(() => dragImg.remove(), 180);
					}}
					onDragEnd={(): void => {
						setDraggedLineIdx(null);
						setDragOverLineIdx(null);
					}}
					className={`absolute inline-flex h-5 w-5 cursor-grab items-center justify-center rounded-[5px] text-[#38383C] hover:bg-[#202027] hover:text-[#F3F4F6] active:cursor-grabbing z-30 transition-opacity ${
						draggedLineIdx !== null
							? "opacity-0 pointer-events-none"
							: ""
					}`}
					style={{
						left: `${focusTextareaLeftPaddingPx - 26}px`,
						top: `${focusTextareaTopPaddingPx + activeGripLineIdx * dynamicLineHeightPx + (dynamicLineHeightPx - 20) / 2}px`,
					}}
				>
					<GripVertical size={18} strokeWidth={1.8} />
				</button>
			)}

			<textarea
				ref={textareaRef}
				aria-label={`Lyrics ${document.title}`}
				value={text}
				onChange={(event: ChangeEvent<HTMLTextAreaElement>): void => {
					onSelectionChange(null);
					onFormatSelectionChange(null);
					onDocumentTextChange(event.target.value);
				}}
				onDragOver={(event: DragEvent<HTMLTextAreaElement>): void => {
					if (draggedSectionId) {
						event.preventDefault();
					} else if (draggedLineIdx !== null) {
						event.preventDefault();

						// Calculate target line index
						const rect =
							event.currentTarget.getBoundingClientRect();
						const relativeY =
							event.clientY -
							rect.top -
							focusTextareaTopPaddingPx +
							event.currentTarget.scrollTop;
						const lineIndex = Math.max(
							0,
							Math.floor(relativeY / dynamicLineHeightPx),
						);

						setDragOverLineIdx(lineIndex);

						// Determine placement (before or after the line)
						const lineTop =
							focusTextareaTopPaddingPx +
							lineIndex * dynamicLineHeightPx;
						const midPoint = lineTop + dynamicLineHeightPx / 2;
						const cursorY =
							event.clientY -
							rect.top +
							event.currentTarget.scrollTop;

						setLineDropPlacement(
							cursorY < midPoint ? "before" : "after",
						);
					}
				}}
				onDrop={(event: DragEvent<HTMLTextAreaElement>): void => {
					if (draggedSectionId) {
						event.preventDefault();
						if (dragOverSectionId) {
							handleSectionDrop(dragOverSectionId);
						} else {
							setDraggedSectionId(null);
							setDragOverSectionId(null);
							setDraggedHeight(0);
						}
					}
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
					...computedLineStyle,
					height: textareaHeight,
					minHeight: "calc(100dvh - 150px)",
					paddingLeft: focusTextareaLeftPaddingPx,
					paddingTop: focusTextareaTopPaddingPx,
					...(draggedSectionId
						? {
								color: "transparent",
								WebkitTextFillColor: "transparent",
								caretColor: "transparent",
							}
						: {}),
				}}
			/>

			{/* Format marks overlay (bold/italic/strike/underline/color) —
			    mounted after the textarea so it paints above the glyphs */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute left-0 right-0 top-0 z-30 select-none"
				style={{
					height: textareaHeight,
				}}
			>
				{mappings.map(
					({ line, section, lineIndex }): ReactElement | null => {
						const lineText = textareaLines[lineIndex] ?? line.text;

						if (
							lineText !== line.text ||
							!lineContentHasMarks(line.content)
						) {
							return null;
						}

						return (
							<div
								key={`format-${line.id}`}
								className="absolute right-0"
								style={{
									left: focusTextareaLeftPaddingPx,
									top:
										focusTextareaTopPaddingPx +
										lineIndex * dynamicLineHeightPx,
									height: dynamicLineHeightPx,
									transform: getSectionTransform(section.id),
									transition: draggedSectionId
										? "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
										: "none",
									opacity:
										draggedSectionId === section.id ? 0 : 1,
								}}
							>
								<FormatMarksOverlay
									lineStyle={computedLineStyle}
									segments={getLineMarkSegments(line.content)}
								/>
							</div>
						);
					},
				)}
			</div>
		</div>
	);
}
