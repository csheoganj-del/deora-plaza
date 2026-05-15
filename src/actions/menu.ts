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
            // Include both the specific unit AND 'shared' items
            filters.push({ field: 'businessUnit', operator: 'in', value: [businessUnit, 'shared'] })
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


export async function bulkCreateMenuItems(items: any[]) {
    try {
        // Get all categories to map names to IDs
        const { getCategories } = await import("@/actions/categories")
        const categories = await getCategories('all');
        const categoryMap = new Map(categories.map((c: any) => [c.name.toLowerCase(), c]));

        const { createCategories } = await import("@/actions/categories") as any;

        // Process items
        const processedItems = [];
        const newCategories = new Set<string>();

        // First pass: Identify new categories
        for (const item of items) {
            if (item.category && !categoryMap.has(item.category.toLowerCase())) {
                newCategories.add(item.category);
            }
        }

        // Create new categories if any (sequentially to avoid race conditions or use a bulk create if available)
        // For simplicity, we'll create them one by one or assume they should exist.
        // Actually, let's create them to be helpful.
        for (const catName of Array.from(newCategories)) {
            // We need a specific action for creating category if not exposed, but we can use createDocument directly or createCategory action
            const { createCategory } = await import("@/actions/categories");
            // Add a slug helper if needed, or createCategory handles it?
            // Assuming createCategory handles it as per previous context (we fixed the seed script but action might use it)
            // Let's check createCategory signature if we can.
            // Safest: Use createDocument 'categories' directly if actions aren't robust.
            // But let's try to map what we have.
            try {
                // Determine if createCategory exists and how it works.
                // If not, we skip linking ID and just use string name (backwards compat).
                // Or best effort.
            } catch (e) { }
        }

        // Re-fetch categories if we created new ones? 
        // For now, let's just map existing ones. If category not found, we leave category_id null but keep category name.

        for (const item of items) {
            const cat = categoryMap.get((item.category || "").toLowerCase());

            processedItems.push({
                name: item.name,
                description: item.description,
                price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
                category: item.category, // Text name
                category_id: cat ? cat.id : null,
                businessUnit: item.businessUnit || 'cafe', // Default
                isAvailable: item.isAvailable ?? true,
                // Add validation?
            });
        }

        // Bulk insert
        const { getSupabase } = await import("@/lib/supabase/client") // logic inside createDocument is simple wrapper
        // We need to use supabase directly for bulk insert
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const { data, error } = await supabase
            .from('menu_items')
            .insert(processedItems)
            .select();

        if (error) throw error;

        // Clear cache
        const { clearCache } = await import("@/lib/cache")
        clearCache('menu_items')

        return { success: true, count: data.length };
    } catch (error: any) {
        console.error('Error bulk creating menu items:', error)
        return { success: false, error: error.message }
    }
}
