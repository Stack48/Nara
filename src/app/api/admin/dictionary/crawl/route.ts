import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/errors";
import { runDictionaryCrawlJob } from "@/server/crawl/crawl.job";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function checkAdmin(request: NextRequest) {
  const cognitoId = request.headers.get("x-cognito-id");
  if (!cognitoId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { cognitoId } });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const isAdmin = user.email === "lea@nara.com" || user.cognitoId === "cognito-lea-001";
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const denied = await checkAdmin(request);
    if (denied) return denied;

    const [logs, totalEntries, bySource, recentEntries] = await Promise.all([
      prisma.crawlLog.findMany({
        orderBy: { startedAt: "desc" },
        take: 20,
      }),
      prisma.dictionaryEntry.count(),
      prisma.dictionaryEntry.groupBy({
        by: ["source"],
        _count: { _all: true },
      }),
      prisma.dictionaryEntry.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          word: true,
          definition: true,
          language: true,
          category: true,
          source: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      logs,
      totalEntries,
      bySource: bySource.map((s) => ({ source: s.source, count: s._count._all })),
      recentEntries,
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await checkAdmin(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get("dryRun") === "true";

    const result = await runDictionaryCrawlJob({ dryRun });

    return NextResponse.json({
      message: dryRun ? "Dry-run terminé (rien inséré)" : "Crawl terminé",
      result,
    });
  } catch (e) {
    return handleError(e);
  }
}
