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
	useCallback,
	type ChangeEvent,
	type ReactElement,
} from "react";
import { useLinguistic } from "@/hooks/useLinguistic";

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

export type LyricsInspectorFocusRequest = {
	panelId: LyricsInspectorPanelId;
	requestId: number;
};

export type LyricsInspectorLookupTarget = LyricsInspectorPanelId | "all";

export type LyricsInspectorLookupRequest = {
	target: LyricsInspectorLookupTarget;
	requestId: number;
	term: string;
};

export type LyricsInspectorProps = {
	focusRequest?: LyricsInspectorFocusRequest | null;
	lookupRequest?: LyricsInspectorLookupRequest | null;
	onLookupTermChange?: (term: string) => void;
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
		panels.map(
			(panel: LyricsInspectorPanel): LyricsInspectorPanelId => panel.id,
		),
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

function isLookupField(field: LyricsInspectorField): boolean {
	return field.label === "Mot" || field.label === "Theme";
}

function createFieldKey(
	panelId: LyricsInspectorPanelId,
	label: string,
): string {
	return `${panelId}:${label}`;
}

function createInitialFieldValues(
	panels: LyricsInspectorPanel[],
): Record<string, string> {
	return panels.reduce(
		(
			values: Record<string, string>,
			panel: LyricsInspectorPanel,
		): Record<string, string> => {
			panel.fields.forEach((field: LyricsInspectorField): void => {
				values[createFieldKey(panel.id, field.label)] = field.value;
			});

			return values;
		},
		{},
	);
}

function applyLookupTermToTargetFields(
	panels: LyricsInspectorPanel[],
	currentValues: Record<string, string>,
	target: LyricsInspectorLookupTarget,
	lookupTerm: string,
): Record<string, string> {
	const nextValues: Record<string, string> = { ...currentValues };
	const targetPanels: LyricsInspectorPanel[] =
		target === "all"
			? panels
			: panels.filter(
					(panel: LyricsInspectorPanel): boolean =>
						panel.id === target,
				);

	targetPanels.forEach((panel: LyricsInspectorPanel): void => {
		panel.fields.forEach((field: LyricsInspectorField): void => {
			if (isLookupField(field)) {
				nextValues[createFieldKey(panel.id, field.label)] = lookupTerm;
			}
		});
	});

	return nextValues;
}

function LyricsInspectorPanelCard({
	fieldValues,
	onFieldChange,
	onSearch,
	onChipClick,
	panel,
}: {
	fieldValues: Record<string, string>;
	onFieldChange: (
		panelId: LyricsInspectorPanelId,
		field: LyricsInspectorField,
		value: string,
	) => void;
	onSearch: (panelId: LyricsInspectorPanelId, value: string) => void;
	onChipClick: (panelId: LyricsInspectorPanelId, value: string) => void;
	panel: LyricsInspectorPanel & { loading: boolean; error: string | null };
}): ReactElement {
	const Icon: LucideIcon = panel.icon;
	const isCompactGrid: boolean = panel.fields.length > 1;

	return (
		<section className="min-w-0 border-b border-[#2C2C32] p-2.5">
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Icon
						size={13}
						strokeWidth={1.8}
						className="text-[#F3F4F6]"
					/>
					<h3 className="text-[12px] font-bold text-[#F3F4F6]">
						{panel.title}
					</h3>
				</div>
				{panel.loading && (
					<span className="text-[9px] text-[#A1A1AA] animate-pulse">
						Chargement...
					</span>
				)}
			</div>

			<div
				className={`grid min-w-0 gap-1.5 ${
					isCompactGrid
						? "grid-cols-[minmax(0,1fr)_minmax(44px,0.42fr)_minmax(50px,0.48fr)]"
						: "grid-cols-1"
				}`}
			>
				{panel.fields.map(
					(field: LyricsInspectorField): ReactElement => {
						const fieldKey: string = createFieldKey(
							panel.id,
							field.label,
						);
						const canEdit: boolean = isLookupField(field);

						return (
							<label
								key={`${panel.id}-${field.label}`}
								className="grid min-w-0 gap-1"
							>
								<span className="truncate text-[10px] font-medium text-[#F3F4F6]">
									{field.label}
								</span>
								<input
									readOnly={!canEdit}
									value={fieldValues[fieldKey] ?? field.value}
									onChange={(
										event: ChangeEvent<HTMLInputElement>,
									): void => {
										if (canEdit) {
											onFieldChange(
												panel.id,
												field,
												event.target.value,
											);
										}
									}}
									onKeyDown={(
										event: React.KeyboardEvent<HTMLInputElement>,
									): void => {
										if (event.key === "Enter" && canEdit) {
											onSearch(
												panel.id,
												event.currentTarget.value,
											);
										}
									}}
									onBlur={(): void => {
										if (canEdit) {
											onSearch(
												panel.id,
												fieldValues[fieldKey] ??
													field.value,
											);
										}
									}}
									className="h-5 min-w-0 w-full rounded-[2px] border border-[#A1A1AA] bg-transparent px-2 text-[9px] text-[#F3F4F6] outline-none transition-colors focus:border-[#F3F4F6]"
								/>
							</label>
						);
					},
				)}
			</div>

			{panel.error && (
				<div className="mt-1 text-[9px] text-red-400">
					{panel.error}
				</div>
			)}

			<div className="mt-2 flex min-w-0 items-start gap-1.5">
				<div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
					{panel.chips.map(
						(chip: string): ReactElement => (
							<button
								key={`${panel.id}-${chip}`}
								type="button"
								onClick={(): void =>
									onChipClick(panel.id, chip)
								}
								className="h-5 max-w-full min-w-0 truncate rounded-[2px] bg-[#2C2C32] px-2 text-[9px] font-medium text-[#F3F4F6] transition-colors hover:bg-[#3A3A42] cursor-pointer"
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
			{tools.map((tool: LyricsInspectorRailTool): ReactElement => {
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
			})}
		</nav>
	);
}

export function LyricsInspector({
	focusRequest,
	lookupRequest,
	onLookupTermChange,
	panels = defaultLyricsInspectorPanels,
	onVisibilityChange,
}: LyricsInspectorProps): ReactElement {
	const [visiblePanelIds, setVisiblePanelIds] = useState<
		Set<LyricsInspectorPanelId>
	>(() => createInitialVisiblePanelIds(panels));
	const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
		createInitialFieldValues(panels),
	);

	const rhymesHook = useLinguistic("rhymes");
	const synonymsHook = useLinguistic("synonyms");
	const antonymsHook = useLinguistic("antonyms");
	const lexicalHook = useLinguistic("lexical");

	const handleSearch = useCallback(
		(panelId: LyricsInspectorPanelId, term: string) => {
			const cleanTerm = term.trim();
			if (!cleanTerm) return;

			if (panelId === "rhymes") rhymesHook.search(cleanTerm);
			else if (panelId === "synonyms") synonymsHook.search(cleanTerm);
			else if (panelId === "antonyms") antonymsHook.search(cleanTerm);
			else if (panelId === "lexical") lexicalHook.search(cleanTerm);

			onLookupTermChange?.(cleanTerm);
		},
		[
			rhymesHook,
			synonymsHook,
			antonymsHook,
			lexicalHook,
			onLookupTermChange,
		],
	);

	const handleChipClick = useCallback(
		(panelId: LyricsInspectorPanelId, chip: string) => {
			handleSearch(panelId, chip);
		},
		[handleSearch],
	);

	const activePanels = useMemo(() => {
		return panels.map((panel) => {
			let chips = panel.chips;
			let fields = [...panel.fields];
			let loading = false;
			let error = null;

			if (panel.id === "rhymes") {
				loading = rhymesHook.loading;
				error = rhymesHook.error || (rhymesHook.data?.error ?? null);
				if (rhymesHook.data) {
					const rhymeData = rhymesHook.data as any;
					chips = rhymeData.results || [];
					fields = [
						{ label: "Mot", value: rhymeData.word },
						{
							label: "Syllabes",
							value: String(rhymeData.syllables ?? ""),
						},
						{ label: "Category", value: rhymeData.category ?? "" },
					];
				}
			} else if (panel.id === "synonyms") {
				loading = synonymsHook.loading;
				error =
					synonymsHook.error || (synonymsHook.data?.error ?? null);
				if (synonymsHook.data) {
					chips = synonymsHook.data.results || [];
					fields = [{ label: "Mot", value: synonymsHook.data.word }];
				}
			} else if (panel.id === "antonyms") {
				loading = antonymsHook.loading;
				error =
					antonymsHook.error || (antonymsHook.data?.error ?? null);
				if (antonymsHook.data) {
					chips = antonymsHook.data.results || [];
					fields = [{ label: "Mot", value: antonymsHook.data.word }];
				}
			} else if (panel.id === "lexical") {
				loading = lexicalHook.loading;
				error = lexicalHook.error || (lexicalHook.data?.error ?? null);
				if (lexicalHook.data) {
					chips = lexicalHook.data.results || [];
					fields = [{ label: "Theme", value: lexicalHook.data.word }];
				}
			}

			return {
				...panel,
				fields,
				chips,
				loading,
				error,
			};
		});
	}, [
		panels,
		rhymesHook.data,
		rhymesHook.loading,
		rhymesHook.error,
		synonymsHook.data,
		synonymsHook.loading,
		synonymsHook.error,
		antonymsHook.data,
		antonymsHook.loading,
		antonymsHook.error,
		lexicalHook.data,
		lexicalHook.loading,
		lexicalHook.error,
	]);

	const railTools: LyricsInspectorRailTool[] = useMemo(
		(): LyricsInspectorRailTool[] => createRailTools(panels),
		[panels],
	);

	const visiblePanels = useMemo(
		() => activePanels.filter((panel) => visiblePanelIds.has(panel.id)),
		[activePanels, visiblePanelIds],
	);

	const hasVisiblePanels: boolean = visiblePanels.length > 0;

	useEffect((): void => {
		onVisibilityChange?.(hasVisiblePanels);
	}, [hasVisiblePanels, onVisibilityChange]);

	useEffect((): void => {
		setFieldValues(createInitialFieldValues(panels));
	}, [panels]);

	useEffect(() => {
		if (rhymesHook.data) {
			setFieldValues((prev) => ({
				...prev,
				[createFieldKey("rhymes", "Mot")]: rhymesHook.data!.word,
				[createFieldKey("rhymes", "Syllabes")]: String(
					(rhymesHook.data as any).syllables ?? "",
				),
				[createFieldKey("rhymes", "Category")]:
					(rhymesHook.data as any).category ?? "",
			}));
		}
	}, [rhymesHook.data]);

	useEffect(() => {
		if (synonymsHook.data) {
			setFieldValues((prev) => ({
				...prev,
				[createFieldKey("synonyms", "Mot")]: synonymsHook.data!.word,
			}));
		}
	}, [synonymsHook.data]);

	useEffect(() => {
		if (antonymsHook.data) {
			setFieldValues((prev) => ({
				...prev,
				[createFieldKey("antonyms", "Mot")]: antonymsHook.data!.word,
			}));
		}
	}, [antonymsHook.data]);

	useEffect(() => {
		if (lexicalHook.data) {
			setFieldValues((prev) => ({
				...prev,
				[createFieldKey("lexical", "Theme")]: lexicalHook.data!.word,
			}));
		}
	}, [lexicalHook.data]);

	useEffect((): void => {
		if (!lookupRequest) {
			return;
		}

		setVisiblePanelIds(
			(
				currentPanelIds: Set<LyricsInspectorPanelId>,
			): Set<LyricsInspectorPanelId> => {
				if (lookupRequest.target === "all") {
					return createInitialVisiblePanelIds(panels);
				}

				const nextPanelIds: Set<LyricsInspectorPanelId> = new Set(
					currentPanelIds,
				);

				nextPanelIds.add(lookupRequest.target);

				return nextPanelIds;
			},
		);
		setFieldValues(
			(currentValues: Record<string, string>): Record<string, string> =>
				applyLookupTermToTargetFields(
					panels,
					currentValues,
					lookupRequest.target,
					lookupRequest.term,
				),
		);

		const term = lookupRequest.term.trim();
		if (term) {
			if (lookupRequest.target === "all") {
				rhymesHook.search(term);
				synonymsHook.search(term);
				antonymsHook.search(term);
				lexicalHook.search(term);
			} else {
				if (lookupRequest.target === "rhymes") rhymesHook.search(term);
				if (lookupRequest.target === "synonyms")
					synonymsHook.search(term);
				if (lookupRequest.target === "antonyms")
					antonymsHook.search(term);
				if (lookupRequest.target === "lexical")
					lexicalHook.search(term);
			}
		}
	}, [lookupRequest, panels]);

	useEffect((): void => {
		if (!focusRequest) {
			return;
		}

		setVisiblePanelIds(
			(
				currentPanelIds: Set<LyricsInspectorPanelId>,
			): Set<LyricsInspectorPanelId> => {
				const nextPanelIds: Set<LyricsInspectorPanelId> = new Set(
					currentPanelIds,
				);

				nextPanelIds.add(focusRequest.panelId);

				return nextPanelIds;
			},
		);
	}, [focusRequest]);

	function handleTogglePanel(panelId: LyricsInspectorPanelId): void {
		setVisiblePanelIds(
			(
				currentPanelIds: Set<LyricsInspectorPanelId>,
			): Set<LyricsInspectorPanelId> => {
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

	function handleFieldChange(
		panelId: LyricsInspectorPanelId,
		field: LyricsInspectorField,
		value: string,
	): void {
		if (!isLookupField(field)) {
			return;
		}

		setFieldValues(
			(
				currentValues: Record<string, string>,
			): Record<string, string> => ({
				...currentValues,
				[createFieldKey(panelId, field.label)]: value,
			}),
		);
		onLookupTermChange?.(value);
	}

	return (
		<aside className="flex h-full min-h-0 overflow-hidden border-l border-[#2C2C32] bg-[#17171C]">
			{hasVisiblePanels && (
				<div className="flex min-h-0 w-[284px] min-w-0 flex-col">
					<div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
						{visiblePanels.map(
							(panel): ReactElement => (
								<LyricsInspectorPanelCard
									key={panel.id}
									fieldValues={fieldValues}
									onFieldChange={handleFieldChange}
									onSearch={handleSearch}
									onChipClick={handleChipClick}
									panel={panel}
								/>
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
