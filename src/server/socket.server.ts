import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { redis, redisSub } from "./redis.client";
import { handlePresence } from "./collaboration/presence.handler";
import { handleYjs } from "./collaboration/yjs.handler";

let io: SocketIOServer | null = null;

export function getSocketServer(): SocketIOServer {
    if (!io) {
        io = new SocketIOServer({
            cors: {
                origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
                methods: ["GET", "POST"],
            },
            transports: ["websocket", "polling"],
        });

        // Adaptateur Redis pour multi-instance
        io.adapter(createAdapter(redis, redisSub));

        // Middleware auth
        io.use(async (socket, next) => {
            const cognitoId = socket.handshake.auth.cognitoId;
            if (!cognitoId) {
                return next(new Error("Non authentifié"));
            }
            socket.data.cognitoId = cognitoId;
            next();
        });

        // Connexion
        io.on("connection", (socket) => {
            console.log(`✅ Socket connecté: ${socket.id}`);

            handlePresence(io!, socket);
            handleYjs(io!, socket);

            socket.on("disconnect", () => {
                console.log(`❌ Socket déconnecté: ${socket.id}`);
            });
        });
    }

    return io;
}