import { NextRequest, NextResponse } from "next/server";
import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { amplifyConfig } from "@/lib/amplify";

const { runWithAmplifyServerContext } = createServerRunner({
    config: amplifyConfig,
});

const protectedRoutes = ["/dashboard", "/projects", "/studio"];
const authRoutes = ["/connexion", "/inscription"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    if (!isProtected && !isAuthRoute) return NextResponse.next();

    const response = NextResponse.next();

    const isAuthenticated = await runWithAmplifyServerContext({
        nextServerContext: { request, response },
        operation: async (ctx) => {
            try {
                const session = await fetchAuthSession(ctx);
                return !!session.tokens;
            } catch {
                return false;
            }
        },
    });

    if (isProtected && !isAuthenticated) {
        return NextResponse.redirect(new URL("/connexion", request.url));
    }

    if (isAuthRoute && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};