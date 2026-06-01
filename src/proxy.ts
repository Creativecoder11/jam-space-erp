import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redirect to login if not authenticated
    if (!token && !pathname.startsWith("/login") && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Redirect to dashboard if already authenticated and visiting auth pages
    if (token && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Role-based route protection
    if (token) {
      const role = token.role as string;

      // Only super admin can access user management
      if (pathname.startsWith("/users") && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Only super admin can access settings
      if (pathname.startsWith("/settings") && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
