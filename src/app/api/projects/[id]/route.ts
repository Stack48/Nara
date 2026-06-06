import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, forbidden, unauthorized } from '@/lib/rbac';
import { z } from 'zod';

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  genre: z.string().optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
});

function getCognitoId(request: NextRequest): string | null {
  return request.headers.get('x-cognito-id');
}

// GET /api/projects/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const cognitoId = getCognitoId(request);
  if (!cognitoId) return unauthorized();

  const { authorized } = await requireRole(
    cognitoId,
    params.id,
    'READONLY',
  );
  if (!authorized) return forbidden();

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!project)
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 });

  return NextResponse.json(project);
}

// PATCH /api/projects/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const cognitoId = getCognitoId(request);
  if (!cognitoId) return unauthorized();

  const { authorized } = await requireRole(
    cognitoId,
    params.id,
    'LEAD_LYRICIST',
  );
  if (!authorized)
    return forbidden('Seul un Lead Parolier ou Admin peut modifier le projet');

  const body = await request.json();
  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const project = await prisma.project.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(project);
}

// DELETE /api/projects/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cognitoId = getCognitoId(request);
  if (!cognitoId) return unauthorized();

  const { authorized } = await requireRole(cognitoId, id, 'ADMIN');
  if (!authorized) return forbidden('Seul un Admin peut supprimer un projet');

  await prisma.project.delete({
    where: { id: id },
  });

  return NextResponse.json({ success: true });
}
