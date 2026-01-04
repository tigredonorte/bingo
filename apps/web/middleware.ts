import { auth } from "@repo/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware configuration for authentication
 *
 * This middleware checks authentication status and redirects
 * unauthenticated users to the login page for protected routes.
 */
export async function middleware(request: NextRequest) {
  // Use the auth middleware from next-auth
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Check if user is authenticated
  const isAuthenticated = !!session;

  // Define protected routes (add routes that require authentication)
  const protectedRoutes = ["/dashboard", "/profile", "/settings"];

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if already authenticated and trying to access login
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (assets)
     * - api/auth (auth API routes - must be accessible)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)",
  ],
};
