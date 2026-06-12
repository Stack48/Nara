import { NextRequest, NextResponse } from "next/server";
import { DictionaryController } from "@/server/dictionary/controller";
import { handleError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || undefined;
    const limit = searchParams.get("limit") || undefined;
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await DictionaryController.findAll({
      page,
      limit,
      status,
      category,
      search,
    });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const cognitoId = request.headers.get("x-cognito-id");
    if (!cognitoId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const result = await DictionaryController.create(body, cognitoId);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
