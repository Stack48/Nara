import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/lib/rbac";
import type { ReferenceMatch } from "@/server/similarity/similarity.service";
import { Prisma } from "@prisma/client";

// PATCH /api/projects/:id/lyrics/:lyricsId/similarity/:jobId/ignore
// Marque un passage signalé comme ignoré (masqué définitivement côté UI)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; lyricsId: string; jobId: string } }
) {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    // LYRICIST : ignorer un signalement modifie le résultat d'analyse
    const { authorized } = await requireRole(cognitoId, params.id, "LYRICIST");
    if (!authorized) return forbidden();

    const body = await request.json().catch(() => null);
    const referenceId: unknown = body?.referenceId;
    const inputWordStart: unknown = body?.inputWordStart;
    const inputWordEnd: unknown = body?.inputWordEnd;

    if (
        typeof referenceId !== "string" ||
        typeof inputWordStart !== "number" ||
        typeof inputWordEnd !== "number"
    ) {
        return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const job = await prisma.analysisJob.findUnique({
        where: { id: params.jobId },
    });

    if (!job || job.lyricsId !== params.lyricsId) {
        return NextResponse.json({ error: "Analyse introuvable" }, { status: 404 });
    }

    const matches = (job.matches ?? []) as unknown as ReferenceMatch[];
    let found = false;

    const updatedMatches = matches.map((match) => {
        if (match.referenceId !== referenceId) return match;

        return {
            ...match,
            passages: match.passages.map((passage) => {
                if (
                    passage.inputWordStart === inputWordStart &&
                    passage.inputWordEnd === inputWordEnd
                ) {
                    found = true;
                    return { ...passage, ignored: true };
                }
                return passage;
            }),
        };
    });

    if (!found) {
        return NextResponse.json({ error: "Passage introuvable" }, { status: 404 });
    }

    const updatedJob = await prisma.analysisJob.update({
        where: { id: job.id },
        data: { matches: updatedMatches as unknown as Prisma.InputJsonValue },
        include: {
            requester: { select: { id: true, name: true, username: true } },
        },
    });

    return NextResponse.json(updatedJob);
}