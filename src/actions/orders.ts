"use server"
// Force recompile - Serialization Fix 7 - Timeline Serialization

import { queryDocuments, createDocument, updateDocument, timestampToDate, dateToTimestamp, deleteDocument, serializeTimestamps } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"

import { updateTableStatus } from "./tables"

export async function createOrder(data: {
    tableId?: string
    tableNumber?: string
    customerMobile?: string
    type: string
    businessUnit: string
    roomNumber?: string
    source?: string
    guestCount?: number
    items: Array<{
        menuItemId: string
        name: string
        quantity: number
        price: number
        specialInstructions?: string
    }>
}) {
    try {
        // Generate order number
        const timestamp = Date.now()
        const orderNumber = `ORD-${timestamp}`

        // Calculate total
        const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        const settlementStatus = ['hotel', 'bar'].includes(data.businessUnit) ? 'pending' : 'not-required'

        const orderData = {
            orderNumber,
            type: data.type,
            businessUnit: data.businessUnit,
            tableId: data.tableId || null,
            tableNumber: data.tableNumber || null,
            roomNumber: data.roomNumber || null,
            source: data.source || 'pos',
            customerMobile: data.customerMobile || null,
            status: 'pending',
            settlementStatus,
            totalAmount,
            isPaid: false,
            items: data.items,
            guestCount: data.guestCount || 0,
            createdAt: dateToTimestamp(new Date()),
            updatedAt: dateToTimestamp(new Date()),
            pendingAt: dateToTimestamp(new Date()),
            preparingAt: null,
            readyAt: null,
            servedAt: null,
            completedAt: null,
            timeline: [{
                status: 'pending',
                timestamp: dateToTimestamp(new Date()),
                actor: 'system',
                message: 'Order placed'
            }]
        }

        console.log("createOrder: About to save order with data:", orderData)
        const result = await createDocument('orders', orderData)
        console.log("createOrder: Order saved with ID:", result.id)

        // If this is a dine-in order with a table, update the table status
        if (data.tableId && data.type === 'dine-in') {
            await updateTableStatus(data.tableId, 'occupied', data.guestCount || 0)
        }

        // Create notification for kitchen
        await createKitchenNotification(orderNumber, data)

        return { success: true, orderId: result.id, orderNumber }
    } catch (error) {
        console.error('Error creating order:', error)
        return { success: false, error }
    }
}

async function createKitchenNotification(orderNumber: string, data: any) {
    try {
        const locationName = data.businessUnit === 'hotel'
            ? `Room ${data.roomNumber}`
            : `${data.businessUnit} Table ${data.tableNumber || 'N/A'}`

        await createDocument('notifications', {
            type: 'order_placed',
            businessUnit: data.businessUnit,
            message: `New order ${orderNumber} for ${locationName}`,
            title: 'New Order',
            recipient: 'kitchen',
            metadata: {
                orderNumber,
                location: locationName,
                itemCount: data.items.length,
                businessUnit: data.businessUnit
            },
            isRead: false,
            createdAt: dateToTimestamp(new Date()),
            expiresAt: dateToTimestamp(new Date(Date.now() + 3 * 60 * 60 * 1000))
        })
    } catch (error) {
        console.error('Error creating kitchen notification:', error)
    }
}

