"use client";

import type { ReactElement } from "react";
import { ShieldCheck } from "lucide-react";
import AccessMatrix from "@/components/permissions/Accessmatrix";
import { useProjectMembers } from "@/hooks/useProjectMembers";
import type { AccessLevel, AccessScope } from "@/lib/permissions";

/**
 * Page « Gestion des membres » (ticket 60-FE).
 * Assemble le hook data et la matrice ; gère chargement / erreur / vide.
 *
 * `ownerId` sert à identifier l'Artiste propriétaire (contrôles réservés).
 * Il vient de GET /api/projects/:id (champ project.ownerId).
 */

export default function MembersAccessScreen({
	projectId,
	ownerId,
}: {
	projectId: string;
	ownerId: string | null;
}): ReactElement {
	const {
		members,
		canManage,
		isLoading,
		error,
		updateLevel,
		updateScope,
	} = useProjectMembers(projectId, ownerId);

	return (
		<section className="flex w-full flex-col gap-4 p-6">
			<header className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-syne text-[20px] font-bold text-[var(--nara-text-primary)]">
						Membres & niveaux d'accès
					</h1>
					<p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[var(--nara-text-secondary)]">
						Chaque membre a un niveau (couleur) et un périmètre :
						lyrics seuls, ou lyrics + musique. Seul l'Artiste
						propriétaire peut modifier les accès.
					</p>
				</div>
				{canManage && (
					<span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#D90097]/15 px-3 py-1 text-[10px] font-bold text-[#D90097]">
						<ShieldCheck size={12} strokeWidth={2.4} />
						Mode gestion
					</span>
				)}
			</header>

			{isLoading && (
				<div className="rounded-[8px] border border-[var(--nara-border)] bg-[var(--nara-action-bg)] p-8 text-center text-[12px] text-[var(--nara-text-secondary)]">
					Chargement des membres…
				</div>
			)}

			{!isLoading && error && (
				<div className="rounded-[8px] border border-[var(--nara-border)] bg-[var(--nara-action-bg)] p-8 text-center">
					<p className="text-[12px] font-medium text-[var(--nara-text-primary)]">
						{error}
					</p>
					<p className="mt-1 text-[11px] text-[var(--nara-text-secondary)]">
						Vérifie ton accès au projet, puis réessaie.
					</p>
				</div>
			)}

			{!isLoading && !error && members.length === 0 && (
				<div className="rounded-[8px] border border-[var(--nara-border)] bg-[var(--nara-action-bg)] p-8 text-center text-[12px] text-[var(--nara-text-secondary)]">
					Aucun membre pour l'instant — invite un collaborateur pour
					démarrer.
				</div>
			)}

			{!isLoading && !error && members.length > 0 && (
				<AccessMatrix
					members={members}
					canManage={canManage}
					onLevelChange={(memberId: string, level: AccessLevel): void => {
						void updateLevel(memberId, level);
					}}
					onScopeChange={(
						memberId: string,
						scope: AccessScope,
					): void => {
						void updateScope(memberId, scope);
					}}
				/>
			)}
		</section>
	);
}