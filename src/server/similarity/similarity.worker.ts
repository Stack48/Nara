import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { extractTipTapText } from "@/server/text/extract-text";
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