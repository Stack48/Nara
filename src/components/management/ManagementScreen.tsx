"use client";

import {
	Bell,
	ChevronRight,
	Clock,
	Copy,
	Download,
	Files,
	GripVertical,
	History,
	Info,
	Layers,
	List,
	MoreVertical,
	Settings,
	Share2,
	Trash2,
	Upload,
	UserPlus,
	Users,
	type LucideIcon,
} from "lucide-react";
import { Syne } from "next/font/google";
import {
	useRef,
	useEffect,
	useState,
	type ChangeEvent,
	type ReactElement,
	type ReactNode,
} from "react";
import {
	commentsStorageKey as lyricsEditorCommentsStorageKey,
	storageKey as lyricsEditorDocumentStorageKey,
} from "@/components/lyricsEditor/v2/lyricsEditorStorage";

const syne = Syne({
	weight: "800",
	subsets: ["latin"],
	display: "swap",
});

type Metric = {
	icon: LucideIcon;
	label: string;
	value: string;
	description: string;
	tone: "purple" | "pink" | "violet";
};

type Collaborator = {
	activity: string;
	avatar: string;
	name: string;
	role: string;
	roleTone: "owner" | "editor" | "commenter" | "reader";
};

type SectionStatus = {
	label: string;
	status: "validated" | "review" | "draft";
};

type ActivityItem = {
	author: string;
	description: string;
	initials: string;
	time: string;
	tone: "pink" | "blue" | "violet";
	title: string;
};

type Participation = {
	initials: string;
	name: string;
	note?: string;
	percent: number;
	tone: "pink" | "blue" | "violet" | "green";
};

type ProjectSetting = {
	description: string;
	icon: LucideIcon;
	label: string;
};

type ProjectSummary = {
	id: string;
	lastModifiedLabel: string;
	name: string;
	status: string;
	statusLabel: string;
	type: string;
};

type ExportableMetric = Omit<Metric, "icon">;

type StoredLyricsLine = {
	comments: number;
	content: unknown;
	id: string;
	number: number;
	text: string;
};

type StoredLyricsSectionAlternative = {
	createdBy: string;
	id: string;
	label: string;
	lines: StoredLyricsLine[];
};

type StoredLyricsSection = {
	accentColor: string;
	activeAlternativeId: string | null;
	alternatives: StoredLyricsSectionAlternative[];
	id: string;
	kind: string;
	lines: StoredLyricsLine[];
	title: string;
};

type StoredLyricsDocument = {
	id: string;
	sections: StoredLyricsSection[];
	title: string;
	updatedAt: string | null;
};

type StoredLineCommentsById = Record<string, unknown[]>;

type ProjectLyricsSnapshot = {
	commentsByLineId: StoredLineCommentsById;
	document: StoredLyricsDocument | null;
	storageKeys: {
		comments: string;
		document: string;
	};
};

type ProjectSnapshot = {
	activity: ActivityItem[];
	collaborators: Collaborator[];
	lyrics: ProjectLyricsSnapshot;
	metrics: Metric[];
	participation: Participation[];
	project: ProjectSummary;
	sections: SectionStatus[];
	settings: Omit<ProjectSetting, "icon">[];
};

type ProjectExportData = {
	activity: ActivityItem[];
	collaborators: Collaborator[];
	exportedAt: string;
	lyrics: ProjectLyricsSnapshot;
	metrics: ExportableMetric[];
	participation: Participation[];
	project: ProjectSummary;
	sections: SectionStatus[];
	settings: Omit<ProjectSetting, "icon">[];
	schemaVersion: 2;
};

const projectExportFileName = "nara-my-way-project-export.json";
const projectImportStorageKey = "nara:management-imported-project";

const currentProject: ProjectSummary = {
	id: "my-way",
	name: "My Way",
	type: "Management",
	status: "in_progress",
	statusLabel: "En cours",
	lastModifiedLabel: "aujourd'hui a 14:32",
};

const metrics: Metric[] = [
	{
		icon: Layers,
		label: "Sections",
		value: "6",
		description: "Structure du morceau",
		tone: "purple",
	},
	{
		icon: List,
		label: "Lignes",
		value: "4",
		description: "Total de lignes de texte",
		tone: "pink",
	},
	{
		icon: Files,
		label: "Versions",
		value: "7",
		description: "Historique des versions",
		tone: "violet",
	},
	{
		icon: Users,
		label: "Collaborateurs",
		value: "4",
		description: "Contributeurs actifs",
		tone: "pink",
	},
];

