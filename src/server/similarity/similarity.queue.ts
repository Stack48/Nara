import { Queue } from "bullmq";

export const SIMILARITY_QUEUE_NAME = "similarity-analysis";

// Données transmises au worker
export interface SimilarityJobData {
    analysisJobId: string; // id de la ligne AnalysisJob en base
}

const connection = {
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    maxRetriesPerRequest: null, // requis par BullMQ
};

export const similarityQueue = new Queue<SimilarityJobData>(
    SIMILARITY_QUEUE_NAME,
    { connection }
);

// Pousse un job dans la file
export async function enqueueSimilarityAnalysis(analysisJobId: string) {
    await similarityQueue.add(
        "analyze",
        { analysisJobId },
        {
            removeOnComplete: 100, // garde les 100 derniers pour debug
            removeOnFail: 100,
        }
    );
}