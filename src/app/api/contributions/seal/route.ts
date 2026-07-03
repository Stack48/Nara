import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { sealContributionSchema } from "@/schemas/contribution.schema";
import { sealContribution } from "@/server/authorship/certificate.service";
import type { AuthorRef } from "@/server/authorship/types";

// POST /api/contributions/seal
// Scelle une nouvelle version dans le coffre « Mes contributions » de l'auteur.
export async function POST(request: NextRequest) {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) {
            return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
        }

        const parsed = sealContributionSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Requête invalide", details: parsed.error.flatten() },
                { status: 422 },
            );
        }
        const { lyricsId, projectRef, title, body } = parsed.data;

        // Si des lyrics sont liées, on vérifie qu'elles appartiennent à l'auteur.
        if (lyricsId) {
            const lyrics = await prisma.lyrics.findUnique({
                where: { id: lyricsId },
                select: { authorId: true },
            });
            if (!lyrics) {
                return NextResponse.json({ error: "Lyrics introuvable" }, { status: 404 });
            }
            if (lyrics.authorId !== user.id) {
                return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
            }
        }

        // L'identité de l'auteur vient toujours du compte authentifié.
        const author: AuthorRef = {
            user_id: user.id,
            display_name: user.name || user.username || user.email,
            email: user.email,
            identity_assurance: "compte_authentifie",
        };

        const certificate = await sealContribution({
            author,
            authorId: user.id,
            lyricsId: lyricsId ?? null,
            projectRef,
            title,
            body,
        });

        return NextResponse.json(certificate, { status: 201 });
    } catch (error) {
        console.error("POST contributions/seal error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
