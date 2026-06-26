// src/app/api/files/[id]/restore/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/lib/rbac";
import { restoreFile } from "@/server/trash.service";

const ROLE_REQUIRED = "LEAD_PAROLIER";

// POST /api/files/:id/restore — restaure un fichier depuis la corbeille
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    const file = await prisma.file.findUnique({ where: { id: params.id } });
    if (!file) {
        return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
    }

    const { authorized } = await requireRole(cognitoId, file.projectId, ROLE_REQUIRED);
    if (!authorized) return forbidden("Droits insuffisants pour restaurer ce fichier");

    const updated = await restoreFile(file.id);
    return NextResponse.json({ success: true, file: updated });
}