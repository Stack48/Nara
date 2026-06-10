import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const RATE_LIMITS: Record<string, number> = {
  FREE_TRIAL: 100, // 100 requests per day
  BASIC: 1000,     // 1000 requests per day
  PRO: 10000,      // 10000 requests per day
};

export async function checkRateLimit(apiKeyStr: string, endpoint: string) {
  // Hash the incoming key to compare with the DB
  const keyHash = crypto.createHash('sha256').update(apiKeyStr).digest('hex');

  // Find the API Key and user
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (!apiKey) {
    return { success: false, error: 'Invalid API Key', status: 401 };
  }

  const planType = apiKey.user.subscription?.planType || 'FREE_TRIAL';
  const limit = RATE_LIMITS[planType] || RATE_LIMITS.FREE_TRIAL;

  // Rate Limiting Logic (Daily limit)
  const now = new Date();
  const resetAt = new Date(now);
  resetAt.setUTCHours(24, 0, 0, 0); // Next midnight

  const rateLimitRecord = await prisma.rateLimit.findUnique({
    where: {
      apiKeyId_endpoint: {
        apiKeyId: apiKey.id,
        endpoint,
      },
    },
  });

  if (rateLimitRecord) {
    if (now > rateLimitRecord.resetAt) {
      // Reset limit
      await prisma.rateLimit.update({
        where: { id: rateLimitRecord.id },
        data: {
          count: 1,
          resetAt,
        },
      });
      return { success: true, remaining: limit - 1, limit, resetAt, userId: apiKey.user.id };
    } else {
      if (rateLimitRecord.count >= limit) {
        return { success: false, error: 'Rate limit exceeded', status: 429, resetAt, userId: apiKey.user.id };
      }
      // Increment
      await prisma.rateLimit.update({
        where: { id: rateLimitRecord.id },
        data: {
          count: rateLimitRecord.count + 1,
        },
      });
      return { success: true, remaining: limit - (rateLimitRecord.count + 1), limit, resetAt, userId: apiKey.user.id };
    }
  } else {
    // Create first record
    await prisma.rateLimit.create({
      data: {
        apiKeyId: apiKey.id,
        endpoint,
        count: 1,
        resetAt,
      },
    });
    return { success: true, remaining: limit - 1, limit, resetAt, userId: apiKey.user.id };
  }
}
