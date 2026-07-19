import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/lib/rbac";

// GET /api/projects/:id/lyrics/:lyricsId/similarity/:jobId
// Statut + résultat complet (score et passages concernés)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string; jobId: string } }
) {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "READONLY");
    if (!authorized) return forbidden();

    const job = await prisma.analysisJob.findUnique({
        where: { id: params.jobId },
        include: {
            requester: { select: { id: true, name: true, username: true } },
        },
    });

    if (!job || job.lyricsId !== params.lyricsId) {
        return NextResponse.json({ error: "Analyse introuvable" }, { status: 404 });
    }

    return NextResponse.json(job);
}