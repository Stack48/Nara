import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
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

        const lyrics = await prisma.lyrics.findUnique({ where: { id } });
        if (!lyrics) return NextResponse.json({ error: "Song introuvable" }, { status: 404 });

        const updated = await prisma.lyrics.update({
            where: { id },
            data: {
                isDeleted: !lyrics.isDeleted,
                deletedAt: !lyrics.isDeleted ? new Date() : null,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH song delete error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}