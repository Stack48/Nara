"use client";

import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Badge,
	Bold,
	ChevronDown,
	Disc,
	Focus,
	Italic,
	PanelLeftClose,
	PanelLeftOpen,
	Strikethrough,
	Underline,
	type LucideIcon,
} from "lucide-react";
import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type ChangeEvent,
	type CSSProperties,
	type MouseEvent,
	type PointerEvent,
	type ReactElement,
} from "react";

export type TextAlign = "left" | "center" | "right";

export type LyricsFormat = {
	fontFamily: string;
	fontSize: string;
	blockSize: string;
	bold: boolean;
	italic: boolean;
	strike: boolean;
	underline: boolean;
	align: TextAlign;
	textColor: string;
	textOpacity: number;
	showTrackPanel: boolean;
	showInspectorTools: boolean;
	focusMode: boolean;
	hideAppChrome: boolean;
	rhymes: boolean;
	annotation: boolean;
	syllables: boolean;
};

type SelectOption = {
	label: string;
	value: string;
};

type ToolbarButton = {
	label: string;
	icon: LucideIcon;
	active: boolean;
	onClick: () => void;
};

type ToolbarSelectProps = {
	ariaLabel: string;
	previewFont?: boolean;
	options: SelectOption[];
	value: string;
	widthClassName: string;
	onChange: (value: string) => void;
};

type LyricsHeaderProps = {
	format: LyricsFormat;
	onFormatChange: (patch: Partial<LyricsFormat>) => void;
};

type RgbColor = {
	b: number;
	g: number;
	r: number;
};

type HsvColor = {
	h: number;
	s: number;
	v: number;
};

type HslColor = {
	h: number;
	l: number;
	s: number;
};

type ColorInputMode = "hex" | "rgb" | "hsl" | "hsb";

const fontOptions: SelectOption[] = [
	{ label: "Arimo", value: "Arimo" },
	{ label: "Syne", value: "Syne" },
	{ label: "Arial", value: "Arial" },
	{ label: "Georgia", value: "Georgia" },
];

const fontSizeOptions: SelectOption[] = [
	{ label: "12", value: "12" },
	{ label: "14", value: "14" },
	{ label: "16", value: "16" },
	{ label: "18", value: "18" },
	{ label: "24", value: "24" },
	{ label: "28", value: "28" },
	{ label: "32", value: "32" },

];

const blockSizeOptions: SelectOption[] = [
	{ label: "Small", value: "small" },
	{ label: "Normal", value: "normal" },
	{ label: "Large", value: "large" },
];

const colorShortcuts: string[] = [
	"#F3F4F6",
	"#FFFFFF",
	"#0D0D10",
	"#17171C",
	"#2C2C32",
	"#666670",
	"#A1A1AA",
	"#D9D9DE",
	"#DA069A",
	"#FF5C72",
	"#F4B84A",
	"#B8F36B",
	"#45D6C8",
	"#38BDF8",
	"#8B5CF6",
	"#6D7DFF",
	"#C4057F",
	"#F97316",
	"#202027",
	"#38383C",
	"#4A4A52",
	"#8C8C96",
	"#111116",
	"#E879F9",
];

const colorInputModes: Array<{ label: string; value: ColorInputMode }> = [
	{ label: "Hex", value: "hex" },
	{ label: "RGB", value: "rgb" },
	{ label: "HSL", value: "hsl" },
	{ label: "HSB", value: "hsb" },
];

