"use server"

import { queryDocuments, updateDocument, createDocument } from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"
import { createInterDepartmentalSettlement } from "@/actions/settlements"

export async function getPendingDepartmentSettlements() {
    try {
        const filters = [
            { field: 'settlementStatus', operator: '==', value: 'pending' }
        ]
        const orders = await queryDocuments('orders', filters, 'createdAt', 'asc')

        return orders.map((order: any) => ({
            ...order,
            createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
            updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
            pendingAt: order.pendingAt ? new Date(order.pendingAt).toISOString() : null,
            preparingAt: order.preparingAt ? new Date(order.preparingAt).toISOString() : null,
            readyAt: order.readyAt ? new Date(order.readyAt).toISOString() : null,
            servedAt: order.servedAt ? new Date(order.servedAt).toISOString() : null,
            completedAt: order.completedAt ? new Date(order.completedAt).toISOString() : null,
            timeline: Array.isArray(order.timeline) ? order.timeline.map((entry: any) => ({
                ...entry,
                timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : null
            })) : order.timeline,
        }))
    } catch (error) {
        console.error('Error fetching pending department settlements:', error)
        return []
    }
}

export async function getDailySettlementReport(date?: Date) {
    try {
        const targetDate = date || new Date()
        const startOfDay = new Date(targetDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(targetDate)
        endOfDay.setHours(23, 59, 59, 999)

        const orders = await queryDocuments('orders', [
            { field: 'createdAt', operator: '>=', value: startOfDay.toISOString() },
            { field: 'createdAt', operator: '<=', value: endOfDay.toISOString() }
        ], 'businessUnit', 'asc')

        const departmentTotals: Record<string, any> = {}
        const departmentOrders: Record<string, any[]> = {}

        for (const order of orders) {
            const dept = order.businessUnit
            if (!departmentTotals[dept]) {
                departmentTotals[dept] = {
                    total: 0,
                    paid: 0,
                    pending: 0,
                    orderCount: 0,
                    paidOrderCount: 0
                }
                departmentOrders[dept] = []
            }

            departmentTotals[dept].total += order.totalAmount
            departmentTotals[dept].orderCount += 1
            departmentOrders[dept].push(order)

            if (order.isPaid) {
                departmentTotals[dept].paid += order.totalAmount
                departmentTotals[dept].paidOrderCount += 1
            } else {
                departmentTotals[dept].pending += order.totalAmount
            }
        }

        return {
            date: targetDate.toISOString().split('T')[0],
            summary: departmentTotals,
            details: departmentOrders,
            grandTotal: Object.values(departmentTotals).reduce((sum: number, d: any) => sum + d.total, 0),
            grandPaid: Object.values(departmentTotals).reduce((sum: number, d: any) => sum + d.paid, 0),
            grandPending: Object.values(departmentTotals).reduce((sum: number, d: any) => sum + d.pending, 0)
        }
    } catch (error) {
        console.error('Error fetching daily settlement report:', error)
        return null
    }
}

export async function createDailySettlement(date?: Date) {
    try {
        const targetDate = date || new Date()
        const report = await getDailySettlementReport(targetDate)

        if (!report) {
            return { success: false, error: 'Failed to generate report' }
        }

        // Process inter-departmental settlements first
        const interDeptResult = await createInterDepartmentalSettlement([], 'Daily settlement processing')

        const settlementData = {
            date: new Date(`${report.date}T00:00:00`).toISOString(),
            summary: report.summary,
            grandTotal: report.grandTotal,
            grandPaid: report.grandPaid,
            grandPending: report.grandPending,
            status: 'created',
            createdAt: new Date().toISOString(),
            approvedAt: null,
            approvedBy: null
        }

        const result = await createDocument('settlements', settlementData)

        // Update all orders for this date as settled
        const startOfDay = new Date(targetDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(targetDate)
        endOfDay.setHours(23, 59, 59, 999)

        const orders = await queryDocuments('orders', [
            { field: 'createdAt', operator: '>=', value: startOfDay.toISOString() },
            { field: 'createdAt', operator: '<=', value: endOfDay.toISOString() }
        ])

        // Update orders using our updateDocument function
        for (const order of orders) {
            await updateDocument('orders', order.id, {
                settlementStatus: 'settled',
                settlementId: result.data?.id,
                settledAt: new Date().toISOString()
            })
        }

        // Create notification for managers
        await createDocument('notifications', {
            type: 'settlement_created',
            businessUnit: 'all',
            message: `Daily settlement created for ${report.date} - ₹${report.grandTotal.toLocaleString()} total`,
            title: 'Daily Settlement Report',
            recipient: 'restaurant_manager',
            metadata: {
                settlementId: result.data?.id,
                date: report.date,
                grandTotal: report.grandTotal
            },
            isRead: false,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })

        return { 
            success: true, 
            settlementId: result.data?.id, 
            report,
            interDeptProcessed: interDeptResult.settlement?.totalOrders || 0
        }
    } catch (error) {
        console.error('Error creating daily settlement:', error)
        return { success: false, error }
    }
}

export async function settleDepartmentOrders(orderIds: string[]) {
    try {
        if (orderIds.length === 0) {
            return { success: true, message: "No orders to settle." }
        }

        // Update orders using our updateDocument function
        for (const orderId of orderIds) {
            await updateDocument('orders', orderId, {
                settlementStatus: 'settled',
                settledAt: new Date().toISOString()
            })
        }

        return { success: true }
    } catch (error) {
        console.error('Error settling department orders:', error)
        return { success: false, error }
    }
}

