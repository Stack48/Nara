// src/app/api/invitations/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { cancelInvitation } from "@/server/members/controller";

// DELETE /api/invitations/:id — annulation d'une invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { id } = await params;
    const result = await cancelInvitation(cognitoId, id);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("DELETE invitation error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}