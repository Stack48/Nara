"use client";

import { useEffect, useState, type ReactElement } from "react";
import { ChevronRight, Headphones, Users, X } from "lucide-react";
import { AvatarWithLevel } from "@/components/permissions/LevelBadge";
import {
	resolveCognitoId,
	useProjectMembers,
	type ProjectMemberView,
} from "@/hooks/useProjectMembers";
import {
	ACCESS_LEVELS,
	getLevelDefinition,
	hasAudio,
	type AccessLevel,
	type LevelDefinition,
} from "@/lib/permissions";

/**
 * Panneau d'accès dans l'éditeur de lyrics (ticket 60-FE).
 *
 * Non bloquant : panneau latéral flottant, même famille que TrackPlayer —
 * `pointer-events-none` sur le conteneur, `pointer-events-auto` sur la
 * carte. L'éditeur TipTap reste cliquable partout autour.
 *
 * Liste compacte : avatar + badge de niveau, nom, et pastille casque si le
 * membre entend la musique (sinon il est en « lyrics seuls »).
 * Le changement de niveau en 1 clic n'apparaît que pour le gestionnaire
 * (Artiste propriétaire / Admin) : un clic sur le badge fait défiler les
 * niveaux — pensé pour rester à une seule interaction, sans menu.
 */

function nextLevel(level: AccessLevel): AccessLevel {
	const order: AccessLevel[] = ACCESS_LEVELS.map(
		(definition: LevelDefinition): AccessLevel => definition.level,
	);
	const index: number = order.indexOf(level);
	return order[(index + 1) % order.length];
}

export default function EditorAccessPanel({
	projectId,
	ownerId = null,
	onClose,
}: {
	projectId: string;
	/** Si non fourni, le panneau le récupère lui-même via GET /api/projects/:id */
	ownerId?: string | null;
	onClose?: () => void;
}): ReactElement {
	const [resolvedOwnerId, setResolvedOwnerId] = useState<string | null>(
		ownerId,
	);

	useEffect((): void => {
		if (ownerId !== null) {
			setResolvedOwnerId(ownerId);
			return;
		}
		const cognitoId: string | null = resolveCognitoId();
		if (!cognitoId) {
			return;
		}
		void fetch(`/api/projects/${projectId}`, {
			headers: { "x-cognito-id": cognitoId },
		})
			.then((response: Response) =>
				response.ok ? response.json() : null,
			)
			.then((project: { ownerId?: string } | null): void => {
				setResolvedOwnerId(project?.ownerId ?? null);
			})
			.catch((): void => setResolvedOwnerId(null));
	}, [ownerId, projectId]);

	const { members, canManage, isLoading, updateLevel } = useProjectMembers(
		projectId,
		resolvedOwnerId,
	);
	const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

	return (
		<div className="pointer-events-none absolute inset-y-0 right-0 z-[70] flex items-start justify-end p-4 pt-16">
			<aside
				aria-label="Accès au projet"
				className="pointer-events-auto flex w-[248px] flex-col overflow-hidden rounded-[12px] border border-[var(--nara-border)] bg-[var(--nara-action-bg)]/95 shadow-2xl backdrop-blur"
			>
				<header className="flex items-center gap-2 border-b border-[var(--nara-border)] px-3 py-2.5">
					<button
						type="button"
						onClick={(): void =>
							setIsCollapsed(
								(collapsed: boolean): boolean => !collapsed,
							)
						}
						aria-expanded={!isCollapsed}
						className="flex items-center gap-2 text-[11px] font-bold text-[var(--nara-text-primary)]"
					>
						<ChevronRight
							size={13}
							className={`transition-transform ${
								isCollapsed ? "" : "rotate-90"
							}`}
						/>
						<Users size={13} className="text-[#D90097]" />
						Accès ({members.length})
					</button>
					{onClose && (
						<button
							type="button"
							onClick={onClose}
							aria-label="Fermer le panneau d'accès"
							className="ml-auto flex h-5 w-5 items-center justify-center rounded-[4px] text-[var(--nara-text-secondary)] transition-colors hover:bg-[var(--nara-action-hover)] hover:text-[var(--nara-text-primary)]"
						>
							<X size={12} />
						</button>
					)}
				</header>

				{!isCollapsed && (
					<div className="max-h-[46vh] overflow-y-auto py-1">
						{isLoading && (
							<p className="px-3 py-3 text-[10px] text-[var(--nara-text-secondary)]">
								Chargement…
							</p>
						)}

						{!isLoading &&
							members.map(
								(member: ProjectMemberView): ReactElement => {
									const definition: LevelDefinition =
										getLevelDefinition(member.level);
									const hearsMusic: boolean = hasAudio(
										member.level,
										member.scope,
									);
									const canEditThis: boolean =
										canManage && !member.isOwner;

									return (
										<div
											key={member.memberId}
											className="flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-[var(--nara-action-hover)]"
										>
											<AvatarWithLevel
												initials={member.initials}
												level={member.level}
												size={24}
											/>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-[11px] font-medium text-[var(--nara-text-primary)]">
													{member.name}
													{member.isOwner && (
														<span className="ml-1 text-[9px] font-bold text-[#D90097]">
															• Propriétaire
														</span>
													)}
												</span>
											</span>

											<span
												title={
													hearsMusic
														? "Lyrics + Musique"
														: "Lyrics seuls"
												}
												className="flex h-4 w-4 items-center justify-center"
												style={{
													color: hearsMusic
														? definition.color
														: "var(--nara-text-secondary)",
													opacity: hearsMusic
														? 1
														: 0.35,
												}}
											>
												<Headphones
													size={11}
													strokeWidth={2.4}
												/>
											</span>

											<button
												type="button"
												disabled={!canEditThis}
												onClick={(): void => {
													if (canEditThis) {
														void updateLevel(
															member.memberId,
															nextLevel(
																member.level,
															),
														);
													}
												}}
												title={
													canEditThis
														? `${definition.label} — cliquer pour changer`
														: definition.label
												}
												className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
													canEditThis
														? "cursor-pointer transition-transform hover:scale-105"
														: "cursor-default"
												}`}
												style={{
													backgroundColor:
														definition.softBg,
													color: definition.color,
												}}
											>
												{definition.label}
											</button>
										</div>
									);
								},
							)}
					</div>
				)}
			</aside>
		</div>
	);
}