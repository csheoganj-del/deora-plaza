"use server"

import { queryDocuments, createDocument, updateDocument } from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"
import { requireDeletePermission } from "@/lib/auth-helpers"

export async function getBarMenu() {
    try {
        const { getBusinessSettings } = await import("@/actions/businessSettings")
        const settings = await getBusinessSettings()
        if (settings && settings.enableBarModule === false) {
            return { drinks: [], food: [] }
        }
        
        // Parallel fetch drinks and food for better performance
        const [drinks, allMenuItems] = await Promise.all([
            queryDocuments('menu_items', [
                { field: 'businessUnit', operator: '==', value: 'bar' }
            ], 'name', 'asc'),
            (async () => {
                const { getMenuItems } = await import("@/actions/menu")
                return await getMenuItems()
            })()
        ])

        // Filter food items (cafe or restaurant items and available)
        // Add robust null/undefined check to prevent "Cannot read properties of null" error
        console.log('All menu items received:', allMenuItems);
        console.log('All menu items count:', allMenuItems?.length);
        
        const food = Array.isArray(allMenuItems) && allMenuItems !== null
            ? allMenuItems.filter((item: any) => {
                console.log('Filtering food item:', item.name, 'businessUnit:', item.businessUnit, 'isAvailable:', item.isAvailable);
                return (item.businessUnit === 'cafe' || item.businessUnit === 'restaurant') && item.isAvailable !== false;
            })
            : []
        
        console.log('Final food items count:', food.length);
        console.log('Final food items:', food);

        return { drinks, food }
    } catch (error) {
        console.error('Error fetching bar menu:', error)
        return { drinks: [], food: [] }
    }
}

export async function createBarOrder(data: {
  items: Array<{
    menuItemId: string
    name: string
    quantity: number
    price: number
    businessUnit: string
    specialInstructions?: string
    measurement?: string
    measurementUnit?: string
    baseMeasurement?: number
  }>
  customerMobile?: string
}) {
    try {
        const { getBusinessSettings } = await import("@/actions/businessSettings")
        const settings = await getBusinessSettings()
        if (settings && settings.enableBarModule === false) {
            return { success: false, error: 'Bar module disabled' }
        }
        const timestamp = Date.now()
        const hasDrinks = data.items.some(item => item.businessUnit === 'bar')
        const hasFood = data.items.some(item => item.businessUnit === 'cafe')

        const orders = []

        // Create drink order if has drinks
        if (hasDrinks) {
            const drinkItems = data.items.filter(item => item.businessUnit === 'bar')
            const drinkTotal = drinkItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

            const drinkOrder = await createDocument('orders', {
                orderNumber: `BAR-${timestamp}`,
                type: 'bar',
                businessUnit: 'bar',
                customerMobile: data.customerMobile || null,
                status: 'pending',
                totalAmount: drinkTotal,
                items: drinkItems,
                createdAt: new Date().toISOString()
            })
            if (drinkOrder.success) {
                orders.push(drinkOrder.data)
            } else {
                console.error('Failed to create drink order:', drinkOrder.error)
                return { success: false, error: `Failed to create drink order: ${drinkOrder.error}` }
            }
        }

        // Create food order if has food
        if (hasFood) {
            const foodItems = data.items.filter(item => item.businessUnit === 'cafe')
            const foodTotal = foodItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

            const foodOrder = await createDocument('orders', {
                orderNumber: `BAR-FOOD-${timestamp}`,
                type: 'takeaway',
                businessUnit: 'cafe',
                customerMobile: data.customerMobile || null,
                status: 'pending',
                totalAmount: foodTotal,
                items: foodItems.map(item => ({
                    ...item,
                    specialInstructions: item.specialInstructions || 'For Bar Table Counter'
                })),
                createdAt: new Date().toISOString()
            })
            if (foodOrder.success) {
                orders.push(foodOrder.data)
            } else {
                console.error('Failed to create food order:', foodOrder.error)
                return { success: false, error: `Failed to create food order: ${foodOrder.error}` }
            }
        }

        if (orders.length === 0) {
            return { success: false, error: 'No orders were created' }
        }

        return { success: true, orders }
    } catch (error) {
        console.error('Error creating bar order:', error)
        return { success: false, error }
    }
}

