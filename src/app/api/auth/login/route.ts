import { NextRequest, NextResponse } from "next/server";
import { loginWithCustomUser } from "@/actions/custom-auth";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth-token";

/**
 * POST /api/auth/login
 * Body: { username: string, password: string }
 *
 * Sets HttpOnly session cookie and returns user + token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body.username || body.identifier || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const result = await loginWithCustomUser(username, password);

    if (!result.success || !result.user || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || "Invalid credentials" },
        { status: 401 }
      );
    }

    const isSecure =
      process.env.NODE_ENV === "production" &&
      (process.env.VERCEL === "1" ||
        process.env.NEXT_PUBLIC_VERCEL_ENV === "production");

    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    });

    // Set cookie on the response (most reliable for browsers)
    response.cookies.set(
      AUTH_COOKIE_NAME,
      result.token,
      authCookieOptions(isSecure)
    );

    return response;
  } catch (error) {
    console.error("[api/auth/login]", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
