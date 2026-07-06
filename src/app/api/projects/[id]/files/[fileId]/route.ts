import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/lib/rbac";
import { getSignedFileUrl } from "@/server/s3.service";

// GET /api/projects/:id/files/:fileId — URL signée
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; fileId: string } }
) {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "READONLY");
    if (!authorized) return forbidden();

    const file = await prisma.file.findUnique({
        where: { id: params.fileId },
    });

    if (!file) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

    const url = await getSignedFileUrl(file.s3Key);

    return NextResponse.json({ ...file, url });
}

// DELETE /api/projects/:id/files/:fileId
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string; fileId: string } }
) {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LEAD_LYRICIST");
    if (!authorized) return forbidden("Seul un Lead LYRICIST ou Admin peut supprimer des fichiers");

    const file = await prisma.file.findUnique({
        where: { id: params.fileId },
    });

    if (!file) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

    // Supprime S3 + DB en sync
    await prisma.file.update({
        where: { id: params.fileId },
        data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
}