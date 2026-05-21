"use client";

import {
	AudioWaveform,
	Bot,
	ChevronRight,
	MoreHorizontal,
	Shuffle,
	Sparkles,
	type LucideIcon,
} from "lucide-react";
import {
	useEffect,
	useMemo,
	useState,
	type ReactElement,
} from "react";

export type LyricsInspectorPanelId =
	| "rhymes"
	| "synonyms"
	| "antonyms"
	| "lexical";

export type LyricsInspectorField = {
	label: string;
	value: string;
};

export type LyricsInspectorPanel = {
	id: LyricsInspectorPanelId;
	title: string;
	icon: LucideIcon;
	railIcon?: LucideIcon;
	fields: LyricsInspectorField[];
	chips: string[];
};

type LyricsInspectorRailTool = {
	id: LyricsInspectorPanelId;
	label: string;
	icon: LucideIcon;
};

export type LyricsInspectorProps = {
	panels?: LyricsInspectorPanel[];
	onVisibilityChange?: (hasVisiblePanels: boolean) => void;
};

export const defaultLyricsInspectorPanels: LyricsInspectorPanel[] = [
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
		railIcon: Sparkles,
		fields: [{ label: "Mot", value: "ecrire" }],
		chips: ["Annihiler", "annuler", "biffer"],
	},
	{
		id: "lexical",
		title: "Champs lexical",
		icon: Sparkles,
		railIcon: Bot,
		fields: [{ label: "Theme", value: "La mer" }],
		chips: ["Vague", "Ocean", "Rivage"],
	},
];

function createInitialVisiblePanelIds(
	panels: LyricsInspectorPanel[],
): Set<LyricsInspectorPanelId> {
	return new Set<LyricsInspectorPanelId>(
		panels.map((panel: LyricsInspectorPanel): LyricsInspectorPanelId => panel.id),
	);
}

function createRailTools(
	panels: LyricsInspectorPanel[],
): LyricsInspectorRailTool[] {
	return panels.map(
		(panel: LyricsInspectorPanel): LyricsInspectorRailTool => ({
			id: panel.id,
			label: panel.title,
			icon: panel.railIcon ?? panel.icon,
		}),
	);
}

function LyricsInspectorPanelCard({
	panel,
}: {
	panel: LyricsInspectorPanel;
}): ReactElement {
	const Icon: LucideIcon = panel.icon;
	const isCompactGrid: boolean = panel.fields.length > 1;

	return (
		<section className="min-w-0 border-b border-[#2C2C32] p-2.5">
			<div className="mb-2 flex items-center gap-2">
				<Icon size={13} strokeWidth={1.8} className="text-[#F3F4F6]" />
				<h3 className="text-[12px] font-bold text-[#F3F4F6]">{panel.title}</h3>
			</div>

			<div
				className={`grid min-w-0 gap-1.5 ${
					isCompactGrid
						? "grid-cols-[minmax(0,1fr)_minmax(44px,0.42fr)_minmax(50px,0.48fr)]"
						: "grid-cols-1"
				}`}
			>
				{panel.fields.map(
					(field: LyricsInspectorField): ReactElement => (
						<label key={`${panel.id}-${field.label}`} className="grid min-w-0 gap-1">
							<span className="truncate text-[10px] font-medium text-[#F3F4F6]">
								{field.label}
							</span>
							<input
								readOnly
								value={field.value}
								className="h-5 min-w-0 w-full rounded-[2px] border border-[#A1A1AA] bg-transparent px-2 text-[9px] text-[#F3F4F6] outline-none"
							/>
						</label>
					),
				)}
			</div>

			<div className="mt-2 flex min-w-0 items-start gap-1.5">
				<div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
					{panel.chips.map(
						(chip: string): ReactElement => (
							<button
								key={`${panel.id}-${chip}`}
								type="button"
								className="h-5 max-w-full min-w-0 truncate rounded-[2px] bg-[#2C2C32] px-2 text-[9px] font-medium text-[#F3F4F6] transition-colors hover:bg-[#3A3A42]"
							>
								{chip}
							</button>
						),
					)}
				</div>
				<button
					type="button"
					aria-label={`Plus d'options pour ${panel.title}`}
					className="inline-flex h-5 w-6 shrink-0 items-center justify-center rounded-[2px] bg-[#2C2C32] text-[#F3F4F6] transition-colors hover:bg-[#3A3A42]"
				>
					<MoreHorizontal size={12} strokeWidth={1.8} />
				</button>
			</div>

			<button
				type="button"
				className="mt-2 flex w-full items-center justify-end gap-1 text-[9px] font-medium text-[#F3F4F6] transition-colors hover:text-white"
			>
				Voir plus
				<ChevronRight size={10} strokeWidth={1.8} />
			</button>
		</section>
	);
}

