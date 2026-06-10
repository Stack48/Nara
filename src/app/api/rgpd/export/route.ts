import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exportUserData } from "@/server/rgpd.service";
import { unauthorized } from "@/middleware/rbac.middleware";
import { logAction } from "@/server/audit.service";
import { withErrorHandler } from "@/lib/api-middleware";

export let GET = withErrorHandler(async (request: NextRequest) => {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) return unauthorized();

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const data = await exportUserData(user.id);

    await logAction(user.id, "EXPORT_DATA", "user",
        request.headers.get("x-forwarded-for") ?? undefined
    );

    return NextResponse.json(data);
    });
