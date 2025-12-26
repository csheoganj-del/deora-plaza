import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  const isRootPage = request.nextUrl.pathname === "/"
  const isDemoPage = request.nextUrl.pathname.startsWith("/dashboard-sample") || 
                     request.nextUrl.pathname.startsWith("/apple-demo") ||
                     request.nextUrl.pathname.startsWith("/vision-demo") ||
                     request.nextUrl.pathname.startsWith("/adaptive-demo") ||
                     request.nextUrl.pathname.startsWith("/demo")
  const isPublicPath = isAuthPage || isRootPage || isDemoPage || request.nextUrl.pathname.startsWith("/api/public")

  // Skip auth for public paths
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for auth token
  const token = request.cookies.get("deora-auth-token")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    // Verify JWT token
    const { jwtVerify } = await import("jose")
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || "deora-plaza-secret-key-change-in-production"
    )
    
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch (error) {
    // Invalid token, redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("deora-auth-token")
    return response
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}