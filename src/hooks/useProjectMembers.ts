"use client";

/**
 * useProjectMembers — état des membres d'un projet + mutations optimistes.
 *
 * Câblage réel sur les routes de 54-BE :
 *   GET    /api/projects/:id/members                → liste
 *   PATCH  /api/projects/:id/members/:memberId      → { role } (ADMIN only)
 *
 * Mise à jour optimiste (DESCRIPTION TECHNIQUE du ticket) : l'UI bascule
 * immédiatement, puis rollback + toast si le serveur refuse (403/erreur).
 *
 * Périmètre audio (« lyrics seuls vs lyrics + musique ») : tant que 54-BE
 * n'expose pas `audioAccess` sur ProjectMember, on lit ce que l'API renvoie
 * si le champ existe, sinon on retombe sur le défaut du niveau, avec une
 * persistance locale (`nara:audio-scope:<projectId>`) pour que la
 * distinction visuelle survive au refresh. Le PATCH envoie quand même
 * `audioAccess` : le jour où le back le supporte, rien à changer ici.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
	apiRoleToLevel,
	defaultScopeForLevel,
	levelToApiRole,
	type AccessLevel,
	type AccessScope,
	type ApiRole,
} from "@/lib/permissions";

/**
 * Identité envoyée dans le header `x-cognito-id` (toutes les routes API
 * la exigent, sinon 401). Ordre de résolution :
 *   1. localStorage["nara:cognito-id"] — pratique en dev pour basculer
 *      entre Léa / Marcus / Romain (utilisateurs du seed) ;
 *   2. NEXT_PUBLIC_COGNITO_ID (fallback env).
 * Quand la vraie session Cognito (13-BE) sera branchée, c'est la SEULE
 * fonction à remplacer par la lecture du token réel.
 */
export function resolveCognitoId(): string | null {
	if (typeof window !== "undefined") {
		const stored: string | null =
			window.localStorage.getItem("nara:cognito-id");
		if (stored) {
			return stored;
		}
	}
	return process.env.NEXT_PUBLIC_COGNITO_ID ?? null;
}

export interface ProjectMemberView {
	memberId: string;
	userId: string;
	name: string;
	username: string | null;
	email: string;
	initials: string;
	level: AccessLevel;
	scope: AccessScope;
	isOwner: boolean;
	isMe: boolean;
}

interface ApiMember {
	id: string;
	userId: string;
	role: ApiRole;
	audioAccess?: boolean;
	user: {
		id: string;
		email: string;
		name: string | null;
		username: string | null;
	};
}

interface UseProjectMembersResult {
	members: ProjectMemberView[];
	me: ProjectMemberView | null;
	/** true si l'utilisateur connecté peut modifier les accès (Artiste propriétaire / Admin). */
	canManage: boolean;
	isLoading: boolean;
	error: string | null;
	updateLevel: (memberId: string, level: AccessLevel) => Promise<void>;
	updateScope: (memberId: string, scope: AccessScope) => Promise<void>;
	removeMember: (memberId: string) => Promise<void>;
	refresh: () => Promise<void>;
}

function initialsOf(name: string | null, email: string): string {
	const source: string = (name ?? email).trim();
	const parts: string[] = source.split(/\s+/).filter(Boolean);

	if (parts.length >= 2) {
		return (parts[0][0] + parts[1][0]).toUpperCase();
	}
	return source.slice(0, 2).toUpperCase();
}

function scopeStorageKey(projectId: string): string {
	return `nara:audio-scope:${projectId}`;
}

function readStoredScopes(projectId: string): Record<string, AccessScope> {
	if (typeof window === "undefined") {
		return {};
	}
	try {
		const raw: string | null = window.localStorage.getItem(
			scopeStorageKey(projectId),
		);
		return raw ? (JSON.parse(raw) as Record<string, AccessScope>) : {};
	} catch {
		return {};
	}
}

function writeStoredScope(
	projectId: string,
	memberId: string,
	scope: AccessScope,
): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		const scopes: Record<string, AccessScope> = readStoredScopes(projectId);
		scopes[memberId] = scope;
		window.localStorage.setItem(
			scopeStorageKey(projectId),
			JSON.stringify(scopes),
		);
	} catch {
		// stockage indisponible : la distinction reste valable pour la session
	}
}

function showToast(message: string, tone: "success" | "error"): void {
	if (typeof window === "undefined") {
		return;
	}
	window.dispatchEvent(
		new CustomEvent("show-nara-toast", { detail: { message, tone } }),
	);
}

