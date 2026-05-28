import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "@/middleware/rbac.middleware";
import { z } from "zod";

const createProjectSchema = z.object({
    name: z.string().min(1, "Le nom est requis").max(100),
    description: z.string().optional(),
    genre: z.string().optional(),
});

function getCognitoId(request: NextRequest): string | null {
    return request.headers.get("x-cognito-id");
}

// GET /api/projects — liste les projets de l'utilisateur
export async function GET(request: NextRequest) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const user = await prisma.user.findUnique({
        where: { cognitoId },
    });

    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { ownerId: user.id },
                { members: { some: { userId: user.id } } },
            ],
        },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
}

// POST /api/projects — crée un projet
export async function POST(request: NextRequest) {
    const cognitoId = getCognitoId(request);
    if (!cognitoId) return unauthorized();

    const user = await prisma.user.findUnique({
        where: { cognitoId },
    });

    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const project = await prisma.project.create({
        data: {
            ...parsed.data,
            ownerId: user.id,
            members: {
                create: {
                    userId: user.id,
                    role: "ADMIN",
                },
            },
        },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            members: true,
        },
    });

    return NextResponse.json(project, { status: 201 });
}