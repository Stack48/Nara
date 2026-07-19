import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/lib/rbac";
import { enqueueSimilarityAnalysis } from "@/server/similarity/similarity.queue";

// POST /api/projects/:id/lyrics/:lyricsId/similarity/:jobId/retry
// Relance un job terminé ou échoué
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string; jobId: string } }
) {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LYRICIST");
    if (!authorized) return forbidden();

    const job = await prisma.analysisJob.findUnique({
        where: { id: params.jobId },
    });

    if (!job || job.lyricsId !== params.lyricsId) {
        return NextResponse.json({ error: "Analyse introuvable" }, { status: 404 });
    }

    if (job.status === "PENDING" || job.status === "RUNNING") {
        return NextResponse.json(
            { error: "Cette analyse est déjà en cours" },
            { status: 409 }
        );
    }

    // Repasse en PENDING et re-pousse dans la queue
    await prisma.analysisJob.update({
        where: { id: job.id },
        data: { status: "PENDING", error: null, finishedAt: null },
    });
    await enqueueSimilarityAnalysis(job.id);

    return NextResponse.json({ id: job.id, status: "PENDING" }, { status: 202 });
}