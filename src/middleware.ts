import { NextRequest, NextResponse } from "next/server";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/lib/amplify";

const protectedRoutes = ["/dashboard", "/projects", "/studio", "/songs"];
const authRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = protectedRoutes.some((route) =>
        pathname.startsWith(route),
    );
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
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isAuthRoute && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
