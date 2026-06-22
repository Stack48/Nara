"use client";

import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	AudioWaveform,
	Badge,
	Bold,
	Briefcase,
	ChevronDown,
	Disc,
	GripVertical,
	Italic,
	MoreHorizontal,
	Music2,
	Play,
	Plus,
	Save,
	Search,
	Shuffle,
	SkipBack,
	SkipForward,
	Sparkles,
	Strikethrough,
	Underline,
	Volume2,
	type LucideIcon,
} from "lucide-react";
import { type ReactElement } from "react";

type SectionType = "intro" | "couplet" | "refrain" | "untitled";

type LyricSection = {
	id: string;
	title: string;
	type: SectionType;
	lines: string[];
};

type ToolPanel = {
	id: string;
	title: string;
	icon: LucideIcon;
	fields: Array<{ label: string; value: string }>;
	chips: string[];
};

type TimelineMarker = {
	id: string;
	label: string;
	time: string;
	progress: number;
	tone: string;
	position: "top" | "bottom";
};

type MiniButtonProps = {
	label: string;
	icon?: LucideIcon;
	active?: boolean;
	children?: React.ReactNode;
};

const sections: LyricSection[] = [
	{
		id: "intro",
		title: "Intro",
		type: "intro",
		lines: [
			"Sed ut perspiciatis unde omnis",
			"Doloremque laudantium,",
			"Totam rem aperiam, eaque ipsa veritatis",
			"Iste natus error sit voluptatem accusantium",
		],
	},
	{
		id: "couplet",
		title: "Couplet",
		type: "couplet",
		lines: [
			"Sed ut perspiciatis unde omnis",
			"Doloremque laudantium,",
			"Totam rem aperiam, eaque ipsa veritatis",
			"Iste natus error sit voluptatem accusantium",
		],
	},
	{
		id: "refrain",
		title: "Refrain",
		type: "refrain",
		lines: [
			"Sed ut perspiciatis unde omnis",
			"Doloremque laudantium,",
			"Totam rem aperiam, eaque ipsa veritatis",
			"Iste natus error sit voluptatem accusantium",
		],
	},
	{
		id: "untitled",
		title: "Untitled",
		type: "untitled",
		lines: [
			"Sed ut perspiciatis unde omnis",
			"Doloremque laudantium,",
			"Iste natus error sit voluptatem accusantium",
			"Sed ut perspiciatis unde omnis",
			"Doloremque laudantium,",
			"Totam rem aperiam, eaque ipsa veritatis",
			"Iste natus error sit voluptatem accusantium",
			"Sed ut perspiciatis unde omnis",
			"Doloremque laudantium,",
		],
	},
];

const alternativeSection: LyricSection = {
	id: "intro-alt",
	title: "Intro - alternative 1",
	type: "intro",
	lines: [
		"Sed ut perspiciatis unde omnis",
		"Doloremque laudantium,",
		"Totam rem aperiam, eaque ipsa veritatis",
		"Iste natus error sit voluptatem accusantium",
	],
};

const toolPanels: ToolPanel[] = [
	{
		id: "rhymes",
		title: "Rimes",
		icon: AudioWaveform,
		fields: [
			{ label: "Mot", value: "Meilleur" },
			{ label: "Syllabes", value: "2" },
			{ label: "Category", value: "Adj." },
		],
		chips: ["Veilleur", "Chanteur", "Couleur"],
	},
	{
		id: "synonyms",
		title: "Synonymes",
		icon: Shuffle,
		fields: [{ label: "Mot", value: "ecrire" }],
		chips: ["Rediger", "Composer", "inscrire"],
	},
	{
		id: "antonyms",
		title: "Antonymes",
		icon: Shuffle,
		fields: [{ label: "Mot", value: "ecrire" }],
		chips: ["Annihiler", "annuler", "biffer"],
	},
	{
		id: "lexical",
		title: "Champs lexical",
		icon: Sparkles,
		fields: [{ label: "Theme", value: "La mer" }],
		chips: ["Vague", "Ocean", "Rivage"],
	},
];

const timelineMarkers: TimelineMarker[] = [
	{
		id: "intro",
		label: "INTRO",
		time: "0:16",
		progress: 22,
		tone: "#d9008d",
		position: "top",
	},
	{
		id: "couplet",
		label: "COUPLET",
		time: "0:31",
		progress: 34,
		tone: "#8b5cf6",
		position: "bottom",
	},
	{
		id: "refrain",
		label: "REFRAIN",
		time: "0:46",
		progress: 45,
		tone: "#f5b942",
		position: "top",
	},
	{
		id: "untitled",
		label: "UNTITLED",
		time: "1:01",
		progress: 55,
		tone: "#6d7ff2",
		position: "bottom",
	},
];

