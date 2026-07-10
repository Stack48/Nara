import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { getChords, updateChords } from "@/server/lyrics-chords/controller";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lyricsId: string }> }
) {
    try {
        const { lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const result = await getChords(cognitoId, lyricsId);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
    } catch (error) {
        console.error("GET chords error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ lyricsId: string }> }
) {
    try {
        const { lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const body = await request.json();
        const result = await updateChords(cognitoId, lyricsId, body);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
    } catch (error) {
        console.error("PATCH chords error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
