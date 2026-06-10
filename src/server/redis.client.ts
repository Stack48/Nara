import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
    redisSub: Redis | undefined;
};

export const redis =
    globalForRedis.redis ??
    new Redis({
        host: process.env.REDIS_HOST ?? "localhost",
        port: parseInt(process.env.REDIS_PORT ?? "6379"),
        retryStrategy: (times) => Math.min(times * 50, 2000),
    });

export const redisSub =
    globalForRedis.redisSub ??
    new Redis({
        host: process.env.REDIS_HOST ?? "localhost",
        port: parseInt(process.env.REDIS_PORT ?? "6379"),
        retryStrategy: (times) => Math.min(times * 50, 2000),
    });

if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
    globalForRedis.redisSub = redisSub;
}