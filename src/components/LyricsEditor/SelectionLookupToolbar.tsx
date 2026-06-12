"use client";

import { Search } from "lucide-react";
import type { ReactElement } from "react";
import type { TextLookupSelection } from "./FocusLyricsDocument";
import type { SectionKind } from "./lyricsEditorStorage";

export type LyricsInspectorLookupTarget =
	| "rhymes"
	| "synonyms"
	| "antonyms"
	| "lexical"
	| "all";

export type SelectionLookupToolbarProps = {
	isFocusMode: boolean;
	onClose: () => void;
	onSearch: (target: LyricsInspectorLookupTarget) => void;
	onTransformSelection: (kind: SectionKind) => void;
	selection: TextLookupSelection;
};

const editableSectionKinds: Exclude<SectionKind, "untitled">[] = [
	"intro",
	"couplet",
	"refrain",
	"pont",
];

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

export default function SelectionLookupToolbar({
	isFocusMode,
	onClose,
	onSearch,
	onTransformSelection,
	selection,
}: SelectionLookupToolbarProps): ReactElement {
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
