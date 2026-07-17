const DEFAULT_TRASH_RETENTION_DAYS = 30;

function parseRetentionDays(raw: string | undefined): number {
    const parsed = Number.parseInt(raw ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_TRASH_RETENTION_DAYS;
}

export const TRASH_RETENTION_DAYS: number = parseRetentionDays(
    process.env.TRASH_RETENTION_DAYS
);