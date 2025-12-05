"use server"

import { queryDocuments, timestampToDate, serializeTimestamps } from "@/lib/firebase/firestore"
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

        // Get total revenue from paid bills (Cafe + Bar orders)
        const billsSnapshot = await adminDb.collection('bills')
            .where('paymentStatus', '==', 'paid')
            .get()

        let cafeBarRevenue = 0
        const revenueByUnit: any = { cafe: 0, bar: 0 }
        billsSnapshot.forEach(doc => {
            const bill = doc.data()
            const amount = bill.grandTotal || 0
            cafeBarRevenue += amount

            if (bill.businessUnit) {
                revenueByUnit[bill.businessUnit] = (revenueByUnit[bill.businessUnit] || 0) + amount
            }
        })

        // Get all bookings revenue (Garden)
        const bookingsSnapshot = await adminDb.collection('bookings').get()
        let bookingsRevenue = 0
        const bookingsByType: any = { garden: 0, hotel: 0 }
        bookingsSnapshot.forEach(doc => {
            const booking = doc.data()
            const amount = booking.totalPaid || 0 // Use totalPaid instead of totalAmount for accurate revenue
            bookingsRevenue += amount

            if (booking.type) {
                bookingsByType[booking.type] = (bookingsByType[booking.type] || 0) + amount
            }
        })

        // Total revenue from all sources
        const totalRevenue = cafeBarRevenue + bookingsRevenue

        // Count bills/orders by business unit
        const cafeOrders = await adminDb.collection('bills').where('businessUnit', '==', 'cafe').get()
        const barOrders = await adminDb.collection('bills').where('businessUnit', '==', 'bar').get()
        const gardenBookings = await adminDb.collection('bookings').where('type', '==', 'garden').get()
        const hotelBookings = await adminDb.collection('bookings').where('type', '==', 'hotel').get()

        // Get recent orders (last 10)
        const recentOrdersSnapshot = await adminDb.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get()

        const recentOrders = recentOrdersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...serializeTimestamps(doc.data())
        }))

        return {
            totalRevenue,
            cafeBarRevenue,
            bookingsRevenue,
            revenueByUnit: {
                cafe: revenueByUnit.cafe || 0,
                bar: revenueByUnit.bar || 0,
                garden: bookingsByType.garden || 0,
                hotel: bookingsByType.hotel || 0
            },
            transactionCounts: {
                cafe: cafeOrders.size,
                bar: barOrders.size,
                garden: gardenBookings.size,
                hotel: hotelBookings.size
            },
            activeOrders: activeOrdersCount,
            totalCustomers,
            recentOrders
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return {
            totalRevenue: 0,
            cafeBarRevenue: 0,
            bookingsRevenue: 0,
            revenueByUnit: { cafe: 0, bar: 0, garden: 0, hotel: 0 },
            transactionCounts: { cafe: 0, bar: 0, garden: 0, hotel: 0 },
            activeOrders: 0,
            totalCustomers: 0,
            recentOrders: []
        }
    }
}
