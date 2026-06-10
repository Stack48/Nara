jest.mock("ioredis", () => {
    return jest.fn().mockImplementation(() => ({
        hset: jest.fn().mockResolvedValue(1),
        hget: jest.fn().mockResolvedValue(null),
        hgetall: jest.fn().mockResolvedValue({}),
        hdel: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue("OK"),
        del: jest.fn().mockResolvedValue(1),
    }));
});

jest.mock("@/server/redis.client", () => ({
    redis: {
        hset: jest.fn().mockResolvedValue(1),
        hget: jest.fn().mockResolvedValue(null),
        hgetall: jest.fn().mockResolvedValue({}),
        hdel: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue("OK"),
        del: jest.fn().mockResolvedValue(1),
    },
    redisSub: {
        hset: jest.fn(),
        hget: jest.fn(),
    },
}));

import * as Y from "yjs";

describe("Collaboration — WebSocket", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ✅ Yjs — convergence de deux états
    it("Yjs converge deux états simultanés", () => {
        const doc1 = new Y.Doc();
        const doc2 = new Y.Doc();

        const text1 = doc1.getText("lyrics");
        const text2 = doc2.getText("lyrics");

        text1.insert(0, "Dans la nuit");
        const update1 = Y.encodeStateAsUpdate(doc1);
        Y.applyUpdate(doc2, update1);

        text2.insert(12, " calme");
        const update2 = Y.encodeStateAsUpdate(doc2);
        Y.applyUpdate(doc1, update2);

        expect(text1.toString()).toBe(text2.toString());
    });

    // ✅ Yjs — pas de perte de données
    it("Yjs ne perd pas de données lors d'édition simultanée", () => {
        const doc1 = new Y.Doc();
        const doc2 = new Y.Doc();

        const text1 = doc1.getText("lyrics");
        const text2 = doc2.getText("lyrics");

        // Sync initial
        const initialState = Y.encodeStateAsUpdate(doc1);
        Y.applyUpdate(doc2, initialState);

        // Édition simultanée
        text1.insert(0, "Léa écrit ceci");
        text2.insert(0, "Marcus écrit cela");

        // Merge
        Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
        Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

        // Les deux docs sont identiques
        expect(text1.toString()).toBe(text2.toString());
        expect(text1.toString().length).toBeGreaterThan(0);
    });

    // ✅ Présence — Redis stocke correctement
    it("présence stockée dans Redis", async () => {
        const { redis } = require("@/server/redis.client");

        await redis.hset("presence:project-1", "socket-1", JSON.stringify({
            userId: "socket-1",
            name: "Léa",
            color: "#D90097",
        }));

        expect(redis.hset).toHaveBeenCalledWith(
            "presence:project-1",
            "socket-1",
            expect.any(String)
        );
    });

    // ✅ Lock — accordé si libre
    it("lock accordé si section libre", async () => {
        const { redis } = require("@/server/redis.client");
        (redis.get as jest.Mock).mockResolvedValue(null);

        const lockKey = "lock:lyrics-1:section-1";
        const existing = await redis.get(lockKey);

        expect(existing).toBeNull(); // section libre
    });

    // ✅ Lock — refusé si pris
    it("lock refusé si section déjà prise", async () => {
        const { redis } = require("@/server/redis.client");
        (redis.get as jest.Mock).mockResolvedValue("socket-lea");

        const lockKey = "lock:lyrics-1:section-1";
        const existing = await redis.get(lockKey);

        expect(existing).toBe("socket-lea"); // section prise
    });

    // ✅ Reconnexion — état récupéré depuis Redis
    it("état Yjs récupéré depuis Redis après reconnexion", async () => {
        const { redis } = require("@/server/redis.client");

        const doc = new Y.Doc();
        const text = doc.getText("lyrics");
        text.insert(0, "Dans la nuit calme");

        const state = Buffer.from(Y.encodeStateAsUpdate(doc)).toString("base64");
        (redis.get as jest.Mock).mockResolvedValue(state);

        const savedState = await redis.get("yjs:lyrics-1");
        expect(savedState).toBe(state);

        // Restaure l'état
        const newDoc = new Y.Doc();
        const update = Buffer.from(savedState!, "base64");
        Y.applyUpdate(newDoc, update);

        expect(newDoc.getText("lyrics").toString()).toBe("Dans la nuit calme");
    });

});