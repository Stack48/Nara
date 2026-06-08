import { prisma } from "@/lib/prisma";
import { confirmForgotPassword } from "@/hooks/useAuth";

// Crée un token de reset et retourne le lien
export async function createPasswordResetToken(email: string): Promise<{ token: string } | { error: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "Aucun compte trouvé avec cet email." };

    // Invalide les anciens tokens
    await prisma.passwordResetRequest.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
    });

    // Expire dans 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const request = await prisma.passwordResetRequest.create({
        data: {
            userId: user.id,
            expiresAt,
        },
    });

    return { token: request.token };
}

// Vérifie le token et retourne l'email associé
export async function validateResetToken(token: string): Promise<{ email: string } | { error: string }> {
    const request = await prisma.passwordResetRequest.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!request) return { error: "Lien invalide." };
    if (request.used) return { error: "Ce lien a déjà été utilisé." };
    if (new Date() > request.expiresAt) return { error: "Ce lien a expiré. Demandes-en un nouveau." };

    return { email: request.user.email };
}

// Marque le token comme utilisé
export async function consumeResetToken(token: string): Promise<void> {
    await prisma.passwordResetRequest.update({
        where: { token },
        data: { used: true },
    });
}