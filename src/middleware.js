import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// Configure the pages that require authentication
const protectedPaths = ["/file-previewer", "/onboarding"];

// Pages that are accessible without authentication
const publicPaths = ["/login", "/signup", "/forget-password", "/api"];

export default withAuth(
  // Enhanced middleware function that is wrapped with NextAuth
  function middleware(request) {
    const { pathname } = request.nextUrl;

    // Check if the path is a protected route
    const isPathProtected = protectedPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Allow public paths and static assets
    const isPublicPath = publicPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    if (!isPathProtected) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run the middleware on the protected routes
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        const isPathProtected = protectedPaths.some(
          (path) => pathname === path || pathname.startsWith(`${path}/`)
        );

        // If it's a protected path and there's no token, don't authorize
        if (isPathProtected && !token) {
          return false;
        }

        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth routes (for NextAuth.js authentication)
     * 2. /_next (Next.js internals)
     * 3. /fonts, /icons, /images (static files)
     * 4. /favicon.ico, /sitemap.xml (static files)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/|icons/|api/auth).*)",
  ],
};
