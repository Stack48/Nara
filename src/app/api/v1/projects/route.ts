import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Retrieve a list of projects
 *     description: Retrieve all projects for the authenticated user via API Key.
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of projects.
 *       401:
 *         description: Unauthorized. Invalid API Key.
 *       429:
 *         description: Too Many Requests. Rate limit exceeded.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid API Key in Authorization header (Format: Bearer <key>)' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    
    // Check Rate Limit & Verify API Key
    const limitStatus = await checkRateLimit(apiKey, '/api/v1/projects');
    
    if (!limitStatus.success || !limitStatus.userId) {
      return NextResponse.json(
        { error: limitStatus.error },
        { 
          status: limitStatus.status,
          headers: limitStatus.status === 429 ? { 'Retry-After': limitStatus.resetAt!.toUTCString() } : {}
        }
      );
    }

    // Fetch projects for the authenticated user
    const projects = await prisma.project.findMany({
      where: { ownerId: limitStatus.userId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      }
    });
    
    const headers = new Headers();
    if (limitStatus.limit !== undefined) {
      headers.set('X-RateLimit-Limit', limitStatus.limit.toString());
      headers.set('X-RateLimit-Remaining', limitStatus.remaining!.toString());
      headers.set('X-RateLimit-Reset', limitStatus.resetAt!.getTime().toString());
    }

    return NextResponse.json({
      data: projects,
    }, { headers });

  } catch (error: any) {
    console.error('API /v1/projects Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
