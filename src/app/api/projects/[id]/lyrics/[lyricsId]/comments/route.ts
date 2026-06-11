import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized, requireRole, forbidden } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lyricsId: string }> }
) {
    try {
        const { id, lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const { authorized } = await requireRole(cognitoId, id, "READONLY");
        if (!authorized) return forbidden();

        const comments = await prisma.comment.findMany({
            where: { lyricsId },
            include: {
                author: { select: { id: true, name: true, username: true, avatarUrl: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("GET comments error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lyricsId: string }> }
) {
    try {
        const { id, lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const { authorized } = await requireRole(cognitoId, id, "LYRICIST");
        if (!authorized) return forbidden();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        const body = await request.json();
        if (!body.content) return NextResponse.json({ error: "Contenu manquant" }, { status: 400 });

        const comment = await prisma.comment.create({
            data: {
                content: body.content,
                lyricsId,
                authorId: user.id,
            },
            include: {
                author: { select: { id: true, name: true, username: true, avatarUrl: true } },
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("POST comment error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}