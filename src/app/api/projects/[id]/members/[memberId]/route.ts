import { NextRequest, NextResponse } from "next/server";
import { updateMemberRole, removeMember } from "@/server/members/controller";
import { unauthorized } from "@/lib/rbac";

function getCognitoId(request: NextRequest): string | null {
  return request.headers.get("x-cognito-id");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const body = await request.json();
    const result = await updateMemberRole(cognitoId, params.id, params.memberId, body);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("PATCH member error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const result = await removeMember(cognitoId, params.id, params.memberId);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("DELETE member error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}