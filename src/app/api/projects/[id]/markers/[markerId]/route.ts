import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/middleware/rbac.middleware";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-middleware";

const updateMarkerSchema = z.object({
    timecode: z.number().min(0).optional(),
    label: z.string().optional(),
});

function getCognitoId(request: NextRequest): string | null {
    return request.headers.get("x-cognito-id");
}

// PATCH /api/projects/:id/markers/:markerId — déplace un marker
// DELETE /api/projects/:id/markers/:markerId
export let PATCH = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string; markerId: string } }) => {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "PAROLIER");
    if (!authorized) return forbidden("Accès refusé");

    const body = await request.json();
    const parsed = updateMarkerSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const marker = await prisma.audioMarker.update({
        where: { id: params.markerId },
        data: parsed.data,
    });

    return NextResponse.json(marker);
    });
export let DELETE = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string; markerId: string } }) => {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LEAD_PAROLIER");
    if (!authorized) return forbidden("Seul un Lead Parolier ou Admin peut supprimer un marker");

    await prisma.audioMarker.delete({ where: { id: params.markerId } });

    return NextResponse.json({ success: true });
    });
