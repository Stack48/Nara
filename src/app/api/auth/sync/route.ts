import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { cognitoId, email, name, username } = await request.json();

        if (!cognitoId || !email) {
            return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
        }

        const user = await prisma.user.upsert({
            where: { cognitoId },
            update: { email, name, username },
            create: { cognitoId, email, name, username },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Sync user error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}