import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, forbidden, unauthorized } from "@/lib/rbac";

const ROLE_REQUIRED = "LEAD_LYRICIST";

type FileAction = (fileId: string) => Promise<unknown>;

/**
 * Boilerplate commun aux actions corbeille : auth, lookup du fichier,
 * vérification du rôle sur le projet, gestion d'erreur.
 * Chaque route ne fournit que sa fonction métier et son message d'erreur.
 */
export function createFileActionHandler(
    action: FileAction,
    opts: { label: string; forbiddenMessage: string }
) {
    return async function handler(
        request: NextRequest,
        { params }: { params: Promise<{ id: string }> }   // ← Promise
    ) {
        try {
            const { id } = await params;                    // ← await
            const cognitoId = request.headers.get("x-cognito-id");
            if (!cognitoId) return unauthorized();

            const file = await prisma.file.findUnique({ where: { id } });
            if (!file) {
                return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
            }

            const { authorized } = await requireRole(cognitoId, file.projectId, ROLE_REQUIRED);
            if (!authorized) return forbidden(opts.forbiddenMessage);

            const result = await action(file.id);
            return NextResponse.json({ success: true, file: result });
        } catch (error) {
            console.error(`[${opts.label}] error:`, error);
            return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
        }
    };
}