import { prisma } from "@/lib/prisma";

export type AuditAction =
    | "LOGIN"
    | "LOGOUT"
    | "CREATE_PROJECT"
    | "UPDATE_PROJECT"
    | "DELETE_PROJECT"
    | "CREATE_LYRICS"
    | "UPDATE_LYRICS"
    | "DELETE_LYRICS"
    | "UPLOAD_FILE"
    | "DELETE_FILE"
    | "CHANGE_ROLE"
    | "REVOKE_MEMBER"
    | "EXPORT_DATA"
    | "DELETE_ACCOUNT"
    | "VIEW_LYRICS";

export async function logAction(
    userId: string,
    action: AuditAction,
    resource: string,
    ipAddress?: string,
    userAgent?: string
) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                ipAddress,
                userAgent,
            },
        });
    } catch (error) {
        // Ne bloque jamais l'app si le log échoue
        console.error("Audit log failed:", error);
    }
}

export async function getUserAuditLogs(userId: string) {
    return await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
}