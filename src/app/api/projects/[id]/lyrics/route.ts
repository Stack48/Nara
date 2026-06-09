import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/middleware/rbac.middleware";
import { z } from "zod";

const createLyricsSchema = z.object({
    title: z.string().min(1, "Le titre est requis").max(100),
    content: z.record(z.string(), z.any()), // JSON TipTap
    sectionType: z.enum(["COUPLET", "REFRAIN", "PONT", "INTRO", "OUTRO", "BRIDGE"]).default("COUPLET"),
    order: z.number().int().default(0),
});

function getCognitoId(request: NextRequest): string | null {
    return request.headers.get("x-cognito-id");
}

// GET /api/projects/:id/lyrics
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LECTURE_SEULE");
    if (!authorized) return forbidden();

    const lyrics = await prisma.lyrics.findMany({
        where: { projectId: params.id },
        include: {
            author: { select: { id: true, name: true, username: true } },
            suggestions: {
                where: { status: "PENDING" },
                include: {
                    author: { select: { id: true, name: true, username: true } },
                },
            },
        },
        orderBy: { order: "asc" },
    });

    return NextResponse.json(lyrics);
}

// POST /api/projects/:id/lyrics
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized, userId } = await requireRole(cognitoId, params.id, "PAROLIER");
    if (!authorized) return forbidden("Accès refusé");

    const body = await request.json();
    const parsed = createLyricsSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const lyrics = await prisma.lyrics.create({
        data: {
            ...parsed.data,
            projectId: params.id,
            authorId: user.id,
        },
        include: {
            author: { select: { id: true, name: true, username: true } },
        },
    });

    return NextResponse.json(lyrics, { status: 201 });
}