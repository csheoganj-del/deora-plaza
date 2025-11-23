"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function getUnbilledOrders(businessUnit: string = "cafe") {
    try {
        const orders = await prisma.order.findMany({
            where: {
                businessUnit,
                status: "served", // Only served orders can be billed
                bill: {
                    is: null, // No bill exists yet
                },
            },
            include: {
                items: true,
                table: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })
        return orders
    } catch (error) {
        console.error("Failed to fetch unbilled orders:", error)
        return []
    }
}

export async function generateBill(orderId: string, discountAmount: number = 0, paymentMethod: string = "cash") {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        })

        if (!order) throw new Error("Order not found")

        const subtotal = order.totalAmount
        const gstPercentage = 5.0
        const gstAmount = (subtotal * gstPercentage) / 100
        const grandTotal = subtotal + gstAmount - discountAmount

        // Generate Bill Number (Simple logic)
        const count = await prisma.bill.count()
        const billNumber = `BILL-${(count + 1).toString().padStart(4, "0")}`

        const bill = await prisma.bill.create({
            data: {
                billNumber,
                orderId,
                businessUnit: order.businessUnit,
                subtotal,
                gstPercentage,
                gstAmount,
                manualDiscount: discountAmount,
                grandTotal,
                paymentMethod: null, // Not paid yet
                paymentStatus: "pending",
                amountPaid: 0,
                change: 0,
            },
        })

        // Update order status
        await prisma.order.update({
            where: { id: orderId },
            data: { status: "billed" },
        })

        revalidatePath("/dashboard/billing")
        return { success: true, bill }
    } catch (error) {
        console.error("Failed to generate bill:", error)
        return { success: false, error }
    }
}

export async function processPayment(billId: string, paymentMethod: string, amountPaid: number) {
    try {
        const bill = await prisma.bill.findUnique({ where: { id: billId } })
        if (!bill) throw new Error("Bill not found")

        const change = amountPaid - bill.grandTotal

        if (change < 0) throw new Error("Insufficient amount paid")

        await prisma.bill.update({
            where: { id: billId },
            data: {
                paymentMethod,
                paymentStatus: "paid",
                amountPaid,
                change,
            },
        })

        // Free up the table if it was a dine-in order
        const order = await prisma.order.findUnique({ where: { id: bill.orderId } })
        if (order && order.tableId) {
            await prisma.table.update({
                where: { id: order.tableId },
                data: {
                    status: "available",
                    currentOrderId: null,
                    customerCount: 0
                }
            })
        }

        revalidatePath("/dashboard/billing")
        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch (error) {
        console.error("Failed to process payment:", error)
        return { success: false, error }
    }
}

export async function getDailyRevenue(businessUnit: string = "cafe") {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const bills = await prisma.bill.findMany({
            where: {
                businessUnit,
                paymentStatus: "paid",
                createdAt: {
                    gte: today,
                },
            },
        })

        const total = bills.reduce((sum, bill) => sum + bill.grandTotal, 0)
        const count = bills.length

        return { total, count }
    } catch (error) {
        console.error("Failed to fetch daily revenue:", error)
        return { total: 0, count: 0 }
    }
}

export async function getRevenueStats(businessUnit: string = "cafe") {
    try {
        // Get last 7 days revenue
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const bills = await prisma.bill.findMany({
            where: {
                businessUnit,
                paymentStatus: "paid",
                createdAt: {
                    gte: sevenDaysAgo,
                },
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        // Group by date
        const dailyMap = new Map<string, number>()
        bills.forEach(bill => {
            const date = bill.createdAt.toISOString().split('T')[0]
            dailyMap.set(date, (dailyMap.get(date) || 0) + bill.grandTotal)
        })

        const chartData = Array.from(dailyMap.entries()).map(([date, total]) => ({
            date,
            total
        }))

        return chartData
    } catch (error) {
        console.error("Failed to fetch revenue stats:", error)
        return []
    }
}
