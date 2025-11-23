"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function getAllStaff() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
        })
        return users.map(user => ({
            ...user,
            password: undefined // Don't send passwords to client
        }))
    } catch (error) {
        console.error("Failed to fetch staff:", error)
        return []
    }
}

export async function createStaff(data: {
    username: string
    password: string
    role: string
    businessUnit: string
    name: string
    mobile?: string
}) {
    try {
        const hashedPassword = await bcrypt.hash(data.password, 10)

        const user = await prisma.user.create({
            data: {
                username: data.username,
                password: hashedPassword,
                role: data.role,
                businessUnit: data.businessUnit,
                profile: JSON.stringify({ name: data.name, mobile: data.mobile || "" }),
                permissions: JSON.stringify([]),
                isActive: true,
            },
        })

        revalidatePath("/dashboard/staff")
        return { success: true, user: { ...user, password: undefined } }
    } catch (error) {
        console.error("Failed to create staff:", error)
        return { success: false, error: "Failed to create user" }
    }
}

export async function toggleStaffStatus(userId: string, isActive: boolean) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive },
        })

        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch (error) {
        console.error("Failed to update staff status:", error)
        return { success: false, error }
    }
}

export async function deleteStaff(userId: string) {
    try {
        await prisma.user.delete({
            where: { id: userId },
        })

        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete staff:", error)
        return { success: false, error }
    }
}

export async function resetPassword(userId: string, newPassword: string) {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        })

        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch (error) {
        console.error("Failed to reset password:", error)
        return { success: false, error }
    }
}
