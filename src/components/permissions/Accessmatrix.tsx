"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { Check, ChevronDown, Minus, Trash2 } from "lucide-react";
import { AvatarWithLevel, LevelBadge } from "@/components/permissions/LevelBadge";
import type { ProjectMemberView } from "@/hooks/useProjectMembers";
import {
	ACCESS_LEVELS,
	PERMISSION_KINDS,
	getLevelDefinition,
	hasPermission,
	scopeLabel,
	type AccessLevel,
	type AccessScope,
	type LevelDefinition,
} from "@/lib/permissions";

/**
 * Matrice d'accès (ticket 60-FE) :
 *  - lignes = membres, colonnes = permissions (lecture / écriture / audio) ;
 *  - chaque cellule s'allume dans la couleur du niveau du membre ;
 *  - la colonne Audio est visuellement séparée : c'est elle qui matérialise
 *    la frontière « lyrics seuls » vs « lyrics + musique » ;
 *  - changement de niveau en 1 clic via le menu, réservé au gestionnaire
 *    (Artiste propriétaire / Admin) — les autres voient une matrice figée.
 */

interface AccessMatrixProps {
	members: ProjectMemberView[];
	canManage: boolean;
	onLevelChange: (memberId: string, level: AccessLevel) => void;
	onScopeChange: (memberId: string, scope: AccessScope) => void;
	onRemove?: (memberId: string) => void;
}

function PermissionCell({
	granted,
	color,
}: {
	granted: boolean;
	color: string;
}): ReactElement {
	return (
		<span
			className="inline-flex h-6 w-6 items-center justify-center rounded-full"
			style={
				granted
					? { backgroundColor: `${color}26`, color }
					: { color: "var(--nara-text-secondary)", opacity: 0.45 }
			}
			aria-label={granted ? "Accordé" : "Non accordé"}
		>
			{granted ? (
				<Check size={13} strokeWidth={3} />
			) : (
				<Minus size={13} strokeWidth={2.4} />
			)}
		</span>
	);
}

function LevelMenu({
	member,
	onSelect,
}: {
	member: ProjectMemberView;
	onSelect: (level: AccessLevel) => void;
}): ReactElement {
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const definition: LevelDefinition = getLevelDefinition(member.level);

	useEffect((): (() => void) => {
		function handleClickOutside(event: MouseEvent): void {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return (): void =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={(): void => setIsOpen((open: boolean): boolean => !open)}
				className="inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-[var(--nara-border)] px-2 text-[11px] font-semibold transition-colors hover:bg-[var(--nara-action-hover)]"
				style={{ color: definition.color }}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
			>
				{definition.label}
				<ChevronDown
					size={12}
					className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{isOpen && (
				<div
					role="listbox"
					className="absolute right-0 top-8 z-30 w-56 overflow-hidden rounded-[8px] border border-[var(--nara-border)] bg-[var(--nara-action-bg)] shadow-2xl"
				>
					{ACCESS_LEVELS.map(
						(option: LevelDefinition): ReactElement => {
							const OptionIcon = option.icon;
							const isCurrent: boolean =
								option.level === member.level;

							return (
								<button
									key={option.level}
									type="button"
									role="option"
									aria-selected={isCurrent}
									onClick={(): void => {
										setIsOpen(false);
										if (!isCurrent) {
											onSelect(option.level);
										}
									}}
									className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--nara-action-hover)]"
								>
									<span
										className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
										style={{
											backgroundColor: option.softBg,
											color: option.color,
										}}
									>
										<OptionIcon size={12} strokeWidth={2.4} />
									</span>
									<span className="min-w-0">
										<span
											className="block text-[11px] font-bold"
											style={{ color: option.color }}
										>
											{option.label}
											{isCurrent && " — actuel"}
										</span>
										<span className="block text-[10px] leading-snug text-[var(--nara-text-secondary)]">
											{option.description}
										</span>
									</span>
								</button>
							);
						},
					)}
				</div>
			)}
		</div>
	);
}

function ScopeToggle({
	member,
	canManage,
	onScopeChange,
}: {
	member: ProjectMemberView;
	canManage: boolean;
	onScopeChange: (scope: AccessScope) => void;
}): ReactElement {
	const definition: LevelDefinition = getLevelDefinition(member.level);
	const isFull: boolean = member.scope === "LYRICS_AND_MUSIC";
	const isLocked: boolean = definition.audioAlways;

	if (isLocked) {
		return (
			<span className="text-[10px] font-medium text-[var(--nara-text-secondary)]">
				{scopeLabel("LYRICS_AND_MUSIC")}
			</span>
		);
	}

	if (!canManage) {
		return (
			<span
				className="text-[10px] font-medium"
				style={{
					color: isFull ? definition.color : "var(--nara-text-secondary)",
				}}
			>
				{scopeLabel(member.scope)}
			</span>
		);
	}

	return (
		<button
			type="button"
			onClick={(): void =>
				onScopeChange(isFull ? "LYRICS_ONLY" : "LYRICS_AND_MUSIC")
			}
			className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[var(--nara-border)] px-2 text-[10px] font-semibold transition-colors hover:bg-[var(--nara-action-hover)]"
			style={{
				color: isFull ? definition.color : "var(--nara-text-secondary)",
			}}
			title="Basculer entre lyrics seuls et lyrics + musique"
		>
			<span
				className="h-1.5 w-1.5 rounded-full"
				style={{
					backgroundColor: isFull
						? definition.color
						: "var(--nara-text-secondary)",
				}}
			/>
			{scopeLabel(member.scope)}
		</button>
	);
}

