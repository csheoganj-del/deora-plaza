"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

type CreateOrderParams = {
    tableId?: string
    items: {
        id: string // menuItemId
        quantity: number
        price: number
    }[]
    businessUnit: string
    staffId: string // In real app, get from session
}

export async function createOrder(params: CreateOrderParams) {
    try {
        // Generate Order Number (Simple logic for now)
        const count = await prisma.order.count()
        const orderNumber = `ORD-${(count + 1).toString().padStart(3, "0")}`

        // Calculate total
        const totalAmount = params.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

        // Create Order
        const order = await prisma.order.create({
            data: {
                orderNumber,
                type: params.tableId ? "dine-in" : "takeaway",
                businessUnit: params.businessUnit,
                tableId: params.tableId,
                staffId: params.staffId, // Should be current user ID
                status: "preparing", // Send directly to kitchen
                totalAmount,
                items: {
                    create: params.items.map((item) => ({
                        menuItemId: item.id,
                        name: "Item Name Placeholder", // Ideally fetch name again or pass it
                        price: item.price,
                        quantity: item.quantity,
                        total: item.price * item.quantity,
                    })),
                },
            },
        })

        // If table order, update table status
        if (params.tableId) {
            await prisma.table.update({
                where: { id: params.tableId },
                data: {
                    status: "occupied",
                    currentOrderId: order.id
                },
            })
        }

        revalidatePath("/dashboard/tables")
        revalidatePath("/dashboard/orders")

        return { success: true, orderId: order.id }
    } catch (error) {
        console.error("Failed to create order:", error)
        return { success: false, error }
    }
}
