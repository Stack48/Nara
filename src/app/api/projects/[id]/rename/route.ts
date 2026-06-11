import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized, forbidden } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

        if (project.ownerId !== user.id) return forbidden("Seul le propriétaire peut renommer ce projet");

        const body = await request.json();
        if (!body.name?.trim()) return NextResponse.json({ error: "Nom manquant" }, { status: 400 });

        const updated = await prisma.project.update({
            where: { id },
            data: { name: body.name.trim() },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH rename error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}