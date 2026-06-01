import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Authenticated user visiting login → send to dashboard
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Role-based route protection
    if (token) {
      const role = token.role as string;
      if (pathname.startsWith("/users") && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      if (pathname.startsWith("/settings") && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // returning false causes withAuth to redirect to pages.signIn below
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (pathname === "/login") return true;
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // Excludes Next.js internals, static files, and NextAuth's own API routes
  // so the middleware never intercepts its own auth endpoints.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/auth).*)"],
};
