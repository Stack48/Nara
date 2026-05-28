import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/middleware/rbac.middleware";
import { createSnapshot } from "@/server/lyrics-version.service";
import { z } from "zod";

const restoreSchema = z.object({
    versionId: z.string(),
});

function getCognitoId(request: NextRequest): string | null {
    return request.headers.get("x-cognito-id");
}

// POST /api/projects/:id/lyrics/:lyricsId/restore
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LEAD_PAROLIER");
    if (!authorized) return forbidden("Seul un Lead Parolier ou Admin peut restaurer une version");

    const body = await request.json();
    const parsed = restoreSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    // Récupère la version à restaurer
    const version = await prisma.lyricVersion.findUnique({
        where: { id: parsed.data.versionId },
    });

    if (!version) return NextResponse.json({ error: "Version introuvable" }, { status: 404 });

    // Snapshot de l'état actuel avant restauration
    await createSnapshot(params.lyricsId, user.id);

    // Restaure le contenu
    const restored = await prisma.lyrics.update({
        where: { id: params.lyricsId },
        data: { content: version.content as any },
    });

    // Crée un snapshot de la restauration
    await createSnapshot(params.lyricsId, user.id);

    return NextResponse.json({
        success: true,
        restoredTo: version.version,
        lyrics: restored,
    });
}