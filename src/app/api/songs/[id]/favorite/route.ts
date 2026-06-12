import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized, forbidden } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        const lyrics = await prisma.lyrics.findUnique({
            where: { id },
            include: { project: true }
        });
        if (!lyrics) return NextResponse.json({ error: "Song introuvable" }, { status: 404 });

        // Vérifier owner ou membre si lié à un projet
        if (lyrics.projectId) {
            const isMemberOrOwner = lyrics.project?.ownerId === user.id ||
                !!(await prisma.projectMember.findFirst({ where: { projectId: lyrics.projectId, userId: user.id } }));
            if (!isMemberOrOwner) return forbidden();
        }

        const updated = await prisma.lyrics.update({
            where: { id },
            data: { isFavorite: !lyrics.isFavorite },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH song favorite error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}