import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/middleware/rbac.middleware";
import { createSnapshot, calculateDiff } from "@/server/lyrics-version.service";

function getCognitoId(request: NextRequest): string | null {
    return request.headers.get("x-cognito-id");
}

// GET /api/projects/:id/lyrics/:lyricsId/versions
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LECTURE_SEULE");
    if (!authorized) return forbidden();

    const versions = await prisma.lyricVersion.findMany({
        where: { lyricsId: params.lyricsId },
        include: {
            author: { select: { id: true, name: true, username: true } },
        },
        orderBy: { version: "desc" },
    });

    // Calcule le diff entre chaque version
    const versionsWithDiff = versions.map((v, i) => {
        if (i === versions.length - 1) {
            return { ...v, diff: null };
        }
        const diff = calculateDiff(
            versions[i + 1].content as Record<string, unknown>,
            v.content as Record<string, unknown>
        );
        return { ...v, diff };
    });

    return NextResponse.json(versionsWithDiff);
}

// POST /api/projects/:id/lyrics/:lyricsId/versions — snapshot manuel
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "PAROLIER");
    if (!authorized) return forbidden();

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const snapshot = await createSnapshot(params.lyricsId, user.id);

    return NextResponse.json(snapshot, { status: 201 });
}