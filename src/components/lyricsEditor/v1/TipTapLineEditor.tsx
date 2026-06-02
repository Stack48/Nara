"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactElement,
} from "react";
import type { JSONContent } from "@tiptap/core";
import {
	getLyricsTextColorCss,
	type LyricsFormat,
} from "@/components/lyricsEditor/v1/LyricsHeader";

export type TipTapLineUpdate = {
	content: JSONContent;
	html: string;
	isEmpty: boolean;
	isGrowing: boolean;
	isTypingAtEnd: boolean;
	text: string;
};

export type TipTapTextSelection = {
	from: number;
	lineId: string;
	rect: {
		bottom: number;
		height: number;
		left: number;
		right: number;
		top: number;
		width: number;
	};
	sectionId: string;
	text: string;
	to: number;
};

export type TipTapCursorPresence = {
	cursorOffset: number;
	lineId: string;
	sectionId: string;
};

export type TipTapLineEditorProps = {
	content: JSONContent;
	format: LyricsFormat;
	isActive: boolean;
	lineId: string;
	lineNumber: number;
	onBackspaceEmptyAtStart: () => void;
	onChange: (update: TipTapLineUpdate) => void;
	onEnter: () => void;
	onFormatSnapshotChange: (patch: Partial<LyricsFormat>) => void;
	onFocus: () => void;
	onMoveFocus: (direction: "next" | "previous") => void;
	onPasteLines: (lines: string[]) => void;
	onCursorPresenceChange: (presence: TipTapCursorPresence) => void;
	onTextSelectionChange: (selection: TipTapTextSelection | null) => void;
	sectionId: string;
	style: CSSProperties;
};

function isSelectionAtTextEnd(editor: Editor): boolean {
	const { selection } = editor.state;

	return (
		selection.empty &&
		selection.$from.parentOffset === selection.$from.parent.content.size
	);
}

function isSelectionAtTextStart(editor: Editor): boolean {
	const { selection } = editor.state;

	return selection.empty && selection.$from.parentOffset === 0;
}

function createPlainRect(rect: DOMRect): TipTapTextSelection["rect"] {
	return {
		bottom: rect.bottom,
		height: rect.height,
		left: rect.left,
		right: rect.right,
		top: rect.top,
		width: rect.width,
	};
}

function getCurrentSelectionRect(): TipTapTextSelection["rect"] | null {
	if (typeof window === "undefined") {
		return null;
	}

	const selection: Selection | null = window.getSelection();

	if (!selection || selection.rangeCount === 0) {
		return null;
	}

	const range: Range = selection.getRangeAt(0);
	const boundingRect: DOMRect = range.getBoundingClientRect();

	if (boundingRect.width > 0 || boundingRect.height > 0) {
		return createPlainRect(boundingRect);
	}

	const firstRect: DOMRect | undefined = Array.from(
		range.getClientRects(),
	)[0];

	return firstRect ? createPlainRect(firstRect) : null;
}

function getSelectedEditorText(editor: Editor): string {
	const { from, to, empty } = editor.state.selection;

	if (empty) {
		return "";
	}

	return editor.state.doc.textBetween(from, to, " ").trim();
}

function getCursorOffset(editor: Editor): number {
	return editor.state.selection.$from.parentOffset;
}

function normalizeTextStyleColor(
	color: unknown,
): Pick<LyricsFormat, "textColor" | "textOpacity"> {
	if (typeof color !== "string" || color.trim().length === 0) {
		return {
			textColor: "#F3F4F6",
			textOpacity: 100,
		};
	}

	const colorValue: string = color.trim();
	const hexMatch: RegExpMatchArray | null = colorValue.match(
		/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
	);

	if (hexMatch) {
		const hexValue: string = hexMatch[1];
		const textColor: string =
			hexValue.length === 3
				? `#${hexValue
						.split("")
						.map(
							(character: string): string =>
								character + character,
						)
						.join("")
						.toUpperCase()}`
				: `#${hexValue.toUpperCase()}`;

		return {
			textColor,
			textOpacity: 100,
		};
	}

	const rgbaMatch: RegExpMatchArray | null = colorValue.match(
		/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)$/i,
	);

	if (rgbaMatch) {
		const red: number = Math.min(Math.max(Number(rgbaMatch[1]), 0), 255);
		const green: number = Math.min(Math.max(Number(rgbaMatch[2]), 0), 255);
		const blue: number = Math.min(Math.max(Number(rgbaMatch[3]), 0), 255);
		const alpha: number = rgbaMatch[4] ? Number(rgbaMatch[4]) : 1;
		const textColor: string = `#${(
			(1 << 24) +
			(red << 16) +
			(green << 8) +
			blue
		)
			.toString(16)
			.slice(1)
			.toUpperCase()}`;

		return {
			textColor,
			textOpacity: Math.round(Math.min(Math.max(alpha, 0), 1) * 100),
		};
	}

	return {
		textColor: "#F3F4F6",
		textOpacity: 100,
	};
}

