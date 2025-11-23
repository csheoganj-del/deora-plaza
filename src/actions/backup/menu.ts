"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getMenuItems(businessUnit: string = "cafe") {
    try {
        const items = await prisma.menuItem.findMany({
            where: {
                businessUnit,
                isAvailable: true,
            },
            orderBy: {
                category: "asc",
            },
        })
        return items
    } catch (error) {
        console.error("Failed to fetch menu items:", error)
        return []
    }
}
