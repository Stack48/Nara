"use client";

import {
	FileAudio,
	Library,
	Music,
	Pause,
	Play,
	SkipBack,
	SkipForward,
	Upload,
	Volume1,
	Volume2,
	VolumeX,
	X,
} from "lucide-react";
import Image from "next/image";
import {
	Fragment,
	useCallback,
	useEffect,
	useRef,
	useState,
	type ChangeEvent,
	type DragEvent,
	type FormEvent,
	type KeyboardEvent,
	type MouseEvent,
	type PointerEvent,
	type ReactElement,
} from "react";
import LiquidGlass from "../LiquidGlass/LiquidGlass";

export type TrackMarker = {
	accentColor?: string;
	id: string;
	label: string;
	timeLabel: string;
	positionPercent: number;
};

export type TrackMarkerCreatePayload = {
	label: string;
	positionPercent: number;
};

export type MusicAssetTrack = {
	audioSrc: string;
	coverSrc?: string;
	id: string;
	title: string;
};

export type TrackPlayerProps = {
	audioSrc?: string;
	coverSrc?: string;
	currentTimeSeconds?: number;
	durationSeconds?: number;
	isPlaying: boolean;
	markers?: TrackMarker[];
	musicAssets?: MusicAssetTrack[];
	onCollapsedChange?: (isCollapsed: boolean) => void;
	onCurrentTimeChange?: (seconds: number) => void;
	onDurationChange?: (seconds: number) => void;
	onMarkerCreate?: (payload: TrackMarkerCreatePayload) => void;
	onMarkerPositionChange?: (
		markerId: string,
		positionPercent: number,
	) => void;
	onPlaybackEnd?: () => void;
	onTrackChange?: (track: MusicAssetTrack) => void;
	onTogglePlay: () => void;
	onVolumeChange?: (volumePercent: number) => void;
	title?: string;
	volumePercent?: number;
};

type TimelineContextMenuState = {
	label: string;
	positionPercent: number;
	timeLabel: string;
	x: number;
	y: number;
};

const defaultTrackMarkers: TrackMarker[] = [
	{
		accentColor: "#b4783c",
		id: "intro",
		label: "Intro",
		timeLabel: "0:16",
		positionPercent: 6,
	},
	{
		accentColor: "#8B5CF6",
		id: "couplet-1",
		label: "Couplet 1",
		timeLabel: "1:12",
		positionPercent: 32,
	},
	{
		accentColor: "#F4B84A",
		id: "refrain",
		label: "Refrain",
		timeLabel: "2:18",
		positionPercent: 62,
	},
];

function TransportButton({
	children,
	label,
	onClick,
}: {
	children: ReactElement;
	label: string;
	onClick?: () => void;
}): ReactElement {
	return (
		<button
			type="button"
			aria-label={label}
			onClick={onClick}
			className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--nara-track-control)] transition-colors hover:bg-[var(--nara-track-control-hover-bg)] hover:text-[var(--nara-track-control-hover-text)]"
		>
			{children}
		</button>
	);
}

