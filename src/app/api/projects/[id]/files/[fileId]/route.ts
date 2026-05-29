import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/middleware/rbac.middleware";
import { deleteFile, getSignedFileUrl } from "@/server/s3.service";

// GET /api/projects/:id/files/:fileId — URL signée
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; fileId: string } }
) {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    const { authorized } = await requireRole(cognitoId, params.id, "LECTURE_SEULE");
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

    const { authorized } = await requireRole(cognitoId, params.id, "LEAD_PAROLIER");
    if (!authorized) return forbidden("Seul un Lead Parolier ou Admin peut supprimer des fichiers");

    const file = await prisma.file.findUnique({
        where: { id: params.fileId },
    });

    if (!file) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

    // Supprime S3 + DB en sync
    await deleteFile(file.s3Key);
    await prisma.file.delete({ where: { id: params.fileId } });

    return NextResponse.json({ success: true });
}