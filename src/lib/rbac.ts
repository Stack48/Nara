import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { Role } from "@/schemas/updateRole.schema";

// Hiérarchie des rôles
const ROLE_HIERARCHY: Record<Role, number> = {
    ADMIN: 4,
    LEAD_LYRICIST: 3,
    LYRICIST: 2,
    READONLY: 1,
};

// Vérifie si un rôle a les permissions suffisantes
export function hasPermission(userRole: Role, requiredRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Récupère le membre d'un projet avec son rôle
export async function getProjectMember(
    cognitoId: string,
    projectId: string
) {
    const user = await prisma.user.findUnique({
        where: { cognitoId },
        include: {
            memberships: {
                where: { projectId },
            },
        },
    });

    if (!user || user.memberships.length === 0) return null;

    return {
        user,
        role: user.memberships[0].role as Role,
        membership: user.memberships[0],
    };
}

// Middleware RBAC — vérifie le rôle sur un projet
export async function requireRole(
    cognitoId: string,
    projectId: string,
    requiredRole: Role
): Promise<{ authorized: boolean; role?: Role; userId?: string }> {

    // Admin global → accès partout
    const user = await prisma.user.findUnique({
        where: { cognitoId },
        include: {
            memberships: {
                where: { projectId },
            },
        },
    });

    if (!user) return { authorized: false };

    const membership = user.memberships[0];
    if (!membership) return { authorized: false };

    const role = membership.role as Role;
    const authorized = hasPermission(role, requiredRole);

    return { authorized, role, userId: user.id };
}

// Helper — retourne une réponse 403
export function forbidden(message = "Accès refusé") {
    return NextResponse.json({ error: message }, { status: 403 });
}

// Helper — retourne une réponse 401
export function unauthorized(message = "Non authentifié") {
    return NextResponse.json({ error: message }, { status: 401 });
}