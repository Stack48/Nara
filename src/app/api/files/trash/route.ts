// src/app/api/files/trash/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "@/lib/rbac";

// GET /api/files/trash
// Liste tous les fichiers en corbeille (deletedAt != null) des projets
export async function GET(request: NextRequest) {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) {
        return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const files = await prisma.file.findMany({
        where: {
            deletedAt: { not: null },
            project: {
                OR: [
                    { ownerId: user.id },
                    { members: { some: { userId: user.id } } },
                ],
            },
        },
        include: {
            uploader: { select: { id: true, name: true, username: true } },
            project: { select: { id: true, name: true } },
        },
        orderBy: { deletedAt: "desc" },
    });

   
    const result = files.map((f) => ({
        id: f.id,
        name: f.originalName,
        mimeType: f.mimeType,
        size: f.size,
        deletedAt: f.deletedAt,
        projectId: f.projectId,
        projectName: f.project?.name ?? null,
        uploader: f.uploader,
    }));

    return NextResponse.json(result);
}