function formatTrackTimeLabel(seconds: number): string {
	const safeSeconds: number = Math.max(0, Math.round(seconds));
	const minutes: number = Math.floor(safeSeconds / 60);
	const remainingSeconds: number = safeSeconds % 60;

	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getTrackTitleFromFile(file: File): string {
	const fileNameParts: string[] = file.name.split(".");

	if (fileNameParts.length <= 1) {
		return file.name;
	}

	return fileNameParts.slice(0, -1).join(".");
}

function isSupportedTrackFile(file: File): boolean {
	const supportedExtensions: Set<string> = new Set([
		"aac",
		"flac",
		"m4a",
		"mp3",
		"mp4",
		"ogg",
		"wav",
		"webm",
	]);
	const fileExtension: string =
		file.name.split(".").pop()?.toLowerCase() ?? "";

	return (
		file.type.startsWith("audio/") ||
		file.type === "video/mp4" ||
		supportedExtensions.has(fileExtension)
	);
}

export function TrackPlayer({
	audioSrc,
	coverSrc = "/app-preview.png",
	currentTimeSeconds = 0,
	durationSeconds = 270,
	isPlaying,
	markers = defaultTrackMarkers,
	musicAssets = [],
	onCollapsedChange,
	onCurrentTimeChange,
	onDurationChange,
	onMarkerCreate,
	onMarkerPositionChange,
	onPlaybackEnd,
	onTrackChange,
	onTogglePlay,
	onVolumeChange,
	title = "Nom de la piste",
	volumePercent = 58,
}: TrackPlayerProps): ReactElement {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const markerNameInputRef = useRef<HTMLInputElement | null>(null);
	const timelineRef = useRef<HTMLDivElement | null>(null);
	const volumeSliderRef = useRef<HTMLDivElement | null>(null);
	const currentTimeRef = useRef<number>(currentTimeSeconds);
	const previousAudibleVolumeRef = useRef<number>(
		volumePercent > 0 ? volumePercent : 58,
	);
	const fileObjectUrlRef = useRef<string | null>(null);
	const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(
		null,
	);
	const [isCoverDragActive, setIsCoverDragActive] = useState<boolean>(false);
	const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
	const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
	const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
		x: 0,
		y: 0,
	});
	const [customWidth, setCustomWidth] = useState<number | null>(null);
	const [customHeight, setCustomHeight] = useState<number | null>(null);
	const playerSectionRef = useRef<HTMLElement | null>(null);
	const dragStateRef = useRef<{
		startX: number;
		startY: number;
		originX: number;
		originY: number;
		moved: boolean;
	} | null>(null);
	const resizeStateRef = useRef<{
		startX: number;
		startY: number;
		startWidth: number;
		startHeight: number;
		edgeX: number;
		edgeY: number;
	} | null>(null);

	function handleDockPointerDown(
		event: PointerEvent<HTMLButtonElement>,
	): void {
		dragStateRef.current = {
			startX: event.clientX,
			startY: event.clientY,
			originX: dragOffset.x,
			originY: dragOffset.y,
			moved: false,
		};
		try {
			event.currentTarget.setPointerCapture(event.pointerId);
		} catch {
			/* pointer capture optional */
		}
	}

	function handleDockPointerMove(
		event: PointerEvent<HTMLButtonElement>,
	): void {
		const state = dragStateRef.current;
		if (!state) {
			return;
		}
		const deltaX: number = event.clientX - state.startX;
		const deltaY: number = event.clientY - state.startY;
		if (Math.abs(deltaX) + Math.abs(deltaY) > 4) {
			state.moved = true;
		}
		setDragOffset({ x: state.originX + deltaX, y: state.originY + deltaY });
	}

	function handleDockPointerUp(): void {
		const state = dragStateRef.current;
		dragStateRef.current = null;
		if (state && !state.moved) {
			setIsCollapsed((value: boolean): boolean => !value);
		}
	}

	function handleResizePointerDown(
		event: PointerEvent<HTMLSpanElement>,
		edgeX: number,
		edgeY: number,
	): void {
		event.preventDefault();
		event.stopPropagation();
		const rect: DOMRect | undefined =
			playerSectionRef.current?.getBoundingClientRect();
		resizeStateRef.current = {
			startX: event.clientX,
			startY: event.clientY,
			startWidth: rect?.width ?? 0,
			startHeight: rect?.height ?? 0,
			edgeX,
			edgeY,
		};
		try {
			event.currentTarget.setPointerCapture(event.pointerId);
		} catch {
			/* pointer capture optional */
		}
	}

	function handleResizePointerMove(
		event: PointerEvent<HTMLSpanElement>,
	): void {
		const state = resizeStateRef.current;
		if (!state) {
			return;
		}
		if (state.edgeX !== 0) {
			const deltaX: number = event.clientX - state.startX;
			const nextWidth: number =
				state.startWidth + deltaX * 2 * state.edgeX;
			setCustomWidth(Math.max(480, Math.min(1600, nextWidth)));
		}
		if (state.edgeY !== 0) {
			// dock is anchored at the bottom: the top edge grows upward
			const deltaY: number = event.clientY - state.startY;
			const nextHeight: number = state.startHeight - deltaY;
			setCustomHeight(Math.max(96, Math.min(440, nextHeight)));
		}
	}

	function handleResizePointerUp(): void {
		resizeStateRef.current = null;
	}
	const [isSeeking, setIsSeeking] = useState<boolean>(false);
	const [isAdjustingVolume, setIsAdjustingVolume] = useState<boolean>(false);
	const [timelineContextMenu, setTimelineContextMenu] =
		useState<TimelineContextMenuState | null>(null);
	const [selectedTrack, setSelectedTrack] = useState<MusicAssetTrack | null>(
		null,
	);
	const effectiveAudioSrc: string | undefined =
		selectedTrack?.audioSrc ?? audioSrc;
	const effectiveCoverSrc: string = selectedTrack?.coverSrc ?? coverSrc;
	const effectiveTitle: string = selectedTrack?.title ?? title;
	const hasAudioSource: boolean =
		typeof effectiveAudioSrc === "string" && effectiveAudioSrc !== "";
	const safeDurationSeconds: number = Math.max(1, durationSeconds);
	const clampedCurrentTimeSeconds: number = Math.max(
		0,
		Math.min(safeDurationSeconds, currentTimeSeconds),
	);
	const currentTimeLabel: string = formatTrackTimeLabel(
		clampedCurrentTimeSeconds,
	);
	const totalTimeLabel: string = formatTrackTimeLabel(safeDurationSeconds);
	const clampedProgress: number =
		(clampedCurrentTimeSeconds / safeDurationSeconds) * 100;
	const clampedVolume: number = Math.max(0, Math.min(100, volumePercent));

	useEffect((): void => {
		onCollapsedChange?.(isCollapsed);
	}, [isCollapsed, onCollapsedChange]);

	const revokeLocalTrackUrl = useCallback((): void => {
		if (fileObjectUrlRef.current) {
			window.URL.revokeObjectURL(fileObjectUrlRef.current);
			fileObjectUrlRef.current = null;
		}
	}, []);

	useEffect((): void => {
		currentTimeRef.current = clampedCurrentTimeSeconds;
	}, [clampedCurrentTimeSeconds]);

	useEffect((): void => {
		if (!timelineContextMenu) {
			return;
		}

		window.requestAnimationFrame((): void => {
			markerNameInputRef.current?.focus();
			markerNameInputRef.current?.select();
		});
	}, [timelineContextMenu]);

	useEffect((): (() => void) => {
		return (): void => {
			revokeLocalTrackUrl();
		};
	}, [revokeLocalTrackUrl]);

	useEffect((): void => {
		if (clampedVolume > 0) {
			previousAudibleVolumeRef.current = clampedVolume;
		}
	}, [clampedVolume]);

	useEffect((): void => {
		const audioElement: HTMLAudioElement | null = audioRef.current;

		if (!audioElement) {
			return;
		}

		audioElement.volume = clampedVolume / 100;
	}, [clampedVolume]);

	useEffect((): void => {
		const audioElement: HTMLAudioElement | null = audioRef.current;

		if (!hasAudioSource || !audioElement) {
			return;
		}

		if (
			Math.abs(audioElement.currentTime - clampedCurrentTimeSeconds) > 0.4
		) {
			audioElement.currentTime = clampedCurrentTimeSeconds;
		}
	}, [clampedCurrentTimeSeconds, hasAudioSource]);

	useEffect((): void => {
		const audioElement: HTMLAudioElement | null = audioRef.current;

		if (!hasAudioSource || !audioElement) {
			return;
		}

		if (!isPlaying) {
			audioElement.pause();
			return;
		}

		void audioElement.play().catch((): void => {
			onPlaybackEnd?.();
		});
	}, [hasAudioSource, isPlaying, onPlaybackEnd]);

	useEffect((): (() => void) | void => {
		if (hasAudioSource || !isPlaying || !onCurrentTimeChange) {
			return;
		}

		let previousTimestamp: number = window.performance.now();

		const intervalId: number = window.setInterval((): void => {
			const timestamp: number = window.performance.now();
			const deltaSeconds: number = (timestamp - previousTimestamp) / 1000;
			previousTimestamp = timestamp;
			const nextSeconds: number = Math.min(
				safeDurationSeconds,
				currentTimeRef.current + deltaSeconds,
			);

			currentTimeRef.current = nextSeconds;
			onCurrentTimeChange(nextSeconds);

			if (nextSeconds >= safeDurationSeconds) {
				onPlaybackEnd?.();
				window.clearInterval(intervalId);
			}
		}, 200);

		return (): void => {
			window.clearInterval(intervalId);
		};
	}, [
		hasAudioSource,
		isPlaying,
		onCurrentTimeChange,
		onPlaybackEnd,
		safeDurationSeconds,
	]);

	function getPointerPositionPercent(clientX: number): number {
		const timelineElement: HTMLDivElement | null = timelineRef.current;

		if (!timelineElement) {
			return 0;
		}

		const timelineRect: DOMRect = timelineElement.getBoundingClientRect();
		const rawPercent: number =
			((clientX - timelineRect.left) / timelineRect.width) * 100;

		return Math.max(0, Math.min(100, rawPercent));
	}

	function getTimelineContextMenuPosition(
		clientX: number,
		clientY: number,
	): {
		x: number;
		y: number;
	} {
		const menuWidth = 220;
		const menuHeight = 132;
		const viewportPadding = 12;

		return {
			x: Math.min(
				window.innerWidth - menuWidth - viewportPadding,
				Math.max(viewportPadding, clientX),
			),
			y: Math.min(
				window.innerHeight - menuHeight - viewportPadding,
				Math.max(viewportPadding, clientY),
			),
		};
	}

	function seekToPointer(clientX: number): void {
		const nextPercent: number = getPointerPositionPercent(clientX);
		const nextSeconds: number = (safeDurationSeconds * nextPercent) / 100;

		if (hasAudioSource && audioRef.current) {
			audioRef.current.currentTime = nextSeconds;
		}

		onCurrentTimeChange?.(nextSeconds);
	}

	function seekBySeconds(offsetSeconds: number): void {
		const nextSeconds: number = Math.max(
			0,
			Math.min(
				safeDurationSeconds,
				clampedCurrentTimeSeconds + offsetSeconds,
			),
		);

		if (hasAudioSource && audioRef.current) {
			audioRef.current.currentTime = nextSeconds;
		}

		onCurrentTimeChange?.(nextSeconds);
	}

	function getVolumePercentFromPointer(clientX: number): number {
		const volumeSliderElement: HTMLDivElement | null =
			volumeSliderRef.current;

		if (!volumeSliderElement) {
			return clampedVolume;
		}

		const volumeRect: DOMRect = volumeSliderElement.getBoundingClientRect();
		const rawPercent: number =
			((clientX - volumeRect.left) / volumeRect.width) * 100;

		return Math.max(0, Math.min(100, rawPercent));
	}

	function setVolumeFromPointer(clientX: number): void {
		onVolumeChange?.(getVolumePercentFromPointer(clientX));
	}

	function adjustVolumeByPercent(offsetPercent: number): void {
		onVolumeChange?.(
			Math.max(0, Math.min(100, clampedVolume + offsetPercent)),
		);
	}

	function selectTrack(
		track: MusicAssetTrack,
		shouldRevokeLocalUrl: boolean,
	): void {
		if (shouldRevokeLocalUrl) {
			revokeLocalTrackUrl();
		}

		setSelectedTrack(track);
		onTrackChange?.(track);
		onCurrentTimeChange?.(0);
		setIsPickerOpen(false);
	}

	function selectFileTrack(file: File): void {
		if (!isSupportedTrackFile(file)) {
			return;
		}

		revokeLocalTrackUrl();

		const nextAudioSrc: string = window.URL.createObjectURL(file);
		fileObjectUrlRef.current = nextAudioSrc;

		selectTrack(
			{
				audioSrc: nextAudioSrc,
				id: `local-${file.name}-${file.lastModified}`,
				title: getTrackTitleFromFile(file),
			},
			false,
		);
	}

	function handleFileInputChange(event: ChangeEvent<HTMLInputElement>): void {
		const file: File | undefined = event.target.files?.[0];

		if (file) {
			selectFileTrack(file);
		}

		event.target.value = "";
	}

	function handleCoverDrop(event: DragEvent<HTMLButtonElement>): void {
		event.preventDefault();
		setIsCoverDragActive(false);

		const file: File | undefined = Array.from(
			event.dataTransfer.files,
		).find(isSupportedTrackFile);

		if (file) {
			selectFileTrack(file);
		}
	}

	function openFileDialog(): void {
		fileInputRef.current?.click();
	}

	function handleVolumeIconClick(): void {
		if (clampedVolume > 0) {
			onVolumeChange?.(0);
			return;
		}

		onVolumeChange?.(Math.max(8, previousAudibleVolumeRef.current));
	}

	function handleMarkerPointerDown(
		event: PointerEvent<HTMLButtonElement>,
		markerId: string,
	): void {
		if (event.button !== 0) {
			return;
		}

		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		setDraggingMarkerId(markerId);
		onMarkerPositionChange?.(
			markerId,
			getPointerPositionPercent(event.clientX),
		);
	}

	function handleMarkerPointerMove(
		event: PointerEvent<HTMLButtonElement>,
	): void {
		if (!draggingMarkerId) {
			return;
		}

		onMarkerPositionChange?.(
			draggingMarkerId,
			getPointerPositionPercent(event.clientX),
		);
	}

	function handleMarkerPointerEnd(
		event: PointerEvent<HTMLButtonElement>,
	): void {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}

		setDraggingMarkerId(null);
	}

	function handleSeekPointerDown(event: PointerEvent<HTMLDivElement>): void {
		if (event.button !== 0) {
			return;
		}

		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		setIsSeeking(true);
		seekToPointer(event.clientX);
	}

	function handleSeekPointerMove(event: PointerEvent<HTMLDivElement>): void {
		if (!isSeeking) {
			return;
		}

		seekToPointer(event.clientX);
	}

	function handleSeekPointerEnd(event: PointerEvent<HTMLDivElement>): void {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}

		setIsSeeking(false);
	}

	function handleSeekKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
		const smallStepSeconds = 5;
		const largeStepSeconds = 15;

		if (event.key === "ArrowLeft") {
			event.preventDefault();
			seekBySeconds(-smallStepSeconds);
			return;
		}

		if (event.key === "ArrowRight") {
			event.preventDefault();
			seekBySeconds(smallStepSeconds);
			return;
		}

		if (event.key === "PageDown") {
			event.preventDefault();
			seekBySeconds(-largeStepSeconds);
			return;
		}

		if (event.key === "PageUp") {
			event.preventDefault();
			seekBySeconds(largeStepSeconds);
			return;
		}

		if (event.key === "Home") {
			event.preventDefault();
			onCurrentTimeChange?.(0);
			return;
		}

		if (event.key === "End") {
			event.preventDefault();
			onCurrentTimeChange?.(safeDurationSeconds);
		}
	}

	function handleVolumePointerDown(
		event: PointerEvent<HTMLDivElement>,
	): void {
		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		setIsAdjustingVolume(true);
		setVolumeFromPointer(event.clientX);
	}

	function handleVolumePointerMove(
		event: PointerEvent<HTMLDivElement>,
	): void {
		if (!isAdjustingVolume) {
			return;
		}

		setVolumeFromPointer(event.clientX);
	}

	function handleVolumePointerEnd(event: PointerEvent<HTMLDivElement>): void {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}

		setIsAdjustingVolume(false);
	}

	function handleVolumeKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
		if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
			event.preventDefault();
			adjustVolumeByPercent(-5);
			return;
		}

		if (event.key === "ArrowRight" || event.key === "ArrowUp") {
			event.preventDefault();
			adjustVolumeByPercent(5);
			return;
		}

		if (event.key === "Home") {
			event.preventDefault();
			onVolumeChange?.(0);
			return;
		}

		if (event.key === "End") {
			event.preventDefault();
			onVolumeChange?.(100);
		}
	}

	function handleTimelineContextMenu(
		event: MouseEvent<HTMLDivElement>,
	): void {
		if (!onMarkerCreate) {
			return;
		}

		event.preventDefault();
		const nextPositionPercent = getPointerPositionPercent(event.clientX);
		const nextSeconds = (safeDurationSeconds * nextPositionPercent) / 100;
		const nextMenuPosition = getTimelineContextMenuPosition(
			event.clientX,
			event.clientY,
		);

		setTimelineContextMenu({
			label: `Repere ${markers.length + 1}`,
			positionPercent: nextPositionPercent,
			timeLabel: formatTrackTimeLabel(nextSeconds),
			x: nextMenuPosition.x,
			y: nextMenuPosition.y,
		});
	}

	function handleTimelineMarkerSubmit(
		event: FormEvent<HTMLFormElement>,
	): void {
		event.preventDefault();

		if (!timelineContextMenu) {
			return;
		}

		onMarkerCreate?.({
			label: timelineContextMenu.label,
			positionPercent: timelineContextMenu.positionPercent,
		});
		setTimelineContextMenu(null);
	}

	function handleAudioLoadedMetadata(): void {
		const audioElement: HTMLAudioElement | null = audioRef.current;

		if (!audioElement || !Number.isFinite(audioElement.duration)) {
			return;
		}

		onDurationChange?.(audioElement.duration);
	}

	function handleAudioTimeUpdate(): void {
		const audioElement: HTMLAudioElement | null = audioRef.current;

		if (!audioElement) {
			return;
		}

		onCurrentTimeChange?.(audioElement.currentTime);
	}

	function handleAudioEnded(): void {
		onCurrentTimeChange?.(safeDurationSeconds);
		onPlaybackEnd?.();
	}

	return (
		<>
			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-[80] flex justify-center px-[clamp(18px,4vw,72px)] pb-4">
				<section
					ref={playerSectionRef}
					aria-label="Lecteur de piste"
					data-track-player="true"
					style={{
						transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
						width: customWidth ? `${customWidth}px` : undefined,
						height:
							!isCollapsed && customHeight
								? `${customHeight}px`
								: undefined,
					}}
					className="pointer-events-auto relative flex w-full min-w-[480px] flex-col overflow-hidden rounded-[16px]  text-[var(--nara-track-text)] transition-[border-color] duration-200 hover:border-white/[0.24]"
				>
					<span
						aria-hidden="true"
						onPointerDown={(
							event: PointerEvent<HTMLSpanElement>,
						): void => handleResizePointerDown(event, -1, 0)}
						onPointerMove={handleResizePointerMove}
						onPointerUp={handleResizePointerUp}
						onPointerCancel={handleResizePointerUp}
						className="absolute inset-y-0 left-0 z-30 w-2 cursor-ew-resize touch-none"
					/>
					<span
						aria-hidden="true"
						onPointerDown={(
							event: PointerEvent<HTMLSpanElement>,
						): void => handleResizePointerDown(event, 1, 0)}
						onPointerMove={handleResizePointerMove}
						onPointerUp={handleResizePointerUp}
						onPointerCancel={handleResizePointerUp}
						className="absolute inset-y-0 right-0 z-30 w-2 cursor-ew-resize touch-none"
					/>
					<span
						aria-hidden="true"
						onPointerDown={(
							event: PointerEvent<HTMLSpanElement>,
						): void => handleResizePointerDown(event, -1, -1)}
						onPointerMove={handleResizePointerMove}
						onPointerUp={handleResizePointerUp}
						onPointerCancel={handleResizePointerUp}
						className="absolute left-0 top-0 z-40 h-4 w-4 cursor-nwse-resize touch-none"
					/>
					<span
						aria-hidden="true"
						onPointerDown={(
							event: PointerEvent<HTMLSpanElement>,
						): void => handleResizePointerDown(event, 1, -1)}
						onPointerMove={handleResizePointerMove}
						onPointerUp={handleResizePointerUp}
						onPointerCancel={handleResizePointerUp}
						className="absolute right-0 top-0 z-40 h-4 w-4 cursor-nesw-resize touch-none"
					/>

					<LiquidGlass
						refractiveIndex={1.33} // indice du verre (1=air, 1.5=verre, 2=diamant, 1.33=eau)
						thickness={35} // force de réfraction aux bords
						bezelWidth={1} // largeur du bord courbé (0-1)
						refractionLevel={1} // intensité displacement (0-1) ← le tien était 60 !
						specularOpacity={0.7} // intensité du reflet/rim lumineux (0-1)
						specularSaturation={50} // couleur dans le reflet
						// lightAngle={225} // direction lumière (225 = haut-gauche)
						blurLevel={0.7} // flou léger par-dessus
						borderRadius={22} // ≈ 16px de radius
						filterQuality={2}
						className="w-full h-full !flex-col !items-stretch !justify-start !p-0 !bg-[var(--nara-surface-raised)]"
					>
						<button
							type="button"
							aria-label={
								isCollapsed
									? "Deplier le lecteur"
									: "Replier le lecteur"
							}
							aria-expanded={!isCollapsed}
							onPointerDown={handleDockPointerDown}
							onPointerMove={handleDockPointerMove}
							onPointerUp={handleDockPointerUp}
							onPointerCancel={handleDockPointerUp}
							className="group z-20 flex w-full shrink-0 cursor-grab touch-none items-center justify-center pt-1.5 pb-0.5 active:cursor-grabbing"
						>
							<span className="h-1.5 w-10 rounded-full bg-[var(--nara-border)] transition-colors group-hover:bg-[var(--nara-border-strong)]" />
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept="audio/*,video/mp4,.aac,.flac,.m4a,.mp3,.mp4,.ogg,.wav,.webm"
							onChange={handleFileInputChange}
							className="sr-only"
						/>
						{hasAudioSource && (
							<audio
								ref={audioRef}
								src={effectiveAudioSrc}
								preload="metadata"
								onLoadedMetadata={handleAudioLoadedMetadata}
								onTimeUpdate={handleAudioTimeUpdate}
								onEnded={handleAudioEnded}
							/>
						)}
						{isCollapsed && (
							<div className="flex flex-1 items-center gap-3 px-4 pb-3 sm:px-6">
								<div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[7px] border border-[var(--nara-border)] bg-[var(--nara-surface)]">
									<Image
										src={effectiveCoverSrc}
										alt=""
										fill
										sizes="36px"
										className="object-cover"
									/>
								</div>
								<p className="w-[150px] shrink-0 truncate text-[12px] font-medium text-[var(--nara-track-text)]">
									{effectiveTitle}
								</p>
								<span className="shrink-0 text-[10px] font-semibold tabular-nums text-[var(--nara-track-muted)]">
									{currentTimeLabel}
								</span>
								<div className="h-[4px] min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--nara-track-progress-bg)]">
									<div
										className="h-full rounded-full bg-[#b4783c]"
										style={{ width: `${clampedProgress}%` }}
									/>
								</div>
								<span className="shrink-0 text-[10px] font-semibold tabular-nums text-[var(--nara-track-muted)]">
									{totalTimeLabel}
								</span>
								<button
									type="button"
									aria-label={
										isPlaying
											? "Mettre en pause"
											: "Lire la piste"
									}
									aria-pressed={isPlaying}
									onClick={onTogglePlay}
									className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--nara-track-play-bg)] text-[var(--nara-track-play-text)] transition-colors hover:opacity-90"
								>
									{isPlaying ? (
										<Pause
											size={15}
											fill="currentColor"
											strokeWidth={2}
										/>
									) : (
										<Play
											size={15}
											fill="currentColor"
											strokeWidth={2}
											className="ml-0.5"
										/>
									)}
								</button>
							</div>
						)}
						{!isCollapsed && (
							<div className="grid flex-1 content-center grid-cols-1 items-center gap-5 overflow-hidden px-5 pb-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
								<div className="flex min-w-0 items-center gap-3">
									<button
										type="button"
										aria-label="Choisir une piste audio"
										onClick={(): void =>
											setIsPickerOpen(true)
										}
										onDragEnter={(
											event: DragEvent<HTMLButtonElement>,
										): void => {
											event.preventDefault();
											setIsCoverDragActive(true);
										}}
										onDragOver={(
											event: DragEvent<HTMLButtonElement>,
										): void => {
											event.preventDefault();
										}}
										onDragLeave={(
											event: DragEvent<HTMLButtonElement>,
										): void => {
											if (
												!event.currentTarget.contains(
													event.relatedTarget as Node | null,
												)
											) {
												setIsCoverDragActive(false);
											}
										}}
										onDrop={handleCoverDrop}
										className={`group relative h-14 w-14 shrink-0 overflow-hidden rounded-[8px] border bg-[var(--nara-surface)] outline-none transition-colors ${
											isCoverDragActive
												? "border-[#b4783c]"
												: "border-[var(--nara-track-border)] hover:border-[var(--nara-border-strong)] focus-visible:border-[var(--nara-track-text)]"
										}`}
									>
										<Image
											src={effectiveCoverSrc}
											alt=""
											fill
											sizes="64px"
											className="object-cover"
											priority={false}
										/>
										<span className="absolute inset-0 grid place-items-center bg-[var(--nara-shell-bg)]/0 text-[var(--nara-text-primary)] opacity-0 transition-[background-color,opacity] group-hover:bg-[var(--nara-shell-bg)]/70 group-hover:opacity-100 group-focus-visible:bg-[var(--nara-shell-bg)]/70 group-focus-visible:opacity-100">
											<Upload
												size={16}
												strokeWidth={1.8}
											/>
										</span>
										{isCoverDragActive && (
											<span className="absolute inset-0 grid place-items-center bg-[var(--nara-shell-bg)]/80 text-[var(--nara-text-primary)]">
												<FileAudio
													size={18}
													strokeWidth={1.8}
												/>
											</span>
										)}
									</button>

									<div className="min-w-0">
										<p className="truncate text-[13px] font-medium leading-none text-[var(--nara-track-text)] sm:text-[14px]">
											{effectiveTitle}
										</p>
										<div className="mt-2 flex items-center gap-1.5">
											<TransportButton
												label="Reculer de cinq secondes"
												onClick={(): void =>
													seekBySeconds(-5)
												}
											>
												<SkipBack
													size={17}
													strokeWidth={1.7}
												/>
											</TransportButton>
											<button
												type="button"
												aria-label={
													isPlaying
														? "Mettre en pause"
														: "Lire la piste"
												}
												aria-pressed={isPlaying}
												onClick={onTogglePlay}
												className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--nara-track-play-bg)] text-[var(--nara-track-play-text)] transition-colors hover:opacity-90"
											>
												{isPlaying ? (
													<Pause
														size={17}
														fill="currentColor"
														strokeWidth={2}
													/>
												) : (
													<Play
														size={17}
														fill="currentColor"
														strokeWidth={2}
														className="ml-0.5"
													/>
												)}
											</button>
											<TransportButton
												label="Avancer de cinq secondes"
												onClick={(): void =>
													seekBySeconds(5)
												}
											>
												<SkipForward
													size={17}
													strokeWidth={1.7}
												/>
											</TransportButton>
										</div>
									</div>
								</div>

								<div className="min-w-0 px-0 lg:px-3">
									<div
										ref={timelineRef}
										className="relative h-[58px] select-none touch-none"
									>
										{markers.map(
											(
												marker: TrackMarker,
												index: number,
											): ReactElement => {
												const isTopLane: boolean =
													index % 2 === 0;
												const accentColor: string =
													"#b4783c";

												return (
													<Fragment
														key={marker.id}
													>
														{/* Label — non-interactive, anchored to the timeline top/bottom so it does not block seeking or right-click */}
														<span
															aria-hidden="true"
															className={`pointer-events-none absolute z-10 flex w-[100px] -translate-x-1/2 flex-col items-center ${
																isTopLane
																	? "top-0"
																	: "bottom-0"
															}`}
															style={{
																left: `${marker.positionPercent}%`,
															}}
														>
															<span className="block max-w-[104px] truncate whitespace-nowrap text-[11px] font-bold uppercase leading-none text-[var(--nara-track-text)]">
																{marker.label}
															</span>
															<span className="mt-0.5 block text-[9px] font-semibold leading-none text-[var(--nara-track-muted)]">
																{
																	marker.timeLabel
																}
															</span>
														</span>

														{/* Drag handle — small zone around the dot only */}
														<button
															type="button"
															aria-label={`Deplacer le repere ${marker.label}`}
															onPointerDown={(
																event: PointerEvent<HTMLButtonElement>,
															): void => {
																handleMarkerPointerDown(
																	event,
																	marker.id,
																);
															}}
															onPointerMove={
																handleMarkerPointerMove
															}
															onPointerUp={
																handleMarkerPointerEnd
															}
															onPointerCancel={
																handleMarkerPointerEnd
															}
															className="absolute top-1/2 z-20 grid h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-transparent outline-none cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--nara-track-text)]"
															style={{
																left: `${marker.positionPercent}%`,
															}}
														>
															<span
																aria-hidden="true"
																className="h-[11px] w-[11px] rounded-full"
																style={{
																	backgroundColor:
																		accentColor,
																	boxShadow:
																		"0 0 0 3px #121215, 0 0 10px rgba(218,6,154,0.45)",
																}}
															/>
														</button>
													</Fragment>
												);
											},
										)}

										<div
											aria-hidden="true"
											className="absolute left-0 right-0 top-1/2 z-0 h-[5px] -translate-y-1/2 rounded-full bg-[var(--nara-track-progress-bg)]"
										>
											<div
												className="h-full rounded-full bg-[#b4783c]"
												style={{
													width: `${clampedProgress}%`,
												}}
											/>
										</div>

										<div
											role="slider"
											aria-label="Position de lecture"
											aria-valuemin={0}
											aria-valuemax={safeDurationSeconds}
											aria-valuenow={Math.round(
												clampedCurrentTimeSeconds,
											)}
											aria-valuetext={`${currentTimeLabel} sur ${totalTimeLabel}`}
											tabIndex={0}
											onPointerDown={
												handleSeekPointerDown
											}
											onPointerMove={
												handleSeekPointerMove
											}
											onPointerUp={handleSeekPointerEnd}
											onPointerCancel={
												handleSeekPointerEnd
											}
											onKeyDown={handleSeekKeyDown}
											onContextMenu={
												handleTimelineContextMenu
											}
											className="absolute left-0 right-0 top-1/2 z-10 h-8 -translate-y-1/2 cursor-pointer touch-none rounded-full bg-transparent outline-none focus-visible:ring-1 focus-visible:ring-[var(--nara-track-text)]"
										/>
									</div>
								</div>

								<div className="flex min-w-0 items-center justify-between gap-5 lg:justify-end">
									<span className="shrink-0 text-[10px] font-semibold tabular-nums text-[var(--nara-track-text)]">
										{currentTimeLabel}/{totalTimeLabel}
									</span>
									<div className="flex w-[120px] shrink-0 items-center gap-2">
										<button
											type="button"
											aria-label={
												clampedVolume > 0
													? "Couper le son"
													: "Remettre le son"
											}
											onClick={handleVolumeIconClick}
											className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] text-[var(--nara-track-control)] transition-colors hover:bg-[var(--nara-track-control-hover-bg)] hover:text-[var(--nara-track-control-hover-text)]"
										>
											{clampedVolume <= 0 ? (
												<VolumeX
													size={14}
													strokeWidth={1.8}
												/>
											) : clampedVolume < 50 ? (
												<Volume1
													size={14}
													strokeWidth={1.8}
												/>
											) : (
												<Volume2
													size={14}
													strokeWidth={1.8}
												/>
											)}
										</button>
										<div
											ref={volumeSliderRef}
											role="slider"
											aria-label="Volume"
											aria-valuemin={0}
											aria-valuemax={100}
											aria-valuenow={Math.round(
												clampedVolume,
											)}
											tabIndex={0}
											onPointerDown={
												handleVolumePointerDown
											}
											onPointerMove={
												handleVolumePointerMove
											}
											onPointerUp={handleVolumePointerEnd}
											onPointerCancel={
												handleVolumePointerEnd
											}
											onKeyDown={handleVolumeKeyDown}
											className="h-[18px] flex-1 cursor-pointer touch-none rounded-full outline-none focus-visible:ring-1 focus-visible:ring-[var(--nara-track-text)]"
										>
											<div className="mt-[7px] h-[3px] rounded-full bg-[var(--nara-track-volume-bg)]">
												<div
													className="h-full rounded-full bg-[var(--nara-track-volume-fill)]"
													style={{
														width: `${clampedVolume}%`,
													}}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</LiquidGlass>
				</section>
			</div>
			{timelineContextMenu && (
				<div
					className="fixed inset-0 z-99"
					onPointerDown={(): void =>
						setTimelineContextMenu(null)
					}
				>
					<form
						role="menu"
						aria-label="Ajouter un repere de piste"
						onSubmit={handleTimelineMarkerSubmit}
						onPointerDown={(event): void =>
							event.stopPropagation()
						}
						onKeyDown={(event): void => {
							if (event.key === "Escape") {
								event.preventDefault();
								setTimelineContextMenu(null);
							}
						}}
						className="fixed w-[220px] rounded-[8px] border border-[var(--nara-track-border)] bg-[var(--nara-track-bg)] p-2.5 text-[var(--nara-track-text)] shadow-[0_8px_24px_rgba(0,0,0,0.24)]"
						style={{
							left: timelineContextMenu.x,
							top: timelineContextMenu.y,
						}}
					>
						<div className="mb-2 flex items-center justify-between gap-3">
							<p className="text-[12px] font-semibold">
								Ajouter un repere
							</p>
							<span className="text-[10px] font-semibold tabular-nums text-[var(--nara-track-muted)]">
								{timelineContextMenu.timeLabel}
							</span>
						</div>
						<label className="mb-1 block text-[10px] font-semibold text-[var(--nara-track-muted)]">
							Nom
						</label>
						<input
							ref={markerNameInputRef}
							value={timelineContextMenu.label}
							onChange={(
								event: ChangeEvent<HTMLInputElement>,
							): void => {
								setTimelineContextMenu(
									(
										currentMenu: TimelineContextMenuState | null,
									): TimelineContextMenuState | null =>
										currentMenu
											? {
													...currentMenu,
													label: event
														.target
														.value,
												}
											: null,
								);
							}}
							className="h-8 w-full rounded-[6px] border border-[var(--nara-track-border)] bg-[var(--nara-surface)] px-2 text-[12px] font-medium outline-none focus:border-[#b4783c]"
						/>
						<div className="mt-2 flex items-center justify-end gap-1.5">
							<button
								type="button"
								onClick={(): void =>
									setTimelineContextMenu(null)
								}
								className="h-7 rounded-[6px] px-2 text-[11px] font-semibold text-[var(--nara-track-muted)] transition-colors hover:bg-[var(--nara-track-control-hover-bg)] hover:text-[var(--nara-track-control-hover-text)]"
							>
								Annuler
							</button>
							<button
								type="submit"
								className="h-7 rounded-[6px] bg-[#b4783c] px-2.5 text-[11px] font-bold text-[var(--nara-text-primary)] transition-colors hover:bg-[#8b5a2b]"
							>
								Ajouter
							</button>
						</div>
					</form>
				</div>
			)}
			{isPickerOpen && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Choisir une piste"
					className="fixed inset-0 z-999 flex items-end bg-[var(--nara-shell-bg)]/70 px-6 py-6"
					onClick={(): void => setIsPickerOpen(false)}
				>
					<div
						className="w-full max-w-[380px] rounded-[10px] border border-[var(--nara-border)] z-999 p-3 text-[var(--nara-text-primary)] shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
						onClick={(event): void => event.stopPropagation()}
					>
						<div className="mb-3 flex items-center justify-between z-999">
							<p className="text-[13px] font-semibold">
								Choisir une piste
							</p>
							<button
								type="button"
								aria-label="Fermer"
								onClick={(): void => setIsPickerOpen(false)}
								className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--nara-text-secondary)] transition-colors hover:bg-[var(--nara-surface-soft)] hover:text-[var(--nara-text-primary)]"
							>
								<X size={15} strokeWidth={1.8} />
							</button>
						</div>

						<button
							type="button"
							onClick={openFileDialog}
							className="flex w-full items-center gap-3 rounded-[8px] border border-[var(--nara-border)] bg-[var(--nara-shell-bg)] px-3 py-2.5 text-left transition-colors hover:border-[var(--nara-border-strong)] hover:bg-[var(--nara-surface)]"
						>
							<FileAudio
								size={18}
								strokeWidth={1.8}
								className="text-[#b4783c]"
							/>
							<span className="min-w-0">
								<span className="block text-[12px] font-semibold">
									Depuis fichiers
								</span>
								<span className="block text-[11px] text-[var(--nara-text-secondary)]">
									mp3, wav, m4a, ogg, mp4
								</span>
							</span>
						</button>

						<div className="mt-3 border-t border-[var(--nara-border)] pt-3">
							<div className="mb-2 flex items-center gap-2 text-[12px] font-semibold">
								<Library size={15} strokeWidth={1.8} />
								Music Assets
							</div>
							{musicAssets.length > 0 ? (
								<div className="flex max-h-[180px] flex-col gap-1 overflow-y-auto">
									{musicAssets.map(
										(
											asset: MusicAssetTrack,
										): ReactElement => (
											<button
												type="button"
												key={asset.id}
												onClick={(): void =>
													selectTrack(asset, true)
												}
												className="flex items-center gap-2 rounded-[7px] px-2 py-2 text-left transition-colors hover:bg-[var(--nara-surface-soft)]"
											>
												<Music
													size={15}
													strokeWidth={1.8}
												/>
												<span className="truncate text-[12px]">
													{asset.title}
												</span>
											</button>
										),
									)}
								</div>
							) : (
								<p className="rounded-[7px] border border-dashed border-[var(--nara-border)] px-3 py-3 text-[11px] text-[var(--nara-text-secondary)]">
									Aucune piste sauvegardee pour l instant.
								</p>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
}
