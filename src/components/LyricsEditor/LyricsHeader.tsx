"use client";

import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Badge,
	Bold,
	ChevronDown,
	Disc,
	Italic,
	Strikethrough,
	Underline,
	type LucideIcon,
} from "lucide-react";
import type { ChangeEvent, MouseEvent, ReactElement } from "react";

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
	showTrackPanel: boolean;
	showInspectorTools: boolean;
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

export default function LyricsHeader({
	format,
	onFormatChange,
}: LyricsHeaderProps): ReactElement {
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
	];

	return (
		<header
			data-lyrics-header="true"
			className="flex h-8 w-full items-center justify-between overflow-hidden border-b border-[#2C2C32] bg-[#17171C] px-5 text-[#F3F4F6]"
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

				<button
					type="button"
					aria-label="Text color"
					className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors hover:bg-[#24242A]"
				>
					<span className="h-[18px] w-[18px] rounded-[5px] bg-[#F3F4F6]" />
				</button>

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