const collaborators: Collaborator[] = [
	{
		avatar: "NL",
		name: "Nilu",
		role: "Proprietaire",
		roleTone: "owner",
		activity: "aujourd'hui a 13:37",
	},
	{
		avatar: "MA",
		name: "Maya",
		role: "Editeur",
		roleTone: "editor",
		activity: "aujourd'hui a 12:37",
	},
	{
		avatar: "SO",
		name: "Soya",
		role: "Commentaire",
		roleTone: "commenter",
		activity: "aujourd'hui a 10:37",
	},
	{
		avatar: "EN",
		name: "Enzo",
		role: "Lecture seule",
		roleTone: "reader",
		activity: "Hier a 19:12",
	},
];

const sectionStatuses: SectionStatus[] = [
	{ label: "Intro", status: "validated" },
	{ label: "Couplet 1", status: "review" },
	{ label: "Refrain", status: "review" },
	{ label: "Couplet 2", status: "review" },
	{ label: "Pont", status: "draft" },
	{ label: "Outro", status: "validated" },
];

const recentActivity: ActivityItem[] = [
	{
		initials: "NL",
		author: "Nilu",
		title: "Nilu a modifie le refrain",
		description: "Quelques lignes recentes et structure ajustee.",
		time: "aujourd'hui a 13:45",
		tone: "pink",
	},
	{
		initials: "MA",
		author: "Maya",
		title: "Maya a modifie le couplet 1",
		description: "Changement sur 3 lignes.",
		time: "aujourd'hui a 11:16",
		tone: "blue",
	},
	{
		initials: "SO",
		author: "Soya a commente une ligne",
		title: "Soya a commente une ligne",
		description: "Belle image, mais peut-etre plus direct ici ?",
		time: "aujourd'hui a 09:02",
		tone: "violet",
	},
	{
		initials: "NL",
		author: "Nilu",
		title: "Nilu a cree la version v7",
		description: "Quelques lignes recentes et structure ajustee.",
		time: "Hier a 16:32",
		tone: "pink",
	},
];

const participation: Participation[] = [
	{ initials: "NL", name: "Nilu", percent: 58, tone: "pink" },
	{ initials: "MA", name: "Maya", percent: 24, tone: "blue" },
	{
		initials: "SO",
		name: "Soya",
		percent: 12,
		tone: "violet",
		note: "12 commentaires",
	},
	{
		initials: "EN",
		name: "Enzo",
		percent: 2,
		tone: "green",
		note: "Lecture seule",
	},
];

const projectSettings: ProjectSetting[] = [
	{
		icon: Info,
		label: "Information du projet",
		description: "Nom, description",
	},
	{
		icon: Settings,
		label: "Preferences",
		description: "Langue, format par defaut",
	},
	{
		icon: Bell,
		label: "Notification",
		description: "Gerer les notifications du projet",
	},
	{
		icon: History,
		label: "Historiques des versions",
		description: "Consulter et restaurer d'anciennes versions",
	},
];

const toneClassNames: Record<Metric["tone"], string> = {
	purple: "bg-[#41006F]",
	pink: "bg-[#D90097]",
	violet: "bg-[#970079]",
};

const avatarClassNames: Record<Participation["tone"], string> = {
	pink: "bg-[#D90097]",
	blue: "bg-[#1478D4]",
	violet: "bg-[#5B2FB8]",
	green: "bg-[#00B76B]",
};

const roleClassNames: Record<Collaborator["roleTone"], string> = {
	owner: "text-[#D90097]",
	editor: "text-[#35A8FF]",
	commenter: "text-[#D8C100]",
	reader: "text-[var(--nara-text-secondary)]",
};

