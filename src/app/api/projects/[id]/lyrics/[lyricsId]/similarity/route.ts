import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized, getCognitoId } from "@/lib/rbac";
import { extractTipTapText } from "@/server/text/extract-text";
import { enqueueSimilarityAnalysis } from "@/server/similarity/similarity.queue";

// POST /api/projects/:id/lyrics/:lyricsId/similarity
// Déclenche une analyse de similarité (à la demande)
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized, userId } = await requireRole(cognitoId, params.id, "LYRICIST");
    if (!authorized || !userId) return forbidden();

    const lyrics = await prisma.lyrics.findUnique({
        where: { id: params.lyricsId },
    });
    if (!lyrics) {
        return NextResponse.json({ error: "Lyrics introuvables" }, { status: 404 });
    }

    // Garde-fou : évite d'empiler les analyses sur le même lyric
    const activeJob = await prisma.analysisJob.findFirst({
        where: {
            lyricsId: params.lyricsId,
            status: { in: ["PENDING", "RUNNING"] },
        },
    });
    if (activeJob) {
        return NextResponse.json(
            { error: "Une analyse est déjà en cours pour ces lyrics", jobId: activeJob.id },
            { status: 409 }
        );
    }

    // Snapshot du texte dès la création → résultat reproductible
    const inputText = extractTipTapText(lyrics.content);
    if (!inputText.trim()) {
        return NextResponse.json(
            { error: "Les lyrics sont vides, rien à analyser" },
            { status: 400 }
        );
    }

    const job = await prisma.analysisJob.create({
        data: {
            lyricsId: params.lyricsId,
            requestedBy: userId,
            inputText,
        },
    });

    await enqueueSimilarityAnalysis(job.id);

    return NextResponse.json(
        { id: job.id, status: job.status, createdAt: job.createdAt },
        { status: 202 }
    );
}

// GET /api/projects/:id/lyrics/:lyricsId/similarity
// Liste les analyses du lyric (la plus récente en premier)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string } }
) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "READONLY");
    if (!authorized) return forbidden();

    const jobs = await prisma.analysisJob.findMany({
        where: { lyricsId: params.lyricsId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
            id: true,
            status: true,
            score: true,
            attempts: true,
            error: true,
            startedAt: true,
            finishedAt: true,
            createdAt: true,
            requester: { select: { id: true, name: true, username: true } },
        },
    });

    return NextResponse.json(jobs);
}