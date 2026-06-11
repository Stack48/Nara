import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized, forbidden } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        const lyrics = await prisma.lyrics.findUnique({ where: { id } });
        if (!lyrics) return NextResponse.json({ error: "Song introuvable" }, { status: 404 });

        if (lyrics.authorId !== user.id) return forbidden("Seul l'auteur peut supprimer définitivement cette song");

        await prisma.lyrics.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE song error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}