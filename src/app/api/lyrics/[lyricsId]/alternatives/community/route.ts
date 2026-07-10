import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { submitCommunityAlternative } from "@/server/lyrics-alternatives/controller";

// POST — soumission manuelle d'alternatives (label Communauté)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ lyricsId: string }> }
) {
    try {
        const { lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const body = await request.json();
        const result = await submitCommunityAlternative(cognitoId, lyricsId, body);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
    } catch (error) {
        console.error("POST community alternative error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
