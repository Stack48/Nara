import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { cognitoId, email, name, username } = await request.json();

        const safeEmail = email || `${cognitoId}@nara.local`;
        const safeName = name || safeEmail.split('@')[0];
        const safeUsername = username || `user_${cognitoId.slice(0, 8)}`;

        if (!cognitoId) {
            return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
        }

        // Cherche d'abord par email si le cognitoId existe pas
        let user = await prisma.user.findUnique({ where: { cognitoId } });

        if (!user) {
            // Essaie de trouver par email et mettre à jour le cognitoId
            user = await prisma.user.findUnique({ where: { email: safeEmail } });
            if (user) {
                user = await prisma.user.update({
                    where: { email: safeEmail },
                    data: { 
                        cognitoId, 
                        ...(user.name ? {} : { name: safeName }),
                        ...(user.username ? {} : { username: safeUsername })
                    },
                });
            } else {
                user = await prisma.user.create({
                    data: { cognitoId, email: safeEmail, name: safeName, username: safeUsername },
                });
            }
        } else {
            user = await prisma.user.update({
                where: { cognitoId },
                data: { 
                    email: safeEmail,
                    ...(user.name ? {} : { name: safeName }),
                    ...(user.username ? {} : { username: safeUsername })
                },
            });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Sync user error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}