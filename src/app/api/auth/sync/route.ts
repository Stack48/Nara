import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { cognitoId, email, name, username } = await request.json();

        const safeEmail = email || `${cognitoId}@nara.local`;
        const safeName = name || safeEmail.split('@')[0];
        const safeUsername = username || safeEmail.split('@')[0];

        if (!cognitoId) {
            return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
        }

        const user = await prisma.user.upsert({
            where: { cognitoId },
            update: { email: safeEmail, name: safeName, username: safeUsername },
            create: { cognitoId, email: safeEmail, name: safeName, username: safeUsername },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Sync user error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}