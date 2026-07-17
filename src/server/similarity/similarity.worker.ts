import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { extractTipTapText } from "@/server/text/extract-text";
import type { ReferenceMatch } from "./similarity.service";
import { analyzeSimilarity, ReferenceInput } from "./similarity.service";
import {
    SIMILARITY_QUEUE_NAME,
    SimilarityJobData,
} from "./similarity.queue";

const connection = {
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    maxRetriesPerRequest: null,
};

async function processAnalysis(job: Job<SimilarityJobData>) {
    const { analysisJobId } = job.data;

    const analysisJob = await prisma.analysisJob.findUnique({
        where: { id: analysisJobId },
    });
    if (!analysisJob) throw new Error(`AnalysisJob ${analysisJobId} introuvable`);

    // Passe en RUNNING + incrémente le compteur de tentatives
    await prisma.analysisJob.update({
        where: { id: analysisJobId },
        data: {
            status: "RUNNING",
            startedAt: new Date(),
            attempts: { increment: 1 },
            error: null,
        },
    });

    try {
        // Texte à analyser : le snapshot s'il existe (relance), sinon
        // extraction depuis les lyrics actuels + sauvegarde du snapshot
        let inputText = analysisJob.inputText;
        if (!inputText) {
            const lyrics = await prisma.lyrics.findUnique({
                where: { id: analysisJob.lyricsId },
            });
            if (!lyrics) throw new Error("Lyrics introuvables");

            inputText = extractTipTapText(lyrics.content);
            await prisma.analysisJob.update({
                where: { id: analysisJobId },
                data: { inputText },
            });
        }

        // Charge la base de référence (n-grammes déjà précalculés)
        const references: ReferenceInput[] = await prisma.referenceLyric.findMany({
            select: {
                id: true,
                title: true,
                artist: true,
                normalizedText: true,
                ngramHashes: true,
            },
        });

        const startedAt = Date.now();
        const result = analyzeSimilarity(inputText, references);
        const durationMs = Date.now() - startedAt;
        const matchesWithCarryOver = await carryOverIgnoredPassages(
            analysisJob.lyricsId,
            analysisJob.id,
            result.matches,
        );
        await prisma.analysisJob.update({
            where: { id: analysisJobId },
            data: {
                status: "COMPLETED",
                score: result.score,
                matches: JSON.parse(JSON.stringify(result.matches)),
                finishedAt: new Date(),
            },
        });

        console.log(
            `✅ Analyse ${analysisJobId} terminée en ${durationMs}ms — score: ${result.score}, refs matchées: ${result.matches.length}`
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        await prisma.analysisJob.update({
            where: { id: analysisJobId },
            data: {
                status: "FAILED",
                error: message,
                finishedAt: new Date(),
            },
        });
        console.error(`❌ Analyse ${analysisJobId} échouée: ${message}`);
        throw err; // laisse BullMQ enregistrer l'échec
    }
}

// [36-FE] Report des signalements ignorés depuis la dernière analyse
// du même lyric : un passage ignoré le reste tant que le texte ne change
// pas assez pour déplacer ses positions.
async function carryOverIgnoredPassages(
    lyricsId: string,
    currentJobId: string,
    matches: ReferenceMatch[],
): Promise<ReferenceMatch[]> {
    const previousJob = await prisma.analysisJob.findFirst({
        where: {
            lyricsId,
            status: "COMPLETED",
            id: { not: currentJobId },
        },
        orderBy: { finishedAt: "desc" },
    });

    if (!previousJob?.matches) return matches;

const previousMatches = previousJob.matches as unknown as ReferenceMatch[];
    const ignoredKeys = new Set<string>();

    previousMatches.forEach((match) => {
        match.passages.forEach((passage) => {
            if (passage.ignored) {
                ignoredKeys.add(
                    `${match.referenceId}:${passage.inputWordStart}:${passage.inputWordEnd}`,
                );
            }
        });
    });

    if (ignoredKeys.size === 0) return matches;

    return matches.map((match) => ({
        ...match,
        passages: match.passages.map((passage) => {
            const key = `${match.referenceId}:${passage.inputWordStart}:${passage.inputWordEnd}`;
            return ignoredKeys.has(key)
                ? { ...passage, ignored: true }
                : passage;
        }),
    }));
}

// Démarre le worker
const worker = new Worker<SimilarityJobData>(
    SIMILARITY_QUEUE_NAME,
    processAnalysis,
    {
        connection,
        concurrency: 2, // 2 analyses en parallèle max
    }
);

worker.on("ready", () => {
    console.log("🎧 Worker similarité démarré, en attente de jobs...");
});

worker.on("failed", (job, err) => {
    console.error(`Job BullMQ ${job?.id} en échec:`, err.message);
});