"use client";

import {
	AudioWaveform,
	Bot,
	ChevronRight,
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

	const [isExpanded, setIsExpanded] = useState(false);

	// Reset expansion state when searched word or chips array changes
	useEffect(() => {
		setIsExpanded(false);
	}, [panel.chips.length, panel.fields]);

	const visibleChips = isExpanded ? panel.chips : panel.chips.slice(0, 8);

	return (
		<section className="min-w-0 bg-[#25252b]/40 border border-white/[0.04] rounded-xl px-3 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.15)] select-none hover:border-white/[0.08] transition-all duration-300 flex flex-col gap-2.5 mx-3.5 my-2.5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Icon size={14} strokeWidth={2} className="text-white/60" />
					<h3 className="text-[11px] font-bold tracking-wide uppercase text-white/40">
						{panel.title}
					</h3>
				</div>
				{panel.loading && (
					<span className="text-[10px] text-[#0A84FF] font-medium animate-pulse">
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
									className="h-6.5 w-full rounded-[6px] border border-white/[0.08] bg-black/40 px-2.5 text-[11px] font-medium text-white/90 outline-none transition-all placeholder-white/20 focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]/20"
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
								className="h-[22px] max-w-full min-w-0 truncate rounded-full bg-white/[0.04] border border-white/[0.05] hover:bg-[#0A84FF]/10 hover:border-[#0A84FF]/20 hover:text-[#0A84FF] active:scale-95 px-3 text-[10px] font-semibold text-white/70 transition-all cursor-pointer shadow-sm"
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
					className="flex w-full items-center justify-end gap-1 text-[10px] font-bold text-[#0A84FF] hover:text-[#3399FF] transition-colors mt-0.5"
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
		<nav className="w-[44px] shrink-0 flex flex-col items-center gap-2.5 pt-4">
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
								? "bg-[#17171C] text-white border-0"
								: "border-0 text-white/40 hover:bg-white/4 hover:text-white"
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

	const handleSearch = useCallback(
		(panelId: LyricsInspectorPanelId, term: string) => {
			const cleanTerm = term.trim();
			if (!cleanTerm) return;

			setLastSearchedWord(cleanTerm);

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
		<aside className="flex h-full min-h-0 overflow-hidden">
			{hasVisiblePanels && (
				<div className="flex min-h-0 w-[284px] min-w-0 flex-col">
					<div
						className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2"
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
									className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#0A84FF]/50 focus:bg-white/[0.05] transition-all"
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
										className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#0A84FF]/50 focus:bg-white/[0.05] transition-all"
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
										className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#0A84FF]/50 focus:bg-white/[0.05] transition-all"
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
								className="flex-1 rounded-xl bg-[#0A84FF] border border-[#0A84FF]/50 py-2.5 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(10,132,255,0.3)] hover:bg-[#3399FF] transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:active:scale-100"
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
