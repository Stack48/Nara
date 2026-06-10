import { NextResponse } from "next/server";
import { UsersController } from "@/server/users/controller";
import { handleError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/api-middleware";

export let GET = withErrorHandler(async () => {
    try {
    const users = await UsersController.findAll();
    return NextResponse.json(users);
    } catch (e) {
    return handleError(e);
    }
    });
export let POST = withErrorHandler(async (request: Request) => {
    try {
    const body = await request.json();
    const user = await UsersController.create(body);
    return NextResponse.json(user, { status: 201 });
    } catch (e) {
    return handleError(e);
    }
    });
