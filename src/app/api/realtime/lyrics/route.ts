import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RealtimePresence = {
	color: string;
	cursorOffset: number | null;
	initial: string;
	lineId: string | null;
	name: string;
	projectId: string;
	sectionId: string | null;
	sessionId: string;
	updatedAt: number;
	userId: string;
};

type RealtimeDocumentPayload = {
	document: unknown;
	lineCommentsById: unknown;
	sourceSessionId: string;
	updatedAt: number;
};

type LyricsRealtimeProjectState = {
	documentPayload: RealtimeDocumentPayload | null;
	presencesBySessionId: Record<string, RealtimePresence>;
};

type LyricsRealtimeStore = Record<string, LyricsRealtimeProjectState>;

type LyricsRealtimeGlobal = typeof globalThis & {
	__naraLyricsRealtimeStore?: LyricsRealtimeStore;
};

const stalePresenceDelayMs = 7500;

function getStore(): LyricsRealtimeStore {
	const realtimeGlobal = globalThis as LyricsRealtimeGlobal;

	realtimeGlobal.__naraLyricsRealtimeStore ??= {};
	return realtimeGlobal.__naraLyricsRealtimeStore;
}

function getProjectState(projectId: string): LyricsRealtimeProjectState {
	const store = getStore();

	store[projectId] ??= {
		documentPayload: null,
		presencesBySessionId: {},
	};

	return store[projectId];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isRealtimePresence(value: unknown): value is RealtimePresence {
	return (
		isRecord(value) &&
		typeof value.sessionId === "string" &&
		typeof value.userId === "string" &&
		typeof value.name === "string" &&
		typeof value.initial === "string" &&
		typeof value.color === "string" &&
		typeof value.projectId === "string" &&
		(typeof value.sectionId === "string" || value.sectionId === null) &&
		(typeof value.lineId === "string" || value.lineId === null) &&
		(typeof value.cursorOffset === "number" || value.cursorOffset === null) &&
		typeof value.updatedAt === "number"
	);
}

function isRealtimeDocumentPayload(
	value: unknown,
): value is RealtimeDocumentPayload {
	return (
		isRecord(value) &&
		typeof value.sourceSessionId === "string" &&
		typeof value.updatedAt === "number" &&
		"document" in value &&
		"lineCommentsById" in value
	);
}

function pruneProjectPresences(projectState: LyricsRealtimeProjectState): void {
	const now = Date.now();

	Object.entries(projectState.presencesBySessionId).forEach(
		([sessionId, presence]: [string, RealtimePresence]): void => {
			if (now - presence.updatedAt > stalePresenceDelayMs) {
				delete projectState.presencesBySessionId[sessionId];
			}
		},
	);
}

function createNoStoreResponse(body: unknown, init?: ResponseInit): NextResponse {
	const response = NextResponse.json(body, init);

	response.headers.set("Cache-Control", "no-store");
	return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
	const projectId = request.nextUrl.searchParams.get("projectId") ?? "my-way";
	const sessionId = request.nextUrl.searchParams.get("sessionId");
	const projectState = getProjectState(projectId);

	pruneProjectPresences(projectState);

	return createNoStoreResponse({
		documentPayload: projectState.documentPayload,
		presences: Object.values(projectState.presencesBySessionId).filter(
			(presence: RealtimePresence): boolean => presence.sessionId !== sessionId,
		),
	});
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	const message: unknown = await request.json().catch((): null => null);

	if (!isRecord(message) || typeof message.type !== "string") {
		return createNoStoreResponse({ error: "Invalid realtime message" }, { status: 400 });
	}

	if (message.type === "presence:update") {
		const presence = message.payload;

		if (!isRealtimePresence(presence)) {
			return createNoStoreResponse({ error: "Invalid presence payload" }, { status: 400 });
		}

		const projectState = getProjectState(presence.projectId);
		projectState.presencesBySessionId[presence.sessionId] = {
			...presence,
			updatedAt: Date.now(),
		};
		pruneProjectPresences(projectState);

		return createNoStoreResponse({ ok: true });
	}

	if (message.type === "document:update") {
		const payload = message.payload;

		if (!isRealtimeDocumentPayload(payload)) {
			return createNoStoreResponse({ error: "Invalid document payload" }, { status: 400 });
		}

		const documentProjectId =
			isRecord(payload.document) && typeof payload.document.id === "string"
				? payload.document.id
				: "my-way";
		const projectState = getProjectState(documentProjectId);

		projectState.documentPayload = {
			...payload,
			updatedAt: Date.now(),
		};

		return createNoStoreResponse({ ok: true });
	}

	if (message.type === "presence:leave" && typeof message.sessionId === "string") {
		const sessionId = message.sessionId;

		Object.values(getStore()).forEach((projectState: LyricsRealtimeProjectState): void => {
			delete projectState.presencesBySessionId[sessionId];
		});

		return createNoStoreResponse({ ok: true });
	}

	return createNoStoreResponse({ error: "Unknown realtime message" }, { status: 400 });
}
