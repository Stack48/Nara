// src/app/api/projects/[id]/invitations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { getInvitations } from "@/server/members/controller";

// GET /api/projects/:id/invitations — invitations en attente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const { id } = await params;
    const result = await getInvitations(cognitoId, id);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("GET invitations error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}