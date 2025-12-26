import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Add detailed logging for debugging
  console.log("Middleware: Processing request for:", request.nextUrl.pathname);
  
  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  const isRootPage = request.nextUrl.pathname === "/"
  const isDemoPage = request.nextUrl.pathname.startsWith("/dashboard-sample") ||
    request.nextUrl.pathname.startsWith("/apple-demo") ||
    request.nextUrl.pathname.startsWith("/vision-demo") ||
    request.nextUrl.pathname.startsWith("/adaptive-demo") ||
    request.nextUrl.pathname.startsWith("/demo") ||
    request.nextUrl.pathname.startsWith("/test-tailwind-css") ||
    request.nextUrl.pathname.startsWith("/test-tailwind") ||
    request.nextUrl.pathname.startsWith("/tailwind-test") ||
    request.nextUrl.pathname.startsWith("/tailwind-comprehensive-test")
  const isPublicPath = isAuthPage || isRootPage || isDemoPage || 
    request.nextUrl.pathname.startsWith("/api/public") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon")

  console.log("Middleware: Path analysis:", {
    path: request.nextUrl.pathname,
    isAuthPage,
    isRootPage,
    isDemoPage,
    isPublicPath
  });

  // Skip auth for public paths
  if (isPublicPath) {
    console.log("Middleware: Allowing public path:", request.nextUrl.pathname);
    return NextResponse.next()
  }

  // Check for auth token
  const token = request.cookies.get("deora-auth-token")?.value
  console.log("Middleware: Token check:", { hasToken: !!token, tokenLength: token?.length });

  if (!token) {
    console.log("Middleware: No token found, redirecting to login");
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    console.log("Middleware: Attempting JWT verification");
    
    // Verify JWT token with better error handling
    const { jwtVerify } = await import("jose")
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "deora-plaza-secret-key-change-in-production"
    )

    const { payload } = await jwtVerify(token, JWT_SECRET, {
      clockTolerance: 30 // Increase clock tolerance to 30 seconds
    })

    console.log("Middleware: Token verified successfully for user:", payload.userId);
    
    // Add user info to request headers for debugging
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId as string)
    return response

  } catch (error) {
    // Log the specific error for debugging
    console.error("Middleware: JWT verification failed:", {
      error: error instanceof Error ? error.message : String(error),
      path: request.nextUrl.pathname,
      hasToken: !!token,
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 20),
      jwtSecret: process.env.JWT_SECRET ? "Set" : "Not set"
    })
    
    // Invalid token, redirect to login
    console.log("Middleware: Redirecting to login due to invalid token");
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("deora-auth-token")
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - root path (/)
     * - login path
     * - test pages
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public|login$|^/$|test-tailwind|test-tailwind-css|tailwind-test|tailwind-comprehensive-test).*)",
  ],
}