function clampNumber(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function normalizeHexColor(value: string): string | null {
	const sanitizedValue: string = value.replace(/[^0-9a-fA-F]/g, "");

	if (sanitizedValue.length === 3) {
		return `#${sanitizedValue
			.split("")
			.map((character: string): string => character + character)
			.join("")
			.toUpperCase()}`;
	}

	if (sanitizedValue.length >= 6) {
		return `#${sanitizedValue.slice(0, 6).toUpperCase()}`;
	}

	return null;
}

function hexToRgb(hexColor: string): RgbColor {
	const normalizedColor: string = normalizeHexColor(hexColor) ?? "#F3F4F6";
	const value: number = Number.parseInt(normalizedColor.slice(1), 16);

	return {
		r: (value >> 16) & 255,
		g: (value >> 8) & 255,
		b: value & 255,
	};
}

function rgbToHex({ b, g, r }: RgbColor): string {
	const nextValue: number = (1 << 24) + (r << 16) + (g << 8) + b;

	return `#${nextValue.toString(16).slice(1).toUpperCase()}`;
}

function rgbToHsv({ b, g, r }: RgbColor): HsvColor {
	const normalizedR: number = r / 255;
	const normalizedG: number = g / 255;
	const normalizedB: number = b / 255;
	const maxValue: number = Math.max(normalizedR, normalizedG, normalizedB);
	const minValue: number = Math.min(normalizedR, normalizedG, normalizedB);
	const delta: number = maxValue - minValue;
	let hue = 0;

	if (delta !== 0) {
		if (maxValue === normalizedR) {
			hue = 60 * (((normalizedG - normalizedB) / delta) % 6);
		} else if (maxValue === normalizedG) {
			hue = 60 * ((normalizedB - normalizedR) / delta + 2);
		} else {
			hue = 60 * ((normalizedR - normalizedG) / delta + 4);
		}
	}

	return {
		h: Math.round((hue + 360) % 360),
		s: maxValue === 0 ? 0 : Math.round((delta / maxValue) * 100),
		v: Math.round(maxValue * 100),
	};
}

function hsvToRgb({ h, s, v }: HsvColor): RgbColor {
	const normalizedS: number = clampNumber(s, 0, 100) / 100;
	const normalizedV: number = clampNumber(v, 0, 100) / 100;
	const chroma: number = normalizedV * normalizedS;
	const huePrime: number = (((h % 360) + 360) % 360) / 60;
	const x: number = chroma * (1 - Math.abs((huePrime % 2) - 1));
	const match: number = normalizedV - chroma;
	let red = 0;
	let green = 0;
	let blue = 0;

	if (huePrime >= 0 && huePrime < 1) {
		red = chroma;
		green = x;
	} else if (huePrime >= 1 && huePrime < 2) {
		red = x;
		green = chroma;
	} else if (huePrime >= 2 && huePrime < 3) {
		green = chroma;
		blue = x;
	} else if (huePrime >= 3 && huePrime < 4) {
		green = x;
		blue = chroma;
	} else if (huePrime >= 4 && huePrime < 5) {
		red = x;
		blue = chroma;
	} else {
		red = chroma;
		blue = x;
	}

	return {
		r: Math.round((red + match) * 255),
		g: Math.round((green + match) * 255),
		b: Math.round((blue + match) * 255),
	};
}

function rgbToHsl({ b, g, r }: RgbColor): HslColor {
	const normalizedR: number = r / 255;
	const normalizedG: number = g / 255;
	const normalizedB: number = b / 255;
	const maxValue: number = Math.max(normalizedR, normalizedG, normalizedB);
	const minValue: number = Math.min(normalizedR, normalizedG, normalizedB);
	const delta: number = maxValue - minValue;
	const lightness: number = (maxValue + minValue) / 2;
	let hue = 0;
	let saturation = 0;

	if (delta !== 0) {
		saturation =
			delta / (1 - Math.abs(2 * lightness - 1));

		if (maxValue === normalizedR) {
			hue = 60 * (((normalizedG - normalizedB) / delta) % 6);
		} else if (maxValue === normalizedG) {
			hue = 60 * ((normalizedB - normalizedR) / delta + 2);
		} else {
			hue = 60 * ((normalizedR - normalizedG) / delta + 4);
		}
	}

	return {
		h: Math.round((hue + 360) % 360),
		l: Math.round(lightness * 100),
		s: Math.round(saturation * 100),
	};
}

function hslToRgb({ h, l, s }: HslColor): RgbColor {
	const normalizedS: number = clampNumber(s, 0, 100) / 100;
	const normalizedL: number = clampNumber(l, 0, 100) / 100;
	const chroma: number =
		(1 - Math.abs(2 * normalizedL - 1)) * normalizedS;
	const huePrime: number = (((h % 360) + 360) % 360) / 60;
	const x: number = chroma * (1 - Math.abs((huePrime % 2) - 1));
	const match: number = normalizedL - chroma / 2;
	let red = 0;
	let green = 0;
	let blue = 0;

	if (huePrime >= 0 && huePrime < 1) {
		red = chroma;
		green = x;
	} else if (huePrime >= 1 && huePrime < 2) {
		red = x;
		green = chroma;
	} else if (huePrime >= 2 && huePrime < 3) {
		green = chroma;
		blue = x;
	} else if (huePrime >= 3 && huePrime < 4) {
		green = x;
		blue = chroma;
	} else if (huePrime >= 4 && huePrime < 5) {
		red = x;
		blue = chroma;
	} else {
		red = chroma;
		blue = x;
	}

	return {
		r: Math.round((red + match) * 255),
		g: Math.round((green + match) * 255),
		b: Math.round((blue + match) * 255),
	};
}

function getPickerHandlePosition(percent: number): string {
	return `${clampNumber(percent, 4, 96)}%`;
}

function areHsvColorsEqual(firstColor: HsvColor, secondColor: HsvColor): boolean {
	return (
		firstColor.h === secondColor.h &&
		firstColor.s === secondColor.s &&
		firstColor.v === secondColor.v
	);
}

export function getLyricsTextColorCss(
	format: Pick<LyricsFormat, "textColor" | "textOpacity">,
): string {
	const { b, g, r }: RgbColor = hexToRgb(format.textColor);
	const opacity: number = clampNumber(format.textOpacity, 0, 100);

	if (opacity >= 100) {
		return rgbToHex({ b, g, r });
	}

	return `rgba(${r}, ${g}, ${b}, ${Math.round(opacity) / 100})`;
}

function ToolbarSeparator(): ReactElement {
	return (
		<span
			aria-hidden="true"
			data-toolbar-separator="true"
			className="h-[18px] w-px bg-[#A1A1AA]"
		/>
	);
}

function ToolbarSelect({
	ariaLabel,
	previewFont = false,
	options,
	value,
	widthClassName,
	onChange,
}: ToolbarSelectProps): ReactElement {
	function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
		onChange(event.target.value);
	}

	return (
		<label className={`relative inline-flex h-7 items-center ${widthClassName}`}>
			<span className="sr-only">{ariaLabel}</span>
			<select
				aria-label={ariaLabel}
				value={value}
				onChange={handleChange}
				className="h-full w-full appearance-none rounded-[4px] bg-transparent pl-0 pr-4 text-[13px] font-semibold leading-none text-[#F3F4F6] outline-none transition-colors hover:text-white focus-visible:bg-[#24242A]"
				style={
					previewFont
						? { fontFamily: value === "Arimo" ? "Arimo, sans-serif" : value }
						: undefined
				}
			>
				{options.map(
					(option: SelectOption): ReactElement => (
						<option
							key={option.value}
							value={option.value}
							className="bg-[#17171C] text-[#F3F4F6]"
						>
							{option.label}
						</option>
					),
				)}
			</select>
			<ChevronDown
				aria-hidden="true"
				size={11}
				strokeWidth={2}
				className="pointer-events-none absolute right-0 text-[#F3F4F6]"
			/>
		</label>
	);
}

