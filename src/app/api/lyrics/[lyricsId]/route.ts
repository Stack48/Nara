import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized, forbidden } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lyricsId: string }> }
) {
    try {
        const { lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        const lyrics = await prisma.lyrics.findUnique({
            where: { id: lyricsId },
            include: {
                project: { select: { id: true, name: true, ownerId: true } },
                author: { select: { id: true, name: true } },
            },
        });

        if (!lyrics) return NextResponse.json({ error: "Lyrics introuvable" }, { status: 404 });

        return NextResponse.json(lyrics);
    } catch (error) {
        console.error("GET lyrics error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ lyricsId: string }> }
) {
    try {
        const { lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        const lyrics = await prisma.lyrics.findUnique({ 
            where: { id: lyricsId },
            include: { project: true } 
        });
        if (!lyrics) return NextResponse.json({ error: "Lyrics introuvable" }, { status: 404 });

        const isMemberOrOwner = lyrics.projectId ? (
            lyrics.project?.ownerId === user.id ||
            !!(await prisma.projectMember.findFirst({ where: { projectId: lyrics.projectId, userId: user.id } }))
        ) : false;

        if (lyrics.authorId !== user.id && !isMemberOrOwner) return forbidden();

        const body = await request.json();

        const updated = await prisma.lyrics.update({
            where: { id: lyricsId },
            data: { content: body.content },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH lyrics error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
