"use server"

import { queryDocuments, createDocument, updateDocument, deleteDocument } from "@/lib/supabase/database"
import { getCachedData, setCachedData, getCachedDataAsync, setCachedDataAsync } from "@/lib/cache"

export async function getMenuItems(businessUnit?: string): Promise<any[]> {
    try {
        // Create cache key
        const cacheKey = `menu_items_${businessUnit || 'all'}`

        // Check cache first
        const cached = await getCachedDataAsync<any[]>(cacheKey)
        if (cached) {
            return cached
        }

        // Fetch ALL menu items regardless of businessUnit to create a unified menu
        const filters: any[] = []
        if (businessUnit) {
            filters.push({ field: 'businessUnit', operator: '==', value: businessUnit })
        }

        const items = await queryDocuments('menu_items', filters, 'name', 'asc')
        const processedItems = items.map((item: any) => ({
            ...item,
            createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
            updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null
        }))

        // Cache for 30 seconds
        await setCachedDataAsync(cacheKey, processedItems, 30000)

        return processedItems
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
    measurement?: string
    measurementUnit?: string
    baseMeasurement?: number
}) {
    try {
        const result = await createDocument('menu_items', {
            ...data,
            isAvailable: data.isAvailable ?? true
        })

        // Clear cache when new item is created
        const { clearCache } = await import("@/lib/cache")
        clearCache('menu_items')

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
    measurement: string
    measurementUnit: string
    baseMeasurement: number
}>) {
    try {
        const result = await updateDocument('menu_items', id, data)

        // Clear cache when item is updated
        const { clearCache } = await import("@/lib/cache")
        clearCache('menu_items')

        return result
    } catch (error) {
        console.error('Error updating menu item:', error)
        return { success: false, error }
    }
}

export async function deleteMenuItem(id: string) {
    try {
        const result = await deleteDocument('menu_items', id)

        // Clear cache when item is deleted
        const { clearCache } = await import("@/lib/cache")
        clearCache('menu_items')

        return result
    } catch (error) {
        console.error('Error deleting menu item:', error)
        return { success: false, error }
    }
}

export async function bulkUpdateMenuItems(ids: string[], data: Partial<{
    category: string
    category_id: string
    isAvailable: boolean
    businessUnit: string
}>) {
    try {
        const { getCategories } = await import("@/actions/categories")
        const categories = await getCategories('all');
        const targetCategory = categories.find(c => c.name === data.category)

        // Run updates in parallel
        // If updating category using the display name, ensure we also update category_id if found
        let payload: any = { ...data };
        if (data.category && targetCategory) {
            payload.category_id = targetCategory.id;
        }

        const promises = ids.map(id =>
            updateDocument('menu_items', id, payload)
        );

        await Promise.all(promises);

        // Clear cache
        const { clearCache } = await import("@/lib/cache")
        clearCache('menu_items')

        return { success: true, count: ids.length };
    } catch (error: any) {
        console.error('Error bulk updating menu items:', error)
        return { success: false, error: error.message };
    }
}