const sectionColor: Record<SectionType, string> = {
	intro: "#d9008d",
	couplet: "#8b5cf6",
	refrain: "#f5b942",
	untitled: "#6d7ff2",
};

function MiniButton({
	label,
	icon: Icon,
	active = false,
	children,
}: MiniButtonProps): ReactElement {
	return (
		<button
			type="button"
			aria-label={label}
			className={[
				"inline-flex h-7 items-center justify-center rounded-[7px] px-2 text-[12px] font-semibold transition-colors",
				active
					? "bg-[#2c2c32] text-[var(--nara-text-primary)]"
					: "text-[#d8d8df] hover:bg-[var(--nara-surface-raised)] hover:text-[var(--nara-text-primary)]",
			].join(" ")}
		>
			{Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : children}
		</button>
	);
}

function SelectToken({ value }: { value: string }): ReactElement {
	return (
		<button
			type="button"
			className="inline-flex h-7 items-center gap-2 rounded-[7px] bg-[var(--nara-surface-raised)] px-3 text-[12px] font-semibold text-[var(--nara-text-primary)] transition-colors hover:bg-[#2c2c32]"
		>
			{value}
			<ChevronDown
				aria-hidden="true"
				className="h-3.5 w-3.5 text-[#a1a1aa]"
			/>
		</button>
	);
}

function Divider(): ReactElement {
	return <span aria-hidden="true" className="mx-1 h-5 w-px bg-[#4a4a52]" />;
}

function ToggleChip({
	label,
	enabled,
}: {
	label: string;
	enabled: boolean;
}): ReactElement {
	return (
		<label className="inline-flex items-center gap-2 text-[11px] font-bold text-[var(--nara-text-primary)]">
			<span>{label}</span>
			<span
				aria-hidden="true"
				className={[
					"relative h-[9px] w-[22px] rounded-full transition-colors",
					enabled ? "bg-[#d9008d]" : "bg-[#6f6f78]",
				].join(" ")}
			>
				<span className="absolute right-[2px] top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full bg-[var(--nara-text-primary)]" />
			</span>
		</label>
	);
}

function EditorToolbar(): ReactElement {
	return (
		<header className="flex h-10 shrink-0 items-center justify-between border-b border-[#2c2c32] bg-[#111115] px-2">
			<div className="flex min-w-0 items-center gap-1">
				<SelectToken value="Arimo" />
				<SelectToken value="16" />
				<Divider />
				<MiniButton label="Gras" icon={Bold} />
				<MiniButton label="Italique" icon={Italic} />
				<MiniButton label="Barre" icon={Strikethrough} />
				<MiniButton label="Souligne" icon={Underline} />
				<Divider />
				<MiniButton label="Couleur">
					<span className="h-4 w-4 rounded-[5px] bg-[var(--nara-text-primary)]" />
				</MiniButton>
				<Divider />
				<MiniButton label="Aligner a gauche" icon={AlignLeft} active />
				<MiniButton label="Centrer" icon={AlignCenter} />
				<MiniButton label="Aligner a droite" icon={AlignRight} />
				<Divider />
				<SelectToken value="Large" />
			</div>

			<div className="hidden items-center gap-1 md:flex">
				<MiniButton label="Piste" icon={Disc} />
				<MiniButton label="Focus" icon={Badge} active />
				<MiniButton label="Outils" icon={Search} />
			</div>
		</header>
	);
}

function SectionHandle(): ReactElement {
	return (
		<div className="absolute -left-8 top-0 hidden items-center gap-1 text-[#4a4a52] group-hover:flex">
			<button type="button" aria-label="Ajouter une section">
				<Plus className="h-4 w-4" />
			</button>
			<button type="button" aria-label="Deplacer la section">
				<GripVertical className="h-4 w-4" />
			</button>
		</div>
	);
}

function LyricSectionBlock({
	section,
}: {
	section: LyricSection;
}): ReactElement {
	return (
		<section className="group relative">
			<SectionHandle />
			<div className="mb-3 flex items-center gap-2">
				<span
					aria-hidden="true"
					className="h-2 w-2 rounded-full"
					style={{ backgroundColor: sectionColor[section.type] }}
				/>
				<h2 className="text-[12px] font-semibold leading-none text-[#70707b]">
					{section.title}
				</h2>
			</div>
			<div className="space-y-[3px] text-[14px] font-medium leading-[1.42] text-[var(--nara-text-primary)]">
				{section.lines.map(
					(line: string, index: number): ReactElement => (
						<p
							key={`${section.id}-${index}-${line}`}
							className="group/line relative rounded-[4px] transition-colors hover:bg-[var(--nara-surface-raised)]/55"
						>
							<button
								type="button"
								aria-label="Deplacer la ligne"
								className="absolute -left-5 top-1/2 hidden -translate-y-1/2 text-[#4a4a52] group-hover/line:block"
							>
								<GripVertical className="h-3.5 w-3.5" />
							</button>
							{line}
						</p>
					),
				)}
			</div>
		</section>
	);
}

