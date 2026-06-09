import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized, requireRole, forbidden } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const { authorized } = await requireRole(cognitoId, id, "ADMIN");
        if (!authorized) return forbidden("Seul un Admin peut supprimer un projet");

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

        const updated = await prisma.project.update({
            where: { id },
            data: {
                isDeleted: !project.isDeleted,
                deletedAt: !project.isDeleted ? new Date() : null,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH project delete error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}