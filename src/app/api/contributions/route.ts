import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { listCertificates } from "@/server/authorship/certificate.service";

// GET /api/contributions?projectRef=...&lyricsId=...
// Historique du coffre de l'auteur authentifié (versions scellées).
export async function GET(request: NextRequest) {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) {
            return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const projectRef = searchParams.get("projectRef") ?? undefined;
        const lyricsId = searchParams.get("lyricsId") ?? undefined;

        const certificates = await listCertificates({ authorId: user.id, projectRef, lyricsId });

        return NextResponse.json({ count: certificates.length, certificates });
    } catch (error) {
        console.error("GET contributions error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
