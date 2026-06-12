import { NextRequest, NextResponse } from "next/server";
import { updateMemberRole, removeMember } from "@/server/members/controller";
import { unauthorized } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/api-middleware";

function getCognitoId(request: NextRequest): string | null {
  return request.headers.get("x-cognito-id");
}

export let PATCH = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) => {
    try {
        const { id, memberId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const body = await request.json();
        const result = await updateMemberRole(cognitoId, id, memberId, body);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
      } catch (error) {
      throw error;
    }
    });
export let DELETE = withErrorHandler(async (request: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) => {
    try {
        const { id, memberId } = await params;
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const result = await removeMember(cognitoId, id, memberId);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
      } catch (error) {
      throw error;
    }
    });