function IconButton({
	icon: Icon,
	label,
	active,
	onClick,
}: ToolbarButton): ReactElement {
	function keepEditorSelection(event: MouseEvent<HTMLButtonElement>): void {
		event.preventDefault();
	}

	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={active}
			onMouseDown={keepEditorSelection}
			onClick={onClick}
			className={`inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-[#F3F4F6] transition-colors hover:bg-[#24242A] hover:text-white ${active ? "bg-[#2C2C32]" : ""
				}`}
		>
			<Icon size={17} strokeWidth={2} />
		</button>
	);
}

function PickerSlider({
	ariaLabel,
	backgroundImage,
	backgroundSize,
	max,
	min,
	onChange,
	value,
}: {
	ariaLabel: string;
	backgroundImage: CSSProperties["backgroundImage"];
	backgroundSize?: CSSProperties["backgroundSize"];
	max: number;
	min: number;
	onChange: (value: number) => void;
	value: number;
}): ReactElement {
	const sliderRef = useRef<HTMLDivElement | null>(null);
	const activePointerIdRef = useRef<number | null>(null);
	const percent: number = ((value - min) / (max - min)) * 100;

	function updateFromPointer(event: PointerEvent<HTMLDivElement>): void {
		const rect: DOMRect | undefined = sliderRef.current?.getBoundingClientRect();

		if (!rect) {
			return;
		}

		const nextPercent: number = clampNumber(
			((event.clientX - rect.left) / rect.width) * 100,
			0,
			100,
		);
		const nextValue: number = min + ((max - min) * nextPercent) / 100;

		onChange(Math.round(nextValue));
	}

	return (
		<div
			ref={sliderRef}
			role="slider"
			aria-label={ariaLabel}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={Math.round(value)}
			tabIndex={0}
			onPointerDown={(event: PointerEvent<HTMLDivElement>): void => {
				event.preventDefault();
				event.stopPropagation();
				activePointerIdRef.current = event.pointerId;
				event.currentTarget.setPointerCapture(event.pointerId);
				updateFromPointer(event);
			}}
			onPointerMove={(event: PointerEvent<HTMLDivElement>): void => {
				if (
					event.buttons !== 1 ||
					activePointerIdRef.current !== event.pointerId
				) {
					return;
				}

				event.stopPropagation();
				updateFromPointer(event);
			}}
			onPointerUp={(event: PointerEvent<HTMLDivElement>): void => {
				if (activePointerIdRef.current !== event.pointerId) {
					return;
				}

				activePointerIdRef.current = null;

				if (event.currentTarget.hasPointerCapture(event.pointerId)) {
					event.currentTarget.releasePointerCapture(event.pointerId);
				}
			}}
			onPointerCancel={(event: PointerEvent<HTMLDivElement>): void => {
				if (activePointerIdRef.current !== event.pointerId) {
					return;
				}

				activePointerIdRef.current = null;

				if (event.currentTarget.hasPointerCapture(event.pointerId)) {
					event.currentTarget.releasePointerCapture(event.pointerId);
				}
			}}
			onKeyDown={(event): void => {
				if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
					event.preventDefault();
					onChange(clampNumber(value - 1, min, max));
				}

				if (event.key === "ArrowRight" || event.key === "ArrowUp") {
					event.preventDefault();
					onChange(clampNumber(value + 1, min, max));
				}
			}}
			className="relative h-4 w-full cursor-pointer rounded-full outline-none focus-visible:ring-1 focus-visible:ring-[#F3F4F6]"
			style={{ backgroundImage, backgroundSize }}
		>
			<span
				aria-hidden="true"
				className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#F3F4F6] bg-transparent shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
				style={{ left: getPickerHandlePosition(percent) }}
			/>
		</div>
	);
}

