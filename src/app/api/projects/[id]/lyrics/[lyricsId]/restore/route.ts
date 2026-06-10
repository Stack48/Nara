import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { restoreVersion } from "@/server/lyrics-versions/controller";
import { withErrorHandler } from "@/lib/api-middleware";

export let POST = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string; lyricsId: string }> }) => {
    try {
            const { id, lyricsId } = await params;
            const cognitoId = getCognitoId(request);
            if (!cognitoId) return unauthorized();

            const body = await request.json();
            const result = await restoreVersion(cognitoId, id, lyricsId, body);
            return NextResponse.json(result.data ?? result.error, { status: result.status });
        } catch (error) {
      throw error;
    }
    });
