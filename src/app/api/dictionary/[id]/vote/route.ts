import { NextRequest, NextResponse } from "next/server";
import { DictionaryController } from "@/server/dictionary/controller";
import { handleError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const result = await DictionaryController.vote(params.id, body, cognitoId);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
