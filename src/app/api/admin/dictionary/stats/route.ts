import { NextRequest, NextResponse } from "next/server";
import { DictionaryController } from "@/server/dictionary/controller";
import { handleError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const result = await DictionaryController.getAdminStats(cognitoId);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
