"use server"

import { createDocument, queryDocuments, updateDocument, timestampToDate, dateToTimestamp } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"
import { recordDiscount } from "@/actions/discounts"
import { updateCustomerStats } from "@/actions/customers"
import { calculateBillTotals } from "@/lib/discount-utils"

// Get the next sequential bill number (reuses deleted numbers to fill gaps)
async function getNextBillNumber(): Promise<string> {
    const today = new Date();
    const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    
    // Get all bills to find existing numbers
    const billsSnapshot = await adminDb.collection('bills').get();
    
    if (billsSnapshot.empty) {
        // No bills exist, start from 1
        return `BILL-${dateString}-001`;
    }
    
    // Extract all existing bill numbers
    const existingNumbers: number[] = [];
    billsSnapshot.forEach(doc => {
        const billNumber = doc.data()?.billNumber;
        if (billNumber && typeof billNumber === 'string') {
            // Extract the number part from "BILL-20251205-003"
            const parts = billNumber.split('-');
            if (parts.length === 3) {
                const num = parseInt(parts[2], 10);
                if (!isNaN(num)) {
                    existingNumbers.push(num);
                }
            }
        }
    });
    
    // Sort the numbers
    existingNumbers.sort((a, b) => a - b);
    
    // Find the first missing number in the sequence
    let nextNumber = 1;
    for (const num of existingNumbers) {
        if (num === nextNumber) {
            nextNumber++;
        } else if (num > nextNumber) {
            // Found a gap, use this number
            break;
        }
    }
    
    return `BILL-${dateString}-${String(nextNumber).padStart(3, '0')}`;
}

export async function deleteBill(billId: string, password: string) {
    try {
        // Verify password
        const DELETION_PASSWORD = 'KappuLokuHimu#1006'
        if (password !== DELETION_PASSWORD) {
            return { success: false, error: 'Invalid password' }
        }

        // Get the bill to find the orderId
        const billDoc = await adminDb.collection('bills').doc(billId).get();
        if (!billDoc.exists) {
            return { success: false, error: 'Bill not found' }
        }
        const billData = billDoc.data();

        // Delete the bill
        await adminDb.collection('bills').doc(billId).delete()

        // Update the order status back to served (or whatever appropriate status)
        if (billData?.orderId) {
            await updateDocument('orders', billData.orderId, {
                status: 'served',
                billId: null,
                settlementStatus: 'not-required', // Reset settlement status
                isPaid: false
            })
        }

        return { success: true }
    } catch (error) {
        console.error('Error deleting bill:', error)
        return { success: false, error }
    }
}

export async function createBill(data: {
    orderId: string
    businessUnit: string
    customerMobile?: string
    customerName?: string
    subtotal: number
    discountPercent?: number
    discountAmount?: number
    gstPercent: number
    gstAmount: number
    grandTotal: number
    paymentMethod?: string
    source?: string // 'dine-in', 'online', 'zomato', 'swiggy'
    address?: string
    items?: any[] // Add items array
}) {
    try {
        const billNumber = await getNextBillNumber()

        const billData = {
            billNumber,
            orderId: data.orderId,
            businessUnit: data.businessUnit,
            customerMobile: data.customerMobile || null,
            customerName: data.customerName || null,
            subtotal: data.subtotal,
            discountPercent: data.discountPercent || 0,
            discountAmount: data.discountAmount || 0,
            gstPercent: data.gstPercent,
            gstAmount: data.gstAmount,
            grandTotal: data.grandTotal,
            paymentMethod: data.paymentMethod || 'cash',
            paymentStatus: 'paid',
            source: data.source || 'dine-in',
            address: data.address || null,
            items: data.items || [], // Save items array
            createdAt: dateToTimestamp(new Date())
        }

        const result = await createDocument('bills', billData)

        // Get order details to check if it has a table
        const orderDoc = await adminDb.collection('orders').doc(data.orderId).get()
        const orderData = orderDoc.data()

        // Update order status to completed
        await updateDocument('orders', data.orderId, {
            status: 'completed',
            billId: result.id,
            isPaid: true,
            paymentMethod: data.paymentMethod || 'cash'
        })

        // If order has a table, reset it to available
        if (orderData?.tableId) {
            await updateDocument('tables', orderData.tableId, {
                status: 'available',
                currentOrderId: null
            })
        }

        // If customer is linked and discount was applied, record it
        if (result.success && data.customerMobile && data.discountPercent && data.discountPercent > 0) {
            await recordDiscount({
                customerId: data.customerMobile,
                customerName: data.customerName || '',
                billId: result.id || '',
                businessUnit: data.businessUnit,
                originalAmount: data.subtotal,
                discountPercent: data.discountPercent,
                discountAmount: data.discountAmount || 0,
                finalAmount: data.grandTotal,
            })
        }

        // Update customer stats (total spent and visit count)
        if (result.success && data.customerMobile) {
            await updateCustomerStats(data.customerMobile, data.grandTotal)
        }

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
            createdAt: timestampToDate(bill.createdAt).toISOString(),
            updatedAt: timestampToDate(bill.updatedAt).toISOString()
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
            createdAt: timestampToDate(data?.createdAt).toISOString()
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

import { getGardenDailyRevenue } from "@/actions/garden"
import { getHotelDailyRevenue } from "@/actions/hotel"

export async function getDailyRevenue(businessUnit?: string) {
    try {
        if (businessUnit === 'garden') {
            return await getGardenDailyRevenue()
        }
        if (businessUnit === 'hotel') {
            return await getHotelDailyRevenue()
        }

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const filters: any[] = [
            { field: 'createdAt', operator: '>=', value: dateToTimestamp(startOfDay) }
        ]

        if (businessUnit) {
            filters.push({ field: 'businessUnit', operator: '==', value: businessUnit })
        }

        const bills = await queryDocuments('bills', filters)

        const total = bills.reduce((total: number, bill: any) => total + (bill.grandTotal || 0), 0)
        return { total, count: bills.length }
    } catch (error) {
        console.error('Error fetching daily revenue:', error)
        return { total: 0, count: 0 }
    }
}

export async function getRevenueStats(businessUnit?: string) {
    try {
        const dailyResult = await getDailyRevenue(businessUnit)
        return { daily: dailyResult.total, weekly: 0, monthly: 0, growth: 0 }
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

        // Filter out orders that already have a billId and serialize timestamps
        return orders.filter((order: any) => !order.billId).map((order: any) => ({
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
    } catch (error) {
        console.error('Error fetching unbilled orders:', error)
        return []
    }
}