export function useProjectMembers(
	projectId: string,
	ownerId: string | null,
): UseProjectMembersResult {
	const [members, setMembers] = useState<ProjectMemberView[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const cognitoId: string | null = useMemo(
		(): string | null => resolveCognitoId(),
		[],
	);

	const fetchMembers = useCallback(async (): Promise<void> => {
		if (!cognitoId) {
			setError("Identité introuvable — connecte-toi pour voir les accès.");
			setIsLoading(false);
			return;
		}

		try {
			const response: Response = await fetch(
				`/api/projects/${projectId}/members`,
				{ headers: { "x-cognito-id": cognitoId } },
			);

			if (!response.ok) {
				throw new Error(`Accès refusé (${response.status})`);
			}

			const apiMembers: ApiMember[] = await response.json();
			const storedScopes: Record<string, AccessScope> =
				readStoredScopes(projectId);

			const meResponse: ProjectMemberView[] = apiMembers.map(
				(member: ApiMember): ProjectMemberView => {
					const level: AccessLevel = apiRoleToLevel(member.role);
					const scope: AccessScope =
						member.audioAccess === true
							? "LYRICS_AND_MUSIC"
							: member.audioAccess === false
								? "LYRICS_ONLY"
								: (storedScopes[member.id] ??
									defaultScopeForLevel(level));

					return {
						memberId: member.id,
						userId: member.userId,
						name: member.user.name ?? member.user.email,
						username: member.user.username,
						email: member.user.email,
						initials: initialsOf(member.user.name, member.user.email),
						level,
						scope,
						isOwner: ownerId !== null && member.userId === ownerId,
						isMe: false, // résolu juste en dessous via /me si besoin
					};
				},
			);

			// L'identité simulée est le cognitoId ; l'API membres ne renvoie
			// pas le cognitoId des users, donc « moi » = le membre dont
			// l'email correspond à l'identité stockée si disponible, sinon
			// on marque le propriétaire comme fallback raisonnable en dev.
			const meEmail: string | null =
				typeof window !== "undefined"
					? window.localStorage.getItem("nara:me-email")
					: null;

			const resolved: ProjectMemberView[] = meResponse.map(
				(member: ProjectMemberView): ProjectMemberView => ({
					...member,
					isMe: meEmail !== null && member.email === meEmail,
				}),
			);

			setMembers(resolved);
			setError(null);
		} catch (fetchError) {
			setError(
				fetchError instanceof Error
					? fetchError.message
					: "Impossible de charger les membres.",
			);
		} finally {
			setIsLoading(false);
		}
	}, [cognitoId, ownerId, projectId]);

	useEffect((): void => {
		void fetchMembers();
	}, [fetchMembers]);

	const me: ProjectMemberView | null = useMemo(
		(): ProjectMemberView | null =>
			members.find((member: ProjectMemberView): boolean => member.isMe) ??
			members.find(
				(member: ProjectMemberView): boolean => member.isOwner,
			) ??
			null,
		[members],
	);

	const canManage: boolean = useMemo(
		(): boolean =>
			me !== null && (me.isOwner || me.level === "ADMIN"),
		[me],
	);

	const updateLevel = useCallback(
		async (memberId: string, level: AccessLevel): Promise<void> => {
			if (!cognitoId) {
				return;
			}

			const previous: ProjectMemberView[] = members;

			// Optimiste : on bascule tout de suite, scope réaligné sur le niveau
			setMembers(
				(current: ProjectMemberView[]): ProjectMemberView[] =>
					current.map(
						(member: ProjectMemberView): ProjectMemberView =>
							member.memberId === memberId
								? {
										...member,
										level,
										scope: defaultScopeForLevel(level),
									}
								: member,
					),
			);

			try {
				const response: Response = await fetch(
					`/api/projects/${projectId}/members/${memberId}`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							"x-cognito-id": cognitoId,
						},
						body: JSON.stringify({ role: levelToApiRole(level) }),
					},
				);

				if (!response.ok) {
					throw new Error();
				}

				showToast("Niveau d'accès mis à jour", "success");
			} catch {
				setMembers(previous);
				showToast(
					"Modification refusée — seul l'Artiste propriétaire peut changer un niveau.",
					"error",
				);
			}
		},
		[cognitoId, members, projectId],
	);

	const updateScope = useCallback(
		async (memberId: string, scope: AccessScope): Promise<void> => {
			if (!cognitoId) {
				return;
			}

			const previous: ProjectMemberView[] = members;

			setMembers(
				(current: ProjectMemberView[]): ProjectMemberView[] =>
					current.map(
						(member: ProjectMemberView): ProjectMemberView =>
							member.memberId === memberId
								? { ...member, scope }
								: member,
					),
			);
			writeStoredScope(projectId, memberId, scope);

			try {
				// Seam 54-BE : si le back accepte audioAccess, il persiste ;
				// sinon (schéma strict → 400) la valeur locale fait foi.
				await fetch(`/api/projects/${projectId}/members/${memberId}`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						"x-cognito-id": cognitoId,
					},
					body: JSON.stringify({
						audioAccess: scope === "LYRICS_AND_MUSIC",
					}),
				});
				showToast(
					scope === "LYRICS_AND_MUSIC"
						? "Accès étendu à la musique"
						: "Accès limité aux lyrics",
					"success",
				);
			} catch {
				setMembers(previous);
				showToast("Impossible de modifier le périmètre.", "error");
			}
		},
		[cognitoId, members, projectId],
	);

	const removeMember = useCallback(
		async (memberId: string): Promise<void> => {
			if (!cognitoId) {
				return;
			}

			const previous: ProjectMemberView[] = members;

			// Optimiste : la ligne disparaît tout de suite
			setMembers(
				(current: ProjectMemberView[]): ProjectMemberView[] =>
					current.filter(
						(member: ProjectMemberView): boolean =>
							member.memberId !== memberId,
					),
			);

			try {
				const response: Response = await fetch(
					`/api/projects/${projectId}/members/${memberId}`,
					{
						method: "DELETE",
						headers: { "x-cognito-id": cognitoId },
					},
				);

				if (!response.ok) {
					throw new Error();
				}

				showToast("Membre révoqué du projet", "success");
			} catch {
				setMembers(previous);
				showToast("Impossible de révoquer ce membre.", "error");
			}
		},
		[cognitoId, members, projectId],
	);

	return {
		members,
		me,
		canManage,
		isLoading,
		error,
		updateLevel,
		updateScope,
		removeMember,
		refresh: fetchMembers,
	};
}