function WorkspaceHeader(): ReactElement {
	return (
		<div className="flex shrink-0 items-center justify-between border-b border-[#26262c] px-3 py-2">
			<div className="flex items-center gap-2">
				<h1 className="text-[14px] font-bold text-[var(--nara-text-primary)]">My Way</h1>
				<button
					type="button"
					className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[#2c2c32] px-2 text-[11px] font-bold text-[var(--nara-text-primary)] transition-colors hover:bg-[var(--nara-surface-raised)]"
				>
					<Save aria-hidden="true" className="h-3.5 w-3.5" />
					Sauvegarder
				</button>
				<span className="text-[11px] font-medium text-[#6f6f78]">
					Modifie
				</span>
			</div>
			<div className="hidden items-center gap-4 lg:flex">
				<ToggleChip label="Rimes" enabled />
				<ToggleChip label="Annotation" enabled />
				<ToggleChip label="Syllabes" enabled />
				<span className="text-[11px] font-bold text-[var(--nara-text-primary)]">
					30 mots
				</span>
			</div>
		</div>
	);
}

function LyricsCanvas(): ReactElement {
	return (
		<div className="min-h-0 flex-1 overflow-y-auto px-10 pb-28 pt-8 lg:px-16 xl:px-20">
			<div className="mx-auto grid max-w-[920px] grid-cols-1 gap-x-24 gap-y-8 md:grid-cols-[minmax(0,390px)_minmax(0,340px)]">
				<div className="space-y-9">
					{sections.map(
						(section: LyricSection): ReactElement => (
							<LyricSectionBlock
								key={section.id}
								section={section}
							/>
						),
					)}
				</div>
				<div className="hidden pt-7 md:block">
					<LyricSectionBlock section={alternativeSection} />
				</div>
			</div>
		</div>
	);
}

function ToolPanelCard({ panel }: { panel: ToolPanel }): ReactElement {
	const Icon = panel.icon;

	return (
		<section className="rounded-[10px] border border-[#2c2c32] bg-[#1b1b20] p-3">
			<div className="mb-3 flex items-center gap-2 text-[#a1a1aa]">
				<Icon aria-hidden="true" className="h-4 w-4" />
				<h3 className="text-[11px] font-black uppercase tracking-[0.04em]">
					{panel.title}
				</h3>
			</div>

			<div
				className={[
					"grid gap-2",
					panel.fields.length > 1
						? "grid-cols-[minmax(0,1.5fr)_minmax(52px,0.7fr)_minmax(56px,0.8fr)]"
						: "grid-cols-1",
				].join(" ")}
			>
				{panel.fields.map(
					(field: { label: string; value: string }): ReactElement => (
						<label
							key={`${panel.id}-${field.label}`}
							className="min-w-0"
						>
							<span className="mb-1 block text-[10px] font-bold text-[#a1a1aa]">
								{field.label}
							</span>
							<input
								readOnly
								value={field.value}
								className="h-6 w-full rounded-[5px] border border-[#34343b] bg-[var(--nara-shell-bg)] px-2 text-[11px] font-semibold text-[var(--nara-text-primary)] outline-none"
							/>
						</label>
					),
				)}
			</div>

			<div className="mt-3 flex items-center gap-2">
				{panel.chips.map(
					(chip: string): ReactElement => (
						<button
							key={`${panel.id}-${chip}`}
							type="button"
							className="rounded-[6px] bg-[#2c2c32] px-2 py-1 text-[10px] font-bold text-[#d8d8df] transition-colors hover:bg-[#34343b]"
						>
							{chip}
						</button>
					),
				)}
				<button
					type="button"
					aria-label={`Plus de ${panel.title}`}
					className="ml-auto rounded-[5px] bg-[#2c2c32] p-1 text-[#d8d8df]"
				>
					<MoreHorizontal
						aria-hidden="true"
						className="h-3.5 w-3.5"
					/>
				</button>
			</div>
		</section>
	);
}

function Inspector(): ReactElement {
	return (
		<aside className="relative hidden w-[312px] shrink-0 border-l border-[#2c2c32]  px-3 py-14 xl:block">
			<div className="space-y-2">
				{toolPanels.map(
					(panel: ToolPanel): ReactElement => (
						<ToolPanelCard key={panel.id} panel={panel} />
					),
				)}
			</div>
			<div className="absolute right-[-42px] top-14 flex flex-col gap-2 rounded-[14px] border border-[#2c2c32] p-1">
				{toolPanels.map((panel: ToolPanel): ReactElement => {
					const Icon = panel.icon;
					return (
						<button
							key={`rail-${panel.id}`}
							type="button"
							aria-label={panel.title}
							className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--nara-surface-raised)] text-[#d8d8df] transition-colors first:bg-[#2c2c32] hover:text-[var(--nara-text-primary)]"
						>
							<Icon aria-hidden="true" className="h-4 w-4" />
						</button>
					);
				})}
				<button
					type="button"
					aria-label="Assets"
					className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--nara-surface-raised)] text-[#d8d8df] transition-colors hover:text-[var(--nara-text-primary)]"
				>
					<Briefcase aria-hidden="true" className="h-4 w-4" />
				</button>
			</div>
		</aside>
	);
}

