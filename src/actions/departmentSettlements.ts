"use server"

import { queryDocuments, updateDocument, serializeTimestamps, createDocument, dateToTimestamp, timestampToDate } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"

export async function getPendingDepartmentSettlements() {
    try {
        const filters = [
            { field: 'settlementStatus', operator: '==' as const, value: 'pending' }
        ]
        const orders = await queryDocuments('orders', filters, 'createdAt', 'asc')

        // Helper function to safely convert any timestamp to ISO string
        const safeTimestampToISO = (ts: any): string | null => {
            if (!ts) return null
            if (typeof ts === 'string') return ts
            try {
                if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate().toISOString()
                if (ts._seconds !== undefined) return new Date(ts._seconds * 1000).toISOString()
                if (ts.seconds !== undefined) return new Date(ts.seconds * 1000).toISOString()
                if (ts instanceof Date) return ts.toISOString()
                if (typeof ts === 'number') return new Date(ts).toISOString()
                return null
            } catch (e) {
                console.error('Error converting timestamp:', e, ts)
                return null
            }
        }

        // Explicitly serialize all timestamp fields including timeline
        const explicitlySerializedOrders = orders.map((order: any) => ({
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

        return explicitlySerializedOrders.map((order: any) => serializeTimestamps(order))
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
            { field: 'createdAt', operator: '>=', value: dateToTimestamp(startOfDay) },
            { field: 'createdAt', operator: '<=', value: dateToTimestamp(endOfDay) }
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

        // Helper function to safely convert any timestamp to ISO string
        const safeTimestampToISO = (ts: any): string | null => {
            if (!ts) return null
            if (typeof ts === 'string') return ts
            try {
                if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate().toISOString()
                if (ts._seconds !== undefined) return new Date(ts._seconds * 1000).toISOString()
                if (ts.seconds !== undefined) return new Date(ts.seconds * 1000).toISOString()
                if (ts instanceof Date) return ts.toISOString()
                if (typeof ts === 'number') return new Date(ts).toISOString()
                return null
            } catch (e) {
                console.error('Error converting timestamp:', e, ts)
                return null
            }
        }

        // Serialize orders in departmentOrders
        const serializedDepartmentOrders: Record<string, any[]> = {}
        Object.keys(departmentOrders).forEach(dept => {
            serializedDepartmentOrders[dept] = departmentOrders[dept].map((order: any) => {
                const explicitlySerialized = {
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
                }
                return serializeTimestamps(explicitlySerialized)
            })
        })

        return {
            date: targetDate.toISOString().split('T')[0],
            summary: departmentTotals,
            details: serializedDepartmentOrders,
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

        const settlementData = {
            date: dateToTimestamp(new Date(`${report.date}T00:00:00`)),
            summary: report.summary,
            grandTotal: report.grandTotal,
            grandPaid: report.grandPaid,
            grandPending: report.grandPending,
            status: 'created',
            createdAt: dateToTimestamp(new Date()),
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
            { field: 'createdAt', operator: '>=', value: dateToTimestamp(startOfDay) },
            { field: 'createdAt', operator: '<=', value: dateToTimestamp(endOfDay) }
        ])

        const batch = adminDb.batch()
        for (const order of orders) {
            const orderRef = adminDb.collection('orders').doc(order.id)
            batch.update(orderRef, {
                settlementStatus: 'settled',
                settlementId: result.id,
                settledAt: dateToTimestamp(new Date())
            })
        }
        await batch.commit()

        // Create notification for managers
        await createDocument('notifications', {
            type: 'settlement_created',
            businessUnit: 'all',
            message: `Daily settlement created for ${report.date} - ₹${report.grandTotal.toLocaleString()} total`,
            title: 'Daily Settlement Report',
            recipient: 'restaurant_manager',
            metadata: {
                settlementId: result.id,
                date: report.date,
                grandTotal: report.grandTotal
            },
            isRead: false,
            createdAt: dateToTimestamp(new Date()),
            expiresAt: dateToTimestamp(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        })

        return { success: true, settlementId: result.id, report }
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

        const batch = adminDb.batch()
        const settlementDate = dateToTimestamp(new Date())

        orderIds.forEach(orderId => {
            const orderRef = adminDb.collection('orders').doc(orderId)
            batch.update(orderRef, {
                settlementStatus: 'settled',
                settledAt: settlementDate
            })
        })

        await batch.commit()

        return { success: true }
    } catch (error) {
        console.error('Error settling department orders:', error)
        return { success: false, error }
    }
}
