import { NextRequest, NextResponse } from "next/server";
import { getCognitoId, unauthorized, forbidden, requireRole } from "@/lib/rbac";
import { getProject, updateProject, deleteProject } from "@/server/projects/controller";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();
    const result = await getProject(cognitoId, id);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("GET project error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();
    const body = await request.json();
    const result = await updateProject(cognitoId, id, body);
    return NextResponse.json(result.data ?? result.error, { status: result.status });
  } catch (error) {
    console.error("PATCH project error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

    if (project.ownerId !== user.id) return forbidden("Seul le propriétaire peut supprimer définitivement ce projet");

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE project error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}