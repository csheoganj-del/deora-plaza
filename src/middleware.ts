import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Public paths that don't require authentication
    const publicPaths = ['/login', '/api/auth']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    if (isPublicPath) {
        return NextResponse.next()
    }

    // Check for auth token
    const token = request.cookies.get('auth-token')?.value

    if (!token && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
