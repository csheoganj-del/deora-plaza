"use server"

import { supabaseServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface RunningOrderItem {
    menuItemId: string
    name: string
    quantity: number
    price: number
}

export interface RunningOrder {
    id: string
    tableId: string
    businessUnit: string
    items: RunningOrderItem[]
    subtotal: number
    discountPercent: number
    discountAmount: number
    gstPercent: number
    gstAmount: number
    total: number
    customerName?: string
    customerMobile?: string
    status: 'active' | 'billed'
    createdAt: string
    updatedAt: string
}

/**
 * Get active running order for a table
 */
export async function getRunningOrderByTable(tableId: string): Promise<RunningOrder | null> {
    try {
        const { data, error } = await supabaseServer
            .from('running_orders')
            .select('*')
            .eq('table_id', tableId)
            .eq('status', 'active')
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned - table has no running order
                return null
            }
            throw error
        }

        return {
            id: data.id,
            tableId: data.table_id,
            businessUnit: data.business_unit,
            items: data.items || [],
            subtotal: parseFloat(data.subtotal) || 0,
            discountPercent: parseFloat(data.discount_percent) || 0,
            discountAmount: parseFloat(data.discount_amount) || 0,
            gstPercent: parseFloat(data.gst_percent) || 0,
            gstAmount: parseFloat(data.gst_amount) || 0,
            total: parseFloat(data.total) || 0,
            customerName: data.customer_name,
            customerMobile: data.customer_mobile,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        }
    } catch (error) {
        console.error('Error fetching running order:', error)
        return null
    }
}

/**
 * Create or update running order for a table
 */
export async function saveRunningOrder(data: {
    tableId: string
    businessUnit: string
    items: RunningOrderItem[]
    subtotal: number
    discountPercent?: number
    discountAmount?: number
    gstPercent?: number
    gstAmount?: number
    total: number
    customerName?: string
    customerMobile?: string
}) {
    try {
        // Check if running order exists
        const existing = await getRunningOrderByTable(data.tableId)

        const orderData = {
            table_id: data.tableId,
            business_unit: data.businessUnit,
            items: data.items,
            subtotal: data.subtotal,
            discount_percent: data.discountPercent || 0,
            discount_amount: data.discountAmount || 0,
            gst_percent: data.gstPercent || 0,
            gst_amount: data.gstAmount || 0,
            total: data.total,
            customer_name: data.customerName,
            customer_mobile: data.customerMobile,
            status: 'active',
        }

        if (existing) {
            // Update existing
            const { error } = await supabaseServer
                .from('running_orders')
                .update(orderData)
                .eq('id', existing.id)

            if (error) throw error
        } else {
            // Create new
            const { error } = await supabaseServer
                .from('running_orders')
                .insert(orderData)

            if (error) throw error
        }

        // Update table status to occupied if it has items
        if (data.items.length > 0) {
            await supabaseServer
                .from('tables')
                .update({ status: 'occupied' })
                .eq('id', data.tableId)
        }

        revalidatePath('/dashboard/tables')
        return { success: true }
    } catch (error) {
        console.error('Error saving running order:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save order'
        }
    }
}

/**
 * Delete running order (when table is cleared without billing)
 */
export async function deleteRunningOrder(tableId: string) {
    try {
        const { error } = await supabaseServer
            .from('running_orders')
            .delete()
            .eq('table_id', tableId)
            .eq('status', 'active')

        if (error) throw error

        // Set table back to available
        await supabaseServer
            .from('tables')
            .update({ status: 'available' })
            .eq('id', tableId)

        revalidatePath('/dashboard/tables')
        return { success: true }
    } catch (error) {
        console.error('Error deleting running order:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete order'
        }
    }
}

/**
 * Mark running order as billed (called after bill generation)
 */
export async function finalizeRunningOrder(tableId: string) {
    try {
        const { error } = await supabaseServer
            .from('running_orders')
            .update({ status: 'billed' })
            .eq('table_id', tableId)
            .eq('status', 'active')

        if (error) throw error

        revalidatePath('/dashboard/tables')
        return { success: true }
    } catch (error) {
        console.error('Error finalizing running order:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to finalize order'
        }
    }
}

/**
 * Get all active running orders (for overview/reporting)
 */
export async function getAllActiveRunningOrders() {
    try {
        const { data, error } = await supabaseServer
            .from('running_orders')
            .select(`
        *,
        tables:table_id (
          table_number,
          section
        )
      `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })

        if (error) throw error

        return data?.map(order => ({
            id: order.id,
            tableId: order.table_id,
            tableNumber: order.tables?.table_number,
            section: order.tables?.section,
            businessUnit: order.business_unit,
            items: order.items || [],
            subtotal: parseFloat(order.subtotal) || 0,
            total: parseFloat(order.total) || 0,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
        })) || []
    } catch (error) {
        console.error('Error fetching all running orders:', error)
        return []
    }
}