function createEmptyLyricsSnapshot(): ProjectLyricsSnapshot {
	return {
		document: null,
		commentsByLineId: {},
		storageKeys: {
			document: lyricsEditorDocumentStorageKey,
			comments: lyricsEditorCommentsStorageKey,
		},
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function parseStoredLyricsLine(value: unknown): StoredLyricsLine | null {
	if (!isRecord(value) || typeof value.id !== "string") {
		return null;
	}

	return {
		id: value.id,
		number: typeof value.number === "number" ? value.number : 0,
		text: typeof value.text === "string" ? value.text : "",
		comments: typeof value.comments === "number" ? value.comments : 0,
		content: value.content ?? null,
	};
}

function parseStoredLyricsLines(value: unknown): StoredLyricsLine[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((line: unknown): StoredLyricsLine | null =>
			parseStoredLyricsLine(line),
		)
		.filter(
			(line: StoredLyricsLine | null): line is StoredLyricsLine =>
				line !== null,
		);
}

function parseStoredLyricsAlternatives(
	value: unknown,
): StoredLyricsSectionAlternative[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map(
			(
				alternative: unknown,
				index: number,
			): StoredLyricsSectionAlternative | null => {
				if (!isRecord(alternative)) {
					return null;
				}

				return {
					createdBy:
						typeof alternative.createdBy === "string"
							? alternative.createdBy
							: "Equipe",
					id:
						typeof alternative.id === "string"
							? alternative.id
							: `alternative-${index + 1}`,
					label:
						typeof alternative.label === "string"
							? alternative.label
							: `Alternative ${index + 1}`,
					lines: parseStoredLyricsLines(alternative.lines),
				};
			},
		)
		.filter(
			(
				alternative: StoredLyricsSectionAlternative | null,
			): alternative is StoredLyricsSectionAlternative =>
				alternative !== null,
		);
}

function parseStoredLyricsDocument(
	value: unknown,
): StoredLyricsDocument | null {
	if (!isRecord(value) || !Array.isArray(value.sections)) {
		return null;
	}

	const sections = value.sections
		.map((section: unknown, index: number): StoredLyricsSection | null => {
			if (!isRecord(section) || typeof section.id !== "string") {
				return null;
			}

			const lines = parseStoredLyricsLines(section.lines);

			return {
				accentColor:
					typeof section.accentColor === "string"
						? section.accentColor
						: "#D90097",
				activeAlternativeId:
					typeof section.activeAlternativeId === "string"
						? section.activeAlternativeId
						: null,
				alternatives: parseStoredLyricsAlternatives(
					section.alternatives,
				),
				id: section.id,
				kind:
					typeof section.kind === "string" ? section.kind : "couplet",
				lines,
				title:
					typeof section.title === "string"
						? section.title
						: `Section ${index + 1}`,
			};
		})
		.filter(
			(
				section: StoredLyricsSection | null,
			): section is StoredLyricsSection => section !== null,
		);

	if (sections.length === 0) {
		return null;
	}

	return {
		id: typeof value.id === "string" ? value.id : currentProject.id,
		sections,
		title:
			typeof value.title === "string" ? value.title : currentProject.name,
		updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
	};
}

function parseLineCommentsById(value: unknown): StoredLineCommentsById {
	if (!isRecord(value)) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(value).filter((entry: [string, unknown]): boolean =>
			Array.isArray(entry[1]),
		),
	) as StoredLineCommentsById;
}

function readStorageJson(key: string): unknown {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const storedValue = window.localStorage.getItem(key);

		return storedValue ? JSON.parse(storedValue) : null;
	} catch {
		return null;
	}
}

function readCurrentLyricsSnapshot(): ProjectLyricsSnapshot {
	return {
		document: parseStoredLyricsDocument(
			readStorageJson(lyricsEditorDocumentStorageKey),
		),
		commentsByLineId: parseLineCommentsById(
			readStorageJson(lyricsEditorCommentsStorageKey),
		),
		storageKeys: {
			document: lyricsEditorDocumentStorageKey,
			comments: lyricsEditorCommentsStorageKey,
		},
	};
}

function countLyricsLines(document: StoredLyricsDocument | null): number {
	return (
		document?.sections.reduce(
			(total: number, section: StoredLyricsSection): number =>
				total + section.lines.length,
			0,
		) ?? Number(metrics[1].value)
	);
}

function countLyricsVersions(document: StoredLyricsDocument | null): number {
	if (!document) {
		return Number(metrics[2].value);
	}

	return document.sections.reduce(
		(total: number, section: StoredLyricsSection): number =>
			total + section.alternatives.length,
		1,
	);
}