function TrackMarker({ marker }: { marker: TimelineMarker }): ReactElement {
	const labelPosition =
		marker.position === "top"
			? "bottom-[calc(50%+18px)]"
			: "top-[calc(50%+18px)]";
	const stemPosition =
		marker.position === "top"
			? "bottom-1/2 mb-1"
			: "top-1/2 mt-1";

	return (
		<div
			className="pointer-events-none absolute inset-y-0 z-10 w-16 -translate-x-1/2"
			style={{ left: `${marker.progress}%` }}
		>
			<div
				className={`absolute left-1/2 w-16 -translate-x-1/2 text-center ${labelPosition}`}
			>
				<p className="truncate text-[9px] font-black leading-none text-[var(--nara-text-primary)]">
					{marker.label}
				</p>
				<p className="mt-0.5 text-[7px] font-semibold leading-none text-[#a1a1aa]">
					{marker.time}
				</p>
			</div>
			<span
				aria-hidden="true"
				className={`absolute left-1/2 h-4 w-px -translate-x-1/2 bg-[#d8d8df]/80 ${stemPosition}`}
			/>
			<span
				aria-hidden="true"
				className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[#080809]"
				style={{ backgroundColor: marker.tone }}
			/>
		</div>
	);
}

function TrackPlayer(): ReactElement {
	return (
		<div className="absolute bottom-4 left-10 right-10 z-20 rounded-[12px] border border-[#4a4a52] bg-[#080809] px-5 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.32)] lg:left-16 lg:right-16 xl:left-20 xl:right-20">
			<div className="absolute left-1/2 top-0 h-1.5 w-9 -translate-x-1/2 rounded-b-full bg-[#6f6f78]" />
			<div className="flex items-center gap-4">
				<div className="h-14 w-14 shrink-0 rounded-[8px] border border-[#34343b]" />
				<div className="hidden min-w-[130px] sm:block">
					<p className="text-[13px] font-bold text-[var(--nara-text-primary)]">
						Nom de la piste
					</p>
					<div className="mt-2 flex items-center gap-3 text-[#a1a1aa]">
						<SkipBack aria-hidden="true" className="h-4 w-4" />
						<button
							type="button"
							aria-label="Lecture"
							className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--nara-text-primary)] text-[var(--nara-shell-bg)]"
						>
							<Play
								aria-hidden="true"
								className="h-4 w-4 fill-current"
							/>
						</button>
						<SkipForward aria-hidden="true" className="h-4 w-4" />
					</div>
				</div>

				<div className="relative h-16 min-w-0 flex-1">
					<div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#6f6f78]" />
					<div className="absolute left-0 top-1/2 h-1 w-[45%] -translate-y-1/2 rounded-full bg-[#d9008d]" />
					{timelineMarkers.map(
						(marker: TimelineMarker): ReactElement => (
							<TrackMarker key={marker.id} marker={marker} />
						),
					)}
				</div>

				<div className="hidden w-[190px] shrink-0 items-center justify-end gap-3 text-[11px] font-bold text-[var(--nara-text-primary)] lg:flex">
					<span>0:00/4:30</span>
					<Volume2
						aria-hidden="true"
						className="h-4 w-4 text-[#d8d8df]"
					/>
					<div className="h-1 w-20 rounded-full bg-[#6f6f78]">
						<div className="h-full w-[62%] rounded-full bg-[var(--nara-text-primary)]" />
					</div>
				</div>
			</div>
		</div>
	);
}

export default function LyricsEditorFigmaBase(): ReactElement {
	return (
		<section className="relative flex h-full min-h-[680px] w-full min-w-0 flex-col overflow-hidden rounded-[10px] border border-[#2c2c32] text-[var(--nara-text-primary)]">
			<EditorToolbar />
			<div className="relative flex min-h-0 flex-1 overflow-hidden">
				<div className="flex min-w-0 flex-1 flex-col">
					<WorkspaceHeader />
					<LyricsCanvas />
				</div>
				<Inspector />
			</div>
			<TrackPlayer />
		</section>
	);
}
