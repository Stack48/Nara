import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/home", /*"/projects",*/ "/studio"];

const authRoutes = ["/connexion", "/inscription"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = protectedRoutes.some((route) =>
        pathname.startsWith(route),
    );
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    if (!isProtected && !isAuthRoute) return NextResponse.next();

    // Vérifie si le cookie de session Amplify existe
    const cookies = request.cookies.getAll();
    const isAuthenticated = cookies.some(
        (cookie) =>
            cookie.name.includes("CognitoIdentityServiceProvider") &&
            cookie.name.includes("idToken"),
    );

    if (isProtected && !isAuthenticated) {
        return NextResponse.redirect(new URL("/connexion", request.url));
    }

    if (isAuthRoute && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
