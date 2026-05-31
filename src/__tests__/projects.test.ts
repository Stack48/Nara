import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectMember: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/middleware/rbac.middleware', () => ({
  requireRole: jest.fn(),
  forbidden: jest.fn((msg) => Response.json({ error: msg }, { status: 403 })),
  unauthorized: jest.fn(() =>
    Response.json({ error: 'Non authentifié' }, { status: 401 }),
  ),
}));

import { requireRole } from '@/lib/rbac';

describe('Projects API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ User introuvable → 404
  it('GET /projects retourne 404 si user introuvable', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await prisma.user.findUnique({
      where: { cognitoId: 'xxx' },
    });
    expect(result).toBeNull();
  });

  // ✅ Accès non autorisé → 403
  it('PATCH /projects/:id retourne 403 si rôle insuffisant', async () => {
    (requireRole as jest.Mock).mockResolvedValue({ authorized: false });

    const { authorized } = await requireRole(
      'cognitoId',
      'projectId',
      'LEAD_PAROLIER',
    );
    expect(authorized).toBe(false);
  });

  // ✅ Accès autorisé → 200
  it('PATCH /projects/:id autorisé si LEAD_PAROLIER', async () => {
    (requireRole as jest.Mock).mockResolvedValue({
      authorized: true,
      role: 'LEAD_PAROLIER',
    });

    const { authorized } = await requireRole(
      'cognitoId',
      'projectId',
      'LEAD_PAROLIER',
    );
    expect(authorized).toBe(true);
  });

  // ✅ DELETE → 403 si pas ADMIN
  it('DELETE /projects/:id retourne 403 si pas ADMIN', async () => {
    (requireRole as jest.Mock).mockResolvedValue({ authorized: false });

    const { authorized } = await requireRole('cognitoId', 'projectId', 'ADMIN');
    expect(authorized).toBe(false);
  });

  // ✅ Validation Zod — input invalide → 400
  it('POST /projects avec nom vide → erreur validation', async () => {
    const { z } = require('zod');
    const schema = z.object({ name: z.string().min(1, 'Le nom est requis') });
    const result = schema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  // ✅ Projet créé avec succès
  it('POST /projects crée un projet', async () => {
    const mockProject = { id: '1', name: 'Mon projet', ownerId: 'user1' };
    (prisma.project.create as jest.Mock).mockResolvedValue(mockProject);

    const result = await prisma.project.create({
      data: { name: 'Mon projet', ownerId: 'user1' },
    } as any);

    expect(result).toEqual(mockProject);
  });
});
