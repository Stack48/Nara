// src/server/trash.service.ts
import { prisma } from "@/lib/prisma";
import { deleteFile } from "./s3.service";
import { TRASH_RETENTION_DAYS } from "@/lib/config";

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


export async function permanentlyDeleteFile(fileId: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return null;

    await deleteFile(file.s3Key);
    await prisma.file.delete({ where: { id: fileId } });
    return file;
}


export interface PurgeResult {
    scanned: number;
    purged: number;
    failed: number;
    retentionDays: number;
}

export async function purgeExpiredFiles(
    retentionDays: number = TRASH_RETENTION_DAYS
): Promise<PurgeResult> {
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