export async function getBarOrders() {
    try {
        const { getBusinessSettings } = await import("@/actions/businessSettings")
        const settings = await getBusinessSettings()
        if (settings && settings.enableBarModule === false) {
            return []
        }
        const orders = await queryDocuments('orders', [
            { field: 'businessUnit', operator: '==', value: 'bar' },
            { field: 'status', operator: 'in', value: ['pending', 'preparing', 'ready'] }
        ], 'createdAt', 'desc')

        // Helper function to safely convert any timestamp to ISO string
        const safeTimestampToISO = (ts: any): string | null => {
            if (!ts) return null
            if (typeof ts === 'string') return ts
            try {
                if (ts instanceof Date) return ts.toISOString()
                if (typeof ts === 'number') return new Date(ts).toISOString()
                return null
            } catch (e) {
                console.error('Error converting timestamp:', e, ts)
                return null
            }
        }

        return orders.map((order: any) => ({
            ...order,
            createdAt: safeTimestampToISO(order.createdAt),
            updatedAt: safeTimestampToISO(order.updatedAt),
            pendingAt: safeTimestampToISO(order.pendingAt),
            preparingAt: safeTimestampToISO(order.preparingAt),
            readyAt: safeTimestampToISO(order.readyAt),
            servedAt: safeTimestampToISO(order.servedAt),
            completedAt: safeTimestampToISO(order.completedAt),
            timeline: Array.isArray(order.timeline) ? order.timeline.map((entry: any) => ({
                ...entry,
                timestamp: safeTimestampToISO(entry.timestamp)
            })) : order.timeline,
        }))
    } catch (error) {
        console.error('Error fetching bar orders:', error)
        return []
    }
}

export async function updateBarOrderStatus(orderId: string, status: string) {
    try {
        const { getBusinessSettings } = await import("@/actions/businessSettings")
        const settings = await getBusinessSettings()
        if (settings && settings.enableBarModule === false) {
            return { success: false, error: 'Bar module disabled' }
        }
        await updateDocument('orders', orderId, { status })
        return { success: true }
    } catch (error) {
        console.error('Error updating bar order status:', error)
        return { success: false, error }
    }
}

export async function purgeBarModuleData(password?: string) {
    try {
        const { getBusinessSettings, updateBusinessSettings } = await import("@/actions/businessSettings")
        const settings = await getBusinessSettings()

        const protectionEnabled = settings?.enablePasswordProtection ?? true
        if (protectionEnabled) {
            const session = await requireDeletePermission()
            if (session.user.role !== 'super_admin') {
                const envPwd = (process.env.ADMIN_DELETION_PASSWORD || '').trim()
                if (!envPwd) {
                    return { success: false, error: 'Deletion password not configured in environment' }
                }
                const provided = (password || '').trim()
                if (provided !== envPwd) {
                    return { success: false, error: 'Invalid password' }
                }
            }
        }

        const { revalidatePath } = await import('next/cache')

        const deleteFrom = async (table: string, filter: any) => {
            const { error } = await supabaseServer.from(table).delete().match(filter)
            if (error) throw error
        }

        await deleteFrom('menu_items', { businessUnit: 'bar' })
        await deleteFrom('tables', { businessUnit: 'bar' })
        await deleteFrom('orders', { businessUnit: 'bar' })
        await deleteFrom('bills', { businessUnit: 'bar' })

        try {
            const { auditDataDeletion } = await import('@/lib/audit')
            await auditDataDeletion('module', 'bar', { action: 'purge' })
        } catch {}

        const newSettings = { ...(settings || {}), enableBarModule: false }
        await updateBusinessSettings(newSettings as any)

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/bar')
        revalidatePath('/dashboard/bar/tables')
        revalidatePath('/dashboard/bar/menu')
        revalidatePath('/dashboard/orders')
        revalidatePath('/dashboard/billing')

        return { success: true }
    } catch (error) {
        console.error('Error purging bar data:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

export async function getBarModuleStatus() {
    try {
        const { getBusinessSettings } = await import("@/actions/businessSettings")
        const settings = await getBusinessSettings()
        const { data: countsOrders } = await supabaseServer
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('businessUnit', 'bar')

        const { data: countsBills } = await supabaseServer
            .from('bills')
            .select('id', { count: 'exact', head: true })
            .eq('businessUnit', 'bar')

        const { data: countsTables } = await supabaseServer
            .from('tables')
            .select('id', { count: 'exact', head: true })
            .eq('businessUnit', 'bar')

        const { data: countsMenu } = await supabaseServer
            .from('menu_items')
            .select('id', { count: 'exact', head: true })
            .eq('businessUnit', 'bar')

        return {
            enabled: settings?.enableBarModule ?? true,
            counts: {
                orders: (countsOrders as any)?.length || 0,
                bills: (countsBills as any)?.length || 0,
                tables: (countsTables as any)?.length || 0,
                menuItems: (countsMenu as any)?.length || 0,
            }
        }
    } catch (error) {
        return { enabled: true, counts: { orders: 0, bills: 0, tables: 0, menuItems: 0 } }
    }
}

