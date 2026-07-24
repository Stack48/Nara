/**
 * Permissions v2 — source unique de vérité côté front.
 *
 * Le ticket 60-FE parle de 4 niveaux métier : Admin, Artiste, Ghostwriter,
 * Écouteur. L'API (54-BE) expose l'enum `ADMIN | LEAD_LYRICIST | LYRICIST |
 * READONLY` (cf. src/schemas/updateRole.schema.ts). Ce module est le SEUL
 * endroit où la traduction se fait : aucun composant ne manipule les rôles
 * API directement.
 *
 * Mapping retenu :
 *   ADMIN          → Admin        (vue complète, gestion)
 *   LEAD_LYRICIST  → Artiste      (propriétaire artistique du projet)
 *   LYRICIST       → Ghostwriter  (écrit via suggestions)
 *   READONLY       → Écouteur     (lecture seule)
 *
 * Note « Artiste propriétaire » : à la création d'un projet, l'owner reçoit
 * le rôle ADMIN (cf. createProject). Le ticket réserve les contrôles de
 * modification à l'Artiste propriétaire — côté front, le critère fiable est
 * donc `project.ownerId === me.userId` OU niveau Admin, ce qui correspond
 * exactement au garde-fou serveur (PATCH role = ADMIN uniquement).
 */

import {
	Crown,
	Eye,
	Feather,
	Headphones,
	Music,
	PenLine,
	type LucideIcon,
} from "lucide-react";

/** Rôle tel que l'API le connaît. */
export type ApiRole = "ADMIN" | "LEAD_LYRICIST" | "LYRICIST" | "READONLY";

/** Niveau d'accès tel que l'UI le nomme (Permissions v2). */
export type AccessLevel = "ADMIN" | "ARTISTE" | "GHOSTWRITER" | "ECOUTEUR";

/** Périmètre d'accès : lyrics seuls, ou lyrics + musique (audio du projet). */
export type AccessScope = "LYRICS_ONLY" | "LYRICS_AND_MUSIC";

/** Types d'accès affichés en colonnes dans la matrice. */
export type PermissionKind = "read" | "write" | "audio";

export interface LevelDefinition {
	level: AccessLevel;
	apiRole: ApiRole;
	label: string;
	description: string;
	/** Couleur du niveau — reprend la palette rôles de ManagementScreen. */
	color: string;
	/** Fond translucide pour badges/pills. */
	softBg: string;
	icon: LucideIcon;
	/** Capacités fixes du niveau (l'audio dépend du périmètre, voir hasAudio). */
	canRead: boolean;
	canWrite: boolean;
	canManage: boolean;
	/** true si l'audio est toujours inclus, sinon dépend du scope du membre. */
	audioAlways: boolean;
}

export const ACCESS_LEVELS: readonly LevelDefinition[] = [
	{
		level: "ADMIN",
		apiRole: "ADMIN",
		label: "Admin",
		description: "Vue complète du projet et gestion des membres.",
		color: "#5B2FB8",
		softBg: "rgba(91,47,184,0.18)",
		icon: Crown,
		canRead: true,
		canWrite: true,
		canManage: true,
		audioAlways: true,
	},
	{
		level: "ARTISTE",
		apiRole: "LEAD_LYRICIST",
		label: "Artiste",
		description: "Propriétaire artistique : écrit, valide et gère les accès.",
		color: "#D90097",
		softBg: "rgba(217,0,151,0.16)",
		icon: Music,
		canRead: true,
		canWrite: true,
		canManage: true,
		audioAlways: true,
	},
	{
		level: "GHOSTWRITER",
		apiRole: "LYRICIST",
		label: "Ghostwriter",
		description: "Écrit et propose des lignes, sans exposition inutile.",
		color: "#35A8FF",
		softBg: "rgba(53,168,255,0.16)",
		icon: Feather,
		canRead: true,
		canWrite: true,
		canManage: false,
		audioAlways: false,
	},
	{
		level: "ECOUTEUR",
		apiRole: "READONLY",
		label: "Écouteur",
		description: "Lit les lyrics ; l'audio dépend du périmètre accordé.",
		color: "#00B76B",
		softBg: "rgba(0,183,107,0.16)",
		icon: Headphones,
		canRead: true,
		canWrite: false,
		canManage: false,
		audioAlways: false,
	},
] as const;

/** Icônes explicites par type d'accès (colonnes de la matrice). */
export const PERMISSION_KINDS: readonly {
	kind: PermissionKind;
	label: string;
	icon: LucideIcon;
}[] = [
	{ kind: "read", label: "Lecture", icon: Eye },
	{ kind: "write", label: "Écriture", icon: PenLine },
	{ kind: "audio", label: "Audio", icon: Headphones },
] as const;

const byLevel: Record<AccessLevel, LevelDefinition> = Object.fromEntries(
	ACCESS_LEVELS.map(
		(definition: LevelDefinition): [AccessLevel, LevelDefinition] => [
			definition.level,
			definition,
		],
	),
) as Record<AccessLevel, LevelDefinition>;

const byApiRole: Record<ApiRole, LevelDefinition> = Object.fromEntries(
	ACCESS_LEVELS.map(
		(definition: LevelDefinition): [ApiRole, LevelDefinition] => [
			definition.apiRole,
			definition,
		],
	),
) as Record<ApiRole, LevelDefinition>;

export function getLevelDefinition(level: AccessLevel): LevelDefinition {
	return byLevel[level];
}

export function apiRoleToLevel(role: ApiRole): AccessLevel {
	return byApiRole[role]?.level ?? "ECOUTEUR";
}

export function levelToApiRole(level: AccessLevel): ApiRole {
	return byLevel[level].apiRole;
}

/**
 * Périmètre par défaut d'un niveau tant que 54-BE n'expose pas
 * `audioAccess` sur ProjectMember : Admin/Artiste entendent tout,
 * Ghostwriter/Écouteur démarrent en « lyrics seuls ».
 */
export function defaultScopeForLevel(level: AccessLevel): AccessScope {
	return byLevel[level].audioAlways ? "LYRICS_AND_MUSIC" : "LYRICS_ONLY";
}

/** L'accès audio effectif d'un membre = niveau + périmètre accordé. */
export function hasAudio(level: AccessLevel, scope: AccessScope): boolean {
	return byLevel[level].audioAlways || scope === "LYRICS_AND_MUSIC";
}

/** Vérifie une permission pour la matrice (une cellule = un appel). */
export function hasPermission(
	level: AccessLevel,
	kind: PermissionKind,
	scope: AccessScope,
): boolean {
	const definition: LevelDefinition = byLevel[level];

	if (kind === "read") {
		return definition.canRead;
	}
	if (kind === "write") {
		return definition.canWrite;
	}
	return hasAudio(level, scope);
}

export function scopeLabel(scope: AccessScope): string {
	return scope === "LYRICS_AND_MUSIC" ? "Lyrics + Musique" : "Lyrics seuls";
}