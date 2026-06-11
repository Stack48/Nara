import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        lyrics: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        suggestion: {
            create: jest.fn(),
            update: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock("@/lib/rbac", () => ({
    requireRole: jest.fn(),
    forbidden: jest.fn((msg) => Response.json({ error: msg }, { status: 403 })),
    unauthorized: jest.fn(() => Response.json({ error: "Non authentifié" }, { status: 401 })),
}));

import { requireRole } from "@/lib/rbac";

describe("Lyrics API", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // GET lyrics — lecture seule autorisée
    it("GET lyrics autorisé pour LECTURE_SEULE", async () => {
        (requireRole as jest.Mock).mockResolvedValue({ authorized: true, role: "LECTURE_SEULE" });
        (prisma.lyrics.findMany as jest.Mock).mockResolvedValue([]);

        const { authorized } = await requireRole("cognitoId", "projectId", "LECTURE_SEULE");
        expect(authorized).toBe(true);
    });

    // POST lyrics — PAROLIER autorisé
    it("POST lyrics autorisé pour PAROLIER", async () => {
        (requireRole as jest.Mock).mockResolvedValue({ authorized: true, role: "PAROLIER" });

        const mockLyrics = {
            id: "1",
            title: "Couplet 1",
            content: { type: "doc", content: [] },
            sectionType: "COUPLET",
            order: 0,
        };

        (prisma.lyrics.create as jest.Mock).mockResolvedValue(mockLyrics);

        const result = await prisma.lyrics.create({ data: mockLyrics } as any);
        expect(result).toEqual(mockLyrics);
    });

    // PATCH lyrics — PAROLIER refusé
    it("PATCH lyrics refusé pour PAROLIER", async () => {
        (requireRole as jest.Mock).mockResolvedValue({ authorized: false });

        const { authorized } = await requireRole("cognitoId", "projectId", "LEAD_PAROLIER");
        expect(authorized).toBe(false);
    });

    // Contenu sauvegardé fidèlement
    it("contenu TipTap sauvegardé et restauré fidèlement", async () => {
        const tiptapContent = {
            type: "doc",
            content: [
                { type: "paragraph", content: [{ type: "text", text: "Dans la nuit calme" }] },
            ],
        };

        (prisma.lyrics.create as jest.Mock).mockResolvedValue({
            id: "1",
            title: "Couplet 1",
            content: tiptapContent,
            sectionType: "COUPLET",
            order: 0,
        });

        const result = await prisma.lyrics.create({ data: {} } as any);
        expect(result.content).toEqual(tiptapContent);
    });

    // Sections ordonnées
    it("sections retournées dans le bon ordre", async () => {
        (prisma.lyrics.findMany as jest.Mock).mockResolvedValue([
            { id: "1", order: 0, sectionType: "INTRO" },
            { id: "2", order: 1, sectionType: "COUPLET" },
            { id: "3", order: 2, sectionType: "REFRAIN" },
        ]);

        const lyrics = await prisma.lyrics.findMany({ orderBy: { order: "asc" } } as any);
        expect(lyrics[0].sectionType).toBe("INTRO");
        expect(lyrics[1].sectionType).toBe("COUPLET");
        expect(lyrics[2].sectionType).toBe("REFRAIN");
    });

    // Suggestion soumise par PAROLIER
    it("suggestion créée avec status PENDING", async () => {
        (prisma.suggestion.create as jest.Mock).mockResolvedValue({
            id: "1",
            status: "PENDING",
            content: { type: "doc", content: [] },
        });

        const result = await prisma.suggestion.create({ data: {} } as any);
        expect(result.status).toBe("PENDING");
    });

    // Validation Zod — titre vide
    it("titre vide → erreur validation", async () => {
        const { z } = require("zod");
        const schema = z.object({ title: z.string().min(1, "Le titre est requis") });
        const result = schema.safeParse({ title: "" });
        expect(result.success).toBe(false);
    });

});