function createMetricsFromLyrics(
	document: StoredLyricsDocument | null,
): Metric[] {
	const sectionCount = document?.sections.length ?? Number(metrics[0].value);
	const lineCount = countLyricsLines(document);
	const versionCount = countLyricsVersions(document);

	return metrics.map((metric: Metric): Metric => {
		if (metric.label === "Sections") {
			return { ...metric, value: String(sectionCount) };
		}

		if (metric.label === "Lignes") {
			return { ...metric, value: String(lineCount) };
		}

		if (metric.label === "Versions") {
			return { ...metric, value: String(versionCount) };
		}

		return metric;
	});
}

function createProjectSnapshot(
	lyrics: ProjectLyricsSnapshot = createEmptyLyricsSnapshot(),
): ProjectSnapshot {
	const project: ProjectSummary = lyrics.document
		? {
				...currentProject,
				id: lyrics.document.id,
				name: lyrics.document.title,
				lastModifiedLabel: lyrics.document.updatedAt
					? new Intl.DateTimeFormat("fr-FR", {
							dateStyle: "short",
							timeStyle: "short",
						}).format(new Date(lyrics.document.updatedAt))
					: currentProject.lastModifiedLabel,
			}
		: currentProject;

	return {
		project,
		lyrics,
		metrics: createMetricsFromLyrics(lyrics.document),
		collaborators,
		sections: sectionStatuses,
		activity: recentActivity,
		participation,
		settings: projectSettings.map(
			({
				description,
				label,
			}: ProjectSetting): Omit<ProjectSetting, "icon"> => ({
				description,
				label,
			}),
		),
	};
}

function createCurrentProjectSnapshot(): ProjectSnapshot {
	return createProjectSnapshot(readCurrentLyricsSnapshot());
}

function createProjectExportData(snapshot: ProjectSnapshot): ProjectExportData {
	return {
		schemaVersion: 2,
		exportedAt: new Date().toISOString(),
		project: snapshot.project,
		lyrics: snapshot.lyrics,
		metrics: snapshot.metrics.map(
			({
				description,
				label,
				tone,
				value,
			}: Metric): ExportableMetric => ({
				description,
				label,
				tone,
				value,
			}),
		),
		collaborators: snapshot.collaborators,
		sections: snapshot.sections,
		activity: snapshot.activity,
		participation: snapshot.participation,
		settings: snapshot.settings,
	};
}

function downloadProjectExport(snapshot: ProjectSnapshot): void {
	const exportJson = JSON.stringify(
		createProjectExportData(snapshot),
		null,
		2,
	);
	const exportBlob = new Blob([exportJson], {
		type: "application/json;charset=utf-8",
	});
	const exportUrl = window.URL.createObjectURL(exportBlob);
	const exportLink = window.document.createElement("a");

	exportLink.href = exportUrl;
	exportLink.download = projectExportFileName;
	exportLink.click();
	window.URL.revokeObjectURL(exportUrl);
}

function isProjectExportData(value: unknown): value is ProjectExportData {
	if (!value || typeof value !== "object") {
		return false;
	}

	const candidate = value as Partial<ProjectExportData>;

	return (
		candidate.schemaVersion === 2 &&
		typeof candidate.project?.id === "string" &&
		Array.isArray(candidate.metrics) &&
		Array.isArray(candidate.collaborators) &&
		Array.isArray(candidate.sections) &&
		typeof candidate.lyrics === "object"
	);
}

function DashboardCard({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}): ReactElement {
	return (
		<section
			className={`rounded-[8px] border border-[var(--nara-border)] bg-[var(--nara-action-bg)] ${className}`}
		>
			{children}
		</section>
	);
}

function CardHeader({
	action,
	children,
}: {
	action?: ReactElement;
	children: string;
}): ReactElement {
	return (
		<div className="flex items-center justify-between">
			<h2 className="text-[16px] font-bold text-[var(--nara-text-primary)]">
				{children}
			</h2>
			{action}
		</div>
	);
}

