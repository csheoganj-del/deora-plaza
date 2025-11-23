"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function getMonthlySettlements(year?: number, month?: number) {
    try {
        const now = new Date()
        const targetYear = year || now.getFullYear()
        const targetMonth = month || now.getMonth() + 1
        const monthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}`

        const settlements = await prisma.partnershipSettlement.findMany({
            where: { month: monthStr },
            orderBy: { createdAt: "desc" },
        })

        return settlements
    } catch (error) {
        console.error("Failed to fetch settlements:", error)
        return []
    }
}

export async function getAllSettlements() {
    try {
        const settlements = await prisma.partnershipSettlement.findMany({
            orderBy: { month: "desc" },
        })
        return settlements
    } catch (error) {
        console.error("Failed to fetch all settlements:", error)
        return []
    }
}

export async function generateMonthlySettlement(businessUnit: string, month: string) {
    try {
        // Parse month (YYYY-MM)
        const [year, monthNum] = month.split('-').map(Number)
        const startDate = new Date(year, monthNum - 1, 1)
        const endDate = new Date(year, monthNum, 0, 23, 59, 59)

        // Get all paid bills for this business unit in this month
        const bills = await prisma.bill.findMany({
            where: {
                businessUnit,
                paymentStatus: "paid",
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })

        const totalRevenue = bills.reduce((sum, bill) => sum + bill.grandTotal, 0)
        const ownerPercentage = 40.0
        const ownerShare = totalRevenue * (ownerPercentage / 100)
        const managerShare = totalRevenue - ownerShare

        // Check if settlement already exists
        const existing = await prisma.partnershipSettlement.findFirst({
            where: {
                businessUnit,
                month,
            },
        })

        if (existing) {
            // Update existing
            const settlement = await prisma.partnershipSettlement.update({
                where: { id: existing.id },
                data: {
                    totalRevenue,
                    ownerShare,
                    managerShare,
                },
            })
            revalidatePath("/dashboard/settlements")
            return { success: true, settlement }
        } else {
            // Create new
            const settlement = await prisma.partnershipSettlement.create({
                data: {
                    businessUnit,
                    month,
                    totalRevenue,
                    ownerPercentage,
                    ownerShare,
                    managerShare,
                    status: "pending",
                },
            })
            revalidatePath("/dashboard/settlements")
            return { success: true, settlement }
        }
    } catch (error) {
        console.error("Failed to generate settlement:", error)
        return { success: false, error }
    }
}

export async function markSettlementPaid(settlementId: string) {
    try {
        await prisma.partnershipSettlement.update({
            where: { id: settlementId },
            data: {
                status: "completed",
                settlementDate: new Date(),
            },
        })

        revalidatePath("/dashboard/settlements")
        return { success: true }
    } catch (error) {
        console.error("Failed to mark settlement as paid:", error)
        return { success: false, error }
    }
}

export async function getCurrentMonthSummary() {
    try {
        const now = new Date()
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const settlements = await prisma.partnershipSettlement.findMany({
            where: { month: monthStr },
        })

        const total = settlements.reduce((sum, s) => sum + s.totalRevenue, 0)
        const ownerTotal = settlements.reduce((sum, s) => sum + s.ownerShare, 0)
        const managerTotal = settlements.reduce((sum, s) => sum + s.managerShare, 0)

        return {
            month: monthStr,
            totalRevenue: total,
            ownerShare: ownerTotal,
            managerShare: managerTotal,
            settlements,
        }
    } catch (error) {
        console.error("Failed to get current month summary:", error)
        return {
            month: "",
            totalRevenue: 0,
            ownerShare: 0,
            managerShare: 0,
            settlements: [],
        }
    }
}
