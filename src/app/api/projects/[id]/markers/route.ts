import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/lib/rbac";
import { z } from "zod";

const createMarkerSchema = z.object({
    timecode: z.number().min(0, "Timecode invalide"),
    label: z.string().optional(),
    lyricsId: z.string(),
    fileId: z.string(),
});

function getCognitoId(request: NextRequest): string | null {
    return request.headers.get("x-cognito-id");
}

// GET /api/projects/:id/markers
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LECTURE_SEULE");
    if (!authorized) return forbidden();

    const markers = await prisma.audioMarker.findMany({
        where: {
            lyrics: { projectId: params.id },
        },
        include: {
            lyrics: { select: { id: true, title: true, sectionType: true } },
            file: { select: { id: true, name: true, mimeType: true } },
            creator: { select: { id: true, name: true, username: true } },
        },
        orderBy: { timecode: "asc" },
    });

    return NextResponse.json(markers);
}

// POST /api/projects/:id/markers
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "PAROLIER");
    if (!authorized) return forbidden("Accès refusé");

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const body = await request.json();
    const parsed = createMarkerSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const marker = await prisma.audioMarker.create({
        data: {
            ...parsed.data,
            createdBy: user.id,
        },
        include: {
            lyrics: { select: { id: true, title: true, sectionType: true } },
            file: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json(marker, { status: 201 });
}