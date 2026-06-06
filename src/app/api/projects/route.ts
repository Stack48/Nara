import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { getProjects, createProject } from "@/server/projects/controller";

export async function GET(request: NextRequest) {
  try {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const result = await getProjects(cognitoId);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("GET projects error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const body = await request.json();
    const result = await createProject(cognitoId, body);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("POST projects error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}