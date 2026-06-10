import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/middleware/rbac.middleware";
import { syncLabelCopy } from "@/server/bridge-audio.service";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-middleware";

const labelCopySchema = z.object({
    title: z.string().min(1),
    isrc: z.string().optional(),
    composers: z.array(z.string()).default([]),
    publishers: z.array(z.string()).default([]),
    recordLabel: z.string().optional(),
    releaseDate: z.string().optional(),
    bridgeAudioId: z.string().optional(),
});

function getCognitoId(request: NextRequest): string | null {
    return request.headers.get("x-cognito-id");
}

// GET /api/projects/:id/label-copy
// POST /api/projects/:id/label-copy
export let GET = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LECTURE_SEULE");
    if (!authorized) return forbidden();

    const labelCopy = await prisma.labelCopy.findFirst({
        where: { projectId: params.id },
    });

    if (!labelCopy) return NextResponse.json(null);

    // Sync Bridge.audio si disponible
    if (labelCopy.bridgeAudioId) {
        const synced = await syncLabelCopy(params.id, labelCopy.bridgeAudioId);
        if (!synced.fallback) return NextResponse.json(synced);
    }

    return NextResponse.json(labelCopy);
    });
export let POST = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LEAD_PAROLIER");
    if (!authorized) return forbidden("Seul un Lead Parolier ou Admin peut créer un Label Copy");

    const body = await request.json();
    const parsed = labelCopySchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const labelCopy = await prisma.labelCopy.create({
        data: {
            ...parsed.data,
            releaseDate: parsed.data.releaseDate
                ? new Date(parsed.data.releaseDate)
                : undefined,
            projectId: params.id,
        },
    });

    return NextResponse.json(labelCopy, { status: 201 });
    });
