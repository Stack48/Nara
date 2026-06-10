import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { getVersions, createVersionSnapshot } from "@/server/lyrics-versions/controller";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lyricsId: string }> }
) {
    try {
        const { id, lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const result = await getVersions(cognitoId, id, lyricsId);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
    } catch (error) {
        console.error("GET versions error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lyricsId: string }> }
) {
    try {
        const { id, lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const result = await createVersionSnapshot(cognitoId, id, lyricsId);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
    } catch (error) {
        console.error("POST snapshot error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}