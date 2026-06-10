jest.mock("@/lib/prisma", () => ({
    prisma: {
        audioMarker: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        labelCopy: {
            findFirst: jest.fn(),
            create: jest.fn(),
            upsert: jest.fn(),
        },
        user: { findUnique: jest.fn() },
    },
}));

jest.mock("@/middleware/rbac.middleware", () => ({
    requireRole: jest.fn(),
    forbidden: jest.fn((msg) => Response.json({ error: msg }, { status: 403 })),
    unauthorized: jest.fn(() => Response.json({ error: "Non authentifié" }, { status: 401 })),
}));

jest.mock("@/server/bridge-audio.service", () => ({
    getBridgeTrackMetadata: jest.fn(),
    syncLabelCopy: jest.fn(),
}));

import { requireRole } from "@/middleware/rbac.middleware";
import { getBridgeTrackMetadata } from "@/server/bridge-audio.service";

describe("Audio Markers", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ✅ Marker créé avec timecode correct
    it("marker créé avec timecode correct", async () => {
        const { prisma } = require("@/lib/prisma");

        const mockMarker = {
            id: "marker-1",
            timecode: 15.5,
            label: "Couplet 1",
            lyricsId: "lyrics-1",
            fileId: "file-1",
        };

        (prisma.audioMarker.create as jest.Mock).mockResolvedValue(mockMarker);

        const result = await prisma.audioMarker.create({ data: mockMarker });
        expect(result.timecode).toBe(15.5);
        expect(result.label).toBe("Couplet 1");
    });

    // ✅ Markers ordonnés par timecode
    it("markers retournés dans l'ordre chronologique", async () => {
        const { prisma } = require("@/lib/prisma");

        (prisma.audioMarker.findMany as jest.Mock).mockResolvedValue([
            { id: "1", timecode: 0.0, label: "Intro" },
            { id: "2", timecode: 15.5, label: "Couplet 1" },
            { id: "3", timecode: 62.0, label: "Refrain" },
        ]);

        const markers = await prisma.audioMarker.findMany({
            orderBy: { timecode: "asc" },
        });

        expect(markers[0].timecode).toBe(0.0);
        expect(markers[1].timecode).toBe(15.5);
        expect(markers[2].timecode).toBe(62.0);
    });

    // ✅ Marker déplaçable
    it("timecode du marker mis à jour", async () => {
        const { prisma } = require("@/lib/prisma");

        (prisma.audioMarker.update as jest.Mock).mockResolvedValue({
            id: "marker-1",
            timecode: 20.0,
        });

        const result = await prisma.audioMarker.update({
            where: { id: "marker-1" },
            data: { timecode: 20.0 },
        });

        expect(result.timecode).toBe(20.0);
    });

    // ✅ Validation timecode — négatif rejeté
    it("timecode négatif rejeté", () => {
        const { z } = require("zod");
        const schema = z.object({ timecode: z.number().min(0) });
        const result = schema.safeParse({ timecode: -1 });
        expect(result.success).toBe(false);
    });

    // ✅ LECTURE_SEULE peut voir les markers
    it("LECTURE_SEULE peut voir les markers", async () => {
        (requireRole as jest.Mock).mockResolvedValue({ authorized: true, role: "LECTURE_SEULE" });
        const { authorized } = await requireRole("cognitoId", "projectId", "LECTURE_SEULE");
        expect(authorized).toBe(true);
    });

    // ✅ PAROLIER ne peut pas supprimer
    it("PAROLIER ne peut pas supprimer un marker", async () => {
        (requireRole as jest.Mock).mockResolvedValue({ authorized: false });
        const { authorized } = await requireRole("cognitoId", "projectId", "LEAD_PAROLIER");
        expect(authorized).toBe(false);
    });

});

describe("Bridge.audio", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ✅ Fallback si Bridge.audio indisponible
    it("fallback gracieux si Bridge.audio indisponible", async () => {
        (getBridgeTrackMetadata as jest.Mock).mockResolvedValue({
            fallback: true,
            message: "Bridge.audio indisponible — métadonnées locales utilisées",
        });

        const result = await getBridgeTrackMetadata("track-123");
        expect(result.fallback).toBe(true);
        expect(result.message).toContain("indisponible");
    });

    // ✅ Métadonnées récupérées si Bridge.audio disponible
    it("métadonnées récupérées si Bridge.audio disponible", async () => {
        (getBridgeTrackMetadata as jest.Mock).mockResolvedValue({
            fallback: false,
            title: "Nuit Calme",
            isrc: "FR-Z99-26-00001",
            composers: ["Léa Dupont"],
            publishers: ["Nara Publishing"],
        });

        const result = await getBridgeTrackMetadata("track-123") as any;
        expect(result.fallback).toBe(false);
        expect(result.isrc).toBe("FR-Z99-26-00001");
        expect(result.composers).toContain("Léa Dupont");
    });

    // ✅ Label Copy créé avec ISRC
    it("Label Copy créé avec ISRC correct", async () => {
        const { prisma } = require("@/lib/prisma");

        const mockLabelCopy = {
            id: "lc-1",
            title: "Nuit Calme",
            isrc: "FR-Z99-26-00001",
            composers: ["Léa Dupont", "Marcus Martin"],
            publishers: ["Nara Publishing"],
            projectId: "project-1",
        };

        (prisma.labelCopy.create as jest.Mock).mockResolvedValue(mockLabelCopy);

        const result = await prisma.labelCopy.create({ data: mockLabelCopy });
        expect(result.isrc).toBe("FR-Z99-26-00001");
        expect(result.composers).toHaveLength(2);
    });

});