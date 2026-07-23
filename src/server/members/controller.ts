import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { addMemberSchema } from "@/schemas/projectMember.schema";
import { updateRoleSchema } from "@/schemas/updateRole.schema";

// GET — liste les membres d'un projet
export async function getMembers(cognitoId: string, projectId: string) {
    const { authorized } = await requireRole(cognitoId, projectId, "READONLY");
    if (!authorized) return { error: "Accès refusé", status: 403 };

    const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: {
            user: { select: { id: true, email: true, name: true, username: true } },
        },
    });

    return { data: members, status: 200 };
}

// POST — invite un membre
export async function addMember(
    cognitoId: string,
    projectId: string,
    body: unknown
) {
    const { authorized, userId } = await requireRole(cognitoId, projectId, "LEAD_LYRICIST");
    if (!authorized) return { error: "Seul un Lead Lyricist ou Admin peut inviter des membres", status: 403 };

    const parsed = addMemberSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.flatten(), status: 400 };

    const { email, role } = parsed.data;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: "Projet introuvable", status: 404 };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
        data: {
            email,
            role,
            projectId,
            invitedBy: userId!,
            expiresAt,
        },
    });

    return { data: invitation, status: 201 };
}

// PATCH — change le rôle d'un membre
export async function updateMemberRole(
    cognitoId: string,
    projectId: string,
    memberId: string,
    body: unknown
) {
    const { authorized } = await requireRole(cognitoId, projectId, "ADMIN");
    if (!authorized) return { error: "Seul un Admin peut modifier les rôles", status: 403 };

    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.flatten(), status: 400 };

    const updated = await prisma.projectMember.update({
        where: {
            id: memberId,
            projectId,
        },
        data: { role: parsed.data.role },
    });

    return { data: updated, status: 200 };
}

// DELETE — révoque un membre
export async function removeMember(
    cognitoId: string,
    projectId: string,
    memberId: string
) {
    const { authorized } = await requireRole(cognitoId, projectId, "ADMIN");
    if (!authorized) return { error: "Seul un Admin peut révoquer un membre", status: 403 };

    await prisma.projectMember.delete({
        where: {
            id: memberId,
            projectId,
        },
    });

    return { data: { success: true }, status: 200 };
}

// GET — liste les invitations en attente d'un projet
export async function getInvitations(cognitoId: string, projectId: string) {
    const { authorized } = await requireRole(cognitoId, projectId, "LEAD_LYRICIST");
    if (!authorized) return { error: "Accès refusé", status: 403 };

    const invitations = await prisma.invitation.findMany({
        where: {
            projectId,
            accepted: false,
            expiresAt: { gt: new Date() },
        },
        select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            expiresAt: true,
            inviter: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return { data: invitations, status: 200 };
}

// DELETE — annule une invitation en attente
export async function cancelInvitation(cognitoId: string, invitationId: string) {
    // L'URL ne contient pas le projectId : on le retrouve via l'invitation
    const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
    });

    if (!invitation) return { error: "Invitation introuvable", status: 404 };

    const { authorized } = await requireRole(
        cognitoId,
        invitation.projectId,
        "LEAD_LYRICIST"
    );
    if (!authorized) {
        return {
            error: "Seul un Lead Lyricist ou Admin peut annuler une invitation",
            status: 403,
        };
    }

    if (invitation.accepted) {
        return { error: "Invitation déjà acceptée", status: 409 };
    }

    await prisma.invitation.delete({ where: { id: invitationId } });

    return { data: { success: true }, status: 200 };
}