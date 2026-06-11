import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { CreateWordSchema, UpdateWordSchema, VoteSchema } from "@/schemas/dictionary.schema";

export async function getOrCreateUser(cognitoId: string) {
  let user = await prisma.user.findUnique({ where: { cognitoId } });
  if (!user) {
    const isLea = cognitoId === "cognito-lea-001";
    const email = isLea ? "lea@nara.com" : `${cognitoId}@nara.com`;
    const username = isLea ? "lea_admin" : `user_${cognitoId.substring(0, 8)}`;
    const name = isLea ? "Léa Admin" : `Utilisateur ${cognitoId.substring(0, 8)}`;

    user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          cognitoId,
          email,
          username,
          name,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { email },
        data: { cognitoId },
      });
    }
  }
  return user;
}

export const DictionaryController = {
  async findAll(queryParams: {
    page?: string | number;
    limit?: string | number;
    status?: string;
    category?: string;
    search?: string;
  }) {
    const page = Math.max(1, parseInt(String(queryParams.page || 1), 10));
    const limit = Math.max(1, Math.min(100, parseInt(String(queryParams.limit || 10), 10)));
    const { status, category, search } = queryParams;

    const where: any = {};

    if (status) {
      where.status = status;
    }
    
    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { word: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { synonyms: { contains: search, mode: "insensitive" } },
      ];
    }

    const [totalCount, suggestions] = await Promise.all([
      prisma.wordSuggestion.count({ where }),
      prisma.wordSuggestion.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, username: true } },
          votes: { select: { value: true, userId: true } },
        },
      }),
    ]);

    const items = suggestions.map((s) => {
      const voteSum = s.votes.reduce((sum, v) => sum + v.value, 0);
      return {
        ...s,
        voteSum,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      items,
    };
  },

  async findById(id: string) {
    const suggestion = await prisma.wordSuggestion.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, username: true } },
        votes: { select: { value: true, userId: true } },
      },
    });

    if (!suggestion) {
      throw new AppError(404, "Suggestion de mot introuvable");
    }

    const voteSum = suggestion.votes.reduce((sum, v) => sum + v.value, 0);
    return {
      ...suggestion,
      voteSum,
    };
  },

  async create(body: unknown, cognitoId: string) {
    const parsed = CreateWordSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0].message);
    }

    const user = await getOrCreateUser(cognitoId);
    
    const existing = await prisma.wordSuggestion.findFirst({
      where: {
        word: {
          equals: parsed.data.word,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      throw new AppError(400, "Ce mot a déjà été suggéré");
    }

    const suggestion = await prisma.wordSuggestion.create({
      data: {
        word: parsed.data.word,
        description: parsed.data.description,
        synonyms: parsed.data.synonyms,
        antonyms: parsed.data.antonyms,
        category: parsed.data.category,
        language: parsed.data.language || "fr",
        authorId: user.id,
        status: "PENDING",
      },
      include: {
        author: { select: { id: true, name: true, username: true } },
        votes: { select: { value: true, userId: true } },
      },
    });

    return {
      ...suggestion,
      voteSum: 0,
    };
  },

  async update(id: string, body: unknown, cognitoId: string) {
    const parsed = UpdateWordSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0].message);
    }

    const user = await getOrCreateUser(cognitoId);
    const isAdmin = user.email === "lea@nara.com" || user.cognitoId === "cognito-lea-001";

    const existing = await prisma.wordSuggestion.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Suggestion de mot introuvable");
    }

    if (!isAdmin && existing.authorId !== user.id) {
      throw new AppError(403, "Accès refusé");
    }

    if (!isAdmin && existing.status !== "PENDING") {
      throw new AppError(400, "Vous ne pouvez modifier qu'une suggestion en attente");
    }

    const updateData: any = {};
    if (parsed.data.word !== undefined) updateData.word = parsed.data.word;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.synonyms !== undefined) updateData.synonyms = parsed.data.synonyms;
    if (parsed.data.antonyms !== undefined) updateData.antonyms = parsed.data.antonyms;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.language !== undefined) updateData.language = parsed.data.language;

    if (isAdmin && parsed.data.status !== undefined) {
      updateData.status = parsed.data.status;
      if (parsed.data.status === "APPROVED") {
        updateData.isVerifiedByNara = true;
      } else {
        updateData.isVerifiedByNara = false;
      }
    }

    const updated = await prisma.wordSuggestion.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, username: true } },
        votes: { select: { value: true, userId: true } },
      },
    });

    const voteSum = updated.votes.reduce((sum, v) => sum + v.value, 0);
    return {
      ...updated,
      voteSum,
    };
  },

  async vote(id: string, body: unknown, cognitoId: string) {
    const parsed = VoteSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0].message);
    }

    const user = await getOrCreateUser(cognitoId);
    
    const existing = await prisma.wordSuggestion.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Suggestion de mot introuvable");
    }

    const voteValue = parsed.data.value;
    await prisma.wordVote.upsert({
      where: {
        wordId_userId: {
          wordId: id,
          userId: user.id,
        },
      },
      create: {
        wordId: id,
        userId: user.id,
        value: voteValue,
      },
      update: {
        value: voteValue,
      },
    });

    return this.findById(id);
  },

  async getAdminStats(cognitoId: string) {
    const user = await getOrCreateUser(cognitoId);
    const isAdmin = user.email === "lea@nara.com" || user.cognitoId === "cognito-lea-001";
    if (!isAdmin) {
      throw new AppError(403, "Accès refusé");
    }

    const [total, pending, approved, rejected, categories] = await Promise.all([
      prisma.wordSuggestion.count(),
      prisma.wordSuggestion.count({ where: { status: "PENDING" } }),
      prisma.wordSuggestion.count({ where: { status: "APPROVED" } }),
      prisma.wordSuggestion.count({ where: { status: "REJECTED" } }),
      prisma.wordSuggestion.groupBy({
        by: ["category"],
        _count: {
          _all: true,
        },
      }),
    ]);

    const categoryDistribution = categories.reduce((acc: any, c) => {
      acc[c.category || "standard"] = c._count._all;
      return acc;
    }, {});

    return {
      total,
      pending,
      approved,
      rejected,
      categoryDistribution,
    };
  },
};