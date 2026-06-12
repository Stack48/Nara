import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/schemas/updateRole.schema";

const ROLE_HIERARCHY: Record<Role, number> = {
    ADMIN: 4,
    LEAD_LYRICIST: 3,
    LYRICIST: 2,
    READONLY: 1,
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ← exporté pour être réutilisé partout
export function getCognitoId(request: NextRequest): string | null {
    return request.headers.get("x-cognito-id");
}

export async function getProjectMember(cognitoId: string, projectId: string) {
    const user = await prisma.user.findUnique({
        where: { cognitoId },
        include: {
            memberships: {
                where: { projectId },
                take: 1, // ← évite user.memberships[0]
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

export async function requireRole(
    cognitoId: string,
    projectId: string,
    requiredRole: Role
): Promise<{ authorized: boolean; role?: Role; userId?: string }> {
    const user = await prisma.user.findUnique({
        where: { cognitoId },
        include: {
            memberships: {
                where: { projectId },
                take: 1, // ← évite user.memberships[0]
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

export function forbidden(message = "Accès refusé") {
    return NextResponse.json({ error: message }, { status: 403 });
}

export function unauthorized(message = "Non authentifié") {
    return NextResponse.json({ error: message }, { status: 401 });
}