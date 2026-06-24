// src/lib/trashTime.ts
// Helpers d'affichage pour la corbeille :
//  - temps relatif depuis la suppression ("Deleted just now", "Deleted 2 min ago"...)
//  - jours restants avant la purge automatique ("29 days left", "Expires today")
//
// Tout part d'un seul timestamp `deletedAt` (ms ou ISO) posé au moment où l'item
// est mis à la corbeille. Sans ce timestamp, on retombe sur un affichage neutre.

export const RETENTION_DAYS = 30;

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function toMs(deletedAt: number | string | null | undefined): number | null {
    if (deletedAt == null) return null;
    const ms = typeof deletedAt === "number" ? deletedAt : new Date(deletedAt).getTime();
    return Number.isFinite(ms) ? ms : null;
}

/** "Deleted just now" | "Deleted 2 min ago" | "Deleted 3 hours ago" | "Deleted 4 days ago" */
export function formatRelativeDeleted(
    deletedAt: number | string | null | undefined,
    now: number = Date.now(),
): string {
    const ms = toMs(deletedAt);
    if (ms == null) return "Deleted recently";

    const diff = Math.max(0, now - ms);

    if (diff < MIN) return "Deleted just now";
    if (diff < HOUR) {
        const m = Math.floor(diff / MIN);
        return `Deleted ${m} min ago`;
    }
    if (diff < DAY) {
        const h = Math.floor(diff / HOUR);
        return `Deleted ${h} hour${h > 1 ? "s" : ""} ago`;
    }
    const d = Math.floor(diff / DAY);
    return `Deleted ${d} day${d > 1 ? "s" : ""} ago`;
}

/** Jours restants avant purge auto (toujours >= 0), ou null si `deletedAt` inconnu. */
export function getDaysLeft(
    deletedAt: number | string | null | undefined,
    retentionDays: number = RETENTION_DAYS,
    now: number = Date.now(),
): number | null {
    const ms = toMs(deletedAt);
    if (ms == null) return null;
    const expiry = ms + retentionDays * DAY;
    return Math.max(0, Math.ceil((expiry - now) / DAY));
}

/** "29 days left" | "1 day left" | "Expires today" | "" (si inconnu) */
export function getDaysLeftLabel(
    deletedAt: number | string | null | undefined,
    retentionDays: number = RETENTION_DAYS,
    now: number = Date.now(),
): string {
    const days = getDaysLeft(deletedAt, retentionDays, now);
    if (days == null) return "";
    if (days <= 0) return "Expires today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
}

/** Niveau d'urgence pour colorer le badge. */
export function getDaysLeftTone(
    deletedAt: number | string | null | undefined,
    retentionDays: number = RETENTION_DAYS,
    now: number = Date.now(),
): "safe" | "warning" | "danger" {
    const days = getDaysLeft(deletedAt, retentionDays, now) ?? 99;
    if (days <= 3) return "danger";
    if (days <= 7) return "warning";
    return "safe";
}