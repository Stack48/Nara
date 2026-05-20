"use client";

import { useState, type ReactElement } from "react";
import LyricsEditorWorkspace from "@/components/LyricsEditor/LyricsEditorWorkspace";
import LyricsHeader, {
	type LyricsFormat,
} from "@/components/LyricsEditor/LyricsHeader";

const initialFormat: LyricsFormat = {
	fontFamily: "Arimo",
	fontSize: "16",
	blockSize: "large",
	bold: false,
	italic: false,
	strike: false,
	underline: false,
	align: "left",
	activeTool: "automation",
	rhymes: false,
	annotation: false,
	syllables: false,
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
		<section className="flex h-[calc(100dvh-104px)] min-h-0 flex-col overflow-hidden rounded-tl-[12px] border border-[#2C2C32] bg-[#17171C]">
			<LyricsHeader format={format} onFormatChange={handleFormatChange} />
			<LyricsEditorWorkspace format={format} />
		</section>
	);
}
