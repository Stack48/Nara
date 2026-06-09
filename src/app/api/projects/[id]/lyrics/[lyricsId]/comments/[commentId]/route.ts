import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized, requireRole, forbidden } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

// PATCH — marquer comme lu
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lyricsId: string; commentId: string }> }
) {
    try {
        const { id, commentId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const { authorized } = await requireRole(cognitoId, id, "READONLY");
        if (!authorized) return forbidden();

        const updated = await prisma.comment.update({
            where: { id: commentId },
            data: { isRead: true },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH comment error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// DELETE — supprimer un commentaire
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lyricsId: string; commentId: string }> }
) {
    try {
        const { id, commentId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });

        // Seul l'auteur ou un ADMIN peut supprimer
        if (comment.authorId !== user.id) {
            const { authorized } = await requireRole(cognitoId, id, "ADMIN");
            if (!authorized) return forbidden("Seul l'auteur ou un Admin peut supprimer ce commentaire");
        }

        await prisma.comment.delete({ where: { id: commentId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE comment error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}