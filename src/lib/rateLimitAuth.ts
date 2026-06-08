import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/server/redis.client";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export async function rateLimitAuth(request: NextRequest): Promise<NextResponse | null> {
    const ip = request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip") ??
        "unknown";

    const key = `rate:auth:${ip}`;
    const current = await redis.incr(key);

    if (current === 1) {
        await redis.pexpire(key, WINDOW_MS);
    }

    if (current > MAX_REQUESTS) {
        return NextResponse.json(
            { error: "Trop de requêtes. Réessaie dans 1 minute." },
            {
                status: 429,
                headers: {
                    "Retry-After": "60",
                    "X-RateLimit-Limit": String(MAX_REQUESTS),
                    "X-RateLimit-Remaining": "0",
                }
            }
        );
    }

    return null;
}