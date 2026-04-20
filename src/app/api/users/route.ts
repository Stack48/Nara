import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
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
    const user = await prisma.user.create({ data: { email, name } });
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
  }
}
