import { redis } from "@/server/redis.client";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfter: number;
}

/**
 * Limite le nombre de générations IA par utilisateur (fenêtre glissante d'1 min).
 * Clé par userId pour éviter qu'un même compte sature l'API Claude.
 */
export async function rateLimitAI(userId: string): Promise<RateLimitResult> {
    const key = `rate:ai:${userId}`;
    const current = await redis.incr(key);

    if (current === 1) {
        await redis.pexpire(key, WINDOW_MS);
    }

    if (current > MAX_REQUESTS) {
        return { allowed: false, remaining: 0, retryAfter: 60 };
    }

    return {
        allowed: true,
        remaining: Math.max(0, MAX_REQUESTS - current),
        retryAfter: 0,
    };
}
