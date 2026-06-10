import { NextResponse } from "next/server";
import { UsersController } from "@/server/users/controller";
import { handleError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/api-middleware";

export let GET = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
    const { id } = await params;
    const user = await UsersController.findById(id);
    return NextResponse.json(user);
    } catch (e) {
    return handleError(e);
    }
    });
export let PUT = withErrorHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
    const { id } = await params;
    const body = await request.json();
    const user = await UsersController.update(id, body);
    return NextResponse.json(user);
    } catch (e) {
    return handleError(e);
    }
    });
export let DELETE = withErrorHandler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
    const { id } = await params;
    await UsersController.remove(id);
    return new NextResponse(null, { status: 204 });
    } catch (e) {
    return handleError(e);
    }
    });
