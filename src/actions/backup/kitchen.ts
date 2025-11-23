"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function getKitchenOrders(businessUnit: string = "cafe") {
    try {
        const orders = await prisma.order.findMany({
            where: {
                businessUnit,
                status: {
                    in: ["preparing", "ready"], // Fetch orders that are active in kitchen
                },
            },
            include: {
                items: true,
                table: true,
            },
            orderBy: {
                createdAt: "asc", // Oldest orders first
            },
        })
        return orders
    } catch (error) {
        console.error("Failed to fetch kitchen orders:", error)
        return []
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { status },
        })

        revalidatePath("/dashboard/kitchen")
        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch (error) {
        console.error("Failed to update order status:", error)
        return { success: false, error }
    }
}

export async function updateOrderItemStatus(itemId: string, status: string) {
    // This would be for more granular control, not implementing fully yet
    // but good to have the placeholder
    return { success: true }
}
