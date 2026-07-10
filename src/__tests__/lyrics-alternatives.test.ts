import {
    generateAlternativesSchema,
    communityAlternativeSchema,
} from "@/schemas/alternatives.schema";
import { updateChordsSchema } from "@/schemas/chords.schema";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: { findUnique: jest.fn() },
        lyrics: { findUnique: jest.fn() },
    },
}));

jest.mock("@/lib/rbac", () => ({
    requireRole: jest.fn(),
}));

jest.mock("@/server/redis.client", () => ({
    redis: { incr: jest.fn(), pexpire: jest.fn() },
}));

describe("Lyrics Alternatives & Chords", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ---- Schémas ----
    describe("schemas", () => {
        it("valide une demande de génération IA", () => {
            const r = generateAlternativesSchema.safeParse({ phrase: "Dans la nuit" });
            expect(r.success).toBe(true);
        });

        it("rejette une phrase vide", () => {
            const r = generateAlternativesSchema.safeParse({ phrase: "" });
            expect(r.success).toBe(false);
        });

        it("limite à 3 alternatives max pour la communauté", () => {
            const r = communityAlternativeSchema.safeParse({
                phrase: "Dans la nuit",
                alternatives: ["a", "b", "c", "d"],
            });
            expect(r.success).toBe(false);
        });

        it("accepte 3 alternatives communauté", () => {
            const r = communityAlternativeSchema.safeParse({
                phrase: "Dans la nuit",
                alternatives: ["a", "b", "c"],
            });
            expect(r.success).toBe(true);
        });

        it("valide un tableau d'accords", () => {
            const r = updateChordsSchema.safeParse({
                chords: [{ word: "nuit", position: 0, chord: "Am" }],
            });
            expect(r.success).toBe(true);
        });
    });

    // ---- Rate limiting ----
    describe("rateLimitAI", () => {
        it("autorise sous la limite", async () => {
            const { redis } = require("@/server/redis.client");
            (redis.incr as jest.Mock).mockResolvedValue(1);
            const { rateLimitAI } = require("@/lib/rateLimitAI");

            const result = await rateLimitAI("user-1");
            expect(result.allowed).toBe(true);
            expect(redis.pexpire).toHaveBeenCalled(); // TTL posé au 1er appel
        });

        it("bloque au-delà de la limite", async () => {
            const { redis } = require("@/server/redis.client");
            (redis.incr as jest.Mock).mockResolvedValue(6);
            const { rateLimitAI } = require("@/lib/rateLimitAI");

            const result = await rateLimitAI("user-1");
            expect(result.allowed).toBe(false);
            expect(result.retryAfter).toBe(60);
        });
    });

    // ---- Résolution d'accès ----
    describe("resolveLyricsAccess", () => {
        it("autorise un membre du projet", async () => {
            const { prisma } = require("@/lib/prisma");
            const { requireRole } = require("@/lib/rbac");
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: "u1",
                cognitoId: "c1",
            });
            (prisma.lyrics.findUnique as jest.Mock).mockResolvedValue({
                id: "l1",
                projectId: "p1",
                authorId: "u9",
            });
            (requireRole as jest.Mock).mockResolvedValue({ authorized: true, role: "LYRICIST" });

            const { resolveLyricsAccess } = require("@/lib/lyricsAccess");
            const access = await resolveLyricsAccess("c1", "l1", "LYRICIST");
            expect(access.ok).toBe(true);
        });

        it("refuse un non-membre du projet", async () => {
            const { prisma } = require("@/lib/prisma");
            const { requireRole } = require("@/lib/rbac");
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: "u1",
                cognitoId: "c1",
            });
            (prisma.lyrics.findUnique as jest.Mock).mockResolvedValue({
                id: "l1",
                projectId: "p1",
                authorId: "u9",
            });
            (requireRole as jest.Mock).mockResolvedValue({ authorized: false });

            const { resolveLyricsAccess } = require("@/lib/lyricsAccess");
            const access = await resolveLyricsAccess("c1", "l1", "LYRICIST");
            expect(access.ok).toBe(false);
            expect(access.status).toBe(403);
        });

        it("autorise l'auteur d'un lyric personnel (sans projet)", async () => {
            const { prisma } = require("@/lib/prisma");
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: "u1",
                cognitoId: "c1",
            });
            (prisma.lyrics.findUnique as jest.Mock).mockResolvedValue({
                id: "l1",
                projectId: null,
                authorId: "u1",
            });

            const { resolveLyricsAccess } = require("@/lib/lyricsAccess");
            const access = await resolveLyricsAccess("c1", "l1", "READONLY");
            expect(access.ok).toBe(true);
        });

        it("refuse un tiers sur un lyric personnel", async () => {
            const { prisma } = require("@/lib/prisma");
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: "u1",
                cognitoId: "c1",
            });
            (prisma.lyrics.findUnique as jest.Mock).mockResolvedValue({
                id: "l1",
                projectId: null,
                authorId: "u9",
            });

            const { resolveLyricsAccess } = require("@/lib/lyricsAccess");
            const access = await resolveLyricsAccess("c1", "l1", "READONLY");
            expect(access.ok).toBe(false);
            expect(access.status).toBe(403);
        });
    });

    // ---- Génération IA (parsing Claude) ----
    describe("generateAlternatives (Claude)", () => {
        const OLD_ENV = process.env.ANTHROPIC_API_KEY;
        afterEach(() => {
            process.env.ANTHROPIC_API_KEY = OLD_ENV;
            jest.resetModules();
        });

        it("parse la réponse JSON et limite au max demandé", async () => {
            process.env.ANTHROPIC_API_KEY = "test-key";
            const create = jest.fn().mockResolvedValue({
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({ alternatives: ["v1", "v2", "v3", "v4"] }),
                    },
                ],
            });
            jest.doMock("@anthropic-ai/sdk", () => {
                return {
                    __esModule: true,
                    default: class {
                        messages = { create };
                    },
                };
            });

            const { generateAlternatives } = require("@/lib/claude");
            const result = await generateAlternatives("Dans la nuit", 3);
            expect(result).toEqual(["v1", "v2", "v3"]); // limité à 3
        });

        it("échoue proprement sans clé API", async () => {
            delete process.env.ANTHROPIC_API_KEY;
            jest.doMock("@anthropic-ai/sdk", () => ({
                __esModule: true,
                default: class {
                    messages = { create: jest.fn() };
                },
            }));
            const { generateAlternatives } = require("@/lib/claude");
            await expect(generateAlternatives("Dans la nuit")).rejects.toThrow();
        });
    });
});
