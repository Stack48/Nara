import { Server, Socket } from "socket.io";
import { redis } from "../redis.client";

interface UserPresence {
    userId: string;
    cognitoId: string;
    name: string;
    color: string;
    cursor?: { line: number; ch: number };
    joinedAt: string;
}

// Couleurs pour les curseurs
const COLORS = [
    "#D90097", "#7C3AED", "#2563EB", "#059669",
    "#DC2626", "#D97706", "#0891B2", "#BE185D",
];

export function handlePresence(io: Server, socket: Socket) {

    // Rejoindre une room projet
    socket.on("join:project", async (data: { projectId: string; name: string }) => {
        const { projectId, name } = data;
        const room = `project:${projectId}`;

        await socket.join(room);

        // Récupère les membres existants
        const existingMembers = await redis.hgetall(`presence:${projectId}`);
        const memberCount = Object.keys(existingMembers).length;

        const presence: UserPresence = {
            userId: socket.id,
            cognitoId: socket.data.cognitoId,
            name,
            color: COLORS[memberCount % COLORS.length],
            joinedAt: new Date().toISOString(),
        };

        // Sauvegarde la présence dans Redis
        await redis.hset(
            `presence:${projectId}`,
            socket.id,
            JSON.stringify(presence)
        );
        await redis.expire(`presence:${projectId}`, 3600); // expire 1h

        // Notifie les autres membres
        socket.to(room).emit("user:joined", presence);

        // Envoie la liste des membres à l'arrivant
        const allMembers = Object.values(existingMembers).map((m) => JSON.parse(m));
        socket.emit("presence:list", allMembers);

        console.log(`👤 ${name} a rejoint le projet ${projectId}`);
    });

    // Mise à jour du curseur
    socket.on("cursor:update", async (data: { projectId: string; cursor: { line: number; ch: number } }) => {
        const { projectId, cursor } = data;
        const room = `project:${projectId}`;

        const presenceData = await redis.hget(`presence:${projectId}`, socket.id);
        if (presenceData) {
            const presence = JSON.parse(presenceData);
            presence.cursor = cursor;
            await redis.hset(`presence:${projectId}`, socket.id, JSON.stringify(presence));
            socket.to(room).emit("cursor:updated", { userId: socket.id, cursor });
        }
    });

    // Quitter une room
    socket.on("leave:project", async (data: { projectId: string }) => {
        const { projectId } = data;
        const room = `project:${projectId}`;

        await redis.hdel(`presence:${projectId}`, socket.id);
        await socket.leave(room);
        socket.to(room).emit("user:left", { userId: socket.id });
    });

    // Déconnexion — nettoie toutes les rooms
    socket.on("disconnecting", async () => {
        for (const room of socket.rooms) {
            if (room.startsWith("project:")) {
                const projectId = room.replace("project:", "");
                await redis.hdel(`presence:${projectId}`, socket.id);
                socket.to(room).emit("user:left", { userId: socket.id });
            }
        }
    });
}