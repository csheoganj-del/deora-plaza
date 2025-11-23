"use server"

import { queryDocuments, timestampToDate } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"

export async function getDashboardStats() {
    try {
        // Get active orders count
        const activeOrdersSnapshot = await adminDb.collection('orders')
            .where('status', 'in', ['pending', 'preparing', 'ready'])
            .get()
        const activeOrdersCount = activeOrdersSnapshot.size

        // Get total customers count
        const customersSnapshot = await adminDb.collection('customers').get()
        const totalCustomers = customersSnapshot.size

        // Get total revenue from paid bills
        const billsSnapshot = await adminDb.collection('bills')
            .where('paymentStatus', '==', 'paid')
            .get()

        let totalRevenue = 0
        billsSnapshot.forEach(doc => {
            const bill = doc.data()
            totalRevenue += bill.grandTotal || 0
        })

        // Get recent orders (last 10)
        const recentOrdersSnapshot = await adminDb.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get()

        const recentOrders = recentOrdersSnapshot.docs.map(doc => {
            const data = doc.data() as {
                businessUnit: string
                type: string
                orderNumber: string
                totalAmount: number
                table?: { tableNumber: string }
                createdAt: any
                [key: string]: any
            }
            return {
                id: doc.id,
                ...data,
                createdAt: timestampToDate(data.createdAt)
            }
        })

        return {
            activeOrders: activeOrdersCount,
            totalCustomers,
            totalRevenue,
            recentOrders
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return {
            activeOrders: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            recentOrders: []
        }
    }
}
