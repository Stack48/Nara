import { prisma } from "@/lib/prisma";
import { resolveLyricsAccess } from "@/lib/lyricsAccess";
import { rateLimitAI } from "@/lib/rateLimitAI";
import { generateAlternatives, isClaudeConfigured } from "@/lib/claude";
import {
    generateAlternativesSchema,
    communityAlternativeSchema,
    MAX_ALTERNATIVES,
} from "@/schemas/alternatives.schema";

const authorSelect = {
    author: { select: { id: true, name: true, username: true } },
} as const;

// Enveloppe de retour commune (data | error + status, + retryAfter pour le 429)
export type ControllerResult = {
    status: number;
    data?: unknown;
    error?: unknown;
    retryAfter?: number;
};

// GET — liste les alternatives (IA + communauté) d'un lyric
export async function listAlternatives(
    cognitoId: string,
    lyricsId: string
): Promise<ControllerResult> {
    const access = await resolveLyricsAccess(cognitoId, lyricsId, "READONLY");
    if (!access.ok) return { error: access.error, status: access.status };

    const alternatives = await prisma.alternative.findMany({
        where: { lyricsId },
        include: authorSelect,
        orderBy: { createdAt: "desc" },
    });

    return { data: alternatives, status: 200 };
}

// POST — génération IA via Claude (rate-limité par utilisateur)
export async function generateAIAlternatives(
    cognitoId: string,
    lyricsId: string,
    body: unknown
): Promise<ControllerResult> {
    const access = await resolveLyricsAccess(cognitoId, lyricsId, "LYRICIST");
    if (!access.ok) return { error: access.error, status: access.status };

    if (!isClaudeConfigured()) {
        return { error: "Génération IA indisponible (clé API manquante)", status: 503 };
    }

    const parsed = generateAlternativesSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.flatten(), status: 400 };

    // Rate limiting sur la génération IA
    const limit = await rateLimitAI(access.user.id);
    if (!limit.allowed) {
        return {
            error: "Trop de générations. Réessaie dans une minute.",
            status: 429,
            retryAfter: limit.retryAfter,
        };
    }

    const max = parsed.data.max ?? MAX_ALTERNATIVES;

    let generated: string[];
    try {
        generated = await generateAlternatives(parsed.data.phrase, max);
    } catch (error) {
        console.error("Claude generateAlternatives error:", error);
        return { error: "Échec de la génération IA", status: 502 };
    }

    if (generated.length === 0) {
        return { error: "Aucune alternative générée", status: 502 };
    }

    const alternative = await prisma.alternative.create({
        data: {
            phrase: parsed.data.phrase,
            alternatives: generated,
            source: "AI",
            lyricsId,
            authorId: access.user.id,
        },
        include: authorSelect,
    });

    return { data: alternative, status: 201 };
}

// POST /community — soumission manuelle d'alternatives (label Communauté)
export async function submitCommunityAlternative(
    cognitoId: string,
    lyricsId: string,
    body: unknown
): Promise<ControllerResult> {
    const access = await resolveLyricsAccess(cognitoId, lyricsId, "LYRICIST");
    if (!access.ok) return { error: access.error, status: access.status };

    const parsed = communityAlternativeSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.flatten(), status: 400 };

    const alternative = await prisma.alternative.create({
        data: {
            phrase: parsed.data.phrase,
            alternatives: parsed.data.alternatives,
            source: "COMMUNITY",
            lyricsId,
            authorId: access.user.id,
        },
        include: authorSelect,
    });

    return { data: alternative, status: 201 };
}

// GET /history — historique des alternatives consultées par l'utilisateur
export async function getAlternativeHistory(
    cognitoId: string,
    lyricsId: string
): Promise<ControllerResult> {
    const access = await resolveLyricsAccess(cognitoId, lyricsId, "READONLY");
    if (!access.ok) return { error: access.error, status: access.status };

    const views = await prisma.alternativeView.findMany({
        where: { userId: access.user.id, alternative: { lyricsId } },
        include: { alternative: { include: authorSelect } },
        orderBy: { viewedAt: "desc" },
    });

    return { data: views, status: 200 };
}

// POST /history — enregistre la consultation d'une alternative
export async function recordAlternativeView(
    cognitoId: string,
    lyricsId: string,
    body: unknown
): Promise<ControllerResult> {
    const access = await resolveLyricsAccess(cognitoId, lyricsId, "READONLY");
    if (!access.ok) return { error: access.error, status: access.status };

    const alternativeId =
        body && typeof body === "object" && "alternativeId" in body
            ? (body as { alternativeId?: unknown }).alternativeId
            : undefined;

    if (typeof alternativeId !== "string" || alternativeId.length === 0) {
        return { error: "alternativeId requis", status: 400 };
    }

    // L'alternative doit appartenir à ce lyric
    const alternative = await prisma.alternative.findFirst({
        where: { id: alternativeId, lyricsId },
        select: { id: true },
    });
    if (!alternative) return { error: "Alternative introuvable", status: 404 };

    const view = await prisma.alternativeView.create({
        data: { alternativeId, userId: access.user.id },
    });

    return { data: view, status: 201 };
}