function NumberDragInput({
	ariaLabel,
	className,
	max,
	min,
	onChange,
	step = 1,
	value,
}: {
	ariaLabel: string;
	className: string;
	max: number;
	min: number;
	onChange: (value: number) => void;
	step?: number;
	value: number;
}): ReactElement {
	const dragStateRef = useRef<{
		didDrag: boolean;
		pointerId: number;
		startValue: number;
		startX: number;
	} | null>(null);
	const previousCursorRef = useRef<string | null>(null);
	const [draftValue, setDraftValue] = useState<string>(
		String(Math.round(value)),
	);

	useEffect((): void => {
		setDraftValue(String(Math.round(value)));
	}, [value]);

	function applyValue(nextValue: number): void {
		const clampedValue: number = Math.round(
			clampNumber(nextValue, min, max),
		);

		setDraftValue(String(clampedValue));
		onChange(clampedValue);
	}

	function restoreCursor(): void {
		if (typeof document === "undefined") {
			return;
		}

		document.body.style.cursor = previousCursorRef.current ?? "";
		previousCursorRef.current = null;
	}

	function handlePointerEnd(event: PointerEvent<HTMLInputElement>): void {
		const dragState = dragStateRef.current;

		if (!dragState) {
			return;
		}

		if (event.currentTarget.hasPointerCapture(dragState.pointerId)) {
			event.currentTarget.releasePointerCapture(dragState.pointerId);
		}

		if (dragState.didDrag) {
			event.preventDefault();
			event.currentTarget.blur();
		}

		dragStateRef.current = null;
		restoreCursor();
	}

	return (
		<input
			aria-label={ariaLabel}
			type="text"
			inputMode="numeric"
			value={draftValue}
			onChange={(event: ChangeEvent<HTMLInputElement>): void => {
				const nextValue: string = event.target.value.replace(/[^\d-]/g, "");
				const parsedValue: number = Number.parseInt(nextValue, 10);

				setDraftValue(nextValue);

				if (!Number.isNaN(parsedValue)) {
					onChange(Math.round(clampNumber(parsedValue, min, max)));
				}
			}}
			onBlur={(): void => {
				setDraftValue(String(Math.round(clampNumber(value, min, max))));
			}}
			onKeyDown={(event): void => {
				if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
					event.preventDefault();
					applyValue(value - step);
				}

				if (event.key === "ArrowRight" || event.key === "ArrowUp") {
					event.preventDefault();
					applyValue(value + step);
				}
			}}
			onPointerDown={(event: PointerEvent<HTMLInputElement>): void => {
				if (event.button !== 0) {
					return;
				}

				dragStateRef.current = {
					didDrag: false,
					pointerId: event.pointerId,
					startValue: value,
					startX: event.clientX,
				};
				event.currentTarget.setPointerCapture(event.pointerId);

				if (typeof document !== "undefined") {
					previousCursorRef.current = document.body.style.cursor;
					document.body.style.cursor = "ew-resize";
				}
			}}
			onPointerMove={(event: PointerEvent<HTMLInputElement>): void => {
				const dragState = dragStateRef.current;

				if (!dragState) {
					return;
				}

				const deltaX: number = event.clientX - dragState.startX;

				if (Math.abs(deltaX) < 2) {
					return;
				}

				dragState.didDrag = true;
				event.preventDefault();
				applyValue(dragState.startValue + deltaX * step);
			}}
			onPointerUp={handlePointerEnd}
			onPointerCancel={handlePointerEnd}
			className={`${className} cursor-ew-resize select-none`}
		/>
	);
}