export default function AccessMatrix({
	members,
	canManage,
	onLevelChange,
	onScopeChange,
	onRemove,
}: AccessMatrixProps): ReactElement {
	return (
		<section className="overflow-hidden rounded-[8px] border border-[var(--nara-border)] bg-[var(--nara-action-bg)]">
			{/* En-tête à double étage : groupes Lyrics vs Lyrics + Musique */}
			<div className="grid grid-cols-[minmax(180px,1.4fr)_repeat(2,72px)_112px_minmax(150px,1fr)_150px_32px] items-end gap-x-2 border-b border-[var(--nara-border)] px-4 pb-2 pt-3">
				<span className="text-[11px] font-medium text-[var(--nara-text-secondary)]">
					Membre
				</span>

				{PERMISSION_KINDS.map(
					({ kind, label, icon: Icon }): ReactElement => (
						<span
							key={kind}
							className={`flex flex-col items-center gap-1 text-[10px] font-medium text-[var(--nara-text-secondary)] ${
								kind === "audio"
									? "rounded-t-[6px] bg-[var(--nara-surface-soft)] px-2 pb-1 pt-1.5"
									: ""
							}`}
						>
							<Icon size={13} strokeWidth={2} />
							{label}
						</span>
					),
				)}

				<span className="text-[11px] font-medium text-[var(--nara-text-secondary)]">
					Périmètre
				</span>
				<span className="text-right text-[11px] font-medium text-[var(--nara-text-secondary)]">
					Niveau
				</span>
				<span />
			</div>

			<div className="divide-y divide-[var(--nara-border)]">
				{members.map((member: ProjectMemberView): ReactElement => {
					const definition: LevelDefinition = getLevelDefinition(
						member.level,
					);

					return (
						<div
							key={member.memberId}
							className="grid min-h-[52px] grid-cols-[minmax(180px,1.4fr)_repeat(2,72px)_112px_minmax(150px,1fr)_150px_32px] items-center gap-x-2 px-4 py-2 transition-colors hover:bg-[var(--nara-action-hover)]"
						>
							<div className="flex min-w-0 items-center gap-2.5">
								<AvatarWithLevel
									initials={member.initials}
									level={member.level}
								/>
								<span className="min-w-0">
									<span className="flex items-center gap-1.5">
										<span className="truncate text-[12px] font-medium text-[var(--nara-text-primary)]">
											{member.name}
										</span>
										{member.isOwner && (
											<span className="rounded-[3px] bg-[#D90097]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#D90097]">
												Propriétaire
											</span>
										)}
										{member.isMe && !member.isOwner && (
											<span className="rounded-[3px] border border-[var(--nara-border)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--nara-text-secondary)]">
												Vous
											</span>
										)}
									</span>
									<span className="block truncate text-[10px] text-[var(--nara-text-secondary)]">
										{member.username
											? `@${member.username}`
											: member.email}
									</span>
								</span>
							</div>

							{PERMISSION_KINDS.map(
								({ kind }): ReactElement => (
									<span
										key={kind}
										className={`flex justify-center ${
											kind === "audio"
												? "h-full items-center bg-[var(--nara-surface-soft)]"
												: ""
										}`}
									>
										<PermissionCell
											granted={hasPermission(
												member.level,
												kind,
												member.scope,
											)}
											color={definition.color}
										/>
									</span>
								),
							)}

							<span>
								<ScopeToggle
									member={member}
									canManage={canManage}
									onScopeChange={(scope: AccessScope): void =>
										onScopeChange(member.memberId, scope)
									}
								/>
							</span>

							<span className="flex justify-end">
								{canManage && !member.isOwner ? (
									<LevelMenu
										member={member}
										onSelect={(level: AccessLevel): void =>
											onLevelChange(member.memberId, level)
										}
									/>
								) : (
									<LevelBadge level={member.level} />
								)}
							</span>

							<span className="flex justify-end">
								{canManage &&
									!member.isOwner &&
									!member.isMe &&
									onRemove && (
										<button
											type="button"
											aria-label={`Révoquer ${member.name}`}
											title="Révoquer ce membre"
											onClick={(): void => {
												if (
													window.confirm(
														`Révoquer ${member.name} du projet ? Cette action retire immédiatement tous ses accès.`,
													)
												) {
													onRemove(member.memberId);
												}
											}}
											className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[var(--nara-text-secondary)] transition-colors hover:bg-[#E5484D]/15 hover:text-[#E5484D]"
										>
											<Trash2 size={13} />
										</button>
									)}
							</span>
						</div>
					);
				})}
			</div>

			{/* Légende des niveaux — codes couleurs du système */}
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--nara-border)] px-4 py-2.5">
				{ACCESS_LEVELS.map(
					(definition: LevelDefinition): ReactElement => (
						<span
							key={definition.level}
							className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--nara-text-secondary)]"
						>
							<span
								className="h-2 w-2 rounded-full"
								style={{ backgroundColor: definition.color }}
							/>
							{definition.label}
						</span>
					),
				)}
				<span className="ml-auto text-[10px] text-[var(--nara-text-secondary)]">
					Colonne Audio grisée = accès lyrics seuls
				</span>
			</div>
		</section>
	);
}