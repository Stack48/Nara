import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({
            where: { cognitoId },
        });

        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        // Récupère tous les lyrics des projets où l'user est membre ou owner
        const lyrics = await prisma.lyrics.findMany({
            where: {
                OR: [
                    // Songs liées à un projet où l'user est owner ou membre
                    {
                        project: {
                            OR: [
                                { ownerId: user.id },
                                { members: { some: { userId: user.id } } },
                            ],
                        },
                    },
                    // Songs standalone (sans projet) de l'user
                    {
                        projectId: null,
                        authorId: user.id,
                    },
                ],
            },
            include: {
                project: {
                    select: { id: true, name: true, status: true },
                },
                author: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(lyrics);
    } catch (error) {
        console.error("GET songs error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}