import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import {
    listAlternatives,
    generateAIAlternatives,
} from "@/server/lyrics-alternatives/controller";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lyricsId: string }> }
) {
    try {
        const { lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const result = await listAlternatives(cognitoId, lyricsId);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
    } catch (error) {
        console.error("GET alternatives error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// POST — génération IA (Claude API)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ lyricsId: string }> }
) {
    try {
        const { lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const body = await request.json();
        const result = await generateAIAlternatives(cognitoId, lyricsId, body);

        const retryAfter =
            "retryAfter" in result ? result.retryAfter : undefined;
        const headers =
            result.status === 429 && retryAfter
                ? { "Retry-After": String(retryAfter) }
                : undefined;

        return NextResponse.json(result.data ?? result.error, {
            status: result.status,
            headers,
        });
    } catch (error) {
        console.error("POST alternatives error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
