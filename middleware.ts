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

    // Protect dashboard routes - require authentication
    if (pathname.startsWith("/dashboard")) {
      const sessionCookie = 
        request.cookies.get("better-auth.session_token") || 
        request.cookies.get("__session") ||
        request.cookies.get("better-auth.session")
      
      if (!sessionCookie) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }

      return NextResponse.next()
    }

    // Protect admin routes - require authentication
    // Admin role check happens in admin layout via requireAdmin()
    if (pathname.startsWith("/admin")) {
      const sessionCookie = 
        request.cookies.get("better-auth.session_token") || 
        request.cookies.get("__session") ||
        request.cookies.get("better-auth.session")
      
      if (!sessionCookie) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Admin role check happens in admin layout via requireAdmin()
      // Middleware just ensures user is authenticated
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