export async function getOrders(businessUnit?: string, status?: string) {
    try {
        console.log("getOrders: Called with businessUnit:", businessUnit, "status:", status)
        const filters = []

        if (businessUnit) {
            if (Array.isArray(businessUnit)) {
                if (businessUnit.length > 0) {
                    filters.push({ field: 'businessUnit', operator: 'in' as const, value: businessUnit })
                }
            } else {
                filters.push({ field: 'businessUnit', operator: '==' as const, value: businessUnit })
            }
        }

        if (status) {
            filters.push({ field: 'status', operator: '==' as const, value: status })
        }

        console.log("getOrders: Filters:", filters)
        let orders = await queryDocuments('orders', filters, 'createdAt', 'desc')
        console.log("getOrders: Raw orders from database:", orders)
        console.log("getOrders: Number of raw orders:", orders.length)

        // Fallback: if filtered query returns empty but we expect results,
        // fetch all orders and filter in memory. This helps when Firestore
        // index constraints or data mismatches cause empty results.
        if (orders.length === 0 && (businessUnit || status)) {
            console.warn("getOrders: Filtered query returned 0. Applying fallback to fetch all and filter client-side.")
            const all = await queryDocuments('orders', [], 'createdAt', 'desc')
            orders = all.filter((o: any) => {
                const unitOk = businessUnit ? (Array.isArray(businessUnit) ? businessUnit.includes(o.businessUnit) : o.businessUnit === businessUnit) : true
                const statusOk = status ? o.status === status : true
                return unitOk && statusOk
            })
            console.log("getOrders: Fallback filtered orders count:", orders.length)
        }

        // DEBUG: Let's also fetch ALL orders to see what's in the database
        const allOrders = await queryDocuments('orders', [], 'createdAt', 'desc')
        console.log("getOrders: ALL orders in database (no filter):", allOrders)
        console.log("getOrders: Total orders in database:", allOrders.length)
        if (allOrders.length > 0) {
            console.log("getOrders: Sample order businessUnit values:", allOrders.map((o: any) => ({ id: o.id, businessUnit: o.businessUnit })))
            // DEBUG: Log the first order's pendingAt field to see its structure
            if (allOrders[0]) {
                console.log("getOrders: First order pendingAt structure:", (allOrders[0] as any).pendingAt)
            }
        }

        // Helper function to safely convert any timestamp to ISO string
        const safeTimestampToISO = (ts: any): string | null => {
            if (!ts) return null
            if (typeof ts === 'string') return ts
            try {
                // Handle Firestore Timestamp with toDate()
                if (ts.toDate && typeof ts.toDate === 'function') {
                    return ts.toDate().toISOString()
                }
                // Handle Firestore Timestamp with _seconds
                if (ts._seconds !== undefined) {
                    return new Date(ts._seconds * 1000).toISOString()
                }
                // Handle Firestore Timestamp with seconds (public field)
                if (ts.seconds !== undefined) {
                    return new Date(ts.seconds * 1000).toISOString()
                }
                // Handle Date object
                if (ts instanceof Date) {
                    return ts.toISOString()
                }
                // Handle number (milliseconds)
                if (typeof ts === 'number') {
                    return new Date(ts).toISOString()
                }
                return null
            } catch (e) {
                console.error('Error converting timestamp:', e, ts)
                return null
            }
        }

        // Explicitly serialize all known timestamp fields first
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

        // Convert timestamps across the entire object recursively
        const serializedOrders = explicitlySerializedOrders.map((order: any) => serializeTimestamps(order))

        // Final sanitization to ensure strictly plain objects (handles any remaining non-plain objects or BigInts)
        const sanitizedOrders = JSON.parse(JSON.stringify(serializedOrders, (key, value) => {
            if (typeof value === 'bigint') {
                return Number(value)
            }
            return value
        }))

        console.log("getOrders: Serialized orders:", sanitizedOrders)
        return sanitizedOrders
    } catch (error) {
        console.error('Error fetching orders:', error)
        return []
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        await updateDocument('orders', orderId, { status })
        return { success: true }
    } catch (error) {
        console.error('Error updating order status:', error)
        return { success: false, error }
    }
}

export async function updateOrderItems(orderId: string, items: any[], totalAmount: number) {
    try {
        await updateDocument('orders', orderId, {
            items,
            totalAmount,
            updatedAt: dateToTimestamp(new Date())
        })
        return { success: true }
    } catch (error) {
        console.error('Error updating order items:', error)
        return { success: false, error }
    }
}

export async function getOrderById(orderId: string) {
    try {
        const doc = await adminDb.collection('orders').doc(orderId).get()

        if (!doc.exists) {
            return null
        }

        const data = doc.data()

        // Helper to safely convert timestamps
        const safeTimestampToISO = (ts: any): string | null => {
            if (!ts) return null
            try {
                if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate().toISOString()
                if (ts._seconds !== undefined) return new Date(ts._seconds * 1000).toISOString()
                if (ts.seconds !== undefined) return new Date(ts.seconds * 1000).toISOString()
                if (typeof ts === 'string') return ts
                return null
            } catch (e) {
                return null
            }
        }

        return {
            id: doc.id,
            ...data,
            createdAt: safeTimestampToISO(data?.createdAt),
            updatedAt: safeTimestampToISO(data?.updatedAt),
            pendingAt: safeTimestampToISO(data?.pendingAt),
            preparingAt: safeTimestampToISO(data?.preparingAt),
            readyAt: safeTimestampToISO(data?.readyAt),
            servedAt: safeTimestampToISO(data?.servedAt),
            completedAt: safeTimestampToISO(data?.completedAt),
            timeline: Array.isArray(data?.timeline) ? data.timeline.map((entry: any) => ({
                ...entry,
                timestamp: safeTimestampToISO(entry.timestamp)
            })) : data?.timeline,
        }
    } catch (error) {
        console.error('Error fetching order:', error)
        return null
    }
}

export async function getOrderTimeline(orderId: string) {
    try {
        const doc = await adminDb.collection('orders').doc(orderId).get()

        if (!doc.exists) {
            return null
        }

        const data = doc.data()
        return {
            orderId,
            orderNumber: data?.orderNumber,
            status: data?.status,
            timeline: (data?.timeline || []).map((event: any) => ({
                ...event,
                timestamp: timestampToDate(event.timestamp).toISOString()
            })),
            timings: {
                createdAt: timestampToDate(data?.createdAt).toISOString(),
                pendingAt: data?.pendingAt ? timestampToDate(data.pendingAt).toISOString() : null,
                preparingAt: data?.preparingAt ? timestampToDate(data.preparingAt).toISOString() : null,
                readyAt: data?.readyAt ? timestampToDate(data.readyAt).toISOString() : null,
                servedAt: data?.servedAt ? timestampToDate(data.servedAt).toISOString() : null,
                completedAt: data?.completedAt ? timestampToDate(data.completedAt).toISOString() : null
            },
            isPaid: data?.isPaid || false
        }
    } catch (error) {
        console.error('Error fetching order timeline:', error)
        return null
    }
}

