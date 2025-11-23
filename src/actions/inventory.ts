"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function getInventoryItems(businessUnit: string = "cafe") {
    try {
        const items = await prisma.inventoryItem.findMany({
            where: { businessUnit },
            orderBy: { name: "asc" },
        })
        return items
    } catch (error) {
        console.error("Failed to fetch inventory items:", error)
        return []
    }
}

export async function updateStock(id: string, quantity: number, type: "add" | "remove") {
    try {
        const item = await prisma.inventoryItem.findUnique({ where: { id } })
        if (!item) throw new Error("Item not found")

        const newQuantity = type === "add"
            ? item.quantity + quantity
            : Math.max(0, item.quantity - quantity)

        await prisma.inventoryItem.update({
            where: { id },
            data: { quantity: newQuantity },
        })

        revalidatePath("/dashboard/inventory")
        return { success: true }
    } catch (error) {
        console.error("Failed to update stock:", error)
        return { success: false, error }
    }
}

export async function addInventoryItem(data: { name: string; quantity: number; unit: string; minThreshold: number; businessUnit: string }) {
    try {
        await prisma.inventoryItem.create({
            data
        })
        revalidatePath("/dashboard/inventory")
        return { success: true }
    } catch (error) {
        console.error("Failed to add inventory item:", error)
        return { success: false, error }
    }
}

export async function checkLowStock(businessUnit: string = "cafe") {
    try {
        const items = await prisma.inventoryItem.findMany({
            where: {
                businessUnit,
                quantity: {
                    lte: prisma.inventoryItem.fields.minThreshold
                }
            }
        })
        return items
    } catch (error) {
        console.error("Failed to check low stock:", error)
        return []
    }
}
