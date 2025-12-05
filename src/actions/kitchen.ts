"use server"

import { queryDocuments, updateDocument, timestampToDate, dateToTimestamp, createDocument, serializeTimestamps } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"

export async function getKitchenOrders(businessUnit?: string) {
    try {
        const filters: any[] = [
            { field: 'status', operator: 'in', value: ['pending', 'preparing', 'ready'] }
        ]

        if (businessUnit) {
            filters.push({ field: 'businessUnit', operator: '==', value: businessUnit })
        } else {
            filters.push({ field: 'businessUnit', operator: 'in', value: ['cafe', 'bar', 'restaurant', 'hotel'] })
        }

        let orders = await queryDocuments('orders', filters, 'createdAt', 'asc')

        // Fallback: fetch all and filter client-side if filtered query returns empty
        if (orders.length === 0) {
            const all = await queryDocuments('orders', [], 'createdAt', 'asc')
            orders = all.filter((o: any) => {
                const statusOk = ['pending', 'preparing', 'ready'].includes(o.status)
                const unitOk = businessUnit
                    ? o.businessUnit === businessUnit
                    : ['cafe', 'bar', 'restaurant', 'hotel'].includes(o.businessUnit)
                return statusOk && unitOk
            })
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

        // Explicitly serialize all timestamp fields
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

        // Recursive serialization for any nested timestamps
        const serializedOrders = explicitlySerializedOrders.map((order: any) => serializeTimestamps(order))

        // Final sanitization
        return JSON.parse(JSON.stringify(serializedOrders, (key, value) => {
            if (typeof value === 'bigint') return Number(value)
            return value
        }))
    } catch (error) {
        console.error('Error fetching kitchen orders:', error)
        return []
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        const updateData: any = {
            status,
            [`${status}At`]: dateToTimestamp(new Date()),
            updatedAt: dateToTimestamp(new Date())
        }

        await updateDocument('orders', orderId, updateData)

        if (status === 'ready') {
            await createOrderNotification(orderId)
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating order status:', error)
        return { success: false, error }
    }
}

async function createOrderNotification(orderId: string) {
    try {
        const orderDoc = await adminDb.collection('orders').doc(orderId).get()
        if (!orderDoc.exists) return

        const order = orderDoc.data()
        const locationName = order?.businessUnit === 'hotel'
            ? `Room ${order?.roomNumber}`
            : `${order?.businessUnit} Table ${order?.table?.tableNumber || 'N/A'}`

        await createDocument('notifications', {
            type: 'order_ready',
            orderId: orderId,
            businessUnit: order?.businessUnit,
            message: `Order ${order?.orderNumber} ready for ${locationName}`,
            title: 'Order Ready for Delivery',
            recipient: 'waiter',
            metadata: {
                orderNumber: order?.orderNumber,
                location: locationName,
                businessUnit: order?.businessUnit
            },
            isRead: false,
            createdAt: dateToTimestamp(new Date()),
            expiresAt: dateToTimestamp(new Date(Date.now() + 2 * 60 * 60 * 1000))
        })
    } catch (error) {
        console.error('Error creating notification:', error)
    }
}
