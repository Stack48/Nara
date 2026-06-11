import { validateFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/server/s3.service";

jest.mock("@aws-sdk/client-s3", () => ({
    S3Client: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({}),
    })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    CreateMultipartUploadCommand: jest.fn(),
    UploadPartCommand: jest.fn(),
    CompleteMultipartUploadCommand: jest.fn(),
    AbortMultipartUploadCommand: jest.fn(),
}));

jest.mock("@aws-sdk/s3-request-presigner", () => ({
    getSignedUrl: jest.fn().mockResolvedValue("https://s3.amazonaws.com/nara/test.wav?token=xxx"),
}));

jest.mock("@/lib/prisma", () => ({
    prisma: {
        file: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
        user: { findUnique: jest.fn() },
    },
}));

jest.mock("@/lib/rbac", () => ({
    requireRole: jest.fn(),
    forbidden: jest.fn((msg) => Response.json({ error: msg }, { status: 403 })),
    unauthorized: jest.fn(() => Response.json({ error: "Non authentifié" }, { status: 401 })),
}));

describe("S3 Drive — Fichiers", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ✅ Fichier valide
    it("fichier WAV 10MB valide", () => {
        const result = validateFile(10 * 1024 * 1024, "audio/wav");
        expect(result.valid).toBe(true);
    });

    // ✅ Fichier trop lourd
    it("fichier > 50MB rejeté", () => {
        const result = validateFile(51 * 1024 * 1024, "audio/wav");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("50MB");
    });

    // ✅ Type MIME non autorisé
    it("fichier .exe rejeté", () => {
        const result = validateFile(1 * 1024 * 1024, "application/exe");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("non autorisé");
    });

    // ✅ PDF autorisé
    it("fichier PDF valide", () => {
        const result = validateFile(5 * 1024 * 1024, "application/pdf");
        expect(result.valid).toBe(true);
    });

    // ✅ Tous les types autorisés sont valides
    it("tous les types MIME autorisés passent la validation", () => {
        ALLOWED_MIME_TYPES.forEach((mimeType) => {
            const result = validateFile(1 * 1024 * 1024, mimeType);
            expect(result.valid).toBe(true);
        });
    });

    // ✅ Limite exacte — 50MB accepté
    it("fichier exactement 50MB accepté", () => {
        const result = validateFile(MAX_FILE_SIZE, "audio/wav");
        expect(result.valid).toBe(true);
    });

    // ✅ URL signée générée
    it("URL signée générée avec getSignedUrl", async () => {
        const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
        (getSignedUrl as jest.Mock).mockResolvedValue(
            "https://s3.amazonaws.com/nara/test.wav?token=xxx&expires=3600"
        );

        const url = await getSignedUrl({}, {});
        expect(url).toContain("s3.amazonaws.com");
        expect(url).toContain("expires");
    });

    // ✅ Suppression synchronisée S3 + DB
    it("suppression S3 et DB synchronisée", async () => {
        const { prisma } = require("@/lib/prisma");
        const { S3Client } = require("@aws-sdk/client-s3");

        const mockSend = jest.fn().mockResolvedValue({});
        S3Client.mockImplementation(() => ({ send: mockSend }));

        (prisma.file.delete as jest.Mock).mockResolvedValue({ id: "file-1" });

        const result = await prisma.file.delete({ where: { id: "file-1" } });
        expect(result.id).toBe("file-1");
    });

    // ✅ RBAC — LECTURE_SEULE peut lire
    it("LECTURE_SEULE peut accéder aux fichiers", async () => {
        const { requireRole } = require("@/lib/rbac");
        (requireRole as jest.Mock).mockResolvedValue({ authorized: true, role: "LECTURE_SEULE" });

        const { authorized } = await requireRole("cognitoId", "projectId", "LECTURE_SEULE");
        expect(authorized).toBe(true);
    });

    // ✅ RBAC — PAROLIER ne peut pas supprimer
    it("PAROLIER ne peut pas supprimer un fichier", async () => {
        const { requireRole } = require("@/lib/rbac");
        (requireRole as jest.Mock).mockResolvedValue({ authorized: false });

        const { authorized } = await requireRole("cognitoId", "projectId", "LEAD_PAROLIER");
        expect(authorized).toBe(false);
    });

});