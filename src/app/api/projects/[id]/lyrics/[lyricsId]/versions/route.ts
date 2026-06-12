import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { getVersions, createVersionSnapshot } from "@/server/lyrics-versions/controller";
import { withErrorHandler } from "@/lib/api-middleware";

export let GET = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string; lyricsId: string }> }) => {
    try {
            const { id, lyricsId } = await params;
            const cognitoId = getCognitoId(request);
            if (!cognitoId) return unauthorized();

            const result = await getVersions(cognitoId, id, lyricsId);
            return NextResponse.json(result.data ?? result.error, { status: result.status });
        } catch (error) {
      throw error;
    }
    });
export let POST = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string; lyricsId: string }> }) => {
    try {
            const { id, lyricsId } = await params;
            const cognitoId = getCognitoId(request);
            if (!cognitoId) return unauthorized();

            const result = await createVersionSnapshot(cognitoId, id, lyricsId);
            return NextResponse.json(result.data ?? result.error, { status: result.status });
        } catch (error) {
      throw error;
    }
    });
