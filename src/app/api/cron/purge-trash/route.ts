// src/app/api/cron/purge-trash/route.ts
import { NextRequest, NextResponse } from "next/server";
import { purgeExpiredFiles } from "@/server/trash.service";

// POST /api/cron/purge-trash
export async function POST(request: NextRequest) {
    const secret = request.headers.get("x-cron-secret");

    // Protection : si CRON_SECRET n'est pas défini, on refuse par sécurité.
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await purgeExpiredFiles();
    return NextResponse.json({ success: true, ...result });
}