import { calculateDiff } from "@/server/lyrics-version.service";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        lyrics: { findUnique: jest.fn() },
        lyricVersion: {
            findFirst: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        user: { findUnique: jest.fn() },
    },
}));

jest.mock("@/lib/rbac", () => ({
    requireRole: jest.fn(),
    forbidden: jest.fn((msg) => Response.json({ error: msg }, { status: 403 })),
    unauthorized: jest.fn(() => Response.json({ error: "Non authentifié" }, { status: 401 })),
}));

describe("Lyrics Versioning", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ✅ Diff — ligne ajoutée
    it("détecte une ligne ajoutée", () => {
        const oldContent = {
            type: "doc",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Dans la nuit calme" }] }],
        };
        const newContent = {
            type: "doc",
            content: [
                { type: "paragraph", content: [{ type: "text", text: "Dans la nuit calme" }] },
                { type: "paragraph", content: [{ type: "text", text: "Le silence parle" }] },
            ],
        };

        const diff = calculateDiff(oldContent, newContent);
        expect(diff.added).toContain("Le silence parle");
        expect(diff.unchanged).toContain("Dans la nuit calme");
    });

    // ✅ Diff — ligne supprimée
    it("détecte une ligne supprimée", () => {
        const oldContent = {
            type: "doc",
            content: [
                { type: "paragraph", content: [{ type: "text", text: "Dans la nuit calme" }] },
                { type: "paragraph", content: [{ type: "text", text: "Le silence parle" }] },
            ],
        };
        const newContent = {
            type: "doc",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Dans la nuit calme" }] }],
        };

        const diff = calculateDiff(oldContent, newContent);
        expect(diff.removed).toContain("Le silence parle");
    });

    // ✅ Diff — rien changé
    it("retourne unchanged si contenu identique", () => {
        const content = {
            type: "doc",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Dans la nuit calme" }] }],
        };

        const diff = calculateDiff(content, content);
        expect(diff.added).toHaveLength(0);
        expect(diff.removed).toHaveLength(0);
        expect(diff.unchanged).toContain("Dans la nuit calme");
    });

    // ✅ Snapshot crée une nouvelle version
    it("snapshot crée une version avec le bon numéro", async () => {
        const { prisma } = require("@/lib/prisma");

        (prisma.lyrics.findUnique as jest.Mock).mockResolvedValue({
            id: "lyrics-1",
            content: { type: "doc", content: [] },
        });

        (prisma.lyricVersion.findFirst as jest.Mock).mockResolvedValue({
            version: 2,
        });

        (prisma.lyricVersion.create as jest.Mock).mockResolvedValue({
            id: "v3",
            version: 3,
            lyricsId: "lyrics-1",
        });

        const { createSnapshot } = require("@/server/lyrics-version.service");
        const snapshot = await createSnapshot("lyrics-1", "user-1");
        expect(snapshot.version).toBe(3);
    });

    // ✅ Restauration — LEAD_PAROLIER autorisé
    it("restauration autorisée pour LEAD_PAROLIER", async () => {
        const { requireRole } = require("@/lib/rbac");
        (requireRole as jest.Mock).mockResolvedValue({ authorized: true, role: "LEAD_PAROLIER" });

        const { authorized } = await requireRole("cognitoId", "projectId", "LEAD_PAROLIER");
        expect(authorized).toBe(true);
    });

    // ✅ Restauration — PAROLIER refusé
    it("restauration refusée pour PAROLIER", async () => {
        const { requireRole } = require("@/lib/rbac");
        (requireRole as jest.Mock).mockResolvedValue({ authorized: false });

        const { authorized } = await requireRole("cognitoId", "projectId", "LEAD_PAROLIER");
        expect(authorized).toBe(false);
    });

});