function getNearbyTextColorSnapshot(
	editor: Editor,
): Pick<LyricsFormat, "textColor" | "textOpacity"> | null {
	const { doc, schema, selection } = editor.state;
	const textStyleMark = schema.marks.textStyle;

	if (!selection.empty || !textStyleMark) {
		return null;
	}

	function readTextColor(
		from: number,
		to: number,
	): unknown | null | undefined {
		let color: unknown | null = null;
		let hasText = false;

		doc.nodesBetween(from, to, (node): boolean => {
			if (!node.isText) {
				return true;
			}

			hasText = true;
			color =
				node.marks.find((mark): boolean => mark.type === textStyleMark)
					?.attrs.color ?? null;

			return false;
		});

		return hasText ? color : undefined;
	}

	const cursorPosition: number = selection.from;
	const colorBefore: unknown | null | undefined =
		cursorPosition > 0
			? readTextColor(Math.max(0, cursorPosition - 1), cursorPosition)
			: undefined;

	if (colorBefore !== undefined) {
		return normalizeTextStyleColor(colorBefore);
	}

	const colorAfter: unknown | null | undefined =
		cursorPosition < doc.content.size
			? readTextColor(
					cursorPosition,
					Math.min(doc.content.size, cursorPosition + 1),
				)
			: undefined;

	return colorAfter !== undefined
		? normalizeTextStyleColor(colorAfter)
		: null;
}

function getFormatSnapshot(
	editor: Editor,
	options: { preferNearbyTextColor?: boolean } = {},
): Partial<LyricsFormat> {
	const textStyleAttributes: Record<string, unknown> =
		editor.getAttributes("textStyle");
	const colorSnapshot = options.preferNearbyTextColor
		? (getNearbyTextColorSnapshot(editor) ??
			normalizeTextStyleColor(textStyleAttributes.color))
		: normalizeTextStyleColor(textStyleAttributes.color);

	return {
		bold: editor.isActive("bold"),
		italic: editor.isActive("italic"),
		strike: editor.isActive("strike"),
		underline: editor.isActive("underline"),
		...colorSnapshot,
	};
}

