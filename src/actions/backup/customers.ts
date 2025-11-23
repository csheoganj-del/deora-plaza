"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function searchCustomers(query: string) {
    try {
        const customers = await prisma.customer.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { mobileNumber: { contains: query } },
                ],
            },
            take: 10,
            orderBy: { updatedAt: "desc" },
        })
        return customers
    } catch (error) {
        console.error("Failed to search customers:", error)
        return []
    }
}

export async function createCustomer(data: { name: string; mobileNumber: string; email?: string; notes?: string }) {
    try {
        const customer = await prisma.customer.create({
            data: {
                ...data,
                visitCount: 1, // Initial visit
                totalSpent: 0,
                discountTier: "none",
            },
        })
        revalidatePath("/dashboard/customers")
        return { success: true, customer }
    } catch (error) {
        console.error("Failed to create customer:", error)
        return { success: false, error }
    }
}

export async function getCustomerDetails(id: string) {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                orders: {
                    include: {
                        items: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 5,
                },
            },
        })
        return customer
    } catch (error) {
        console.error("Failed to get customer details:", error)
        return null
    }
}

export async function updateLoyaltyTier(customerId: string) {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { visitCount: true, totalSpent: true },
        })

        if (!customer) return

        let newTier = "none"
        const { visitCount, totalSpent } = customer

        if (visitCount >= 30 || totalSpent >= 30000) {
            newTier = "gold"
        } else if (visitCount >= 15 || totalSpent >= 15000) {
            newTier = "silver"
        } else if (visitCount >= 5 || totalSpent >= 5000) {
            newTier = "bronze"
        }

        await prisma.customer.update({
            where: { id: customerId },
            data: { discountTier: newTier },
        })

        revalidatePath("/dashboard/customers")
        return newTier
    } catch (error) {
        console.error("Failed to update loyalty tier:", error)
    }
}
