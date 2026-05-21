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
	useCallback,
	useEffect,
	useRef,
	useState,
	type ChangeEvent,
	type DragEvent,
	type KeyboardEvent,
	type PointerEvent,
	type ReactElement,
} from "react";

export type TrackMarker = {
	accentColor?: string;
	id: string;
	label: string;
	timeLabel: string;
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
	onCurrentTimeChange?: (seconds: number) => void;
	onDurationChange?: (seconds: number) => void;
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

const defaultTrackMarkers: TrackMarker[] = [
	{
		accentColor: "#DA069A",
		id: "intro",
		label: "Intro",
		timeLabel: "0:16",
		positionPercent: 5.93,
	},
	{
		accentColor: "#8B5CF6",
		id: "couplet-1",
		label: "Couplet 1",
		timeLabel: "0:31",
		positionPercent: 11.48,
	},
	{
		accentColor: "#F4B84A",
		id: "refrain",
		label: "refrain",
		timeLabel: "0:46",
		positionPercent: 17.04,
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
	onCurrentTimeChange,
	onDurationChange,
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
	const [isSeeking, setIsSeeking] = useState<boolean>(false);
	const [isAdjustingVolume, setIsAdjustingVolume] = useState<boolean>(false);
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

	const revokeLocalTrackUrl = useCallback((): void => {
		if (fileObjectUrlRef.current) {
			window.URL.revokeObjectURL(fileObjectUrlRef.current);
			fileObjectUrlRef.current = null;
		}
	}, []);

	useEffect((): void => {
		currentTimeRef.current = clampedCurrentTimeSeconds;
	}, [clampedCurrentTimeSeconds]);

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
		<section
			aria-label="Lecteur de piste"
			data-track-player="true"
			className="shrink-0 border-t border-[var(--nara-track-border)] bg-[var(--nara-track-bg)] px-4 text-[var(--nara-track-text)] sm:px-7"
		>
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
			<div className="grid h-[104px] grid-cols-1 items-center gap-4 overflow-hidden lg:grid-cols-[auto_minmax(0,1fr)_auto]">
				<div className="flex min-w-0 items-center gap-3">
					<button
						type="button"
						aria-label="Choisir une piste audio"
						onClick={(): void => setIsPickerOpen(true)}
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
						className={`group relative h-14 w-14 shrink-0 overflow-hidden rounded-[8px] border bg-[var(--nara-surface)] outline-none transition-colors sm:h-16 sm:w-16 ${
							isCoverDragActive
								? "border-[#DA069A]"
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
						<span className="absolute inset-0 grid place-items-center bg-[#0D0D10]/0 text-[#F3F4F6] opacity-0 transition-[background-color,opacity] group-hover:bg-[#0D0D10]/70 group-hover:opacity-100 group-focus-visible:bg-[#0D0D10]/70 group-focus-visible:opacity-100">
							<Upload size={16} strokeWidth={1.8} />
						</span>
						{isCoverDragActive && (
							<span className="absolute inset-0 grid place-items-center bg-[#0D0D10]/80 text-[#F3F4F6]">
								<FileAudio size={18} strokeWidth={1.8} />
							</span>
						)}
					</button>

					<div className="min-w-0">
						<p className="truncate text-[13px] font-medium leading-none text-[var(--nara-track-text)] sm:text-[14px]">
							{effectiveTitle}
						</p>
						<div className="mt-3 flex items-center gap-1.5">
							<TransportButton
								label="Reculer de cinq secondes"
								onClick={(): void => seekBySeconds(-5)}
							>
								<SkipBack size={17} strokeWidth={1.7} />
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
								className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--nara-track-play-bg)] text-[var(--nara-track-play-text)] transition-colors hover:opacity-90"
							>
								{isPlaying ? (
									<Pause
										size={16}
										fill="currentColor"
										strokeWidth={2}
									/>
								) : (
									<Play
										size={16}
										fill="currentColor"
										strokeWidth={2}
										className="ml-0.5"
									/>
								)}
							</button>
							<TransportButton
								label="Avancer de cinq secondes"
								onClick={(): void => seekBySeconds(5)}
							>
								<SkipForward size={17} strokeWidth={1.7} />
							</TransportButton>
						</div>
					</div>
				</div>

				<div className="min-w-0 px-0 lg:px-3">
					<div
						ref={timelineRef}
						className="relative h-[96px] select-none touch-none"
					>
						{markers.map(
							(
								marker: TrackMarker,
								index: number,
							): ReactElement => {
								const isTopLane: boolean = index % 2 === 0;
								const accentColor: string =
									marker.accentColor ?? "#DA069A";

								return (
									<button
										type="button"
										key={marker.id}
										aria-label={`Deplacer le repere ${marker.label}`}
										onPointerDown={(
											event: PointerEvent<HTMLButtonElement>,
										): void => {
											handleMarkerPointerDown(
												event,
												marker.id,
											);
										}}
										onPointerMove={handleMarkerPointerMove}
										onPointerUp={handleMarkerPointerEnd}
										onPointerCancel={handleMarkerPointerEnd}
										className={`absolute z-10 h-[42px] w-[72px] -translate-x-1/2 cursor-ew-resize bg-transparent text-center outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--nara-track-text)] ${
											isTopLane
												? "top-[6px]"
												: "bottom-[6px]"
										}`}
										style={{
											left: `${marker.positionPercent}%`,
										}}
									>
										<span
											aria-hidden="true"
											className={`absolute left-1/2 z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${
												isTopLane
													? "bottom-[-5px]"
													: "top-[-5px]"
											}`}
											style={{
												backgroundColor: accentColor,
												boxShadow:
													"0 0 0 2px var(--nara-track-bg)",
											}}
										/>
										<span
											aria-hidden="true"
											className={`absolute left-1/2 z-10 h-[14px] w-px -translate-x-1/2 ${
												isTopLane
													? "bottom-[5px]"
													: "top-[5px]"
											}`}
											style={{
												backgroundColor: accentColor,
											}}
										/>
										<span
											className={`pointer-events-none absolute left-1/2 flex w-[104px] -translate-x-1/2 flex-col items-center ${
												isTopLane ? "top-0" : "bottom-0"
											}`}
										>
											<span className="block max-w-[104px] truncate whitespace-nowrap text-[11px] font-bold uppercase leading-none text-[var(--nara-track-text)]">
												{marker.label}
											</span>
											<span className="mt-0.5 block text-[9px] font-semibold leading-none text-[var(--nara-track-muted)]">
												{marker.timeLabel}
											</span>
										</span>
									</button>
								);
							},
						)}

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
							onPointerDown={handleSeekPointerDown}
							onPointerMove={handleSeekPointerMove}
							onPointerUp={handleSeekPointerEnd}
							onPointerCancel={handleSeekPointerEnd}
							onKeyDown={handleSeekKeyDown}
							className="absolute left-0 right-0 top-1/2 h-[5px] -translate-y-1/2 cursor-pointer touch-none overflow-hidden rounded-full bg-[var(--nara-track-progress-bg)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--nara-track-text)]"
						>
							<div
								className="h-full rounded-full bg-[#DA069A]"
								style={{ width: `${clampedProgress}%` }}
							/>
						</div>
					</div>
				</div>

				<div className="flex min-w-0 items-center justify-between gap-5 lg:justify-end">
					<span className="shrink-0 text-[10px] font-medium tabular-nums text-[var(--nara-track-text)]">
						{currentTimeLabel}/{totalTimeLabel}
					</span>
					<div className="flex w-[104px] shrink-0 items-center gap-2">
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
								<VolumeX size={14} strokeWidth={1.8} />
							) : clampedVolume < 50 ? (
								<Volume1 size={14} strokeWidth={1.8} />
							) : (
								<Volume2 size={14} strokeWidth={1.8} />
							)}
						</button>
						<div
							ref={volumeSliderRef}
							role="slider"
							aria-label="Volume"
							aria-valuemin={0}
							aria-valuemax={100}
							aria-valuenow={Math.round(clampedVolume)}
							tabIndex={0}
							onPointerDown={handleVolumePointerDown}
							onPointerMove={handleVolumePointerMove}
							onPointerUp={handleVolumePointerEnd}
							onPointerCancel={handleVolumePointerEnd}
							onKeyDown={handleVolumeKeyDown}
							className="h-[12px] flex-1 cursor-pointer touch-none rounded-full outline-none focus-visible:ring-1 focus-visible:ring-[var(--nara-track-text)]"
						>
							<div className="mt-[4.5px] h-[3px] rounded-full bg-[var(--nara-track-volume-bg)]">
								<div
									className="h-full rounded-full bg-[var(--nara-track-volume-fill)]"
									style={{ width: `${clampedVolume}%` }}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
			{isPickerOpen && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Choisir une piste"
					className="fixed inset-0 z-40 flex items-end bg-[#0A0A0C]/70 px-6 py-6"
					onClick={(): void => setIsPickerOpen(false)}
				>
					<div
						className="w-full max-w-[380px] rounded-[10px] border border-[#2C2C32] bg-[#17171C] p-3 text-[#F3F4F6] shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
						onClick={(event): void => event.stopPropagation()}
					>
						<div className="mb-3 flex items-center justify-between">
							<p className="text-[13px] font-semibold">
								Choisir une piste
							</p>
							<button
								type="button"
								aria-label="Fermer"
								onClick={(): void => setIsPickerOpen(false)}
								className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[#A1A1AA] transition-colors hover:bg-[#222229] hover:text-white"
							>
								<X size={15} strokeWidth={1.8} />
							</button>
						</div>

						<button
							type="button"
							onClick={openFileDialog}
							className="flex w-full items-center gap-3 rounded-[8px] border border-[#2C2C32] bg-[#0D0D10] px-3 py-2.5 text-left transition-colors hover:border-[#4A4A52] hover:bg-[#111116]"
						>
							<FileAudio
								size={18}
								strokeWidth={1.8}
								className="text-[#DA069A]"
							/>
							<span className="min-w-0">
								<span className="block text-[12px] font-semibold">
									Depuis fichiers
								</span>
								<span className="block text-[11px] text-[#A1A1AA]">
									mp3, wav, m4a, ogg, mp4
								</span>
							</span>
						</button>

						<div className="mt-3 border-t border-[#2C2C32] pt-3">
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
												className="flex items-center gap-2 rounded-[7px] px-2 py-2 text-left transition-colors hover:bg-[#222229]"
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
								<p className="rounded-[7px] border border-dashed border-[#2C2C32] px-3 py-3 text-[11px] text-[#A1A1AA]">
									Aucune piste sauvegardee pour l instant.
								</p>
							)}
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
