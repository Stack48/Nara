import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import {
    getAlternativeHistory,
    recordAlternativeView,
} from "@/server/lyrics-alternatives/controller";

// GET — historique des alternatives consultées
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lyricsId: string }> }
) {
    try {
        const { lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const result = await getAlternativeHistory(cognitoId, lyricsId);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
    } catch (error) {
        console.error("GET alternative history error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// POST — enregistre la consultation d'une alternative
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ lyricsId: string }> }
) {
    try {
        const { lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const body = await request.json();
        const result = await recordAlternativeView(cognitoId, lyricsId, body);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
    } catch (error) {
        console.error("POST alternative view error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
