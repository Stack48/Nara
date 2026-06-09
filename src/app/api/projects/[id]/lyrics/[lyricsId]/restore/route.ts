import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { restoreVersion } from "@/server/lyrics-versions/controller";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lyricsId: string }> }
) {
    try {
        const { id, lyricsId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const body = await request.json();
        const result = await restoreVersion(cognitoId, id, lyricsId, body);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
    } catch (error) {
        console.error("POST restore error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}