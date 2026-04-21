import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { UserInputSchema } from "@/schemas/user";

function parseInput(body: unknown) {
  const result = UserInputSchema.safeParse(body);
  if (!result.success) throw new AppError(400, result.error.errors[0].message);
  return result.data;
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
    const { email, name } = parseInput(body);
    try {
      return await prisma.user.create({ data: { email, name } });
    } catch {
      throw new AppError(409, "Email déjà utilisé");
    }
  },

  async update(id: string, body: unknown) {
    const { email, name } = parseInput(body);
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
