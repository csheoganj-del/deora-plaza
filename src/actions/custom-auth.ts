"use server"

import { queryDocuments } from "@/lib/supabase/database"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || (() => {
        if (process.env.NODE_ENV === 'production') {
            throw new Error("JWT_SECRET must be set in production environment");
        }
        console.warn("WARNING: Using fallback JWT secret in development. Set JWT_SECRET in production.");
        return "deora-plaza-dev-secret-key-not-for-production";
    })()
)

if (!process.env.JWT_SECRET) {
    console.warn("WARNING: JWT_SECRET is not set in environment variables. Using fallback secret.");
}

export interface LoginResult {
    success: boolean
    error?: string
    user?: {
        id: string
        username?: string
        phoneNumber?: string
        name: string
        role: string
        businessUnit: string
    }
}

export async function loginWithCustomUser(
    identifier: string, // username or phone number
    password: string
): Promise<LoginResult> {
    // Add timeout wrapper to prevent hanging
    return Promise.race([
        loginWithCustomUserInternal(identifier, password),
        new Promise<LoginResult>((_, reject) =>
            setTimeout(() => reject(new Error("Login timeout")), 8000) // Reduced from 15s to 8s
        )
    ]).catch((error) => {
        console.error("Login timeout or error:", error);
        return {
            success: false,
            error: "Login is taking too long. Please check your connection and try again."
        };
    });
}

async function loginWithCustomUserInternal(
    identifier: string,
    password: string
): Promise<LoginResult> {
    try {
        const totalStartTime = Date.now();
        console.log(`[PERF] Login attempt started for identifier: ${identifier}`);

        // Optimized: Use single query with OR condition instead of sequential queries
        const queryStartTime = Date.now();
        const { data: users, error } = await (await import("@/lib/supabase/server")).supabaseServer
            .from("users")
            .select("*")
            .or(`username.eq.${identifier.toLowerCase()},phoneNumber.eq.${identifier}`)
            .limit(1);

        const queryDuration = Date.now() - queryStartTime;
        console.log(`[PERF] User lookup query completed in ${queryDuration}ms`);

        if (error) {
            console.error("Database query error:", error);
            return { success: false, error: "An error occurred during login. Please try again." };
        }

        const user = users && users.length > 0 ? users[0] : null;

        if (!user) {
            console.log("User not found:", identifier);
            return { success: false, error: "Invalid username or password" }
        }

        console.log("Found user:", user);

        // Check if user is active
        if (!user.isActive) {
            return { success: false, error: "Account is deactivated. Please contact administrator." }
        }

        // Verify password (only for password-based auth)
        if (user.authMethod === "password") {
            if (!user.password) {
                return { success: false, error: "Invalid username or password" }
            }

            const bcryptStartTime = Date.now();
            const isValidPassword = await bcrypt.compare(password, user.password)
            const bcryptDuration = Date.now() - bcryptStartTime;
            console.log(`[PERF] Password verification completed in ${bcryptDuration}ms`);

            if (!isValidPassword) {
                return { success: false, error: "Invalid username or password" }
            }
        } else {
            // For phone-based auth, password login is not supported
            return { success: false, error: "This account uses phone authentication. Please use OTP login." }
        }

        // Create JWT token with more robust timing
        const jwtStartTime = Date.now();
        const now = Math.floor(Date.now() / 1000);
        console.log("Creating JWT token with timestamp:", now);

        const token = await new SignJWT({
            userId: user.id,
            username: user.username,
            phoneNumber: user.phoneNumber,
            name: user.name,
            role: user.role,
            businessUnit: user.businessUnit,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime(now + (24 * 60 * 60)) // 24 hours from now
            .setIssuedAt(now - 5) // 5 seconds in the past to account for clock skew
            .setNotBefore(now - 5) // Allow 5 seconds clock skew
            .sign(JWT_SECRET)

        const jwtDuration = Date.now() - jwtStartTime;
        console.log(`[PERF] JWT token created in ${jwtDuration}ms, length:`, token.length);
        console.log("Token payload:", {
            userId: user.id,
            username: user.username,
            role: user.role,
            businessUnit: user.businessUnit
        });

        // Set cookie with more explicit options
        const cookieStartTime = Date.now();
        const cookieStore = await cookies()
        console.log("Setting auth cookie with options:", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
            domain: undefined,
        });

        cookieStore.set("deora-auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
            domain: undefined,
        })

        const cookieDuration = Date.now() - cookieStartTime;
        console.log(`[PERF] Cookie set in ${cookieDuration}ms`);

        const totalDuration = Date.now() - totalStartTime;
        console.log(`[PERF] ✅ Total login completed in ${totalDuration}ms`);
        console.log("Login successful, returning user data:", {
            id: user.id,
            username: user.username,
            role: user.role,
            businessUnit: user.businessUnit
        });

        // Clear any conflicting Supabase auth state to avoid conflicts
        try {
            // This will be handled client-side after redirect
        } catch (e) {
            console.warn('Could not clear Supabase auth state:', e);
        }

        // Log login activity with location (Fire and forget style safely)


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
        }
    } catch (error) {
        console.error("Login error:", error)
        return {
            success: false,
            error: "An error occurred during login. Please try again.",
        }
    }
}

export async function logoutCustomUser() {
    const cookieStore = await cookies()

    // Force expire the cookie
    cookieStore.set("deora-auth-token", "", {
        maxAge: 0,
        path: "/",
        expires: new Date(0)
    })

    // Clear any cached data
    revalidatePath("/", "layout")

    // Redirect to login page
    redirect("/login")
}

export async function getCurrentCustomUser() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("deora-auth-token")?.value

        if (!token) {
            console.log("No auth token found in cookies")
            return null
        }

        const verified = await jwtVerify(token, JWT_SECRET, {
            clockTolerance: 10 // Allow 10 seconds clock skew
        })

        console.log("Token verified successfully for user:", verified.payload.userId)
        return verified.payload as any
    } catch (error) {
        console.error("Token verification failed in getCurrentCustomUser:", error instanceof Error ? error.message : String(error))
        return null
    }
}

// Debug function to check auth status
export async function debugAuthStatus() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("deora-auth-token")?.value

        console.log("Debug Auth Status:", {
            hasToken: !!token,
            tokenLength: token?.length,
            tokenPreview: token?.substring(0, 20) + "...",
            jwtSecret: process.env.JWT_SECRET ? "Set" : "Not set"
        })

        if (token) {
            try {
                const verified = await jwtVerify(token, JWT_SECRET, {
                    clockTolerance: 10
                })
                console.log("Token is valid, expires:", new Date(verified.payload.exp! * 1000))
                return { valid: true, payload: verified.payload }
            } catch (error) {
                console.log("Token is invalid:", error instanceof Error ? error.message : String(error))
                return { valid: false, error: error instanceof Error ? error.message : String(error) }
            }
        }

        return { valid: false, error: "No token" }
    } catch (error) {
        console.error("Debug auth status error:", error)
        return { valid: false, error: error instanceof Error ? error.message : String(error) }
    }
}


