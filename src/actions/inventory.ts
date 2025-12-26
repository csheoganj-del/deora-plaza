"use server"

import { revalidatePath } from "next/cache"
import { queryDocuments, updateDocument, createDocument, deleteDocument } from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"

export async function getInventoryItems(businessUnit: string = "cafe") {
    try {
        const filters = [
            { field: 'businessUnit', operator: '==', value: businessUnit }
        ]
        
        const items = await queryDocuments('inventory', filters)
        return items
    } catch (error) {
        console.error("Error fetching inventory:", error)
        return []
    }
}

export async function updateStock(id: string, quantity: number, type: "add" | "remove") {
    try {
        // Get current item
        const { data: item, error: fetchError } = await supabaseServer
            .from('inventory')
            .select('*')
            .eq('id', id)
            .single()

        if (fetchError || !item) {
            return { success: false, error: "Item not found" }
        }

        const currentQuantity = item.quantity || 0
        const newQuantity = type === "add" ? currentQuantity + quantity : currentQuantity - quantity

        if (newQuantity < 0) {
            return { success: false, error: "Insufficient stock" }
        }

        const result = await updateDocument('inventory', id, {
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
        })

        if (!result.success) {
            return { success: false, error: "Failed to update stock" }
        }

        revalidatePath('/dashboard/inventory')
        return { success: true }
    } catch (error) {
        console.error("Error updating stock:", error)
        return { success: false, error: "Failed to update stock" }
    }
}

export async function addInventoryItem(data: { name: string; quantity: number; unit: string; minThreshold: number; businessUnit: string }) {
    try {
        const result = await createDocument('inventory', {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })

        if (!result.success) {
            return { success: false, error: "Failed to add item" }
        }

        revalidatePath('/dashboard/inventory')
        return { success: true }
    } catch (error) {
        console.error("Error adding item:", error)
        return { success: false, error: "Failed to add item" }
    }
}

export async function deleteInventoryItem(id: string) {
    try {
        const result = await deleteDocument('inventory', id)
        
        if (!result.success) {
            return { success: false, error: "Failed to delete item" }
        }

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

