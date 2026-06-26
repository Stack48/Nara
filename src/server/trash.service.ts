// src/server/trash.service.ts
import { prisma } from "@/lib/prisma";
import { deleteFile } from "./s3.service";

// Rétention configurable (jours). Défaut 30. Surchageable via .env (TRASH_RETENTION_DAYS).
export const TRASH_RETENTION_DAYS = Number(process.env.TRASH_RETENTION_DAYS ?? 30);

const DAY_MS = 24 * 60 * 60 * 1000;

/** Étape 1 — met le fichier à la corbeille (soft delete). Ne touche PAS à S3. */
export async function trashFile(fileId: string) {
    return prisma.file.update({
        where: { id: fileId },
        data: { deletedAt: new Date() },
    });
}

/** Restaure un fichier depuis la corbeille. */
export async function restoreFile(fileId: string) {
    return prisma.file.update({
        where: { id: fileId },
        data: { deletedAt: null },
    });
}

/**
 * Étape 2 — suppression définitive. S3 D'ABORD, puis la DB :
 * si S3 échoue, on garde la ligne en base (pas de fichier "fantôme" en DB sans S3).
 */
export async function permanentlyDeleteFile(fileId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return null;

    await deleteFile(file.s3Key);
    await prisma.file.delete({ where: { id: fileId } });
    return file;
}

/**
 * Purge automatique : supprime définitivement (S3 + DB) tous les fichiers
 * en corbeille depuis plus de `retentionDays` jours.
 * Tolérante aux pannes : un échec sur un fichier n'arrête pas les autres.
 */
export async function purgeExpiredFiles(retentionDays = TRASH_RETENTION_DAYS) {
    const cutoff = new Date(Date.now() - retentionDays * DAY_MS);

    const expired = await prisma.file.findMany({
        where: { deletedAt: { not: null, lte: cutoff } },
    });

    let purged = 0;
    const errors: string[] = [];

    for (const file of expired) {
        try {
            await deleteFile(file.s3Key);
            await prisma.file.delete({ where: { id: file.id } });
            purged++;
        } catch (e) {
            console.error(`[purge-trash] échec pour le fichier ${file.id}`, e);
            errors.push(file.id);
        }
    }

    return { scanned: expired.length, purged, failed: errors.length, retentionDays };
}