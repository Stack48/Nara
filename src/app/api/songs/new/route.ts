import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        const body = await request.json();
        const title = body.title?.trim() || "Sans titre";

        const lyrics = await prisma.lyrics.create({
            data: {
                title,
                content: {
                    id: "new",
                    title,
                    updatedAt: null,
                    sections: [
                        {
                            accentColor: "#DA069A",
                            activeAlternativeId: null,
                            alternatives: [],
                            id: "couplet-1",
                            kind: "couplet",
                            title: "COUPLET",
                            lines: [
                                {
                                    id: "line-1",
                                    number: 1,
                                    content: { type: "doc", content: [{ type: "paragraph" }] },
                                    comments: 0,
                                    text: "",
                                }
                            ],
                        }
                    ],
                },
                authorId: user.id,
                projectId: body.projectId || null,
            },
        });

        return NextResponse.json(lyrics, { status: 201 });
    } catch (error) {
        console.error("POST song error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
