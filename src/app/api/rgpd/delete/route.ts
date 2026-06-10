import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteUserData } from "@/server/rgpd.service";
import { unauthorized } from "@/middleware/rbac.middleware";
import { logAction } from "@/server/audit.service";

export async function DELETE(request: NextRequest) {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    await logAction(user.id, "DELETE_ACCOUNT", "user",
        request.headers.get("x-forwarded-for") ?? undefined
    );

    const result = await deleteUserData(user.id);

    return NextResponse.json(result);
}