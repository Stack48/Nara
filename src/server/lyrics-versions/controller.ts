import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/rbac";
import { createSnapshot, calculateDiff } from "@/server/lyrics-version.service";
import { restoreVersionSchema } from "@/schemas/lyricVersion.schema";

// GET — liste les versions d'un lyric
export async function getVersions(
    cognitoId: string,
    projectId: string,
    lyricsId: string
) {
    const { authorized } = await requireRole(cognitoId, projectId, "READONLY");
    if (!authorized) return { error: "Accès refusé", status: 403 };

    const versions = await prisma.lyricVersion.findMany({
        where: { lyricsId },
        include: {
            author: { select: { id: true, name: true, username: true } },
        },
        orderBy: { version: "desc" },
    });

    const versionsWithDiff = versions.map((v, i) => {
        if (i === versions.length - 1) return { ...v, diff: null };
        const diff = calculateDiff(
            versions[i + 1].content as Record<string, unknown>,
            v.content as Record<string, unknown>
        );
        return { ...v, diff };
    });

    return { data: versionsWithDiff, status: 200 };
}

// POST — snapshot manuel
export async function createVersionSnapshot(
    cognitoId: string,
    projectId: string,
    lyricsId: string
) {
    const { authorized } = await requireRole(cognitoId, projectId, "LYRICIST");
    if (!authorized) return { error: "Accès refusé", status: 403 };

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return { error: "Utilisateur introuvable", status: 404 };

    const snapshot = await createSnapshot(lyricsId, user.id);
    return { data: snapshot, status: 201 };
}

// POST — restaure une version
export async function restoreVersion(
    cognitoId: string,
    projectId: string,
    lyricsId: string,
    body: unknown
) {
    const { authorized } = await requireRole(cognitoId, projectId, "LEAD_LYRICIST");
    if (!authorized) return { error: "Seul un Lead Lyricist ou Admin peut restaurer une version", status: 403 };

    const parsed = restoreVersionSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.flatten(), status: 400 };

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return { error: "Utilisateur introuvable", status: 404 };

    const version = await prisma.lyricVersion.findUnique({
        where: { id: parsed.data.versionId },
    });
    if (!version) return { error: "Version introuvable", status: 404 };

    // Snapshot avant restauration
    await createSnapshot(lyricsId, user.id);

    // Restaure le contenu
    const restored = await prisma.lyrics.update({
        where: { id: lyricsId },
        data: { content: version.content ? (version.content as Prisma.InputJsonValue) : Prisma.JsonNull },
    });

    // Snapshot après restauration
    await createSnapshot(lyricsId, user.id);

    return { data: { restoredTo: version.version, lyrics: restored }, status: 200 };
}