import { NextRequest, NextResponse } from "next/server";
import { DictionaryController } from "@/server/dictionary/controller";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/errors";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || undefined;
    const limit = searchParams.get("limit") || undefined;
    const status = searchParams.get("status") || "PENDING"; // File de modération par défaut sur PENDING
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || undefined;

    const result = await DictionaryController.findAll({
      page,
      limit,
      status,
      category,
      search,
      sortBy,
    });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
