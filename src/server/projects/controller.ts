import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createProjectSchema, updateProjectSchema } from "@/schemas/project.schema";

// GET — liste les projets de l'utilisateur
export async function getProjects(cognitoId: string) {
    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return { error: "Utilisateur introuvable", status: 404 };

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

    return { data: projects, status: 200 };
}

// POST — crée un projet
export async function createProject(cognitoId: string, body: unknown) {
    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return { error: "Utilisateur introuvable", status: 404 };

    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.flatten(), status: 400 };

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

    return { data: project, status: 201 };
}

// GET — récupère un projet
export async function getProject(cognitoId: string, projectId: string) {
    const { authorized } = await requireRole(cognitoId, projectId, "READONLY");
    if (!authorized) return { error: "Accès refusé", status: 403 };

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            owner: { select: { id: true, name: true, email: true } },
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            },
        },
    });

    if (!project) return { error: "Projet introuvable", status: 404 };

    return { data: project, status: 200 };
}

// PATCH — modifie un projet
export async function updateProject(
    cognitoId: string,
    projectId: string,
    body: unknown
) {
    const { authorized, role } = await requireRole(cognitoId, projectId, "LEAD_LYRICIST");
    if (!authorized) return { error: "Seul un Lead Lyricist ou Admin peut modifier le projet", status: 403 };

    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.flatten(), status: 400 };

    // Seul un Admin peut changer le statut
    if (parsed.data.status !== undefined && role !== "ADMIN") {
        return { error: "Seul un Admin peut changer le statut du projet", status: 403 };
    }

    const project = await prisma.project.update({
        where: { id: projectId },
        data: parsed.data,
    });

    return { data: project, status: 200 };
}

// DELETE — supprime un projet (propriétaire uniquement)
export async function deleteProject(cognitoId: string, projectId: string) {
    const user = await prisma.user.findUnique({ where: { cognitoId } });
    if (!user) return { error: "Utilisateur introuvable", status: 404 };

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: "Projet introuvable", status: 404 };

    // Seul le propriétaire peut supprimer
    if (project.ownerId !== user.id) {
        return { error: "Seul le propriétaire peut supprimer ce projet", status: 403 };
    }

    await prisma.project.delete({ where: { id: projectId } });

    return { data: { success: true }, status: 200 };
}