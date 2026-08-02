"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  signAuthToken,
  verifyAuthToken,
} from "@/lib/auth-token";

if (!process.env.JWT_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.warn(
    "WARNING: JWT_SECRET is not set. Using fallback secret for development."
  );
}

export interface LoginResult {
  success: boolean;
  error?: string;
  token?: string;
  user?: {
    id: string;
    username?: string;
    phoneNumber?: string;
    name: string;
    role: string;
    businessUnit: string;
  };
}

/** Demo accounts — always available for cafe_manager / admin (and full demo when Supabase is placeholder). */
const DEMO_PASSWORD = "ManageCafe123";
// bcrypt hash of ManageCafe123 (cost 10)
const DEMO_PASSWORD_HASH =
  "$2b$10$ad9zvDS30ToipIzzulu4heb0Z43Z35Agb1AXuiWj.Ny3aqjf5OtK2";

const DEMO_USERS = [
  {
    id: "demo-cafe-mgr",
    username: "cafe_manager",
    password: DEMO_PASSWORD_HASH,
    role: "cafe_manager",
    name: "Cafe Manager",
    businessUnit: "cafe",
    isActive: true,
    authMethod: "password" as const,
  },
  {
    id: "demo-admin",
    username: "admin",
    password: DEMO_PASSWORD_HASH,
    role: "super_admin",
    name: "System Administrator",
    businessUnit: "all",
    isActive: true,
    authMethod: "password" as const,
  },
];

function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return !url || url.includes("placeholder");
}

async function verifyDemoPassword(password: string): Promise<boolean> {
  // Exact match first (fast, reliable for known demo password)
  if (password === DEMO_PASSWORD) return true;
  try {
    return await bcrypt.compare(password, DEMO_PASSWORD_HASH);
  } catch {
    return false;
  }
}

export async function loginWithCustomUser(
  identifier: string,
  password: string
): Promise<LoginResult> {
  return Promise.race([
    loginWithCustomUserInternal(identifier, password),
    new Promise<LoginResult>((_, reject) =>
      setTimeout(() => reject(new Error("Login timeout")), 12000)
    ),
  ]).catch((error) => {
    console.error("Login timeout or error:", error);
    return {
      success: false,
      error:
        "Login is taking too long. Please check your connection and try again.",
    };
  });
}

async function loginWithCustomUserInternal(
  identifier: string,
  password: string
): Promise<LoginResult> {
  try {
    const totalStartTime = Date.now();
    const normalizedId = (identifier || "").trim().toLowerCase();
    console.log(`[AUTH] Login attempt: ${normalizedId}`);

    if (!normalizedId || !password) {
      return { success: false, error: "Username and password are required" };
    }

    let user: any = null;

    // Always allow demo accounts for cafe_manager / admin
    const demoUser = DEMO_USERS.find((u) => u.username === normalizedId);
    if (demoUser) {
      console.log("[AUTH] Demo user path");
      const valid = await verifyDemoPassword(password);
      if (!valid) {
        return { success: false, error: "Invalid username or password" };
      }
      user = demoUser;
    } else if (isDemoMode()) {
      // Placeholder env: only demo users exist
      return { success: false, error: "Invalid username or password" };
    } else {
      // Real Supabase users
      console.log("[AUTH] Querying Supabase...");
      try {
        const { supabaseServer } = await import("@/lib/supabase/server");
        const result = await supabaseServer
          .from("users")
          .select("*")
          .or(
            `username.eq.${normalizedId},phoneNumber.eq.${identifier.trim()}`
          )
          .limit(1);

        if (result.error) {
          console.error("Database query error:", result.error);
          return {
            success: false,
            error: "An error occurred during login. Please try again.",
          };
        }

        user = result.data?.[0] || null;
        if (!user) {
          return { success: false, error: "Invalid username or password" };
        }
        if (!user.isActive) {
          return {
            success: false,
            error: "Account is deactivated. Please contact administrator.",
          };
        }
        if (user.authMethod === "password") {
          if (!user.password) {
            return { success: false, error: "Invalid username or password" };
          }
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return { success: false, error: "Invalid username or password" };
          }
        } else {
          return {
            success: false,
            error:
              "This account uses phone authentication. Please use OTP login.",
          };
        }
      } catch (supaErr) {
        console.error("[AUTH] Supabase failed:", supaErr);
        return {
          success: false,
          error: "An error occurred during login. Please try again.",
        };
      }
    }

    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }

    const token = await signAuthToken({
      userId: user.id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
      businessUnit: user.businessUnit,
    });

    const cookieStore = await cookies();
    const isSecure =
      process.env.NODE_ENV === "production" &&
      (process.env.VERCEL === "1" ||
        process.env.NEXT_PUBLIC_VERCEL_ENV === "production");

    cookieStore.set(
      AUTH_COOKIE_NAME,
      token,
      authCookieOptions(isSecure)
    );

    console.log(
      `[AUTH] Login OK for ${user.username} in ${Date.now() - totalStartTime}ms`
    );

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
        businessUnit: user.businessUnit,
      },
      token,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "An error occurred during login. Please try again.",
    };
  }
}

export async function logoutCustomUser() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    maxAge: 0,
    path: "/",
    expires: new Date(0),
  });
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getCurrentCustomUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyAuthToken(token);
    if (!payload) return null;

    // Normalize id field for callers expecting userId
    return {
      ...payload,
      userId: (payload.userId as string) || (payload.sub as string),
    } as any;
  } catch (error) {
    console.error(
      "[getCurrentCustomUser]",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

export async function debugAuthStatus() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { valid: false, error: "No token" };
    }

    const payload = await verifyAuthToken(token);
    if (!payload) {
      return { valid: false, error: "Invalid token" };
    }
    return { valid: true, payload };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
