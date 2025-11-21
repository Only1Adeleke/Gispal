import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const runtime = "nodejs"

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // NEVER run middleware on these paths
    const skipPaths = [
      "/",
      "/login",
      "/register",
      "/api/auth",
      "/_next",
      "/static",
    ]

    // Check if path should be skipped
    for (const skipPath of skipPaths) {
      if (pathname === skipPath || pathname.startsWith(skipPath + "/")) {
        return NextResponse.next()
      }
    }

    // Skip files with extensions (static assets)
    if (pathname.includes(".") && !pathname.startsWith("/api")) {
      return NextResponse.next()
    }

    // Protect dashboard and admin routes only
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      // Better Auth uses "better-auth.session_token" as the default cookie name
      // Also check for "__session" as fallback
      const sessionCookie = 
        request.cookies.get("better-auth.session_token") || 
        request.cookies.get("__session") ||
        request.cookies.get("better-auth.session")
      
      if (!sessionCookie) {
        // No session cookie - redirect to login
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Session cookie exists - allow request
      return NextResponse.next()
    }

    // Allow all other requests
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // On error, allow request to proceed
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Better Auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
  runtime: "nodejs",
}
