"use client";

import type { ReactElement } from "react";
import {
	getLevelDefinition,
	type AccessLevel,
	type LevelDefinition,
} from "@/lib/permissions";

/**
 * Pastille de niveau (Permissions v2) : code couleur + icône du niveau.
 * Deux usages prévus par le ticket :
 *  - <LevelBadge/> : pill autonome (matrice, légende, listes) ;
 *  - <AvatarWithLevel/> : badge miniature accroché à l'avatar collaborateur.
 */

export function LevelBadge({
	level,
	compact = false,
}: {
	level: AccessLevel;
	compact?: boolean;
}): ReactElement {
	const definition: LevelDefinition = getLevelDefinition(level);
	const Icon = definition.icon;

	return (
		<span
			className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
			style={{ backgroundColor: definition.softBg, color: definition.color }}
			title={definition.description}
		>
			<Icon size={compact ? 10 : 11} strokeWidth={2.4} />
			{!compact && definition.label}
		</span>
	);
}

export function AvatarWithLevel({
	initials,
	level,
	size = 28,
}: {
	initials: string;
	level: AccessLevel;
	size?: number;
}): ReactElement {
	const definition: LevelDefinition = getLevelDefinition(level);
	const Icon = definition.icon;
	const badgeSize: number = Math.max(12, Math.round(size * 0.46));

	return (
		<span
			className="relative inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
			style={{
				width: size,
				height: size,
				fontSize: Math.round(size * 0.36),
				backgroundColor: definition.color,
			}}
			aria-label={`${initials} — ${definition.label}`}
		>
			{initials}
			<span
				className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border border-[#0A0A0A]"
				style={{
					width: badgeSize,
					height: badgeSize,
					backgroundColor: "#0A0A0A",
					color: definition.color,
				}}
				title={definition.label}
			>
				<Icon size={badgeSize - 5} strokeWidth={2.6} />
			</span>
		</span>
	);
}