import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        // Récupère les comments des projets où l'user est membre ou owner
        const comments = await prisma.comment.findMany({
            where: {
                lyrics: {
                    project: {
                        OR: [
                            { ownerId: user.id },
                            { members: { some: { userId: user.id } } },
                        ],
                    },
                },
            },
            include: {
                author: { select: { id: true, name: true, username: true, avatarUrl: true } },
                lyrics: { select: { id: true, title: true, projectId: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("GET recent comments error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}