function MetricCard({ metric }: { metric: Metric }): ReactElement {
	const Icon = metric.icon;

	return (
		<DashboardCard className="flex min-h-[78px] items-center gap-4 p-4">
			<div
				className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] text-white ${toneClassNames[metric.tone]}`}
			>
				<Icon size={26} strokeWidth={1.8} />
			</div>
			<div className="min-w-0">
				<div className="flex items-end gap-2">
					<strong className="text-[28px] font-medium leading-[0.8] text-[var(--nara-text-primary)]">
						{metric.value}
					</strong>
					<span className="text-[15px] font-medium leading-none text-[var(--nara-text-primary)]">
						{metric.label}
					</span>
				</div>
				<p className="mt-1 text-[11px] font-medium text-[var(--nara-text-secondary)]">
					{metric.description}
				</p>
			</div>
		</DashboardCard>
	);
}

function Avatar({
	children,
	tone,
}: {
	children: string;
	tone: Participation["tone"];
}): ReactElement {
	return (
		<span
			className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${avatarClassNames[tone]}`}
		>
			{children}
		</span>
	);
}

function CollaboratorsCard(): ReactElement {
	return (
		<DashboardCard className="flex h-full flex-col p-3">
			<CardHeader
				action={
					<button
						type="button"
						className="inline-flex h-6 items-center gap-1.5 rounded-[4px] border border-[var(--nara-border)] px-2 text-[11px] font-semibold text-[var(--nara-text-primary)] transition-colors hover:bg-[var(--nara-action-hover)]"
					>
						<UserPlus size={12} />
						Inviter
					</button>
				}
			>
				Collaborateurs & roles
			</CardHeader>

			<div className="mt-5 overflow-hidden">
				<div className="grid grid-cols-[1.2fr_1fr_1.3fr_24px] border-b border-[var(--nara-border)] pb-2 text-[11px] font-medium text-[var(--nara-text-secondary)]">
					<span>Membre</span>
					<span>Role</span>
					<span>Derniere activite</span>
					<span />
				</div>
				<div className="divide-y divide-[var(--nara-border)]">
					{collaborators.map(
						(collaborator: Collaborator): ReactElement => (
							<div
								key={collaborator.name}
								className="grid min-h-9 grid-cols-[1.2fr_1fr_1.3fr_24px] items-center text-[11px]"
							>
								<div className="flex min-w-0 items-center gap-2">
									<Avatar
										tone={
											collaborator.roleTone === "owner"
												? "pink"
												: collaborator.roleTone ===
													  "editor"
													? "blue"
													: collaborator.roleTone ===
														  "commenter"
														? "violet"
														: "green"
										}
									>
										{collaborator.avatar}
									</Avatar>
									<span className="truncate font-medium text-[var(--nara-text-primary)]">
										{collaborator.name}
									</span>
									{collaborator.roleTone === "owner" && (
										<span className="rounded-[3px] bg-[#D90097]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#D90097]">
											Vous
										</span>
									)}
								</div>
								<span
									className={`truncate font-medium ${roleClassNames[collaborator.roleTone]}`}
								>
									{collaborator.role}
								</span>
								<span className="truncate text-[var(--nara-text-secondary)]">
									{collaborator.activity}
								</span>
								<button
									type="button"
									aria-label={`Options de ${collaborator.name}`}
									className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[var(--nara-text-secondary)] hover:bg-[var(--nara-action-hover)] hover:text-[var(--nara-text-primary)]"
								>
									<MoreVertical size={14} />
								</button>
							</div>
						),
					)}
				</div>
			</div>

			<CardFooterLink>Gerer les acces</CardFooterLink>
		</DashboardCard>
	);
}

function StatusBadge({
	status,
}: {
	status: SectionStatus["status"];
}): ReactElement {
	const label =
		status === "validated"
			? "Valide"
			: status === "review"
				? "A retravailler"
				: "Brouillon";
	const className =
		status === "validated"
			? "border-[#3A7C1F] bg-[#183014] text-[#9BDD70]"
			: status === "review"
				? "border-[#9B7300] bg-[#352800] text-[#F4C33E]"
				: "border-[var(--nara-border-strong)] bg-[var(--nara-surface-soft)] text-[var(--nara-text-secondary)]";

	return (
		<span
			className={`inline-flex h-5 min-w-[86px] items-center justify-center rounded-[5px] border px-2 text-[10px] font-semibold ${className}`}
		>
			{label}
		</span>
	);
}

