import type { TrashedFile } from "@/types/trash";

export const RETENTION_DAYS = 30;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type RetentionTone = "safe" | "warning" | "danger";

/** Date de purge effective : `expiresAt` si présent, sinon dérivée. */
export function getExpiry(file: TrashedFile): Date {
    if (file.expiresAt) return new Date(file.expiresAt);
    const deleted = new Date(file.deletedAt);
    return new Date(deleted.getTime() + RETENTION_DAYS * MS_PER_DAY);
}

/** Jours restants avant purge automatique (jamais négatif). */
export function getDaysRemaining(file: TrashedFile, now: Date = new Date()): number {
    const diff = getExpiry(file).getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / MS_PER_DAY));
}

/** Libellé affiché dans le badge de rétention. */
export function getRetentionLabel(file: TrashedFile, now: Date = new Date()): string {
    const days = getDaysRemaining(file, now);
    if (days <= 0) return "Expires today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
}


export function getRetentionTone(file: TrashedFile, now: Date = new Date()): RetentionTone {
    const days = getDaysRemaining(file, now);
    if (days <= 3) return "danger";
    if (days <= 7) return "warning";
    return "safe";
}

const FR_DATE = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});


export function formatDeletedAt(file: TrashedFile): string {
    return FR_DATE.format(new Date(file.deletedAt));
}


export function formatBytes(bytes: number): string {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}