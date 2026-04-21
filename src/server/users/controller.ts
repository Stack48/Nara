import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseBody(body: unknown): { email: string; name: string | null } {
  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const name =
    typeof b.name === "string" && b.name.trim() !== ""
      ? b.name.trim()
      : null;
  if (!email || !isValidEmail(email)) throw new AppError(400, "Email invalide");
  return { email, name };
}

export const UsersController = {
  async findAll() {
    return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(404, "Introuvable");
    return user;
  },

  async create(body: unknown) {
    const { email, name } = parseBody(body);
    try {
      return await prisma.user.create({ data: { email, name } });
    } catch {
      throw new AppError(409, "Email déjà utilisé");
    }
  },

  async update(id: string, body: unknown) {
    const { email, name } = parseBody(body);
    try {
      return await prisma.user.update({ where: { id }, data: { email, name } });
    } catch {
      throw new AppError(409, "Mise à jour impossible (email déjà utilisé ?)");
    }
  },

  async remove(id: string) {
    try {
      await prisma.user.delete({ where: { id } });
    } catch {
      throw new AppError(404, "Utilisateur introuvable");
    }
  },
};
