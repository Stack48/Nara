import { NextRequest, NextResponse } from "next/server";
import { runDictionaryCrawlJob } from "@/server/crawl/crawl.job";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await runDictionaryCrawlJob();

  return NextResponse.json({
    message: "Cron crawl terminé",
    result,
  });
}
