import { Server, Socket } from "socket.io";
import * as Y from "yjs";
import { redis } from "../redis.client";

// Stockage des documents Yjs en mémoire
const yjsDocs = new Map<string, Y.Doc>();

function getOrCreateDoc(lyricsId: string): Y.Doc {
    if (!yjsDocs.has(lyricsId)) {
        yjsDocs.set(lyricsId, new Y.Doc());
    }
    return yjsDocs.get(lyricsId)!;
}

export function handleYjs(io: Server, socket: Socket) {

    // Sync initial — envoie l'état du doc au nouveau connecté
    socket.on("yjs:sync", async (data: { lyricsId: string }) => {
        const { lyricsId } = data;
        const doc = getOrCreateDoc(lyricsId);

        // Essaie de récupérer l'état depuis Redis
        const savedState = await redis.get(`yjs:${lyricsId}`);
        if (savedState) {
            const update = Buffer.from(savedState, "base64");
            Y.applyUpdate(doc, update);
        }

        const state = Y.encodeStateAsUpdate(doc);
        socket.emit("yjs:state", {
            lyricsId,
            state: Buffer.from(state).toString("base64"),
        });
    });

    // Reçoit et broadcast les updates Yjs
    socket.on("yjs:update", async (data: { lyricsId: string; update: string }) => {
        const { lyricsId, update } = data;
        const doc = getOrCreateDoc(lyricsId);

        const updateBuffer = Buffer.from(update, "base64");
        Y.applyUpdate(doc, updateBuffer);

        // Sauvegarde dans Redis
        const state = Y.encodeStateAsUpdate(doc);
        await redis.set(
            `yjs:${lyricsId}`,
            Buffer.from(state).toString("base64"),
            "EX",
            3600
        );

        // Broadcast aux autres
        socket.to(`project:${lyricsId}`).emit("yjs:update", data);
    });

    // Lock simple sur une section
    socket.on("lock:acquire", async (data: { lyricsId: string; sectionId: string }) => {
        const { lyricsId, sectionId } = data;
        const lockKey = `lock:${lyricsId}:${sectionId}`;

        const existing = await redis.get(lockKey);
        if (existing && existing !== socket.id) {
            socket.emit("lock:denied", { sectionId, lockedBy: existing });
            return;
        }

        await redis.set(lockKey, socket.id, "EX", 30); // lock 30s
        socket.to(`project:${lyricsId}`).emit("lock:acquired", {
            sectionId,
            userId: socket.id,
        });
        socket.emit("lock:granted", { sectionId });
    });

    // Libère le lock
    socket.on("lock:release", async (data: { lyricsId: string; sectionId: string }) => {
        const { lyricsId, sectionId } = data;
        const lockKey = `lock:${lyricsId}:${sectionId}`;

        await redis.del(lockKey);
        socket.to(`project:${lyricsId}`).emit("lock:released", { sectionId });
    });
}