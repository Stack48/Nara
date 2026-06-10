import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, validateResetToken, consumeResetToken } from "@/server/auth/password-reset.service";
import { confirmForgotPassword } from "@/hooks/useAuth";
import { withErrorHandler } from "@/lib/api-middleware";

// POST — demande de reset (génère le token)
// PATCH — confirme le nouveau mot de passe
export let POST = withErrorHandler(async (request: NextRequest) => {
    try {
            const { email } = await request.json();
            if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

            const result = await createPasswordResetToken(email);

            if ("error" in result) {
                return NextResponse.json({ error: result.error }, { status: 404 });
            }


            return NextResponse.json({ success: true });
        } catch (error) {
      throw error;
    }
    });
export let PATCH = withErrorHandler(async (request: NextRequest) => {
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
      throw error;
    }
    });