function ColorPickerPopover({
	color,
	opacity,
	onChange,
}: {
	color: string;
	opacity: number;
	onChange: (patch: Pick<LyricsFormat, "textColor" | "textOpacity">) => void;
}): ReactElement {
	const colorAreaRef = useRef<HTMLDivElement | null>(null);
	const activeColorAreaPointerIdRef = useRef<number | null>(null);
	const normalizedColor: string = normalizeHexColor(color) ?? "#F3F4F6";
	const normalizedRgbColor: RgbColor = hexToRgb(normalizedColor);
	const [hsvColor, setHsvColor] = useState<HsvColor>(
		(): HsvColor => rgbToHsv(hexToRgb(normalizedColor)),
	);
	const hsvColorRef = useRef<HsvColor>(hsvColor);
	const lastPickerColorRef = useRef<string>(normalizedColor);
	const hslColor: HslColor = useMemo(
		(): HslColor => rgbToHsl(hexToRgb(normalizedColor)),
		[normalizedColor],
	);
	const [colorInputMode, setColorInputMode] =
		useState<ColorInputMode>("hex");
	const [hexInput, setHexInput] = useState<string>(normalizedColor.slice(1));
	const [isModeMenuOpen, setIsModeMenuOpen] = useState<boolean>(false);
	const colorCss: string = getLyricsTextColorCss({
		textColor: normalizedColor,
		textOpacity: opacity,
	});

	function setSyncedHsvColor(nextHsvColor: HsvColor): void {
		hsvColorRef.current = nextHsvColor;
		setHsvColor((currentHsvColor: HsvColor): HsvColor =>
			areHsvColorsEqual(currentHsvColor, nextHsvColor)
				? currentHsvColor
				: nextHsvColor,
		);
	}

	useEffect((): void => {
		const nextHexInput: string = normalizedColor.slice(1);

		setHexInput((currentHexInput: string): string =>
			currentHexInput === nextHexInput ? currentHexInput : nextHexInput,
		);

		if (lastPickerColorRef.current === normalizedColor) {
			return;
		}

		const convertedHsvColor: HsvColor = rgbToHsv(hexToRgb(normalizedColor));
		const nextHsvColor: HsvColor =
			convertedHsvColor.s === 0 || convertedHsvColor.v === 0
				? {
						...convertedHsvColor,
						h: hsvColorRef.current.h,
					}
				: convertedHsvColor;
		lastPickerColorRef.current = normalizedColor;
		hsvColorRef.current = nextHsvColor;
		setHsvColor((currentHsvColor: HsvColor): HsvColor =>
			areHsvColorsEqual(currentHsvColor, nextHsvColor)
				? currentHsvColor
				: nextHsvColor,
		);
	}, [normalizedColor]);

	function applyHsv(nextHsvColor: HsvColor): void {
		const normalizedHsvColor: HsvColor = {
			h: Math.round(clampNumber(nextHsvColor.h, 0, 360)),
			s: Math.round(clampNumber(nextHsvColor.s, 0, 100)),
			v: Math.round(clampNumber(nextHsvColor.v, 0, 100)),
		};
		const nextColor: string = rgbToHex(hsvToRgb(normalizedHsvColor));

		lastPickerColorRef.current = nextColor;
		setSyncedHsvColor(normalizedHsvColor);
		onChange({
			textColor: nextColor,
			textOpacity: opacity,
		});
	}

	function applyRgb(nextRgbColor: RgbColor): void {
		const nextColor: string = rgbToHex({
			b: Math.round(clampNumber(nextRgbColor.b, 0, 255)),
			g: Math.round(clampNumber(nextRgbColor.g, 0, 255)),
			r: Math.round(clampNumber(nextRgbColor.r, 0, 255)),
		});
		const convertedHsvColor: HsvColor = rgbToHsv(hexToRgb(nextColor));
		const nextHsvColor: HsvColor =
			convertedHsvColor.s === 0 || convertedHsvColor.v === 0
				? {
						...convertedHsvColor,
						h: hsvColorRef.current.h,
					}
				: convertedHsvColor;

		lastPickerColorRef.current = nextColor;
		setSyncedHsvColor(nextHsvColor);
		onChange({
			textColor: nextColor,
			textOpacity: opacity,
		});
	}

	function applyHsl(nextHslColor: HslColor): void {
		applyRgb(hslToRgb(nextHslColor));
	}

	function updateFromColorArea(event: PointerEvent<HTMLDivElement>): void {
		const rect: DOMRect | undefined = colorAreaRef.current?.getBoundingClientRect();

		if (!rect) {
			return;
		}

		const nextSaturation: number = clampNumber(
			((event.clientX - rect.left) / rect.width) * 100,
			0,
			100,
		);
		const nextValue: number = clampNumber(
			100 - ((event.clientY - rect.top) / rect.height) * 100,
			0,
			100,
		);

		applyHsv({
			h: hsvColorRef.current.h,
			s: Math.round(nextSaturation),
			v: Math.round(nextValue),
		});
	}

	function handleHexChange(event: ChangeEvent<HTMLInputElement>): void {
		const nextValue: string = event.target.value
			.replace(/[^0-9a-fA-F]/g, "")
			.slice(0, 6)
			.toUpperCase();
		const nextColor: string | null = normalizeHexColor(nextValue);

		setHexInput(nextValue);

		if (nextColor) {
			const convertedHsvColor: HsvColor = rgbToHsv(hexToRgb(nextColor));
			const nextHsvColor: HsvColor =
				convertedHsvColor.s === 0 || convertedHsvColor.v === 0
					? {
							...convertedHsvColor,
							h: hsvColorRef.current.h,
						}
					: convertedHsvColor;

			lastPickerColorRef.current = nextColor;
			setSyncedHsvColor(nextHsvColor);
			onChange({
				textColor: nextColor,
				textOpacity: opacity,
			});
		}
	}

	function handleChannelChange(
		channelIndex: number,
		rawValue: number,
	): void {
		const maxValue: number = channelIndex === 0 ? 360 : 100;
		const rgbMaxValue = 255;
		const nextValue: number = clampNumber(
			Number.isNaN(rawValue) ? 0 : rawValue,
			0,
			colorInputMode === "rgb" ? rgbMaxValue : maxValue,
		);

		if (colorInputMode === "rgb") {
			const channels: number[] = [
				normalizedRgbColor.r,
				normalizedRgbColor.g,
				normalizedRgbColor.b,
			];
			channels[channelIndex] = nextValue;
			applyRgb({
				b: channels[2],
				g: channels[1],
				r: channels[0],
			});
			return;
		}

		if (colorInputMode === "hsl") {
			const channels: number[] = [hslColor.h, hslColor.s, hslColor.l];
			channels[channelIndex] = nextValue;
			applyHsl({
				h: channels[0],
				l: channels[2],
				s: channels[1],
			});
			return;
		}

		if (colorInputMode === "hsb") {
			const channels: number[] = [
				hsvColorRef.current.h,
				hsvColorRef.current.s,
				hsvColorRef.current.v,
			];
			channels[channelIndex] = nextValue;
			applyHsv({
				h: channels[0],
				s: channels[1],
				v: channels[2],
			});
		}
	}

	const hueBackground =
		"linear-gradient(90deg,#FF0000 0%,#FFFF00 17%,#00FF00 33%,#00FFFF 50%,#0000FF 67%,#FF00FF 83%,#FF0000 100%)";
	const opacityBackground = `linear-gradient(90deg, rgba(${normalizedRgbColor.r}, ${normalizedRgbColor.g}, ${normalizedRgbColor.b}, 0), ${normalizedColor}), conic-gradient(#F3F4F6 25%, #D1D1D6 0 50%, #F3F4F6 0 75%, #D1D1D6 0)`;
	const selectedModeLabel: string =
		colorInputModes.find(
			(mode: { label: string; value: ColorInputMode }): boolean =>
				mode.value === colorInputMode,
		)?.label ?? "Hex";
	const channelValues: number[] =
		colorInputMode === "rgb"
			? [normalizedRgbColor.r, normalizedRgbColor.g, normalizedRgbColor.b]
			: colorInputMode === "hsl"
				? [hslColor.h, hslColor.s, hslColor.l]
				: [hsvColor.h, hsvColor.s, hsvColor.v];
	const inputGridClassName: string =
		colorInputMode === "hex"
			? "grid-cols-[64px_minmax(0,1fr)_54px]"
			: "grid-cols-[64px_repeat(3,32px)_54px]";

	return (
		<div
			role="dialog"
			aria-label="Choisir une couleur"
			className="absolute left-0 top-[calc(100%+8px)] z-[80] w-[258px] rounded-[7px] border border-[#3A3A42] bg-[#2B2B31] p-3 shadow-[0_18px_36px_rgba(0,0,0,0.42)]"
		>
			<div
				ref={colorAreaRef}
				className="relative h-[204px] w-full cursor-crosshair overflow-hidden rounded-[4px] border border-[#17171C]"
				style={{ backgroundColor: `hsl(${hsvColor.h}, 100%, 50%)` }}
				onPointerDown={(event: PointerEvent<HTMLDivElement>): void => {
					event.preventDefault();
					event.stopPropagation();
					activeColorAreaPointerIdRef.current = event.pointerId;
					event.currentTarget.setPointerCapture(event.pointerId);
					updateFromColorArea(event);
				}}
				onPointerMove={(event: PointerEvent<HTMLDivElement>): void => {
					if (
						event.buttons !== 1 ||
						activeColorAreaPointerIdRef.current !== event.pointerId
					) {
						return;
					}

					event.stopPropagation();
					updateFromColorArea(event);
				}}
				onPointerUp={(event: PointerEvent<HTMLDivElement>): void => {
					if (activeColorAreaPointerIdRef.current !== event.pointerId) {
						return;
					}

					activeColorAreaPointerIdRef.current = null;

					if (event.currentTarget.hasPointerCapture(event.pointerId)) {
						event.currentTarget.releasePointerCapture(event.pointerId);
					}
				}}
				onPointerCancel={(event: PointerEvent<HTMLDivElement>): void => {
					if (activeColorAreaPointerIdRef.current !== event.pointerId) {
						return;
					}

					activeColorAreaPointerIdRef.current = null;

					if (event.currentTarget.hasPointerCapture(event.pointerId)) {
						event.currentTarget.releasePointerCapture(event.pointerId);
					}
				}}
			>
				<span
					aria-hidden="true"
					className="absolute inset-0 bg-[linear-gradient(90deg,#F3F4F6,rgba(243,244,246,0))]"
				/>
				<span
					aria-hidden="true"
					className="absolute inset-0 bg-[linear-gradient(0deg,#0D0D10,rgba(13,13,16,0))]"
				/>
				<span
					aria-hidden="true"
					className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#F3F4F6] shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
					style={{
						left: getPickerHandlePosition(hsvColor.s),
						top: getPickerHandlePosition(100 - hsvColor.v),
					}}
				/>
			</div>

			<div className="mt-3 grid grid-cols-[22px_minmax(0,1fr)] items-center gap-x-2 gap-y-2">
				<span className="text-center text-[10px] font-bold text-[#F3F4F6]">H</span>
				<PickerSlider
					ariaLabel="Teinte"
					backgroundImage={hueBackground}
					min={0}
					max={360}
					value={hsvColor.h}
					onChange={(hue: number): void => {
						applyHsv({ ...hsvColorRef.current, h: hue });
					}}
				/>
				<span className="text-center text-[10px] font-bold text-[#F3F4F6]">A</span>
				<PickerSlider
					ariaLabel="Opacite"
					backgroundImage={opacityBackground}
					backgroundSize="auto, 12px 12px"
					min={0}
					max={100}
					value={opacity}
					onChange={(nextOpacity: number): void => {
						onChange({
							textColor: normalizedColor,
							textOpacity: nextOpacity,
						});
					}}
				/>
			</div>

			<div className={`mt-3 grid ${inputGridClassName} gap-1`}>
				<div className="relative">
					<button
						type="button"
						aria-expanded={isModeMenuOpen}
						onMouseDown={(event: MouseEvent<HTMLButtonElement>): void =>
							event.preventDefault()
						}
						onClick={(): void => {
							setIsModeMenuOpen(
								(currentValue: boolean): boolean => !currentValue,
							);
						}}
						className="inline-flex h-7 w-full items-center justify-between rounded-[4px] border border-[#4A4A52] bg-[#33333A] px-2 text-[11px] font-semibold text-[#F3F4F6] outline-none transition-colors hover:bg-[#3A3A42]"
					>
						{selectedModeLabel}
						<ChevronDown size={11} strokeWidth={2} />
					</button>
					{isModeMenuOpen && (
						<div className="absolute left-0 top-[calc(100%+4px)] z-[90] w-[86px] rounded-[6px] border border-[#4A4A52] bg-[#1F1F25] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.4)]">
							{colorInputModes.map(
								(mode: {
									label: string;
									value: ColorInputMode;
								}): ReactElement => (
									<button
										key={mode.value}
										type="button"
										onMouseDown={(
											event: MouseEvent<HTMLButtonElement>,
										): void => event.preventDefault()}
										onClick={(): void => {
											setColorInputMode(mode.value);
											setIsModeMenuOpen(false);
										}}
										className={`flex h-7 w-full items-center rounded-[4px] px-2 text-left text-[11px] font-semibold transition-colors ${
											mode.value === colorInputMode
												? "bg-[#34343C] text-[#F3F4F6]"
												: "text-[#D9D9DE] hover:bg-[#2C2C32]"
										}`}
									>
										{mode.label}
									</button>
								),
							)}
						</div>
					)}
				</div>
				{colorInputMode === "hex" ? (
					<input
						aria-label="Couleur hexadecimale"
						value={hexInput}
						onChange={handleHexChange}
						className="h-7 min-w-0 rounded-[4px] border border-[#4A4A52] bg-[#33333A] px-2 text-[11px] font-bold text-[#F3F4F6] outline-none focus:border-[#F3F4F6]"
					/>
				) : (
					channelValues.map(
						(channelValue: number, channelIndex: number): ReactElement => (
							<NumberDragInput
								key={`${colorInputMode}-${channelIndex}`}
								ariaLabel={`${selectedModeLabel} ${channelIndex + 1}`}
								min={0}
								max={
									colorInputMode === "rgb"
										? 255
										: channelIndex === 0
											? 360
											: 100
								}
								value={Math.round(channelValue)}
								onChange={(nextValue: number): void => {
									handleChannelChange(channelIndex, nextValue);
								}}
								className="h-7 min-w-0 rounded-[4px] border border-[#3E3E46] bg-[#33333A] px-1 text-center text-[11px] font-bold text-[#F3F4F6] outline-none focus:border-[#F3F4F6]"
							/>
						),
					)
				)}
				<label className="relative">
					<span className="sr-only">Opacite</span>
					<NumberDragInput
						ariaLabel="Opacite"
						min={0}
						max={100}
						value={Math.round(opacity)}
						onChange={(nextOpacity: number): void => {
							onChange({
								textColor: normalizedColor,
								textOpacity: nextOpacity,
							});
						}}
						className="h-7 w-full rounded-[4px] border border-[#4A4A52] bg-[#33333A] pl-1 pr-5 text-center text-[11px] font-bold text-[#F3F4F6] outline-none focus:border-[#F3F4F6]"
					/>
					<span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#A1A1AA]">
						%
					</span>
				</label>
			</div>

			<div className="mt-3 h-px bg-[#3A3A42]" />

			<div className="mt-3 grid grid-cols-8 gap-2">
				{colorShortcuts.map(
					(shortcutColor: string): ReactElement => {
						const isSelected: boolean =
							normalizeHexColor(shortcutColor) === normalizedColor;

						return (
							<button
								key={shortcutColor}
								type="button"
								aria-label={`Couleur ${shortcutColor}`}
								onMouseDown={(event: MouseEvent<HTMLButtonElement>): void =>
									event.preventDefault()
								}
								onClick={(): void => {
									const convertedHsvColor: HsvColor = rgbToHsv(
										hexToRgb(shortcutColor),
									);
									const nextHsvColor: HsvColor =
										convertedHsvColor.s === 0 || convertedHsvColor.v === 0
											? {
													...convertedHsvColor,
													h: hsvColorRef.current.h,
												}
											: convertedHsvColor;

									lastPickerColorRef.current = shortcutColor;
									setSyncedHsvColor(nextHsvColor);
									onChange({
										textColor: shortcutColor,
										textOpacity: opacity,
									});
								}}
								className={`h-4 w-4 rounded-[3px] border transition-transform hover:scale-110 ${
									isSelected ? "border-[#F3F4F6]" : "border-[#4A4A52]"
								}`}
								style={{ backgroundColor: shortcutColor }}
							/>
						);
					},
				)}
			</div>

			<div className="mt-3 flex items-center justify-between">
				<span className="text-[10px] font-medium text-[#A1A1AA]">
					Couleur active
				</span>
				<span
					className="h-4 w-10 rounded-[3px] border border-[#4A4A52]"
					style={{ backgroundColor: colorCss }}
				/>
			</div>
		</div>
	);
}