export default function TipTapLineEditor({
	content,
	format,
	isActive,
	lineId,
	lineNumber,
	onBackspaceEmptyAtStart,
	onChange,
	onEnter,
	onFormatSnapshotChange,
	onFocus,
	onMoveFocus,
	onPasteLines,
	onCursorPresenceChange,
	onTextSelectionChange,
	sectionId,
	style,
}: TipTapLineEditorProps): ReactElement {
	const latestPropsRef = useRef({
		lineId,
		onBackspaceEmptyAtStart,
		onChange,
		onEnter,
		onFormatSnapshotChange,
		onFocus,
		onMoveFocus,
		onPasteLines,
		onCursorPresenceChange,
		onTextSelectionChange,
		sectionId,
	});
	const previousTextRef = useRef<string>("");
	const previousContentRef = useRef<string>(JSON.stringify(content));
	const isApplyingToolbarFormatRef = useRef<boolean>(false);
	const previousFormatRef = useRef({
		bold: format.bold,
		italic: format.italic,
		strike: format.strike,
		textColor: format.textColor,
		textOpacity: format.textOpacity,
		underline: format.underline,
	});
	const [isEmpty, setIsEmpty] = useState<boolean>(true);

	useEffect((): void => {
		latestPropsRef.current = {
			lineId,
			onBackspaceEmptyAtStart,
			onChange,
			onEnter,
			onFormatSnapshotChange,
			onFocus,
			onMoveFocus,
			onPasteLines,
			onCursorPresenceChange,
			onTextSelectionChange,
			sectionId,
		};
	}, [
		lineId,
		onBackspaceEmptyAtStart,
		onChange,
		onEnter,
		onFormatSnapshotChange,
		onFocus,
		onMoveFocus,
		onPasteLines,
		onCursorPresenceChange,
		onTextSelectionChange,
		sectionId,
	]);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				blockquote: false,
				bulletList: false,
				code: false,
				codeBlock: false,
				heading: false,
				horizontalRule: false,
				listItem: false,
				orderedList: false,
			}),
			TextStyle,
			Color,
			Placeholder.configure({
				placeholder: "Ecrire une ligne",
			}),
		],
		content,
		editorProps: {
			attributes: {
				"aria-label": `Ligne ${lineNumber}`,
				"data-line-editor": "true",
				"data-line-id": lineId,
				"data-section-id": sectionId,
				class: "relative z-10 min-h-[24px] w-full cursor-text select-text bg-transparent text-[#F3F4F6] outline-none transition-colors focus-visible:text-white [&_.ProseMirror]:min-h-[24px] [&_.ProseMirror]:outline-none [&_p]:m-0",
				role: "textbox",
				spellcheck: "false",
			},
			handleKeyDown: (_view, event): boolean => {
				if (event.key === "Enter") {
					event.preventDefault();
					latestPropsRef.current.onEnter();
					return true;
				}

				if (event.key === "ArrowDown") {
					event.preventDefault();
					latestPropsRef.current.onMoveFocus("next");
					return true;
				}

				if (event.key === "ArrowUp") {
					event.preventDefault();
					latestPropsRef.current.onMoveFocus("previous");
					return true;
				}

				if (
					event.key === "Backspace" &&
					editor &&
					isSelectionAtTextStart(editor) &&
					editor.state.doc.textContent.length === 0
				) {
					event.preventDefault();
					latestPropsRef.current.onBackspaceEmptyAtStart();
					return true;
				}

				return false;
			},
			handlePaste: (view, event): boolean => {
				const raw = event.clipboardData?.getData("text/plain") ?? "";
				const lines = raw
					.split(/\r?\n/)
					.map((line: string): string => line.trimEnd())
					.filter((line: string): boolean => line.length > 0);

				if (lines.length > 1) {
					event.preventDefault();
					latestPropsRef.current.onPasteLines(lines);
					return true;
				}

				if (raw.length > 0) {
					event.preventDefault();
					view.dispatch(view.state.tr.insertText(raw));
					return true;
				}

				return false;
			},
		},
		immediatelyRender: false,
		onCreate: ({ editor: createdEditor }): void => {
			previousTextRef.current = createdEditor.getText();
			setIsEmpty(createdEditor.isEmpty);
		},
		onFocus: ({ editor: focusedEditor }): void => {
			latestPropsRef.current.onFocus();
			latestPropsRef.current.onCursorPresenceChange({
				cursorOffset: getCursorOffset(focusedEditor),
				lineId: latestPropsRef.current.lineId,
				sectionId: latestPropsRef.current.sectionId,
			});
			latestPropsRef.current.onFormatSnapshotChange(
				getFormatSnapshot(focusedEditor),
			);
		},
		onUpdate: ({ editor: updatedEditor }): void => {
			const nextText = updatedEditor.getText();
			const nextIsEmpty = updatedEditor.isEmpty;
			const isGrowing = nextText.length > previousTextRef.current.length;
			const isTypingAtEnd = isSelectionAtTextEnd(updatedEditor);

			previousTextRef.current = nextText;
			previousContentRef.current = JSON.stringify(
				updatedEditor.getJSON(),
			);
			setIsEmpty(nextIsEmpty);

			latestPropsRef.current.onChange({
				content: updatedEditor.getJSON(),
				html: updatedEditor.getHTML(),
				isEmpty: nextIsEmpty,
				isGrowing,
				isTypingAtEnd,
				text: nextText,
			});
			latestPropsRef.current.onCursorPresenceChange({
				cursorOffset: getCursorOffset(updatedEditor),
				lineId: latestPropsRef.current.lineId,
				sectionId: latestPropsRef.current.sectionId,
			});
			latestPropsRef.current.onFormatSnapshotChange(
				getFormatSnapshot(updatedEditor, {
					preferNearbyTextColor: !isApplyingToolbarFormatRef.current,
				}),
			);
		},
		onSelectionUpdate: ({ editor: updatedEditor }): void => {
			const selectedText: string = getSelectedEditorText(updatedEditor);
			const selectionRect: TipTapTextSelection["rect"] | null =
				getCurrentSelectionRect();

			latestPropsRef.current.onCursorPresenceChange({
				cursorOffset: getCursorOffset(updatedEditor),
				lineId: latestPropsRef.current.lineId,
				sectionId: latestPropsRef.current.sectionId,
			});

			latestPropsRef.current.onFormatSnapshotChange(
				getFormatSnapshot(updatedEditor, {
					preferNearbyTextColor: !isApplyingToolbarFormatRef.current,
				}),
			);

			if (selectedText.length === 0 || selectionRect === null) {
				latestPropsRef.current.onTextSelectionChange(null);
				return;
			}

			latestPropsRef.current.onTextSelectionChange({
				from: updatedEditor.state.selection.from,
				lineId: latestPropsRef.current.lineId,
				rect: selectionRect,
				sectionId: latestPropsRef.current.sectionId,
				text: selectedText,
				to: updatedEditor.state.selection.to,
			});
		},
	});

	useEffect((): void => {
		const nextContentValue = JSON.stringify(content);

		if (
			!editor ||
			editor.isFocused ||
			previousContentRef.current === nextContentValue
		) {
			return;
		}

		previousContentRef.current = nextContentValue;
		editor.commands.setContent(content, { emitUpdate: false });
		previousTextRef.current = editor.getText();
		setIsEmpty(editor.isEmpty);
	}, [content, editor]);

	useEffect((): void => {
		if (!editor) {
			return;
		}

		const previousFormat = previousFormatRef.current;
		const shouldApplyToEditor = isActive;

		previousFormatRef.current = {
			bold: format.bold,
			italic: format.italic,
			strike: format.strike,
			textColor: format.textColor,
			textOpacity: format.textOpacity,
			underline: format.underline,
		};

		if (!shouldApplyToEditor) {
			return;
		}

		const chain = editor.chain().focus();
		let hasCommand = false;

		if (previousFormat.bold !== format.bold) {
			if (format.bold) {
				chain.setBold();
			} else {
				chain.unsetBold();
			}
			hasCommand = true;
		}

		if (previousFormat.italic !== format.italic) {
			if (format.italic) {
				chain.setItalic();
			} else {
				chain.unsetItalic();
			}
			hasCommand = true;
		}

		if (previousFormat.underline !== format.underline) {
			if (format.underline) {
				chain.setUnderline();
			} else {
				chain.unsetUnderline();
			}
			hasCommand = true;
		}

		if (previousFormat.strike !== format.strike) {
			if (format.strike) {
				chain.setStrike();
			} else {
				chain.unsetStrike();
			}
			hasCommand = true;
		}

		if (
			previousFormat.textColor !== format.textColor ||
			previousFormat.textOpacity !== format.textOpacity
		) {
			chain.setMark("textStyle", {
				color: getLyricsTextColorCss(format),
			});
			hasCommand = true;
		}

		if (hasCommand) {
			isApplyingToolbarFormatRef.current = true;
			chain.run();
			isApplyingToolbarFormatRef.current = false;
		}
	}, [
		editor,
		format,
		format.bold,
		format.italic,
		format.strike,
		format.textColor,
		format.textOpacity,
		format.underline,
		isActive,
	]);

	return (
		<div className="relative z-10 w-full min-w-0 select-text" style={style}>
			{isEmpty && (
				<span className="pointer-events-none absolute left-0 top-0 text-[#38383C]">
					Ecrire une ligne
				</span>
			)}
			<EditorContent editor={editor} />
		</div>
	);
}
