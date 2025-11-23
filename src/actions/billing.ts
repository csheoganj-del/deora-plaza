"use server"

import { createDocument, queryDocuments, updateDocument, timestampToDate, dateToTimestamp } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"

export async function createBill(data: {
    orderId: string
    businessUnit: string
    subtotal: number
    gstPercent: number
    gstAmount: number
    grandTotal: number
    paymentMethod?: string
}) {
    try {
        const timestamp = Date.now()
        const billNumber = `BILL-${timestamp}`

        const billData = {
            billNumber,
            orderId: data.orderId,
            businessUnit: data.businessUnit,
            subtotal: data.subtotal,
            gstPercent: data.gstPercent,
            gstAmount: data.gstAmount,
            grandTotal: data.grandTotal,
            paymentMethod: data.paymentMethod || 'cash',
            paymentStatus: 'paid',
            createdAt: dateToTimestamp(new Date())
        }

        const result = await createDocument('bills', billData)

        // Update order status to completed
        await updateDocument('orders', data.orderId, {
            status: 'completed',
            billId: result.id
        })

        return { success: true, billId: result.id, billNumber }
    } catch (error) {
        console.error('Error creating bill:', error)
        return { success: false, error }
    }
}

export async function getBills(businessUnit?: string) {
    try {
        const filters = businessUnit
            ? [{ field: 'businessUnit', operator: '==' as const, value: businessUnit }]
            : []

        const bills = await queryDocuments('bills', filters, 'createdAt', 'desc')

        return bills.map((bill: any) => ({
            ...bill,
            createdAt: timestampToDate(bill.createdAt)
        }))
    } catch (error) {
        console.error('Error fetching bills:', error)
        return []
    }
}

export async function getBillById(billId: string) {
    try {
        const doc = await adminDb.collection('bills').doc(billId).get()

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
        console.error('Error fetching bill:', error)
        return null
    }
}

export async function generateBill(data: any) {
    return createBill(data)
}

export async function processPayment(billId: string, paymentMethod: string, amountPaid?: number) {
    try {
        await updateDocument('bills', billId, {
            paymentStatus: 'paid',
            paymentMethod,
            amountPaid: amountPaid || 0,
            updatedAt: dateToTimestamp(new Date())
        })
        return { success: true }
    } catch (error) {
        console.error('Error processing payment:', error)
        return { success: false, error }
    }
}

export async function getDailyRevenue(businessUnit?: string) {
    try {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const filters: any[] = [
            { field: 'createdAt', operator: '>=', value: dateToTimestamp(startOfDay) }
        ]

        if (businessUnit) {
            filters.push({ field: 'businessUnit', operator: '==', value: businessUnit })
        }

        const bills = await queryDocuments('bills', filters)

        return bills.reduce((total: number, bill: any) => total + (bill.grandTotal || 0), 0)
    } catch (error) {
        console.error('Error fetching daily revenue:', error)
        return 0
    }
}

export async function getRevenueStats(businessUnit?: string) {
    try {
        const daily = await getDailyRevenue(businessUnit)
        return { daily, weekly: 0, monthly: 0, growth: 0 }
    } catch (error) {
        return { daily: 0, weekly: 0, monthly: 0, growth: 0 }
    }
}

export async function getUnbilledOrders() {
    try {
        // Get orders that are served/completed but not yet billed
        const orders = await queryDocuments('orders', [
            { field: 'status', operator: 'in', value: ['served', 'completed'] }
        ])

        // Filter out orders that already have a billId
        return orders.filter((order: any) => !order.billId).map((order: any) => ({
            ...order,
            createdAt: timestampToDate(order.createdAt)
        }))
    } catch (error) {
        console.error('Error fetching unbilled orders:', error)
        return []
    }
}
