import { hasPermission } from '@/lib/rbac';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    projectMember: {
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    invitation: {
      create: jest.fn(),
    },
  },
}));

describe('RBAC — hasPermission', () => {
  // ✅ Admin peut tout faire
  it('ADMIN peut accéder aux routes ADMIN', () => {
    expect(hasPermission('ADMIN', 'ADMIN')).toBe(true);
  });

  it('ADMIN peut accéder aux routes LEAD_PAROLIER', () => {
    expect(hasPermission('ADMIN', 'LEAD_PAROLIER')).toBe(true);
  });

  it('ADMIN peut accéder aux routes LECTURE_SEULE', () => {
    expect(hasPermission('ADMIN', 'LECTURE_SEULE')).toBe(true);
  });

  // ✅ Lead Parolier
  it('LEAD_PAROLIER peut accéder aux routes PAROLIER', () => {
    expect(hasPermission('LEAD_PAROLIER', 'PAROLIER')).toBe(true);
  });

  it('LEAD_PAROLIER ne peut pas accéder aux routes ADMIN', () => {
    expect(hasPermission('LEAD_PAROLIER', 'ADMIN')).toBe(false);
  });

  // ✅ Parolier
  it('PAROLIER peut accéder aux routes LECTURE_SEULE', () => {
    expect(hasPermission('PAROLIER', 'LECTURE_SEULE')).toBe(true);
  });

  it('PAROLIER ne peut pas accéder aux routes LEAD_PAROLIER', () => {
    expect(hasPermission('PAROLIER', 'LEAD_PAROLIER')).toBe(false);
  });

  it('PAROLIER ne peut pas modifier directement', () => {
    expect(hasPermission('PAROLIER', 'ADMIN')).toBe(false);
  });

  // ✅ Lecture seule
  it("LECTURE_SEULE ne peut accéder qu'aux routes LECTURE_SEULE", () => {
    expect(hasPermission('LECTURE_SEULE', 'LECTURE_SEULE')).toBe(true);
  });

  it('LECTURE_SEULE ne peut pas accéder aux routes PAROLIER', () => {
    expect(hasPermission('LECTURE_SEULE', 'PAROLIER')).toBe(false);
  });

  it('LECTURE_SEULE ne peut pas accéder aux routes ADMIN', () => {
    expect(hasPermission('LECTURE_SEULE', 'ADMIN')).toBe(false);
  });
});
