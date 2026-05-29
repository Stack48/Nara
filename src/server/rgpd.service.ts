import { prisma } from "@/lib/prisma";
import { deleteFile } from "./s3.service";

// Export de toutes les données d'un utilisateur
export async function exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            ownedProjects: true,
            memberships: {
                include: { project: true },
            },
            lyrics: true,
            suggestions: true,
            lyricVersions: true,
            files: true,
            auditLogs: {
                orderBy: { createdAt: "desc" },
                take: 1000,
            },
            rgpdConsent: true,
        },
    });

    if (!user) throw new Error("Utilisateur introuvable");

    return {
        exportedAt: new Date().toISOString(),
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            createdAt: user.createdAt,
        },
        projects: user.ownedProjects,
        memberships: user.memberships,
        lyrics: user.lyrics,
        suggestions: user.suggestions,
        versions: user.lyricVersions,
        files: user.files.map((f) => ({
            id: f.id,
            name: f.originalName,
            mimeType: f.mimeType,
            size: f.size,
            createdAt: f.createdAt,
        })),
        auditLogs: user.auditLogs,
        rgpdConsent: user.rgpdConsent,
    };
}

// Suppression en cascade de toutes les données
export async function deleteUserData(userId: string) {
    // Récupère les fichiers S3 avant suppression
    const files = await prisma.file.findMany({
        where: { uploadedBy: userId },
    });

    // Supprime les fichiers S3
    await Promise.all(files.map((f) => deleteFile(f.s3Key).catch(console.error)));

    // Supprime l'utilisateur en cascade (Prisma gère le reste)
    await prisma.user.delete({ where: { id: userId } });

    return { success: true, deletedAt: new Date().toISOString() };
}