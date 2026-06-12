import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        return NextResponse.json(user);
    } catch (error) {
        console.error("GET me error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const user = await prisma.user.findUnique({ where: { cognitoId } });
        if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

        const body = await request.json();
        const { name, username } = body;

        const updated = await prisma.user.update({
            where: { cognitoId },
            data: {
                ...(name !== undefined && { name }),
                ...(username !== undefined && { username }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH me error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}