function SectionStatusCard(): ReactElement {
	return (
		<DashboardCard className="flex h-full flex-col p-3">
			<CardHeader>Statut des sections</CardHeader>
			<div className="mt-5 divide-y divide-[var(--nara-border)]">
				{sectionStatuses.map(
					(section: SectionStatus): ReactElement => (
						<div
							key={section.label}
							className="grid min-h-8 grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-2 text-[11px]"
						>
							<GripVertical
								size={14}
								className="text-[var(--nara-text-secondary)]"
							/>
							<span className="truncate font-medium text-[var(--nara-text-primary)]">
								{section.label}
							</span>
							<StatusBadge status={section.status} />
						</div>
					),
				)}
			</div>
			<CardFooterLink>{"Ouvrir l'editeur"}</CardFooterLink>
		</DashboardCard>
	);
}

function ActivityCard(): ReactElement {
	return (
		<DashboardCard className="flex h-full flex-col p-3">
			<CardHeader
				action={
					<button
						type="button"
						className="text-[11px] font-semibold text-[#D90097] hover:text-[#F23BB7]"
					>
						Voir tout
					</button>
				}
			>
				Activite recente
			</CardHeader>
			<div className="mt-4 space-y-3">
				{recentActivity.map(
					(item: ActivityItem): ReactElement => (
						<div
							key={`${item.title}-${item.time}`}
							className="grid grid-cols-[20px_minmax(0,1fr)_auto] gap-3"
						>
							<div className="flex flex-col items-center">
								<span
									className={`mt-1 h-2 w-2 rounded-full ${
										item.tone === "pink"
											? "bg-[#D90097]"
											: item.tone === "blue"
												? "bg-[#1478D4]"
												: "bg-[#5B2FB8]"
									}`}
								/>
								<span className="mt-1 h-full w-px bg-[var(--nara-border)]" />
							</div>
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<Avatar
										tone={
											item.tone === "pink"
												? "pink"
												: item.tone === "blue"
													? "blue"
													: "violet"
										}
									>
										{item.initials}
									</Avatar>
									<p className="truncate text-[12px] font-bold text-[var(--nara-text-primary)]">
										{item.title}
									</p>
								</div>
								<p className="mt-1 truncate text-[10px] font-medium text-[var(--nara-text-secondary)]">
									{item.description}
								</p>
							</div>
							<span className="whitespace-nowrap pt-1 text-[10px] font-medium text-[var(--nara-text-secondary)]">
								{item.time}
							</span>
						</div>
					),
				)}
			</div>
			<CardFooterLink>{"Voir toute l'activite"}</CardFooterLink>
		</DashboardCard>
	);
}

function ParticipationCard(): ReactElement {
	return (
		<DashboardCard className="h-full p-3">
			<CardHeader>Participation au projet</CardHeader>
			<div className="mt-5 space-y-2.5">
				{participation.map(
					(item: Participation): ReactElement => (
						<div
							key={item.name}
							className="grid grid-cols-[56px_1fr_auto] items-center gap-3"
						>
							<div className="flex min-w-0 items-center gap-2">
								<Avatar tone={item.tone}>
									{item.initials}
								</Avatar>
								<span className="truncate text-[12px] font-medium text-[var(--nara-text-primary)]">
									{item.name}
								</span>
							</div>
							<div className="h-1.5 rounded-full bg-[var(--nara-surface-soft)]">
								<div
									className={`h-full rounded-full ${avatarClassNames[item.tone]}`}
									style={{ width: `${item.percent}%` }}
								/>
							</div>
							<span className="min-w-[84px] text-right text-[10px] font-medium text-[var(--nara-text-secondary)]">
								{item.note ?? `${item.percent}%`}
							</span>
						</div>
					),
				)}
			</div>
		</DashboardCard>
	);
}

function SettingsCard(): ReactElement {
	return (
		<DashboardCard className="h-full p-3">
			<CardHeader>Parametres du projet</CardHeader>
			<div className="mt-4 grid gap-1">
				{projectSettings.map((item: ProjectSetting): ReactElement => {
					const Icon = item.icon;

					return (
						<button
							key={item.label}
							type="button"
							className="grid min-h-9 grid-cols-[22px_minmax(0,1fr)_16px] items-center gap-2 rounded-[5px] px-1.5 text-left transition-colors hover:bg-[var(--nara-action-hover)]"
						>
							<Icon
								size={15}
								className="text-[var(--nara-text-primary)]"
								strokeWidth={1.8}
							/>
							<span className="min-w-0">
								<span className="block truncate text-[12px] font-semibold leading-4 text-[var(--nara-text-primary)]">
									{item.label}
								</span>
								<span className="block truncate text-[10px] font-medium text-[var(--nara-text-secondary)]">
									{item.description}
								</span>
							</span>
							<ChevronRight
								size={15}
								className="text-[var(--nara-text-secondary)]"
							/>
						</button>
					);
				})}
			</div>
		</DashboardCard>
	);
}

