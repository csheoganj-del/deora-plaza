import { NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  extractTokenFromCookieHeader,
  verifyAuthToken,
} from "@/lib/auth-token";

export async function GET(request: NextRequest) {
  try {
    // 1) Prefer request cookies (reliable in Route Handlers)
    let token =
      request.cookies.get(AUTH_COOKIE_NAME)?.value ||
      extractTokenFromCookieHeader(request.headers.get("cookie"));

    // 2) Optional Bearer header (API / mobile clients)
    if (!token) {
      const auth = request.headers.get("authorization");
      if (auth?.toLowerCase().startsWith("bearer ")) {
        token = auth.slice(7).trim();
      }
    }

    if (!token) {
      return Response.json({ user: null }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload) {
      return Response.json({ user: null }, { status: 401 });
    }

    const userId = (payload.userId as string) || (payload.sub as string);

    return Response.json({
      user: {
        id: userId,
        username: payload.username,
        name: payload.name,
        role: payload.role,
        businessUnit: payload.businessUnit,
      },
    });
  } catch (error) {
    console.error("[api/auth/me]", error);
    return Response.json(
      { error: "Authentication check failed" },
      { status: 500 }
    );
  }
}
