"use server"

import { supabaseServer } from "@/lib/supabase/server"
import { createDocument, queryDocuments, updateDocument, deleteDocument, getDocument } from "@/lib/supabase/database"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export type AuthMethod = 'password' | 'phone'

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'cafe_manager' | 'bar_manager' | 'hotel_manager' | 'garden_manager' | 'waiter' | 'kitchen' | 'bartender' | 'reception' | 'hotel_reception'

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
    createdAt: string
    updatedAt: string
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

export async function getUserById(userId: string) {
  try {
    console.log("Server action: Attempting to fetch user data for ID:", userId);
    
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error("Server action: Database query error:", error);
      return { success: false, error: error.message }
    }

    console.log("Server action: User data fetched successfully:", data);
    return { success: true, data }
  } catch (error: any) {
    console.error("Server action: Error fetching user:", error);
    return { success: false, error: error.message }
  }
}

export async function createUser(data: CreateUserData) {
    try {
        // Validate required fields based on auth method
        if (data.authMethod === 'password') {
            if (!data.username || !data.password) {
                return { success: false, error: "Username and password are required for password-based auth" }
            }
        } else if (data.authMethod === 'phone') {
            if (!data.phoneNumber) {
                return { success: false, error: "Phone number is required for phone-based auth" }
            }
        }

        // Hash password if provided
        let hashedPassword: string | undefined
        if (data.password) {
            hashedPassword = await bcrypt.hash(data.password, 10)
        }

        // Prepare user data for database
        const userData = {
            username: data.username,
            authMethod: data.authMethod,
            password: hashedPassword,
            phoneNumber: data.phoneNumber,
            role: data.role,
            businessUnit: data.businessUnit,
            name: data.name,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        // Create user in database
        const result = await createDocument(USERS_COLLECTION, userData)

        if (result.success) {
            revalidatePath('/dashboard/users')
            return { success: true, user: result.data }
        } else {
            return { success: false, error: result.error }
        }
    } catch (error) {
        console.error('Error creating user:', error)
        return { success: false, error: "Failed to create user" }
    }
}

export async function updateUser(id: string, data: Partial<User>) {
    try {
        // Don't allow updating authMethod or phoneNumber through this function (unless we switch logic later)
        // But ALLOW password updates if provided
        const { authMethod, phoneNumber, password, ...updateData } = data

        let updatePayload: any = {
            ...updateData,
            updatedAt: new Date().toISOString()
        }

        // If password is provided, hash it and add to payload
        if (password && password.trim().length > 0) {
            updatePayload.password = await bcrypt.hash(password, 10)
        }

        const result = await updateDocument(USERS_COLLECTION, id, updatePayload)

        if (result.success) {
            revalidatePath('/dashboard/users')
            return { success: true, user: result.data }
        } else {
            return { success: false, error: result.error }
        }
    } catch (error) {
        console.error('Error updating user:', error)
        return { success: false, error: "Failed to update user" }
    }
}

export async function deleteUser(id: string) {
    try {
        // Prevent deletion of super admin users
        const user = await getDocument(USERS_COLLECTION, id)
        if (user?.role === 'super_admin') {
            return { success: false, error: "Cannot delete super admin user" }
        }

        const result = await deleteDocument(USERS_COLLECTION, id)

        if (result.success) {
            revalidatePath('/dashboard/users')
            return { success: true }
        } else {
            return { success: false, error: result.error }
        }
    } catch (error) {
        console.error('Error deleting user:', error)
        return { success: false, error: "Failed to delete user" }
    }
}

export async function toggleUserStatus(id: string, isActive: boolean) {
    try {
        // Prevent deactivating super admin users
        const user = await getDocument(USERS_COLLECTION, id)
        if (user?.role === 'super_admin' && !isActive) {
            return { success: false, error: "Cannot deactivate super admin user" }
        }

        const result = await updateDocument(USERS_COLLECTION, id, {
            isActive,
            updatedAt: new Date().toISOString()
        })

        if (result.success) {
            revalidatePath('/dashboard/users')
            return { success: true }
        } else {
            return { success: false, error: result.error }
        }
    } catch (error) {
        console.error('Error toggling user status:', error)
        return { success: false, error: "Failed to update user status" }
    }
}

export async function getAllUsers() {
    try {
        const data = await queryDocuments(USERS_COLLECTION, [], 'createdAt', 'desc')
        return { success: true, data }
    } catch (error) {
        console.error('Error fetching users:', error)
        return { success: false, error: "Failed to fetch users" }
    }
}

export async function upsertDeviceToken(userId: string, platform: 'android' | 'ios' | 'web', token: string) {
    try {
        const user = await getDocument(USERS_COLLECTION, userId) as any | null
        if (!user) {
            return { success: false, error: "User not found" }
        }

        const now = new Date().toISOString()
        const key = `devices.${platform}`
        const update: any = {}
        update[key] = { platform, token, lastSeenAt: now, enabled: true }

        const result = await updateDocument(USERS_COLLECTION, userId, {
            ...update,
            updatedAt: now
        })

        if (!result.success) {
            return { success: false, error: result.error }
        }

        return { success: true }
    } catch (error) {
        console.error("Error upserting device token:", error)
        return { success: false, error }
    }
}

export async function markDeviceSeen(userId: string, platform: 'android' | 'ios' | 'web') {
    try {
        const now = new Date().toISOString()
        const key = `devices.${platform}.lastSeenAt`
        const result = await updateDocument(USERS_COLLECTION, userId, {
            [key]: now,
            updatedAt: now
        })

        if (!result.success) {
            return { success: false, error: result.error }
        }

        return { success: true }
    } catch (error) {
        console.error("Error marking device seen:", error)
        return { success: false, error }
    }
}

export async function updateDeviceLocation(
    userId: string,
    platform: 'android' | 'ios' | 'web',
    location: { lat: number; lon: number; accuracy?: number; city?: string; region?: string; country?: string }
) {
    try {
        const now = new Date().toISOString()
        const key = `devices.${platform}.location`
        const update: any = {}
        update[key] = {
            lat: location.lat,
            lon: location.lon,
            accuracy: location.accuracy,
            city: location.city,
            region: location.region,
            country: location.country,
            updatedAt: now
        }
        const result = await updateDocument(USERS_COLLECTION, userId, {
            ...update,
            updatedAt: now
        })

        if (!result.success) {
            return { success: false, error: result.error }
        }

        return { success: true }
    } catch (error) {
        console.error("Error updating device location:", error)
        return { success: false, error }
    }
}

