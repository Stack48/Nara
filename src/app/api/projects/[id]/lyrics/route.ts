import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/lib/rbac";
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

    const { authorized } = await requireRole(cognitoId, params.id, "READONLY");
    if (!authorized) return forbidden();

    const lyrics = await prisma.lyrics.findMany({
        where: { projectId: params.id },
        include: {
            project: { select: { id: true, name: true, status: true, imageUrl: true } },
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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

    const isMemberOrOwner = project.ownerId === user.id ||
        !!(await prisma.projectMember.findFirst({ where: { projectId: id, userId: user.id } }));
    if (!isMemberOrOwner) return forbidden();

    const body = await request.json();
    const parsed = createLyricsSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const lyrics = await prisma.lyrics.create({
        data: {
            ...parsed.data,
            projectId: id,
            authorId: user.id,
        },
        include: {
            author: { select: { id: true, name: true, username: true } },
        },
    });

    return NextResponse.json(lyrics, { status: 201 });
}