export default function LyricsHeader({
	format,
	onFormatChange,
}: LyricsHeaderProps): ReactElement {
	const colorPickerRef = useRef<HTMLDivElement | null>(null);
	const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);
	const textColorCss: string = useMemo(
		(): string =>
			getLyricsTextColorCss({
				textColor: format.textColor,
				textOpacity: format.textOpacity,
			}),
		[format.textColor, format.textOpacity],
	);

	useEffect((): (() => void) | undefined => {
		if (!isColorPickerOpen || typeof document === "undefined") {
			return undefined;
		}

		function handlePointerDown(event: globalThis.PointerEvent): void {
			const target: EventTarget | null = event.target;

			if (!(target instanceof Node)) {
				return;
			}

			if (!colorPickerRef.current?.contains(target)) {
				setIsColorPickerOpen(false);
			}
		}

		function handleKeyDown(event: globalThis.KeyboardEvent): void {
			if (event.key === "Escape") {
				setIsColorPickerOpen(false);
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return (): void => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isColorPickerOpen]);

	const textTools: ToolbarButton[] = [
		{
			label: "Bold",
			icon: Bold,
			active: format.bold,
			onClick: () => onFormatChange({ bold: !format.bold }),
		},
		{
			label: "Italic",
			icon: Italic,
			active: format.italic,
			onClick: () => onFormatChange({ italic: !format.italic }),
		},
		{
			label: "Strikethrough",
			icon: Strikethrough,
			active: format.strike,
			onClick: () => onFormatChange({ strike: !format.strike }),
		},
		{
			label: "Underline",
			icon: Underline,
			active: format.underline,
			onClick: () => onFormatChange({ underline: !format.underline }),
		},
	];

	const alignTools: ToolbarButton[] = [
		{
			label: "Align left",
			icon: AlignLeft,
			active: format.align === "left",
			onClick: () => onFormatChange({ align: "left" }),
		},
		{
			label: "Align center",
			icon: AlignCenter,
			active: format.align === "center",
			onClick: () => onFormatChange({ align: "center" }),
		},
		{
			label: "Align right",
			icon: AlignRight,
			active: format.align === "right",
			onClick: () => onFormatChange({ align: "right" }),
		},
	];

	const rightTools: ToolbarButton[] = [
		{
			label: "Piste",
			icon: Disc,
			active: format.showTrackPanel,
			onClick: () => onFormatChange({ showTrackPanel: !format.showTrackPanel }),
		},
		{
			label: "Outils",
			icon: Badge,
			active: format.showInspectorTools,
			onClick: () =>
				onFormatChange({ showInspectorTools: !format.showInspectorTools }),
		},
		{
			label: "Mode focus",
			icon: Focus,
			active: format.focusMode,
			onClick: () =>
				onFormatChange({
					focusMode: !format.focusMode,
					hideAppChrome: false,
				}),
		},
		...(format.focusMode
			? [
					{
						label: format.hideAppChrome
							? "Afficher la navigation"
							: "Cacher la navigation",
						icon: format.hideAppChrome ? PanelLeftOpen : PanelLeftClose,
						active: format.hideAppChrome,
						onClick: () =>
							onFormatChange({ hideAppChrome: !format.hideAppChrome }),
					},
				]
			: []),
	];

	return (
		<header
			data-lyrics-header="true"
			className="relative z-[90] flex h-8 w-full items-center justify-between overflow-visible border-b border-[var(--nara-border)] bg-[var(--nara-surface)] px-5 text-[var(--nara-text-primary)]"
		>
			<div className="flex min-w-0 items-center gap-3">
				<ToolbarSelect
					ariaLabel="Font family"
					previewFont
					options={fontOptions}
					value={format.fontFamily}
					widthClassName="w-[66px]"
					onChange={(fontFamily: string): void => {
						onFormatChange({ fontFamily });
					}}
				/>

				<ToolbarSelect
					ariaLabel="Font size"
					options={fontSizeOptions}
					value={format.fontSize}
					widthClassName="w-[38px]"
					onChange={(fontSize: string): void => {
						onFormatChange({ fontSize });
					}}
				/>

				<ToolbarSeparator />

				<div className="flex items-center gap-0.5">
					{textTools.map(
						(tool: ToolbarButton): ReactElement => (
							<IconButton key={tool.label} {...tool} />
						),
					)}
				</div>

				<ToolbarSeparator />

				<div ref={colorPickerRef} className="relative">
					<button
						type="button"
						aria-label="Text color"
						aria-expanded={isColorPickerOpen}
						onMouseDown={(event: MouseEvent<HTMLButtonElement>): void =>
							event.preventDefault()
						}
						onClick={(): void => {
							setIsColorPickerOpen(
								(currentValue: boolean): boolean => !currentValue,
							);
						}}
						className={`inline-flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors hover:bg-[#24242A] ${
							isColorPickerOpen ? "bg-[#2C2C32]" : ""
						}`}
					>
						<span
							className="h-[18px] w-[18px] rounded-[5px] border border-[var(--nara-color-swatch-border)]"
							style={{ backgroundColor: textColorCss }}
						/>
					</button>
					{isColorPickerOpen && (
						<ColorPickerPopover
							color={format.textColor}
							opacity={format.textOpacity}
							onChange={(patch): void => {
								onFormatChange(patch);
							}}
						/>
					)}
				</div>

				<ToolbarSeparator />

				<div className="flex items-center gap-0.5">
					{alignTools.map(
						(tool: ToolbarButton): ReactElement => (
							<IconButton key={tool.label} {...tool} />
						),
					)}
				</div>

				<ToolbarSeparator />

				<ToolbarSelect
					ariaLabel="Block size"
					options={blockSizeOptions}
					value={format.blockSize}
					widthClassName="w-[58px]"
					onChange={(blockSize: string): void => {
						onFormatChange({ blockSize });
					}}
				/>
			</div>

			<div className="flex items-center gap-1">
				{rightTools.map(
					(tool: ToolbarButton): ReactElement => (
						<IconButton key={tool.label} {...tool} />
					),
				)}
			</div>
		</header>
	);
}
