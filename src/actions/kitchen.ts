"use server"

import { queryDocuments, updateDocument, timestampToDate } from "@/lib/firebase/firestore"

export async function getKitchenOrders(businessUnit?: string) {
    try {
        const filters: any[] = [
            { field: 'status', operator: 'in', value: ['pending', 'preparing', 'ready'] }
        ]

        if (businessUnit) {
            filters.push({ field: 'businessUnit', operator: '==', value: businessUnit })
        } else {
            filters.push({ field: 'businessUnit', operator: 'in', value: ['cafe', 'bar'] })
        }

        const orders = await queryDocuments('orders', filters, 'createdAt', 'asc')

        return orders.map((order: any) => ({
            ...order,
            createdAt: timestampToDate(order.createdAt)
        }))
    } catch (error) {
        console.error('Error fetching kitchen orders:', error)
        return []
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        await updateDocument('orders', orderId, {
            status,
            [`${status}At`]: new Date()
        })
        return { success: true }
    } catch (error) {
        console.error('Error updating order status:', error)
        return { success: false, error }
    }
}
