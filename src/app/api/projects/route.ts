import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { getProjects, createProject } from "@/server/projects/controller";
import { withErrorHandler } from "@/lib/api-middleware";

export let GET = withErrorHandler(async (request: NextRequest) => {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const result = await getProjects(cognitoId);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
      } catch (error) {
      throw error;
    }
    });
export let POST = withErrorHandler(async (request: NextRequest) => {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const body = await request.json();
        const result = await createProject(cognitoId, body);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
      } catch (error) {
      throw error;
    }
    });