function QuickActionsCard({
	onSnapshotChange,
	snapshot,
}: {
	onSnapshotChange: (snapshot: ProjectSnapshot) => void;
	snapshot: ProjectSnapshot;
}): ReactElement {
	const [exportState, setExportState] = useState<"idle" | "exported">("idle");
	const [importState, setImportState] = useState<
		"idle" | "imported" | "invalid"
	>("idle");
	const importInputRef = useRef<HTMLInputElement | null>(null);

	function handleExportProject(): void {
		const latestSnapshot = createCurrentProjectSnapshot();
		const exportSnapshot = latestSnapshot.lyrics.document
			? latestSnapshot
			: snapshot;

		downloadProjectExport(exportSnapshot);
		onSnapshotChange(exportSnapshot);
		setExportState("exported");
		window.setTimeout((): void => setExportState("idle"), 1400);
	}

	function resetImportStateLater(): void {
		window.setTimeout((): void => setImportState("idle"), 1800);
	}

	function handleImportButtonClick(): void {
		importInputRef.current?.click();
	}

	async function handleImportProjectFile(
		event: ChangeEvent<HTMLInputElement>,
	): Promise<void> {
		const importedFile: File | undefined = event.target.files?.[0];

		event.target.value = "";

		if (!importedFile) {
			return;
		}

		try {
			const fileContent: string = await importedFile.text();
			const parsedContent: unknown = JSON.parse(fileContent);

			if (!isProjectExportData(parsedContent)) {
				setImportState("invalid");
				resetImportStateLater();
				return;
			}

			window.localStorage.setItem(
				projectImportStorageKey,
				JSON.stringify(parsedContent),
			);

			if (parsedContent.lyrics.document) {
				window.localStorage.setItem(
					lyricsEditorDocumentStorageKey,
					JSON.stringify(parsedContent.lyrics.document),
				);
			}

			window.localStorage.setItem(
				lyricsEditorCommentsStorageKey,
				JSON.stringify(parsedContent.lyrics.commentsByLineId),
			);

			onSnapshotChange(createProjectSnapshot(parsedContent.lyrics));
			setImportState("imported");
			resetImportStateLater();
		} catch {
			setImportState("invalid");
			resetImportStateLater();
		}
	}

	return (
		<DashboardCard className="h-full p-3">
			<CardHeader>Actions rapides</CardHeader>
			<div className="mt-4 grid gap-3">
				<input
					ref={importInputRef}
					type="file"
					accept="application/json,.json"
					className="hidden"
					onChange={handleImportProjectFile}
				/>
				<button
					type="button"
					className="flex h-10 items-center justify-center gap-2 rounded-[5px] border border-[var(--nara-border)] bg-[var(--nara-surface-raised)] text-[11px] font-semibold text-[var(--nara-text-primary)] transition-colors hover:bg-[var(--nara-action-hover)]"
				>
					<Share2 size={14} />
					Partager le projet
				</button>
				<div className="grid grid-cols-2 gap-3">
					<button
						type="button"
						onClick={handleImportButtonClick}
						aria-live="polite"
						className="flex h-10 items-center justify-center gap-2 rounded-[5px] border border-[var(--nara-border)] bg-[var(--nara-surface-raised)] text-[11px] font-semibold text-[var(--nara-text-primary)] transition-colors hover:bg-[var(--nara-action-hover)]"
					>
						<Upload size={14} />
						{importState === "imported"
							? "Import pret"
							: importState === "invalid"
								? "JSON invalide"
								: "Importer le projet"}
					</button>
					<button
						type="button"
						onClick={handleExportProject}
						aria-live="polite"
						className="flex h-10 items-center justify-center gap-2 rounded-[5px] border border-[var(--nara-border)] bg-[var(--nara-surface-raised)] text-[11px] font-semibold text-[var(--nara-text-primary)] transition-colors hover:bg-[var(--nara-action-hover)]"
					>
						<Download size={14} />
						{exportState === "exported"
							? "Export pret"
							: "Exporter le projet"}
					</button>
				</div>
				<div className="grid grid-cols-1 gap-3">
					<button
						type="button"
						className="flex h-10 items-center justify-center gap-2 rounded-[5px] border border-[var(--nara-border)] bg-[var(--nara-surface-raised)] text-[11px] font-semibold text-[var(--nara-text-primary)] transition-colors hover:bg-[var(--nara-action-hover)]"
					>
						<Copy size={14} />
						Dupliquer le projet
					</button>
				</div>
				<button
					type="button"
					className="flex h-10 items-center justify-center gap-2 rounded-[5px] border border-[#762437] bg-[#2B1118] text-[11px] font-semibold text-[#FF657E] transition-colors hover:bg-[#35151E]"
				>
					<Trash2 size={14} />
					Supprimer le projet
				</button>
			</div>
		</DashboardCard>
	);
}

