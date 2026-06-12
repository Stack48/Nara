import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { getProject, updateProject, deleteProject } from "@/server/projects/controller";
import { withErrorHandler } from "@/lib/api-middleware";

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const cognitoId = getCognitoId(request);
  if (!cognitoId) return unauthorized();
  const { id } = await params;
  const result = await getProject(cognitoId, id);
  return NextResponse.json(result.data ?? result.error, { status: result.status });
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const cognitoId = getCognitoId(request);
  if (!cognitoId) return unauthorized();
  const { id } = await params;
  const body = await request.json();
  const result = await updateProject(cognitoId, id, body);
  return NextResponse.json(result.data ?? result.error, { status: result.status });
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const cognitoId = getCognitoId(request);
  if (!cognitoId) return unauthorized();
  const { id } = await params;
  const result = await deleteProject(cognitoId, id);
  return NextResponse.json(result.data ?? result.error, { status: result.status });
});