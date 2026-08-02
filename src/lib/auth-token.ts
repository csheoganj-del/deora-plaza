import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const AUTH_COOKIE_NAME = "bloom-auth-token";

/** Single source of truth for JWT signing/verification (read at call time, not module load). */
export function getJwtSecretKey(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "bloom-cafe-dev-secret-key-not-for-production";
  return new TextEncoder().encode(secret);
}

export interface AuthTokenPayload extends JWTPayload {
  userId: string;
  username?: string;
  phoneNumber?: string;
  name?: string;
  role: string;
  businessUnit: string;
}

export async function signAuthToken(payload: {
  userId: string;
  username?: string;
  phoneNumber?: string;
  name?: string;
  role: string;
  businessUnit: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    userId: payload.userId,
    username: payload.username,
    phoneNumber: payload.phoneNumber,
    name: payload.name,
    role: payload.role,
    businessUnit: payload.businessUnit,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setNotBefore(now - 30)
    .setExpirationTime(now + 60 * 60 * 24)
    .sign(getJwtSecretKey());
}

export async function verifyAuthToken(
  token: string
): Promise<AuthTokenPayload | null> {
  if (!token || typeof token !== "string") return null;

  // Strip accidental quotes / Bearer prefix
  const cleaned = token
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^"|"$/g, "");

  if (!cleaned || cleaned.split(".").length !== 3) return null;

  try {
    const { payload } = await jwtVerify(cleaned, getJwtSecretKey(), {
      clockTolerance: 60,
    });
    if (!payload.userId && !(payload as any).sub) return null;
    return payload as AuthTokenPayload;
  } catch (err) {
    console.error(
      "[auth-token] verify failed:",
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}

/** Extract token from Cookie header string or Next cookies store value. */
export function extractTokenFromCookieHeader(
  cookieHeader: string | null | undefined
): string | null {
  if (!cookieHeader) return null;
  // Prefer last occurrence (client may set a second non-HttpOnly cookie)
  const parts = cookieHeader.split(";").map((c) => c.trim());
  let found: string | null = null;
  for (const part of parts) {
    if (part.startsWith(`${AUTH_COOKIE_NAME}=`)) {
      found = decodeURIComponent(part.slice(AUTH_COOKIE_NAME.length + 1));
    }
  }
  return found;
}

export function authCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true as const,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24,
  };
}
