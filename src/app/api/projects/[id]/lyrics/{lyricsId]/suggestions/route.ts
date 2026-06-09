import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/middleware/rbac.middleware";
import { z } from "zod";

const suggestionSchema = z.object({
    content: z.record(z.string(), z.any()),
});

const reviewSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    suggestionId: z.string(),
});

function getCognitoId(request: NextRequest): string | null {
    return request.headers.get("x-cognito-id");
}

// POST — soumet une suggestion
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "PAROLIER");
    if (!authorized) return forbidden("Accès refusé");

    const body = await request.json();
    const parsed = suggestionSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const suggestion = await prisma.suggestion.create({
        data: {
            content: parsed.data.content,
            lyricsId: params.lyricsId,
            authorId: user.id,
        },
        include: {
            author: { select: { id: true, name: true, username: true } },
        },
    });

    return NextResponse.json(suggestion, { status: 201 });
}

// PATCH — approuve ou rejette une suggestion (LEAD_PAROLIER+)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LEAD_PAROLIER");
    if (!authorized) return forbidden("Seul un Lead Parolier ou Admin peut valider les suggestions");

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const suggestion = await prisma.suggestion.update({
        where: { id: parsed.data.suggestionId },
        data: { status: parsed.data.status },
    });

    return NextResponse.json(suggestion);
}