function LyricsInspectorRail({
	tools,
	visiblePanelIds,
	onTogglePanel,
}: {
	tools: LyricsInspectorRailTool[];
	visiblePanelIds: Set<LyricsInspectorPanelId>;
	onTogglePanel: (panelId: LyricsInspectorPanelId) => void;
}): ReactElement {
	return (
		<nav className="flex w-9 shrink-0 flex-col items-center gap-2 border-l border-[#2C2C32] pt-3">
			{tools.map(
				(tool: LyricsInspectorRailTool): ReactElement => {
					const Icon: LucideIcon = tool.icon;
					const isActive: boolean = visiblePanelIds.has(tool.id);

					return (
						<button
							key={tool.id}
							type="button"
							aria-label={`${isActive ? "Masquer" : "Afficher"} ${tool.label}`}
							aria-pressed={isActive}
							onClick={(): void => {
								onTogglePanel(tool.id);
							}}
							className={`inline-flex h-7 w-7 items-center justify-center rounded-[5px] border text-[#A1A1AA] transition-colors hover:text-white ${
								isActive
									? "border-[#3A3A42] bg-[#2C2C32] text-[#F3F4F6]"
									: "border-transparent bg-[#17171C]"
							}`}
						>
							<Icon size={15} strokeWidth={1.8} />
						</button>
					);
				},
			)}
		</nav>
	);
}

export function LyricsInspector({
	panels = defaultLyricsInspectorPanels,
	onVisibilityChange,
}: LyricsInspectorProps): ReactElement {
	const [visiblePanelIds, setVisiblePanelIds] = useState<
		Set<LyricsInspectorPanelId>
	>(() => createInitialVisiblePanelIds(panels));
	const railTools: LyricsInspectorRailTool[] = useMemo(
		(): LyricsInspectorRailTool[] => createRailTools(panels),
		[panels],
	);
	const visiblePanels: LyricsInspectorPanel[] = useMemo(
		(): LyricsInspectorPanel[] =>
			panels.filter(
				(panel: LyricsInspectorPanel): boolean => visiblePanelIds.has(panel.id),
			),
		[panels, visiblePanelIds],
	);
	const hasVisiblePanels: boolean = visiblePanels.length > 0;

	useEffect((): void => {
		onVisibilityChange?.(hasVisiblePanels);
	}, [hasVisiblePanels, onVisibilityChange]);

	function handleTogglePanel(panelId: LyricsInspectorPanelId): void {
		setVisiblePanelIds(
			(currentPanelIds: Set<LyricsInspectorPanelId>): Set<LyricsInspectorPanelId> => {
				const nextPanelIds: Set<LyricsInspectorPanelId> = new Set(
					currentPanelIds,
				);

				if (nextPanelIds.has(panelId)) {
					nextPanelIds.delete(panelId);
				} else {
					nextPanelIds.add(panelId);
				}

				return nextPanelIds;
			},
		);
	}

	return (
		<aside className="flex h-full min-h-0 overflow-hidden border-l border-[#2C2C32] bg-[#17171C]">
			{hasVisiblePanels && (
				<div className="flex min-h-0 w-[284px] min-w-0 flex-col">
					<div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
						{visiblePanels.map(
							(panel: LyricsInspectorPanel): ReactElement => (
								<LyricsInspectorPanelCard key={panel.id} panel={panel} />
							),
						)}
					</div>
				</div>
			)}

			<LyricsInspectorRail
				tools={railTools}
				visiblePanelIds={visiblePanelIds}
				onTogglePanel={handleTogglePanel}
			/>
		</aside>
	);
}
