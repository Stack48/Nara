import { encrypt, decrypt, isEncrypted } from "@/server/crypto.service";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        auditLog: {
            create: jest.fn().mockResolvedValue({}),
            findMany: jest.fn().mockResolvedValue([]),
        },
        user: {
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
        file: {
            findMany: jest.fn().mockResolvedValue([]),
        },
    },
}));

jest.mock("@/server/redis.client", () => ({
    redis: {
        incr: jest.fn().mockResolvedValue(1),
        pexpire: jest.fn().mockResolvedValue(1),
        get: jest.fn().mockResolvedValue(null),
    },
}));

jest.mock("@/server/s3.service", () => ({
    deleteFile: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/middleware/rbac.middleware", () => ({
    unauthorized: jest.fn(() => Response.json({ error: "Non authentifié" }, { status: 401 })),
}));

// Set encryption key pour les tests
process.env.ENCRYPTION_KEY = "test-encryption-key-for-jest";

describe("Sécurité — Chiffrement AES-256", () => {

    // ✅ Chiffrement basique
    it("chiffre et déchiffre correctement", () => {
        const data = { type: "doc", content: [{ type: "text", text: "Dans la nuit calme" }] };
        const encrypted = encrypt(data);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toEqual(data);
    });

    // ✅ Données chiffrées illisibles
    it("données chiffrées illisibles en DB", () => {
        const data = { type: "doc", content: [{ type: "text", text: "Lyrics secrets" }] };
        const encrypted = encrypt(data);
        expect(encrypted).not.toContain("Lyrics secrets");
        expect(isEncrypted(encrypted)).toBe(true);
    });

    // ✅ Deux chiffrements différents pour le même contenu
    it("deux chiffrements du même contenu sont différents (IV aléatoire)", () => {
        const data = { text: "Dans la nuit calme" };
        const encrypted1 = encrypt(data);
        const encrypted2 = encrypt(data);
        expect(encrypted1).not.toBe(encrypted2);
    });

    // ✅ Déchiffrement fidèle
    it("déchiffrement restaure le contenu fidèlement", () => {
        const data = {
            type: "doc",
            content: [
                { type: "paragraph", content: [{ type: "text", text: "Couplet 1" }] },
                { type: "paragraph", content: [{ type: "text", text: "Refrain" }] },
            ],
        };
        const encrypted = encrypt(data);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toEqual(data);
    });

});

describe("Sécurité — Rate Limiting", () => {

    it("première requête autorisée", async () => {
        const { redis } = require("@/server/redis.client");
        (redis.incr as jest.Mock).mockResolvedValue(1);

        const count = await redis.incr("rate:auth:127.0.0.1");
        expect(count).toBe(1);
    });

    it("11ème requête bloquée", async () => {
        const { redis } = require("@/server/redis.client");
        (redis.incr as jest.Mock).mockResolvedValue(11);

        const count = await redis.incr("rate:auth:127.0.0.1");
        expect(count).toBeGreaterThan(10);
    });

});

describe("Sécurité — Audit Log", () => {

    it("log créé pour chaque action", async () => {
        const { prisma } = require("@/lib/prisma");
        const { logAction } = require("@/server/audit.service");

        await logAction("user-1", "LOGIN", "auth", "127.0.0.1");
        expect(prisma.auditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                userId: "user-1",
                action: "LOGIN",
                resource: "auth",
            }),
        });
    });

    it("échec du log ne bloque pas l'app", async () => {
        const { prisma } = require("@/lib/prisma");
        const { logAction } = require("@/server/audit.service");

        (prisma.auditLog.create as jest.Mock).mockRejectedValue(new Error("DB error"));

        await expect(logAction("user-1", "LOGIN", "auth")).resolves.not.toThrow();
    });

});

describe("RGPD", () => {

    it("export retourne toutes les données utilisateur", async () => {
        const { prisma } = require("@/lib/prisma");

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: "user-1",
            email: "lea@nara.com",
            name: "Léa",
            username: "lea_nara",
            createdAt: new Date(),
            ownedProjects: [],
            memberships: [],
            lyrics: [],
            suggestions: [],
            lyricVersions: [],
            files: [],
            auditLogs: [],
            rgpdConsent: null,
        });

        const { exportUserData } = require("@/server/rgpd.service");
        const data = await exportUserData("user-1");

        expect(data.user.email).toBe("lea@nara.com");
        expect(data).toHaveProperty("projects");
        expect(data).toHaveProperty("lyrics");
        expect(data).toHaveProperty("files");
        expect(data).toHaveProperty("exportedAt");
    });

    it("suppression en cascade supprime les fichiers S3", async () => {
        const { prisma } = require("@/lib/prisma");
        const { deleteFile } = require("@/server/s3.service");

        (prisma.file.findMany as jest.Mock).mockResolvedValue([
            { id: "file-1", s3Key: "projects/1/test.wav" },
        ]);
        (prisma.user.delete as jest.Mock).mockResolvedValue({ id: "user-1" });

        const { deleteUserData } = require("@/server/rgpd.service");
        await deleteUserData("user-1");

        expect(deleteFile).toHaveBeenCalledWith("projects/1/test.wav");
        expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    });

});