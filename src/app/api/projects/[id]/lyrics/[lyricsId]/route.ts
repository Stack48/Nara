import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/lib/rbac";
import { z } from "zod";

const updateLyricsSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    content: z.record(z.string(), z.any()).optional(),
    sectionType: z.enum(["COUPLET", "REFRAIN", "PONT", "INTRO", "OUTRO", "BRIDGE"]).optional(),
    order: z.number().int().optional(),
});

function getCognitoId(request: NextRequest): string | null {
    return request.headers.get("x-cognito-id");
}

// PATCH /api/projects/:id/lyrics/:lyricsId
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LEAD_LYRICIST");
    if (!authorized) return forbidden("Seul un Lead LYRICIST ou Admin peut modifier les lyrics");

    const body = await request.json();
    const parsed = updateLyricsSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const lyrics = await prisma.lyrics.update({
        where: { id: params.lyricsId },
        data: parsed.data,
    });

    return NextResponse.json(lyrics);
}

// DELETE /api/projects/:id/lyrics/:lyricsId
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "ADMIN");
    if (!authorized) return forbidden("Seul un Admin peut supprimer des lyrics");

    await prisma.lyrics.delete({ where: { id: params.lyricsId } });

    return NextResponse.json({ success: true });
}