"use server"

import { queryDocuments, createDocument, updateDocument, timestampToDate, dateToTimestamp } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"

export async function createOrder(data: {
    tableId?: string
    tableNumber?: string
    customerMobile?: string
    type: string
    businessUnit: string
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

        const orderData = {
            orderNumber,
            type: data.type,
            businessUnit: data.businessUnit,
            tableId: data.tableId || null,
            tableNumber: data.tableNumber || null,
            customerMobile: data.customerMobile || null,
            status: 'pending',
            totalAmount,
            items: data.items,
            createdAt: dateToTimestamp(new Date())
        }

        const result = await createDocument('orders', orderData)
        return { success: true, orderId: result.id, orderNumber }
    } catch (error) {
        console.error('Error creating order:', error)
        return { success: false, error }
    }
}

export async function getOrders(businessUnit?: string, status?: string) {
    try {
        const filters = []

        if (businessUnit) {
            filters.push({ field: 'businessUnit', operator: '==' as const, value: businessUnit })
        }

        if (status) {
            filters.push({ field: 'status', operator: '==' as const, value: status })
        }

        const orders = await queryDocuments('orders', filters, 'createdAt', 'desc')

        // Convert timestamps to dates
        return orders.map((order: any) => ({
            ...order,
            createdAt: timestampToDate(order.createdAt)
        }))
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

export async function getOrderById(orderId: string) {
    try {
        const doc = await adminDb.collection('orders').doc(orderId).get()

        if (!doc.exists) {
            return null
        }

        const data = doc.data()
        return {
            id: doc.id,
            ...data,
            createdAt: timestampToDate(data?.createdAt)
        }
    } catch (error) {
        console.error('Error fetching order:', error)
        return null
    }
}
