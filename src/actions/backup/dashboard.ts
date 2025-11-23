"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getDashboardStats() {
    try {
        const [activeOrdersCount, totalCustomers, totalRevenueResult, recentOrders] = await Promise.all([
            prisma.order.count({
                where: {
                    status: { in: ["pending", "preparing", "ready"] }
                }
            }),
            prisma.customer.count(),
            prisma.bill.aggregate({
                _sum: {
                    grandTotal: true
                },
                where: {
                    paymentStatus: "paid"
                }
            }),
            prisma.order.findMany({
                take: 5,
                orderBy: {
                    createdAt: "desc"
                },
                include: {
                    table: true,
                    customer: true
                }
            })
        ])

        return {
            activeOrders: activeOrdersCount,
            totalCustomers: totalCustomers,
            totalRevenue: totalRevenueResult._sum.grandTotal || 0,
            recentOrders: recentOrders
        }
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
        return {
            activeOrders: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            recentOrders: []
        }
    }
}
