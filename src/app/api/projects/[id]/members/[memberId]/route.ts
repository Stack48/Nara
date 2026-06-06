import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, forbidden, unauthorized } from '@/lib/rbac';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'LEAD_LYRICIST', 'LYRICIST', 'READONLY']),
});

function getCognitoId(request: NextRequest): string | null {
  return request.headers.get('x-cognito-id');
}

// PATCH /api/projects/:id/members/:memberId — change le rôle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const resolvedParams = await params;
  const { id, memberId } = resolvedParams;
  const cognitoId = getCognitoId(request);
  if (!cognitoId) return unauthorized();

  // Seul un ADMIN peut changer les rôles
  const { authorized } = await requireRole(cognitoId, id, 'ADMIN');
  if (!authorized) return forbidden('Seul un Admin peut modifier les rôles');

  const body = await request.json();
  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await prisma.projectMember.update({
    where: { id: memberId },
    data: { role: parsed.data.role },
  });

  return NextResponse.json(updated);
}

// DELETE /api/projects/:id/members/:memberId — révoque un membre
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const resolvedParams = await params;
  const { id, memberId } = resolvedParams;
  const cognitoId = getCognitoId(request);
  if (!cognitoId) return unauthorized();

  // Seul un ADMIN peut révoquer
  const { authorized } = await requireRole(cognitoId, id, 'ADMIN');
  if (!authorized) return forbidden('Seul un Admin peut révoquer un membre');

  await prisma.projectMember.delete({
    where: { id: memberId },
  });

  return NextResponse.json({ success: true });
}
