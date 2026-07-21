import { NextRequest, NextResponse } from "next/server";
import { getMembers, addMember } from "@/server/members/controller";
import { unauthorized } from "@/lib/rbac";

function getCognitoId(request: NextRequest): string | null {
  return request.headers.get("x-cognito-id");
}

// GET /api/projects/:id/members — liste les membres du projet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const result = await getMembers(cognitoId, id);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("GET members error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/projects/:id/members — invite un membre
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const body = await request.json();
    const result = await addMember(cognitoId, id, body);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("POST member error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}