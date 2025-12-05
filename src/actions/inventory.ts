"use server"

import { adminDb } from "@/lib/firebase/admin"
import { revalidatePath } from "next/cache"
import { timestampToDate } from "@/lib/firebase/firestore"

export async function getInventoryItems(businessUnit: string = "cafe") {
    try {
        const snapshot = await adminDb.collection('inventory')
            .where('businessUnit', '==', businessUnit)
            .get()

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch (error) {
        console.error("Error fetching inventory:", error)
        return []
    }
}

export async function updateStock(id: string, quantity: number, type: "add" | "remove") {
    try {
        const docRef = adminDb.collection('inventory').doc(id)
        const doc = await docRef.get()

        if (!doc.exists) {
            return { success: false, error: "Item not found" }
        }

        const currentQuantity = doc.data()?.quantity || 0
        const newQuantity = type === "add" ? currentQuantity + quantity : currentQuantity - quantity

        if (newQuantity < 0) {
            return { success: false, error: "Insufficient stock" }
        }

        await docRef.update({
            quantity: newQuantity,
            updatedAt: new Date()
        })

        revalidatePath('/dashboard/inventory')
        return { success: true }
    } catch (error) {
        console.error("Error updating stock:", error)
        return { success: false, error: "Failed to update stock" }
    }
}

export async function addInventoryItem(data: { name: string; quantity: number; unit: string; minThreshold: number; businessUnit: string }) {
    try {
        await adminDb.collection('inventory').add({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        revalidatePath('/dashboard/inventory')
        return { success: true }
    } catch (error) {
        console.error("Error adding item:", error)
        return { success: false, error: "Failed to add item" }
    }
}

export async function deleteInventoryItem(id: string) {
    try {
        await adminDb.collection('inventory').doc(id).delete()
        revalidatePath('/dashboard/inventory')
        return { success: true }
    } catch (error) {
        console.error("Error deleting item:", error)
        return { success: false, error: "Failed to delete item" }
    }
}

export async function checkLowStock(businessUnit: string = "cafe") {
    try {
        const items = await getInventoryItems(businessUnit)
        return items.filter((item: any) => item.quantity <= item.minThreshold)
    } catch (error) {
        console.error("Error checking low stock:", error)
        return []
    }
}
