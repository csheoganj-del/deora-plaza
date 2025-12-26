"use server"

import { queryDocuments } from "@/lib/supabase/database"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
// import { logActivityWithLocation } from "@/actions/location"

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "deora-plaza-secret-key-change-in-production"
)

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
            setTimeout(() => reject(new Error("Login timeout")), 15000)
        )
    ]).catch((error) => {
        console.error("Login timeout or error:", error);
        return {
            success: false,
            error: "Login is taking too long. Please try again."
        };
    });
}

async function loginWithCustomUserInternal(
    identifier: string,
    password: string
): Promise<LoginResult> {
    try {
        // Query users table for matching username or phone number with timeout
        let user = null;
        
        // Try to find by username first
        const usersByUsername = await queryDocuments("users", [
            { field: "username", operator: "==", value: identifier.toLowerCase() }
        ], undefined, "asc", 1);
        
        if (usersByUsername.length > 0) {
            user = usersByUsername[0];
        } else {
            // Try to find by phone number
            const usersByPhone = await queryDocuments("users", [
                { field: "phoneNumber", operator: "==", value: identifier }
            ], undefined, "asc", 1);
            
            if (usersByPhone.length > 0) {
                user = usersByPhone[0];
            }
        }

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

            const isValidPassword = await bcrypt.compare(password, user.password)
            if (!isValidPassword) {
                return { success: false, error: "Invalid username or password" }
            }
        } else {
            // For phone-based auth, password login is not supported
            return { success: false, error: "This account uses phone authentication. Please use OTP login." }
        }

        // Create JWT token
        const token = await new SignJWT({
            userId: user.id,
            username: user.username,
            phoneNumber: user.phoneNumber,
            name: user.name,
            role: user.role,
            businessUnit: user.businessUnit,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("24h")
            .setIssuedAt()
            .sign(JWT_SECRET)

        // Set cookie
        const cookieStore = await cookies()
        cookieStore.set("deora-auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        })

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
            return null
        }

        const verified = await jwtVerify(token, JWT_SECRET)
        return verified.payload as any
    } catch (error) {
        return null
    }
}


