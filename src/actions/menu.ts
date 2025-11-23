"use server"

import { queryDocuments, createDocument, updateDocument, deleteDocument } from "@/lib/firebase/firestore"

export async function getMenuItems(businessUnit?: string) {
    try {
        const filters = businessUnit
            ? [{ field: 'businessUnit', operator: '==' as const, value: businessUnit }]
            : []

        const items = await queryDocuments('menuItems', filters, 'name', 'asc')
        return items
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
        const result = await deleteDocument('menuItems', id)
        return result
    } catch (error) {
        console.error('Error deleting menu item:', error)
        return { success: false, error }
    }
}
