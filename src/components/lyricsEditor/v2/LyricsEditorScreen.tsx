"use client";

import { useEffect, useState, type ReactElement } from "react";
import LyricsEditorWorkspace from "@/components/lyricsEditor/v2/LyricsEditorWorkspace";
import LyricsHeader, {
	type LyricsFormat,
} from "@/components/lyricsEditor/v2/LyricsHeader";

const initialFormat: LyricsFormat = {
	fontFamily: "Georgia",
	fontSize: "18",
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
	focusMode: true, // Default to true in V2!
	hideAppChrome: true, // Default to hide sidebar navigation in Focus Mode V2!
	rhymes: false,
	annotation: false,
	syllables: true,
};

export default function LyricsEditorScreen(): ReactElement {
	const [format, setFormat] = useState<LyricsFormat>(initialFormat);

	useEffect((): (() => void) => {
		window.dispatchEvent(
			new CustomEvent("nara:lyrics-focus-mode", {
				detail: {
					enabled: format.focusMode,
					hideChrome: format.focusMode && format.hideAppChrome,
				},
			}),
		);

		return (): void => {
			window.dispatchEvent(
				new CustomEvent("nara:lyrics-focus-mode", {
					detail: { enabled: false, hideChrome: false },
				}),
			);
		};
	}, [format.focusMode, format.hideAppChrome]);

	function handleFormatChange(patch: Partial<LyricsFormat>): void {
		setFormat(
			(currentFormat: LyricsFormat): LyricsFormat => ({
				...currentFormat,
				...patch,
				focusMode: true,
			}),
		);
	}

	return (
		<section className="flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden ">
			<LyricsHeader format={format} onFormatChange={handleFormatChange} />
			<LyricsEditorWorkspace
				format={format}
				onFormatChange={handleFormatChange}
			/>
		</section>
	);
}
