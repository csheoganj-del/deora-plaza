import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname === "/" ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/avatars")

  // Skip auth for public paths
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for auth token
  const token = request.cookies.get("bloom-auth-token")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const { jwtVerify } = await import("jose")
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || "fallback_secret_for_development_only_12345"
    )

    const { payload } = await jwtVerify(token, JWT_SECRET, {
      clockTolerance: 10
    })

    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId as string)
    return response

  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("bloom-auth-token")
    return response
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public|avatars|login$|^/$).*)",
  ],
}