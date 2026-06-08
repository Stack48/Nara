import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, validateResetToken, consumeResetToken } from "@/server/auth/passwordResetService";
import { confirmForgotPassword } from "@/hooks/useAuth";

// POST — demande de reset (génère le token)
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

        const result = await createPasswordResetToken(email);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 404 });
        }


        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// PATCH — confirme le nouveau mot de passe
export async function PATCH(request: NextRequest) {
    try {
        const { token, newPassword } = await request.json();
        if (!token || !newPassword) {
            return NextResponse.json({ error: "Token et mot de passe requis" }, { status: 400 });
        }

        const result = await validateResetToken(token);
        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Utilise Cognito pour changer le mot de passe
        await confirmForgotPassword(result.email, token, newPassword);
        await consumeResetToken(token);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Confirm reset error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}