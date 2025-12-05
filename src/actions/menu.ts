"use server"

import { queryDocuments, createDocument, updateDocument, deleteDocument, timestampToDate } from "@/lib/firebase/firestore"

export async function getMenuItems(businessUnit?: string) {
    try {
        console.log("getMenuItems: Fetching all menu items (shared across all business units)")
        // Fetch ALL menu items regardless of businessUnit to create a unified menu
        const filters: any[] = []

        const items = await queryDocuments('menuItems', filters, 'name', 'asc')
        console.log(`getMenuItems: Found ${items.length} total items`)
        return items.map((item: any) => ({
            ...item,
            createdAt: item.createdAt ? timestampToDate(item.createdAt).toISOString() : null,
            updatedAt: item.updatedAt ? timestampToDate(item.updatedAt).toISOString() : null
        }))
    } catch (error) {
        console.error('Error fetching menu items:', error)
        return []
    }
}

export async function createMenuItem(data: {
    name: string
    description?: string
    price: number
    category: string
    businessUnit: string
    isAvailable?: boolean
}) {
    try {
        const result = await createDocument('menuItems', {
            ...data,
            isAvailable: data.isAvailable ?? true
        })
        return result
    } catch (error) {
        console.error('Error creating menu item:', error)
        return { success: false, error }
    }
}

export async function updateMenuItem(id: string, data: Partial<{
    name: string
    description: string
    price: number
    category: string
    isAvailable: boolean
}>) {
    try {
        const result = await updateDocument('menuItems', id, data)
        return result
    } catch (error) {
        console.error('Error updating menu item:', error)
        return { success: false, error }
    }
}

export async function deleteMenuItem(id: string) {
    try {
        console.log("deleteMenuItem: Deleting item with ID:", id)
        const result = await deleteDocument('menuItems', id)
        console.log("deleteMenuItem: Result:", result)
        return result
    } catch (error) {
        console.error('Error deleting menu item:', error)
        return { success: false, error }
    }
}
