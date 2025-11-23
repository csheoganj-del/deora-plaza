"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function getBarMenu() {
    try {
        const items = await prisma.menuItem.findMany({
            where: { businessUnit: "bar" },
            orderBy: { name: "asc" },
        })
        return items
    } catch (error) {
        console.error("Failed to fetch bar menu:", error)
        return []
    }
}

export async function createBarOrder(data: {
    tableNumber?: string
    drinkItems: { id: string; quantity: number; price: number; name: string }[]
    foodItems: { id: string; quantity: number; price: number; name: string }[]
    staffId: string
}) {
    try {
        // Generate Order Number
        const count = await prisma.order.count()
        const orderNumber = `BAR-${(count + 1).toString().padStart(3, "0")}`

        // Calculate totals
        const drinkTotal = data.drinkItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const foodTotal = data.foodItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const totalAmount = drinkTotal + foodTotal

        // Create Bar Order (drinks)
        const barOrder = await prisma.order.create({
            data: {
                orderNumber,
                type: data.tableNumber ? "dine-in" : "takeaway",
                businessUnit: "bar",
                staffId: data.staffId,
                status: "preparing",
                totalAmount: drinkTotal,
                items: {
                    create: data.drinkItems.map((item) => ({
                        menuItemId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        total: item.price * item.quantity,
                    })),
                },
            },
        })

        // If food items exist, create separate order to cafe kitchen
        let cafeOrder = null
        if (data.foodItems.length > 0) {
            const cafeOrderNumber = `BAR-FOOD-${(count + 1).toString().padStart(3, "0")}`
            cafeOrder = await prisma.order.create({
                data: {
                    orderNumber: cafeOrderNumber,
                    type: "bar-food",
                    businessUnit: "cafe",
                    staffId: data.staffId,
                    status: "preparing",
                    totalAmount: foodTotal,
                    items: {
                        create: data.foodItems.map((item) => ({
                            menuItemId: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            total: item.price * item.quantity,
                            specialInstructions: `For Bar Table ${data.tableNumber || "Counter"}`,
                        })),
                    },
                },
            })
        }

        revalidatePath("/dashboard/bar")
        revalidatePath("/dashboard/kitchen")

        return {
            success: true,
            barOrderId: barOrder.id,
            cafeOrderId: cafeOrder?.id,
            totalAmount,
            drinkTotal,
            foodTotal,
        }
    } catch (error) {
        console.error("Failed to create bar order:", error)
        return { success: false, error }
    }
}

export async function getBarOrders() {
    try {
        const orders = await prisma.order.findMany({
            where: {
                businessUnit: "bar",
                status: { in: ["preparing", "ready"] },
            },
            include: {
                items: true,
            },
            orderBy: { createdAt: "desc" },
        })
        return orders
    } catch (error) {
        console.error("Failed to fetch bar orders:", error)
        return []
    }
}

export async function updateBarOrderStatus(orderId: string, status: string) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { status },
        })

        revalidatePath("/dashboard/bar")
        return { success: true }
    } catch (error) {
        console.error("Failed to update order status:", error)
        return { success: false, error }
    }
}
