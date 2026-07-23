import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { certificateSchema } from "@/schemas/contribution.schema";
import { verifyCertificate } from "@/server/authorship/certificate.service";
import type { Certificate } from "@/server/authorship/types";

// POST /api/certificates/verify
// Vérifie un certificat (empreinte + jeton). Fonctionne aussi sur un certificat
// exporté hors base. Source de vérité côté serveur.
export async function POST(request: NextRequest) {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const parsed = certificateSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Certificat invalide", details: parsed.error.flatten() },
                { status: 422 },
            );
        }

        const result = await verifyCertificate(parsed.data as Certificate);
        return NextResponse.json(result);
    } catch (error) {
        console.error("POST certificates/verify error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
