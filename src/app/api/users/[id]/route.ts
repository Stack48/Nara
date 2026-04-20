import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name =
    typeof body.name === "string" && body.name.trim() !== ""
      ? body.name.trim()
      : null;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { email, name },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Mise à jour impossible (email déjà utilisé ?)" },
      { status: 409 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
}
