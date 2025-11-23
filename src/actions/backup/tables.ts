"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getTables(businessUnit: string = "cafe") {
    try {
        const tables = await prisma.table.findMany({
            where: {
                businessUnit,
            },
            orderBy: {
                tableNumber: "asc", // Assuming tableNumber is numeric string or we might need to parse
            },
        })
        return tables
    } catch (error) {
        console.error("Failed to fetch tables:", error)
        return []
    }
}

export async function updateTableStatus(tableId: string, status: string) {
    try {
        await prisma.table.update({
            where: { id: tableId },
            data: { status },
        })
        return { success: true }
    } catch (error) {
        console.error("Failed to update table status:", error)
        return { success: false, error }
    }
}
