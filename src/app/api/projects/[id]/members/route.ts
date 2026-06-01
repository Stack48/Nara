import { NextRequest, NextResponse } from "next/server";
import { getMembers, addMember } from "@/server/membres/controller";
import { unauthorized } from "@/middleware/rbac.middleware";

function getCognitoId(request: NextRequest): string | null {
    return request.headers.get("x-cognito-id");
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const result = await getMembers(cognitoId, params.id);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
    } catch (error) {
        console.error("GET members error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cognitoId = getCognitoId(request);
        if (!cognitoId) return unauthorized();

        const body = await request.json();
        const result = await addMember(cognitoId, params.id, body);
        return NextResponse.json(result.data ?? result.error, { status: result.status });
    } catch (error) {
        console.error("POST members error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}