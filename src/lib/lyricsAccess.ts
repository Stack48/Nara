import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { Role } from "@/schemas/updateRole.schema";

type LyricsRef = { id: string; projectId: string | null; authorId: string };
type AccessUser = { id: string; cognitoId: string };

export type LyricsAccess =
    | { ok: true; user: AccessUser; lyrics: LyricsRef; role?: Role }
    | { ok: false; status: number; error: string };

/**
 * Résout l'accès à un lyric pour les routes plates /lyrics/[lyricsId]/*.
 * - Lyric rattaché à un projet → RBAC projet via requireRole.
 * - Lyric personnel (projectId null) → seul l'auteur y accède.
 */
export async function resolveLyricsAccess(
    cognitoId: string,
    lyricsId: string,
    requiredRole: Role
): Promise<LyricsAccess> {
    const user = await prisma.user.findUnique({
        where: { cognitoId },
        select: { id: true, cognitoId: true },
    });
    if (!user) return { ok: false, status: 404, error: "Utilisateur introuvable" };

    const lyrics = await prisma.lyrics.findUnique({
        where: { id: lyricsId },
        select: { id: true, projectId: true, authorId: true },
    });
    if (!lyrics) return { ok: false, status: 404, error: "Lyrics introuvable" };

    if (lyrics.projectId) {
        const { authorized, role } = await requireRole(
            cognitoId,
            lyrics.projectId,
            requiredRole
        );
        if (!authorized) return { ok: false, status: 403, error: "Accès refusé" };
        return { ok: true, user, lyrics, role };
    }

    // Lyric personnel : réservé à l'auteur
    if (lyrics.authorId !== user.id) {
        return { ok: false, status: 403, error: "Accès refusé" };
    }
    return { ok: true, user, lyrics };
}