function CardFooterLink({ children }: { children: string }): ReactElement {
	return (
		<button
			type="button"
			className="mt-auto flex w-full items-center justify-between border-t border-[var(--nara-border)] pt-3 text-[11px] font-semibold text-[#D90097] transition-colors hover:text-[#F23BB7]"
		>
			<span>{children}</span>
			<ChevronRight size={14} />
		</button>
	);
}

export default function ManagementScreen(): ReactElement {
	const [projectSnapshot, setProjectSnapshot] = useState<ProjectSnapshot>(
		(): ProjectSnapshot => createProjectSnapshot(),
	);

	useEffect((): void => {
		setProjectSnapshot(createCurrentProjectSnapshot());
	}, []);

	return (
		<div className="h-full min-h-0 overflow-hidden bg-[var(--nara-surface)] p-2 text-[var(--nara-text-primary)]">
			<div className="grid h-full min-h-0 w-full grid-rows-[auto_auto_minmax(0,1fr)_minmax(0,1fr)] gap-3">
				<section className="flex min-h-[132px] items-center rounded-[8px] border border-[var(--nara-border)] bg-[var(--nara-action-bg)] px-5 py-4">
					<div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
						<div className="h-[96px] w-[132px] shrink-0 rounded-[10px] bg-[#F3F4F6]" />
						<div className="min-w-0">
							<p className="text-[12px] font-bold text-[#D90097]">
								{projectSnapshot.project.type}
							</p>
							<div className="mt-1 flex flex-wrap items-center gap-3">
								<h1
									className={`${syne.className} text-[34px] font-extrabold leading-[0.9] tracking-normal text-[var(--nara-text-primary)]`}
								>
									{projectSnapshot.project.name}
								</h1>
								<button
									type="button"
									aria-label="Modifier le nom"
									className="rounded-[4px] p-1 text-[var(--nara-text-secondary)] transition-colors hover:bg-[var(--nara-action-hover)] hover:text-[var(--nara-text-primary)]"
								>
									<Settings size={16} />
								</button>
								<span className="inline-flex h-5 items-center gap-1.5 rounded-[4px] border border-[#D8C100] px-2 text-[10px] font-bold text-[#D8C100]">
									<span className="h-1.5 w-1.5 rounded-full bg-[#D8C100]" />
									{projectSnapshot.project.statusLabel}
								</span>
							</div>
							<div className="mt-3 flex items-start gap-2 text-[11px] font-medium text-[var(--nara-text-secondary)]">
								<Clock size={16} className="mt-0.5 shrink-0" />
								<p>
									Dernieres modification
									<br />
									{projectSnapshot.project.lastModifiedLabel}
								</p>
							</div>
						</div>
					</div>
				</section>

				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					{projectSnapshot.metrics.map(
						(metric: Metric): ReactElement => (
							<MetricCard key={metric.label} metric={metric} />
						),
					)}
				</div>

				<div className="grid min-h-0 gap-3 xl:grid-cols-[1fr_1.04fr_1fr]">
					<CollaboratorsCard />
					<SectionStatusCard />
					<ActivityCard />
				</div>

				<div className="grid min-h-0 gap-3 xl:grid-cols-[1fr_1.04fr_1fr]">
					<ParticipationCard />
					<SettingsCard />
					<QuickActionsCard
						snapshot={projectSnapshot}
						onSnapshotChange={setProjectSnapshot}
					/>
				</div>
			</div>
		</div>
	);
}
