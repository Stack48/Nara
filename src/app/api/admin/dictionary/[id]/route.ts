import { NextRequest, NextResponse } from "next/server";
import { DictionaryController } from "@/server/dictionary/controller";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/errors";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const isAdmin = user.email === "lea@nara.com" || user.cognitoId === "cognito-lea-001";
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const result = await DictionaryController.update(params.id, body, cognitoId);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
