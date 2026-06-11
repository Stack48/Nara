import { NextRequest, NextResponse } from "next/server";
import { DictionaryController } from "@/server/dictionary/controller";
import { handleError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await DictionaryController.findById(params.id);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const result = await DictionaryController.update(params.id, body, cognitoId);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
