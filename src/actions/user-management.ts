"use server"

import { createDocument, queryDocuments, updateDocument, deleteDocument, getDocument } from "@/lib/firebase/firestore"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export type AuthMethod = 'password' | 'phone'

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'staff'

export type BusinessUnit = 'all' | 'cafe' | 'bar' | 'hotel' | 'garden'

export interface User {
    id: string
    username?: string
    authMethod: AuthMethod
    password?: string // Only for password-based users (hashed)
    phoneNumber?: string // Only for OTP-based users
    role: UserRole
    businessUnit: BusinessUnit
    name: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export interface CreateUserData {
    authMethod: AuthMethod
    username?: string
    password?: string
    phoneNumber?: string
    role: UserRole
    businessUnit: BusinessUnit
    name: string
}

const USERS_COLLECTION = "users"

export async function createUser(data: CreateUserData) {
    try {
        // Validate required fields based on auth method
        if (data.authMethod === 'password') {
            if (!data.username || !data.password) {
                return { success: false, error: "Username and password are required for password-based auth" }
            }

            // Check if username already exists
            const existingUser = await getDocument(USERS_COLLECTION, data.username)
            if (existingUser) {
                return { success: false, error: "Username already exists" }
            }
        } else if (data.authMethod === 'phone') {
            if (!data.phoneNumber) {
                return { success: false, error: "Phone number is required for OTP-based auth" }
            }

            // Check if phone number already exists
            const users = await queryDocuments(USERS_COLLECTION, [
                { field: 'phoneNumber', operator: '==', value: data.phoneNumber }
            ])
            if (users.length > 0) {
                return { success: false, error: "Phone number already registered" }
            }
        }

        // Hash password if using password auth
        let hashedPassword: string | undefined
        if (data.authMethod === 'password' && data.password) {
            hashedPassword = await bcrypt.hash(data.password, 10)
        }

        // Create user document
        const userId = data.authMethod === 'password' ? data.username! : `phone_${data.phoneNumber!.replace(/\+/g, '')}`

        const userData: Omit<User, 'id'> = {
            username: data.username,
            authMethod: data.authMethod,
            password: hashedPassword,
            phoneNumber: data.phoneNumber,
            role: data.role,
            businessUnit: data.businessUnit,
            name: data.name,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const result = await createDocument(USERS_COLLECTION, userData, userId)

        if (!result.success) {
            return { success: false, error: result.error }
        }

        revalidatePath("/dashboard/users")
        return { success: true, userId }
    } catch (error) {
        console.error("Error creating user:", error)
        return { success: false, error }
    }
}

export async function getUsers() {
    try {
        const users = await queryDocuments(USERS_COLLECTION, []) as any[]

        // Remove password field and convert dates to strings
        return users.map(user => {
            const { password, ...userWithoutPassword } = user

            // Helper to convert any date-like object to ISO string
            const toISOString = (date: any) => {
                if (!date) return date
                if (typeof date === 'string') return date
                if (date instanceof Date) return date.toISOString()
                if (date.toDate && typeof date.toDate === 'function') return date.toDate().toISOString()
                if (date._seconds) return new Date(date._seconds * 1000).toISOString()
                return date
            }

            return {
                ...userWithoutPassword,
                createdAt: toISOString(user.createdAt),
                updatedAt: toISOString(user.updatedAt)
            }
        })
    } catch (error) {
        console.error("Error fetching users:", error)
        return []
    }
}

export async function getUserById(userId: string) {
    try {
        const user = await getDocument(USERS_COLLECTION, userId) as any | null

        if (!user) {
            return null
        }

        // Helper to convert any date-like object to ISO string
        const toISOString = (date: any) => {
            if (!date) return date
            if (typeof date === 'string') return date
            if (date instanceof Date) return date.toISOString()
            if (date.toDate && typeof date.toDate === 'function') return date.toDate().toISOString()
            if (date._seconds) return new Date(date._seconds * 1000).toISOString()
            return date
        }

        // Remove password field and convert dates
        const { password, ...userWithoutPassword } = user
        return {
            ...userWithoutPassword,
            createdAt: toISOString(user.createdAt),
            updatedAt: toISOString(user.updatedAt)
        }
    } catch (error) {
        console.error("Error fetching user:", error)
        return null
    }
}

export async function updateUser(userId: string, data: Partial<CreateUserData>) {
    try {
        const updateData: any = {
            ...data,
            updatedAt: new Date()
        }

        // Don't allow changing auth method or password through this function
        delete updateData.authMethod
        delete updateData.password

        await updateDocument(USERS_COLLECTION, userId, updateData)

        revalidatePath("/dashboard/users")
        return { success: true }
    } catch (error) {
        console.error("Error updating user:", error)
        return { success: false, error }
    }
}

export async function deleteUser(userId: string) {
    try {
        await deleteDocument(USERS_COLLECTION, userId)

        revalidatePath("/dashboard/users")
        return { success: true }
    } catch (error) {
        console.error("Error deleting user:", error)
        return { success: false, error }
    }
}

export async function resetUserPassword(userId: string, newPassword: string) {
    try {
        // Get user to verify it's a password-based account
        const user = await getDocument(USERS_COLLECTION, userId) as User | null

        if (!user) {
            return { success: false, error: "User not found" }
        }

        if (user.authMethod !== 'password') {
            return { success: false, error: "Cannot reset password for OTP-based users" }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await updateDocument(USERS_COLLECTION, userId, {
            password: hashedPassword,
            updatedAt: new Date()
        })

        revalidatePath("/dashboard/users")
        return { success: true }
    } catch (error) {
        console.error("Error resetting password:", error)
        return { success: false, error }
    }
}

export async function toggleUserStatus(userId: string) {
    try {
        const user = await getDocument(USERS_COLLECTION, userId) as User | null

        if (!user) {
            return { success: false, error: "User not found" }
        }

        await updateDocument(USERS_COLLECTION, userId, {
            isActive: !user.isActive,
            updatedAt: new Date()
        })

        revalidatePath("/dashboard/users")
        return { success: true }
    } catch (error) {
        console.error("Error toggling user status:", error)
        return { success: false, error }
    }
}

export async function upsertDeviceToken(userId: string, platform: 'android' | 'ios' | 'web', token: string) {
    try {
        const user = await getDocument(USERS_COLLECTION, userId) as any | null
        if (!user) {
            return { success: false, error: "User not found" }
        }

        const now = new Date()
        const key = `devices.${platform}`
        const update: any = {}
        update[key] = { platform, token, lastSeenAt: now, enabled: true }

        await updateDocument(USERS_COLLECTION, userId, {
            ...update,
            updatedAt: now
        })

        return { success: true }
    } catch (error) {
        console.error("Error upserting device token:", error)
        return { success: false, error }
    }
}

export async function markDeviceSeen(userId: string, platform: 'android' | 'ios' | 'web') {
    try {
        const now = new Date()
        const key = `devices.${platform}.lastSeenAt`
        await updateDocument(USERS_COLLECTION, userId, {
            [key]: now,
            updatedAt: now
        })
        return { success: true }
    } catch (error) {
        console.error("Error marking device seen:", error)
        return { success: false, error }
    }
}

// duplicate definitions removed