export async function syncOrderPaymentStatus(orderId: string, bookingId: string, isPaid: boolean) {
    try {
        await updateDocument('orders', orderId, {
            isPaid,
            paymentSyncedAt: dateToTimestamp(new Date()),
            bookingId,
            updatedAt: dateToTimestamp(new Date())
        })

        if (isPaid) {
            await createDocument('notifications', {
                type: 'payment_received',
                orderId,
                bookingId,
                businessUnit: 'hotel',
                message: `Order paid - marked in system`,
                title: 'Payment Received',
                recipient: 'restaurant_manager',
                isRead: false,
                createdAt: dateToTimestamp(new Date()),
                expiresAt: dateToTimestamp(new Date(Date.now() + 24 * 60 * 60 * 1000))
            })
        }

        return { success: true }
    } catch (error) {
        console.error('Error syncing order payment status:', error)
        return { success: false, error }
    }
}

// Link a room service order to a hotel booking
export async function linkOrderToBooking(orderId: string, bookingId: string, roomNumber: string) {
    try {
        // Get the order
        const orderDoc = await adminDb.collection('orders').doc(orderId).get()
        if (!orderDoc.exists) {
            return { success: false, error: 'Order not found' }
        }

        const order = orderDoc.data()
        const orderTotal = order?.totalAmount || 0

        // Update the order with booking reference
        await updateDocument('orders', orderId, {
            bookingId,
            roomNumber,
            linkedToBooking: true
        })

        // Get the booking from the bookings collection (not hotelBookings)
        const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()
        if (!bookingDoc.exists) {
            return { success: false, error: 'Booking not found' }
        }

        const booking = bookingDoc.data()

        // Add room service charge to booking
        const roomServiceCharges = booking?.roomServiceCharges || []
        const newCharge = {
            orderId,
            orderNumber: order?.orderNumber,
            amount: orderTotal,
            items: order?.items || [],
            createdAt: dateToTimestamp(new Date())
        }

        const updatedCharges = [...roomServiceCharges, newCharge]
        const roomServiceTotal = updatedCharges.reduce((sum, charge) => sum + charge.amount, 0)

        // Update booking total amount to include room service
        const baseAmount = booking?.totalAmount || 0
        const previousRoomServiceTotal = booking?.roomServiceTotal || 0
        const newTotalAmount = baseAmount - previousRoomServiceTotal + roomServiceTotal

        // Recalculate remaining balance
        const totalPaid = booking?.totalPaid || 0
        const newRemainingBalance = newTotalAmount - totalPaid
        const newPaymentStatus = newRemainingBalance <= 0 ? 'completed' : (totalPaid > 0 ? 'partial' : 'pending')

        await updateDocument('bookings', bookingId, {
            roomServiceCharges: updatedCharges,
            roomServiceTotal,
            totalAmount: newTotalAmount,
            remainingBalance: newRemainingBalance,
            paymentStatus: newPaymentStatus,
            updatedAt: dateToTimestamp(new Date())
        })

        return { success: true }
    } catch (error) {
        console.error('Error linking order to booking:', error)
        return { success: false, error }
    }
}

export async function deleteOrder(orderId: string, password?: string) {
    try {
        // Verify password
        const DELETION_PASSWORD = 'KappuLokuHimu#1006'
        if (password !== DELETION_PASSWORD) {
            return { success: false, error: 'Invalid password' }
        }

        const doc = await adminDb.collection('orders').doc(orderId).get()
        if (!doc.exists) {
            return { success: false, error: 'Order not found' }
        }

        const data = doc.data()
        const bookingId = data?.bookingId

        await deleteDocument('orders', orderId)

        if (bookingId) {
            const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()
            if (bookingDoc.exists) {
                const booking = bookingDoc.data()
                const charges = booking?.roomServiceCharges || []
                const updatedCharges = charges.filter((c: any) => c.orderId !== orderId)
                const roomServiceTotal = updatedCharges.reduce((sum: number, c: any) => sum + (c.amount || 0), 0)

                const baseAmount = booking?.totalAmount || 0
                const previousRoomServiceTotal = booking?.roomServiceTotal || 0
                const newTotalAmount = baseAmount - previousRoomServiceTotal + roomServiceTotal

                const totalPaid = booking?.totalPaid || 0
                const newRemainingBalance = newTotalAmount - totalPaid
                const newPaymentStatus = newRemainingBalance <= 0 ? 'completed' : (totalPaid > 0 ? 'partial' : 'pending')

                await updateDocument('bookings', bookingId, {
                    roomServiceCharges: updatedCharges,
                    roomServiceTotal,
                    totalAmount: newTotalAmount,
                    remainingBalance: newRemainingBalance,
                    paymentStatus: newPaymentStatus,
                })
            }
        }

        return { success: true }
    } catch (error) {
        console.error('Error deleting order:', error)
        return { success: false, error }
    }
}
