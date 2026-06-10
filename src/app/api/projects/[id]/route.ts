import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { getProject, updateProject, deleteProject } from "@/server/projects/controller";
import { withErrorHandler } from "@/lib/api-middleware";

export let GET = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const result = await getProject(cognitoId, params.id);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
      } catch (error) {
      throw error;
    }
    });
export let PATCH = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const body = await request.json();
        const result = await updateProject(cognitoId, params.id, body);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
      } catch (error) {
      throw error;
    }
    });
export let DELETE = withErrorHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const result = await deleteProject(cognitoId, params.id);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
      } catch (error) {
      throw error;
    }
    });
