"use client";

import { useState, type ReactElement } from "react";
import LyricsEditorWorkspaceTiptap from "@/components/lyricsEditor/LyricsEditorWorkspaceTiptap";
import LyricsHeader, {
	type LyricsFormat,
} from "@/components/lyricsEditor/LyricsHeader";

const initialFormat: LyricsFormat = {
	fontFamily: "Arimo",
	fontSize: "16",
	blockSize: "large",
	bold: false,
	italic: false,
	strike: false,
	underline: false,
	align: "left",
	textColor: "#F3F4F6",
	textOpacity: 100,
	showTrackPanel: false,
	showInspectorTools: true,
	rhymes: false,
	annotation: false,
	syllables: true,
};

export default function LyricsEditorScreen(): ReactElement {
	const [format, setFormat] = useState<LyricsFormat>(initialFormat);

	function handleFormatChange(patch: Partial<LyricsFormat>): void {
		setFormat((currentFormat: LyricsFormat): LyricsFormat => ({
			...currentFormat,
			...patch,
		}));
	}

	return (
		<section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--nara-surface)]">
			<LyricsHeader format={format} onFormatChange={handleFormatChange} />
			<LyricsEditorWorkspaceTiptap
				format={format}
				onFormatChange={handleFormatChange}
			/>
		</section>
	);
}
