import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized } from "@/lib/rbac";
import { getProject, updateProject, deleteProject } from "@/server/projects/controller";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const result = await getProject(cognitoId, params.id);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("GET project error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const body = await request.json();
    const result = await updateProject(cognitoId, params.id, body);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("PATCH project error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const result = await deleteProject(cognitoId, params.id);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("DELETE project error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
