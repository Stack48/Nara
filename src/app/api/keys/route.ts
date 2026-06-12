import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { generateApiKey } from '@/lib/utils'; // I will implement this

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Generate a secure API key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const apiKey = `nara_${rawKey}`;
    
    // Hash it for storage
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const createdKey = await prisma.apiKey.create({
      data: {
        userId,
        name: name || 'Default Key',
        keyHash,
      },
    });

    // We only return the raw API key once!
    return NextResponse.json({ 
      id: createdKey.id,
      name: createdKey.name,
      apiKey 
    });

  } catch (error: any) {
    console.error('API Key creation failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        // We DO NOT return the hash or the raw key
      }
    });

    return NextResponse.json({ keys });
  } catch (error: any) {
    console.error('Fetching API Keys failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('keyId');
    const userId = searchParams.get('userId');

    if (!keyId || !userId) {
      return NextResponse.json({ error: 'Missing keyId or userId' }, { status: 400 });
    }

    await prisma.apiKey.delete({
      where: {
        id: keyId,
        userId: userId, // Ensure the key belongs to the user
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Deleting API Key failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
