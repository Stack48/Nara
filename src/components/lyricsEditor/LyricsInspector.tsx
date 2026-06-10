"use client";

import {
	AudioWaveform,
	Bot,
	ChevronRight,
	ChevronDown,
	MoreHorizontal,
	Shuffle,
	Sparkles,
	X,
	Check,
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
import { useRef } from "react";

export type LyricsInspectorPanelId =
	| "rhymes"
	| "synonyms"
	| "antonyms"
	| "lexical";

export type LyricsInspectorField = {
	label: string;
	value: string;
};

export type PanelFilters = {
	syllables: number | null;
	category: string | null;
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
		id: "lexical",
		title: "Champs lexical",
		icon: Sparkles,
		railIcon: Bot,
		fields: [
			{ label: "Theme", value: "La mer" },
			{ label: "Syllabes", value: "" },
			{ label: "Category", value: "" },
		],
		chips: ["Vague", "Ocean", "Rivage"],
	},
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
		fields: [
			{ label: "Mot", value: "ecrire" },
			{ label: "Syllabes", value: "" },
			{ label: "Category", value: "" },
		],
		chips: ["Rediger", "Composer", "inscrire"],
	},
	{
		id: "antonyms",
		title: "Antonymes",
		icon: Shuffle,
		railIcon: Sparkles,
		fields: [
			{ label: "Mot", value: "ecrire" },
			{ label: "Syllabes", value: "" },
			{ label: "Category", value: "" },
		],
		chips: ["Annihiler", "annuler", "biffer"],
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

type InspectorSelectOption = {
	label: string;
	value: string;
};

function InspectorSelect({
	options,
	value,
	onChange,
}: {
	options: InspectorSelectOption[];
	value: string;
	onChange: (value: string) => void;
}): ReactElement {
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect((): void | (() => void) => {
		if (!isOpen) {
			return;
		}

		function handleOutside(event: Event): void {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleOutside);
		return (): void =>
			document.removeEventListener("mousedown", handleOutside);
	}, [isOpen]);

	const selectedLabel: string =
		options.find((option: InspectorSelectOption): boolean => option.value === value)
			?.label ?? value;

	return (
		<div
			ref={containerRef}
			className="relative inline-flex h-6.5 w-full items-center min-w-0"
		>
			<button
				type="button"
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				onMouseDown={(event): void => event.preventDefault()}
				onClick={(): void => setIsOpen((current) => !current)}
				className="flex h-6.5 w-full items-center justify-between gap-1 rounded-[6px] border border-white/[0.08] bg-black/40 px-2 text-[11px] font-medium text-white/90 outline-none transition-all hover:bg-black/60 focus:border-[#DA069A] focus:ring-1 focus:ring-[#DA069A]/20"
			>
				<span className="truncate text-left">{selectedLabel}</span>
				<ChevronDown
					aria-hidden="true"
					size={11}
					strokeWidth={2}
					className={`shrink-0 text-white/40 transition-transform duration-200 ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{isOpen && (
				<div
					role="listbox"
					className="absolute left-0 bottom-[calc(100%+6px)] z-[100] min-w-[120px] max-h-[160px] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#141418]/95 py-1 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-2xl backdrop-saturate-150"
					style={{
						scrollbarWidth: "thin",
						scrollbarColor: "rgba(255,255,255,0.08) transparent",
					}}
				>
					{options.map((option: InspectorSelectOption): ReactElement => {
						const isSelected: boolean = option.value === value;

						return (
							<button
								key={option.value}
								type="button"
								role="option"
								aria-selected={isSelected}
								onMouseDown={(event): void => event.preventDefault()}
								onClick={(): void => {
									onChange(option.value);
									setIsOpen(false);
								}}
								className={`flex w-full items-center gap-2 whitespace-nowrap px-2.5 py-1 text-left text-[11px] font-medium transition-colors cursor-pointer ${
									isSelected
										? "bg-[#DA069A]/15 text-white"
										: "text-[#D9D9DE] hover:bg-white/[0.06]"
								}`}
							>
								<span className="flex-1 truncate">
									{option.label}
								</span>
								{isSelected && (
									<Check
										size={10}
										strokeWidth={2.5}
										className="shrink-0 text-[#DA069A]"
									/>
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

function LyricsInspectorPanelCard({
	fieldValues,
	onFieldChange,
	onSearch,
	onChipClick,
	panel,
	rhymeFilters,
	onRhymeFilterChange,
}: {
	fieldValues: Record<string, string>;
	onFieldChange: (
		panelId: LyricsInspectorPanelId,
		field: LyricsInspectorField,
		value: string,
	) => void;
	onSearch: (panelId: LyricsInspectorPanelId, value: string) => void;
	onChipClick: (panelId: LyricsInspectorPanelId, value: string) => void;
	panel: LyricsInspectorPanel & {
		loading: boolean;
		error: string | null;
		availableSyllables?: number[];
		availableCategories?: string[];
	};
	rhymeFilters: { syllables: number | null; category: string | null };
	onRhymeFilterChange: (next: {
		syllables?: number | null;
		category?: string | null;
	}) => void;
}): ReactElement {
	const Icon: LucideIcon = panel.icon;
	const isCompactGrid: boolean = panel.fields.length > 1;

	const [isExpanded, setIsExpanded] = useState(false);

	// Reset expansion state when searched word or chips array changes
	useEffect(() => {
		setIsExpanded(false);
	}, [panel.chips.length, panel.fields]);

	const visibleChips = isExpanded ? panel.chips : panel.chips.slice(0, 8);

	return (
		<section className="min-w-0 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2 select-none hover:bg-white/[0.035] hover:border-white/[0.08] transition-all duration-300 flex flex-col gap-2 mx-2.5 my-1">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Icon size={14} strokeWidth={2} className="text-white/60" />
					<h3 className="text-[11px] font-bold tracking-wide uppercase text-white/40">
						{panel.title}
					</h3>
				</div>
				{panel.loading && (
					<span className="text-[10px] text-[#DA069A] font-medium animate-pulse">
						Chargement...
					</span>
				)}
			</div>

			<div
				className={`grid min-w-0 gap-1.5 ${
					isCompactGrid
						? "grid-cols-[minmax(0,1fr)_minmax(50px,0.42fr)_minmax(56px,0.48fr)]"
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
						const isFilterField: boolean =
							field.label === "Syllabes" ||
							field.label === "Category";

						if (isFilterField) {
							const isSyllables = field.label === "Syllabes";

							return (
								<label
									key={`${panel.id}-${field.label}`}
									className="grid min-w-0 gap-1"
								>
									<span className="truncate text-[10px] font-semibold text-white/50 tracking-tight">
										{field.label}
									</span>
									{isSyllables ? (
										<InspectorSelect
											value={
												rhymeFilters.syllables !== null
													? String(rhymeFilters.syllables)
													: ""
											}
											onChange={(val): void =>
												onRhymeFilterChange({
													syllables: val ? Number(val) : null,
												})
											}
											options={[
												{ label: "Toutes", value: "" },
												...(panel.availableSyllables ?? []).map((n) => ({
													label: String(n),
													value: String(n),
												})),
											]}
										/>
									) : (
										<InspectorSelect
											value={rhymeFilters.category ?? ""}
											onChange={(val): void =>
												onRhymeFilterChange({
													category: val || null,
												})
											}
											options={[
												{ label: "Toutes", value: "" },
												...(panel.availableCategories ?? []).map((c) => ({
													label: c,
													value: c,
												})),
											]}
										/>
									)}
								</label>
							);
						}

						return (
							<label
								key={`${panel.id}-${field.label}`}
								className="grid min-w-0 gap-1"
							>
								<span className="truncate text-[10px] font-semibold text-white/50 tracking-tight">
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
									className="h-6.5 w-full rounded-[6px] border border-white/[0.08] bg-black/40 px-2.5 text-[11px] font-medium text-white/90 outline-none transition-all placeholder-white/20 focus:border-[#DA069A] focus:ring-1 focus:ring-[#DA069A]/20"
								/>
							</label>
						);
					},
				)}
			</div>

			{panel.error && (
				<div className="text-[10px] text-red-400/90 font-medium px-0.5">
					{panel.error}
				</div>
			)}

			<div className="mt-1 flex min-w-0 items-start gap-1.5">
				<div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
					{visibleChips.map(
						(chip: string): ReactElement => (
							<button
								key={`${panel.id}-${chip}`}
								type="button"
								onMouseDown={(event): void =>
									event.preventDefault()
								}
								onClick={(): void =>
									onChipClick(panel.id, chip)
								}
								className="h-[22px] max-w-full min-w-0 truncate rounded-full bg-white/[0.04] border border-white/[0.05] hover:bg-[#DA069A]/10 hover:border-[#DA069A]/20 hover:text-[#DA069A] active:scale-95 px-3 text-[10px] font-semibold text-white/70 transition-all cursor-pointer shadow-sm"
							>
								{chip}
							</button>
						),
					)}
				</div>
			</div>

			{panel.chips.length > 8 && (
				<button
					type="button"
					onMouseDown={(event): void => event.preventDefault()}
					onClick={(): void => setIsExpanded(!isExpanded)}
					className="flex w-full items-center justify-end gap-1 text-[10px] font-bold text-[#DA069A] hover:text-[#E60091] transition-colors mt-0.5"
				>
					{isExpanded ? "Voir moins" : "Voir plus"}
					<ChevronRight
						size={10}
						strokeWidth={1.8}
						className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
					/>
				</button>
			)}
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
		<nav className="w-[40px] shrink-0 flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-[#141418]/65 p-1.5 shadow-[0_16px_50px_-12px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150">
			{tools.map((tool: LyricsInspectorRailTool): ReactElement => {
				const Icon: LucideIcon = tool.icon;
				const isActive: boolean = visiblePanelIds.has(tool.id);

				return (
					<button
						key={tool.id}
						type="button"
						onMouseDown={(event): void => event.preventDefault()}
						aria-label={`${isActive ? "Masquer" : "Afficher"} ${tool.label}`}
						aria-pressed={isActive}
						onClick={(): void => {
							onTogglePanel(tool.id);
						}}
						className={`inline-flex h-8 w-8 items-center justify-center rounded-[8px] border transition-all duration-200 active:scale-90 ${
							isActive
								? "bg-white/[0.10] text-white border-white/[0.06]"
								: "border-transparent text-white/40 hover:bg-white/[0.05] hover:text-white"
						}`}
					>
						<Icon size={15} strokeWidth={2} />
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

	const [failedLookups, setFailedLookups] = useState<Record<string, number>>(
		{},
	);
	const [modalWord, setModalWord] = useState<string | null>(null);
	const [modalForm, setModalForm] = useState({
		description: "",
		synonyms: "",
		antonyms: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [lastSearchedWord, setLastSearchedWord] = useState<string>("");

	const rhymesHook = useLinguistic("rhymes");
	const synonymsHook = useLinguistic("synonyms");
	const antonymsHook = useLinguistic("antonyms");
	const lexicalHook = useLinguistic("lexical");

	const hookByPanel = useMemo(
		() => ({
			rhymes: rhymesHook,
			synonyms: synonymsHook,
			antonyms: antonymsHook,
			lexical: lexicalHook,
		}),
		[rhymesHook, synonymsHook, antonymsHook, lexicalHook],
	);

	const createEmptyFilters = (): Record<
		LyricsInspectorPanelId,
		PanelFilters
	> => ({
		rhymes: { syllables: null, category: null },
		synonyms: { syllables: null, category: null },
		antonyms: { syllables: null, category: null },
		lexical: { syllables: null, category: null },
	});

	const [filtersByPanel, setFiltersByPanel] = useState<
		Record<LyricsInspectorPanelId, PanelFilters>
	>(createEmptyFilters);

	const handleSearch = useCallback(
		(panelId: LyricsInspectorPanelId, term: string) => {
			const cleanTerm = term.trim();
			if (!cleanTerm) return;

			setLastSearchedWord(cleanTerm);
			// A fresh word search clears the panel's active filters.
			setFiltersByPanel((prev) => ({
				...prev,
				[panelId]: { syllables: null, category: null },
			}));
			hookByPanel[panelId]?.search(cleanTerm);

			onLookupTermChange?.(cleanTerm);
		},
		[hookByPanel, onLookupTermChange],
	);

	const handleFilterChange = useCallback(
		(
			panelId: LyricsInspectorPanelId,
			next: { syllables?: number | null; category?: string | null },
		) => {
			setFiltersByPanel((prev) => {
				const merged = { ...prev[panelId], ...next };
				const hook = hookByPanel[panelId];
				const wordFieldLabel =
					panelId === "lexical" ? "Theme" : "Mot";
				const word =
					(hook?.data?.word ?? "") ||
					fieldValues[createFieldKey(panelId, wordFieldLabel)] ||
					lastSearchedWord;

				if (word) {
					hook?.search(word, {
						syllables: merged.syllables,
						category: merged.category,
					});
				}

				return { ...prev, [panelId]: merged };
			});
		},
		[hookByPanel, fieldValues, lastSearchedWord],
	);

	const handleChipClick = useCallback(
		(panelId: LyricsInspectorPanelId, chip: string) => {
			try {
				document.execCommand("insertText", false, chip);
			} catch (e) {
				console.error("Failed to insert word:", e);
			}
		},
		[],
	);

	const activePanels = useMemo(() => {
		return panels.map((panel) => {
			let chips = panel.chips;
			let fields = [...panel.fields];
			let loading = false;
			let error = null;
			let availableSyllables: number[] = [];
			let availableCategories: string[] = [];

			const hook = hookByPanel[panel.id];
			if (hook) {
				loading = hook.loading;
				error = hook.error || (hook.data?.error ?? null);
				if (hook.data) {
					const hookData = hook.data as any;
					chips = hookData.results || [];
					availableSyllables = hookData.availableSyllables || [];
					availableCategories = hookData.availableCategories || [];

					const wordLabel = panel.id === "lexical" ? "Theme" : "Mot";
					const activeFilters = filtersByPanel[panel.id];

					fields = [
						{ label: wordLabel, value: hookData.word },
						{
							label: "Syllabes",
							value: String(activeFilters.syllables ?? ""),
						},
						{
							label: "Category",
							value: activeFilters.category ?? "",
						},
					];
				}
			}

			return {
				...panel,
				fields,
				chips,
				loading,
				error,
				availableSyllables,
				availableCategories,
			};
		});
	}, [
		panels,
		filtersByPanel,
		hookByPanel,
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
				[createFieldKey("synonyms", "Syllabes")]: String(
					filtersByPanel.synonyms.syllables ?? "",
				),
				[createFieldKey("synonyms", "Category")]:
					filtersByPanel.synonyms.category ?? "",
			}));
		}
	}, [synonymsHook.data, filtersByPanel.synonyms]);

	useEffect(() => {
		if (antonymsHook.data) {
			setFieldValues((prev) => ({
				...prev,
				[createFieldKey("antonyms", "Mot")]: antonymsHook.data!.word,
				[createFieldKey("antonyms", "Syllabes")]: String(
					filtersByPanel.antonyms.syllables ?? "",
				),
				[createFieldKey("antonyms", "Category")]:
					filtersByPanel.antonyms.category ?? "",
			}));
		}
	}, [antonymsHook.data, filtersByPanel.antonyms]);

	useEffect(() => {
		if (lexicalHook.data) {
			setFieldValues((prev) => ({
				...prev,
				[createFieldKey("lexical", "Theme")]: lexicalHook.data!.word,
				[createFieldKey("lexical", "Syllabes")]: String(
					filtersByPanel.lexical.syllables ?? "",
				),
				[createFieldKey("lexical", "Category")]:
					filtersByPanel.lexical.category ?? "",
			}));
		}
	}, [lexicalHook.data, filtersByPanel.lexical]);

	const processedWordRef = useRef<string | null>(null);

	useEffect(() => {
		if (!lastSearchedWord) return;

		const isLoading =
			rhymesHook.loading ||
			synonymsHook.loading ||
			antonymsHook.loading ||
			lexicalHook.loading;
		if (isLoading) return;

		if (processedWordRef.current === lastSearchedWord) return;

		// Helper to check if a hook failed (has network error OR empty/error data)
		const didFail = (hook: { error: string | null; data: any }) => {
			if (hook.error) return true;
			if (!hook.data) return true; // No data means it failed to get anything
			return (
				!!hook.data.error ||
				(Array.isArray(hook.data.results) &&
					hook.data.results.length === 0)
			);
		};

		// The word is truly missing only if ALL searched hooks failed
		const allFailed =
			didFail(rhymesHook) &&
			didFail(synonymsHook) &&
			didFail(antonymsHook) &&
			didFail(lexicalHook);

		if (allFailed) {
			setFailedLookups((prev) => {
				const count = (prev[lastSearchedWord] || 0) + 1;
				if (count >= 2) {
					setModalWord(lastSearchedWord);
				}
				return { ...prev, [lastSearchedWord]: count };
			});
		}

		processedWordRef.current = lastSearchedWord;
	}, [
		lastSearchedWord,
		rhymesHook.loading,
		rhymesHook.error,
		rhymesHook.data,
		synonymsHook.loading,
		synonymsHook.error,
		synonymsHook.data,
		antonymsHook.loading,
		antonymsHook.error,
		antonymsHook.data,
		lexicalHook.loading,
		lexicalHook.error,
		lexicalHook.data,
	]);

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
			setLastSearchedWord(term);
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
		<aside className="flex h-full min-h-0 items-start gap-2 overflow-visible">
			{hasVisiblePanels && (
				// <div className="flex max-h-full min-h-0 w-[286px] min-w-0 flex-col overflow-hidden rounded-[12px] border border-white/[0.08] bg-[#0D0D10]/70  backdrop-blur-2xl backdrop-saturate-150">
				// <div className="flex max-h-full min-h-0 w-[286px] min-w-0 flex-col overflow-hidden rounded-[12px]   backdrop-blur-2xl backdrop-saturate-150">
				<div className="flex max-h-full min-h-0 w-[286px] min-w-0 flex-col overflow-hidden rounded-[12px]">
					<div
						className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1.5"
						style={{
							scrollbarWidth: "thin",
							scrollbarColor:
								"rgba(255,255,255,0.08) transparent",
						}}
					>
						{visiblePanels.map(
							(panel): ReactElement => (
								<LyricsInspectorPanelCard
									key={panel.id}
									fieldValues={fieldValues}
									onFieldChange={handleFieldChange}
									onSearch={handleSearch}
									onChipClick={handleChipClick}
									panel={panel}
									rhymeFilters={filtersByPanel.rhymes}
									onRhymeFilterChange={(next) =>
										handleFilterChange(panel.id, next)
									}
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

			{modalWord && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#1a1a20] p-6 shadow-2xl flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-bold text-white tracking-wide">
								Mot introuvable
							</h3>
							<button
								onClick={() => setModalWord(null)}
								className="text-white/40 hover:text-white transition-colors"
							>
								<X size={16} strokeWidth={2} />
							</button>
						</div>

						<p className="text-[13px] leading-relaxed text-white/60">
							Le mot{" "}
							<strong className="text-white font-semibold">
								"{modalWord}"
							</strong>{" "}
							n'a pas été trouvé dans notre base de données
							linguistique. Voulez-vous suggérer son ajout ?
						</p>

						<div className="flex flex-col gap-3 pt-2">
							<div>
								<label className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">
									Description (Obligatoire)
								</label>
								<input
									type="text"
									value={modalForm.description}
									onChange={(e) =>
										setModalForm((prev) => ({
											...prev,
											description: e.target.value,
										}))
									}
									placeholder="Courte définition..."
									className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#DA069A]/50 focus:bg-white/[0.05] transition-all"
								/>
							</div>

							<div className="flex gap-3">
								<div className="flex-1">
									<label className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">
										Synonymes
									</label>
									<input
										type="text"
										value={modalForm.synonyms}
										onChange={(e) =>
											setModalForm((prev) => ({
												...prev,
												synonyms: e.target.value,
											}))
										}
										placeholder="Séparés par des virgules"
										className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#DA069A]/50 focus:bg-white/[0.05] transition-all"
									/>
								</div>
								<div className="flex-1">
									<label className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">
										Antonymes
									</label>
									<input
										type="text"
										value={modalForm.antonyms}
										onChange={(e) =>
											setModalForm((prev) => ({
												...prev,
												antonyms: e.target.value,
											}))
										}
										placeholder="Séparés par des virgules"
										className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#DA069A]/50 focus:bg-white/[0.05] transition-all"
									/>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
							<button
								onClick={() => {
									setModalWord(null);
									setModalForm({
										description: "",
										synonyms: "",
										antonyms: "",
									});
								}}
								className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.08] py-2.5 text-[12px] font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95"
							>
								Annuler
							</button>
							<button
								onClick={async () => {
									if (!modalForm.description.trim()) return;
									setIsSubmitting(true);
									try {
										await fetch("/api/linguistic/add", {
											method: "POST",
											headers: {
												"Content-Type":
													"application/json",
											},
											body: JSON.stringify({
												word: modalWord,
												description:
													modalForm.description.trim(),
												synonyms:
													modalForm.synonyms.trim() ||
													undefined,
												antonyms:
													modalForm.antonyms.trim() ||
													undefined,
											}),
										});
										setModalWord(null);
										setModalForm({
											description: "",
											synonyms: "",
											antonyms: "",
										});
									} catch (e) {
										console.error("Failed to add word", e);
									} finally {
										setIsSubmitting(false);
									}
								}}
								disabled={
									isSubmitting ||
									!modalForm.description.trim()
								}
								className="flex-1 rounded-xl bg-[#DA069A] border border-[#DA069A]/50 py-2.5 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(10,132,255,0.3)] hover:bg-[#E60091] transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:active:scale-100"
							>
								{isSubmitting ? (
									"Envoi..."
								) : (
									<>
										<Check size={14} strokeWidth={2.5} />
										Soumettre
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</aside>
	);
}
