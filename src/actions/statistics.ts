"use server"

import { queryDocuments } from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"

export interface ItemSalesStats {
    itemId: string
    itemName: string
    category: string
    quantity: number
    revenue: number
    orderCount: number
}

export interface CategoryStats {
    category: string
    revenue: number
    quantity: number
    orderCount: number
    items: number
}

export interface PaymentMethodStats {
    method: string
    count: number
    revenue: number
    percentage: number
}

export interface TimeBasedStats {
    hour?: number
    day?: string
    week?: string
    month?: string
    revenue: number
    count: number
}

/* 
   Helper to fetch and Normalize Data from Bills and Bookings 
   Returns an array of "Transaction" like objects:
   { 
     id: string, 
     createdAt: Date, 
     amount: number, 
     businessUnit: string, 
     items: [], 
     paymentMethod: string 
   }
*/
async function getAllTransactions(startDate?: Date, endDate?: Date, businessUnit?: string) {
    // 1. Fetch Bills (Restaurant, Garden Orders, etc.)
    const billFilters: any[] = [{ field: 'paymentStatus', operator: 'in', value: ['paid', 'completed'] }]
    if (startDate) billFilters.push({ field: 'createdAt', operator: '>=', value: startDate.toISOString() })
    if (endDate) billFilters.push({ field: 'createdAt', operator: '<=', value: endDate.toISOString() })

    // 2. Fetch Bookings (Hotel, Events)
    // Bookings might have status 'confirmed', 'checked-in', 'checked-out' and paymentStatus 'partial', 'completed'
    // We should ideally count payments made, but for revenue stats, we often look at "Total Sales" (booked value) OR "Collected" (payments).
    // The previous logic for bills used `paymentStatus == 'paid'`, implying "Sales that are paid".
    // For Hotel, let's use all active bookings and sum their `totalPaid` separately? 
    // OR just use `totalAmount` if `paymentStatus` is completed?
    // Let's stick to "Revenue" as "Accrued Revenue" (Total Bill Amount) for completed/active transactions, 
    // but typically dashboard revenue = collected + due.
    // Let's fetch all relevant bookings.
    const bookingFilters: any[] = [{ field: 'status', operator: 'in', value: ['confirmed', 'checked-in', 'checked-out', 'completed'] }]
    if (startDate) bookingFilters.push({ field: 'createdAt', operator: '>=', value: startDate.toISOString() })
    if (endDate) bookingFilters.push({ field: 'createdAt', operator: '<=', value: endDate.toISOString() })

    const [bills, bookings] = await Promise.all([
        queryDocuments('bills', billFilters),
        queryDocuments('bookings', bookingFilters)
    ])

    // Normalize Bills
    const normalizedBills = bills.map((b: any) => ({
        id: b.id,
        createdAt: new Date(b.createdAt),
        amount: b.grandTotal || 0,
        businessUnit: b.businessUnit || 'restaurant', // Default to restaurant if missing
        paymentMethod: b.paymentMethod || 'cash',
        items: b.items || [],
        type: 'bill'
    }))

    // Normalize Bookings
    const normalizedBookings = bookings.map((b: any) => ({
        id: b.id,
        createdAt: new Date(b.createdAt),
        // use totalAmount as the revenue value for the "sale"
        amount: b.totalAmount || 0,
        businessUnit: b.type || 'hotel', // 'hotel' or 'garden'
        paymentMethod: 'mixed', // Bookings often have multiple payments
        payments: b.payments || [], // Keep active payments for method analysis
        items: [{
            name: `${b.type === 'hotel' ? 'Room' : 'Event'} Booking`,
            category: 'Accommodation',
            quantity: 1,
            price: b.totalAmount || 0
        }],
        type: 'booking'
    }))

    let allTrans = [...normalizedBills, ...normalizedBookings]

    if (businessUnit) {
        allTrans = allTrans.filter(t => t.businessUnit === businessUnit)
    }

    return allTrans
}

export async function getItemSalesStats(
    businessUnit?: string,
    startDate?: Date,
    endDate?: Date
): Promise<ItemSalesStats[]> {
    try {
        if (!startDate) {
            startDate = new Date()
            startDate.setMonth(startDate.getMonth() - 6)
        }

        const transactions = await getAllTransactions(startDate, endDate, businessUnit)
        const itemMap = new Map<string, ItemSalesStats>()

        transactions.forEach(t => {
            let items: any[] = []
            // Parse items if string (legacy bills)
            if (typeof t.items === 'string') {
                try { items = JSON.parse(t.items) } catch (e) { items = [] }
            } else if (Array.isArray(t.items)) {
                items = t.items
            }

            items.forEach((item: any) => {
                const itemId = item.id || item.name
                const itemName = item.name || 'Unknown'
                const category = item.category || 'UNCATEGORIZED'
                const quantity = item.quantity || 0
                const price = item.price || 0
                const revenue = quantity * price

                if (itemMap.has(itemId)) {
                    const existing = itemMap.get(itemId)!
                    existing.quantity += quantity
                    existing.revenue += revenue
                    existing.orderCount += 1
                } else {
                    itemMap.set(itemId, {
                        itemId,
                        itemName,
                        category,
                        quantity,
                        revenue,
                        orderCount: 1
                    })
                }
            })
        })

        return Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue)
    } catch (error) {
        console.error('Error fetching item sales stats:', error)
        return []
    }
}

export async function getCategoryStats(
    businessUnit?: string,
    startDate?: Date,
    endDate?: Date
): Promise<CategoryStats[]> {
    try {
        if (!startDate) {
            startDate = new Date()
            startDate.setMonth(startDate.getMonth() - 6)
        }
        const transactions = await getAllTransactions(startDate, endDate, businessUnit)
        const categoryMap = new Map<string, CategoryStats>()

        transactions.forEach(t => {
            let items: any[] = []
            if (typeof t.items === 'string') {
                try { items = JSON.parse(t.items) } catch (e) { items = [] }
            } else if (Array.isArray(t.items)) {
                items = t.items
            }

            items.forEach((item: any) => {
                const category = item.category || 'UNCATEGORIZED'
                const quantity = item.quantity || 0
                const price = item.price || 0
                const revenue = quantity * price

                if (categoryMap.has(category)) {
                    const existing = categoryMap.get(category)!
                    existing.revenue += revenue
                    existing.quantity += quantity
                    existing.orderCount += 1 // This is slightly inaccurate per item loop, but tracks frequency
                    existing.items += 1
                } else {
                    categoryMap.set(category, {
                        category,
                        revenue,
                        quantity,
                        orderCount: 1,
                        items: 1
                    })
                }
            })
        })

        return Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue)
    } catch (error) {
        console.error('Error fetching category stats:', error)
        return []
    }
}

export async function getPaymentMethodStats(
    businessUnit?: string,
    startDate?: Date,
    endDate?: Date
): Promise<PaymentMethodStats[]> {
    try {
        if (!startDate) {
            startDate = new Date()
            startDate.setMonth(startDate.getMonth() - 6)
        }
        const transactions = await getAllTransactions(startDate, endDate, businessUnit)

        const methodMap = new Map<string, { count: number; revenue: number }>()
        let totalRevenue = 0

        transactions.forEach(t => {
            // For bookings with 'mixed' payments, iterate over payments array
            if (t.type === 'booking' && t.payments && t.payments.length > 0) {
                t.payments.forEach((p: any) => {
                    const method = (p.type || p.method || 'cash').toLowerCase()
                    const amount = p.amount || 0
                    totalRevenue += amount // Use collected amount for payments

                    if (methodMap.has(method)) {
                        const existing = methodMap.get(method)!
                        existing.count += 1
                        existing.revenue += amount
                    } else {
                        methodMap.set(method, { count: 1, revenue: amount })
                    }
                })
            } else {
                // For regular bills or bookings without granular payments, use main method
                // (Though for bookings, amount is totalAmount, not necessarily paid. 
                //  Bills are 'paid', so amount is good. 
                //  For Bookings, if no payments array, we might assume 'cash' or skip?
                //  Let's assume bill.paymentMethod is correct for bills)
                if (t.type === 'bill') {
                    const method = (t.paymentMethod || 'cash').toLowerCase()
                    const amount = t.amount
                    totalRevenue += amount

                    if (methodMap.has(method)) {
                        const existing = methodMap.get(method)!
                        existing.count += 1
                        existing.revenue += amount
                    } else {
                        methodMap.set(method, { count: 1, revenue: amount })
                    }
                }
            }
        })

        return Array.from(methodMap.entries()).map(([method, data]) => ({
            method: method.charAt(0).toUpperCase() + method.slice(1),
            count: data.count,
            revenue: data.revenue,
            percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
        })).sort((a, b) => b.revenue - a.revenue)
    } catch (error) {
        console.error('Error fetching payment method stats:', error)
        return []
    }
}

export async function getTimeBasedStats(
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    businessUnit?: string,
    startDate?: Date,
    endDate?: Date
): Promise<TimeBasedStats[]> {
    try {
        // Default range handle
        if (!startDate) {
            startDate = new Date()
            startDate.setMonth(startDate.getMonth() - 6)
        }
        const transactions = await getAllTransactions(startDate, endDate, businessUnit)
        const statsMap = new Map<string, TimeBasedStats>()

        transactions.forEach(t => {
            const date = t.createdAt
            const revenue = t.amount
            let key = ''
            let label = ''

            // Same key logic
            if (period === 'hourly') {
                const hour = date.getHours()
                key = `hour-${hour}`
                label = `${hour}:00`
                if (!statsMap.has(key)) statsMap.set(key, { hour, revenue: 0, count: 0 })
            } else if (period === 'daily') {
                const dayStr = date.toISOString().split('T')[0]
                key = `day-${dayStr}`
                label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                if (!statsMap.has(key)) statsMap.set(key, { day: label, revenue: 0, count: 0 })
            } else if (period === 'weekly') {
                // Weekly logic
                const weekStart = new Date(date)
                const day = weekStart.getDay()
                const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
                weekStart.setDate(diff)
                const weekStr = weekStart.toISOString().split('T')[0]
                key = `week-${weekStr}`
                label = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                if (!statsMap.has(key)) statsMap.set(key, { week: label, revenue: 0, count: 0 })
            } else if (period === 'monthly') {
                const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                key = `month-${monthStr}`
                label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                if (!statsMap.has(key)) statsMap.set(key, { month: label, revenue: 0, count: 0 })
            } else if (period === 'yearly') {
                const yearStr = `${date.getFullYear()}`
                key = `year-${yearStr}`
                label = date.toLocaleDateString('en-US', { year: 'numeric' })
                if (!statsMap.has(key)) statsMap.set(key, { month: label, revenue: 0, count: 0 })
            }

            if (statsMap.has(key)) {
                const existing = statsMap.get(key)!
                existing.revenue += revenue
                existing.count += 1
            }
        })

        const stats = Array.from(statsMap.values())
        // Sort
        if (period === 'hourly') {
            stats.sort((a, b) => (a.hour || 0) - (b.hour || 0))
        } else {
            stats.sort((a, b) => {
                const aKey = a.day || a.week || a.month || ''
                const bKey = b.day || b.week || b.month || ''
                return aKey.localeCompare(bKey)
            })
        }
        return stats
    } catch (e) {
        console.error('Error fetching time stats', e)
        return []
    }
}

export async function getRevenueStats(businessUnit?: string, timePeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    try {
        const now = new Date()
        let startLimit = new Date()
        if (timePeriod === 'yearly') startLimit.setFullYear(now.getFullYear() - 1, 0, 1)
        else startLimit.setFullYear(now.getFullYear(), now.getMonth() - 2, 1) // Fetch enough for comparison

        const transactions = await getAllTransactions(startLimit, undefined, businessUnit)

        // Date Helpers
        const dailyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const weeklyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0)
        const monthlyStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

        // Helper
        const sumRev = (trans: any[]) => trans.reduce((s, t) => s + t.amount, 0)
        const filterDate = (start: Date, end?: Date) => transactions.filter(t => t.createdAt >= start && (!end || t.createdAt <= end))

        return {
            daily: sumRev(filterDate(dailyStart)),
            weekly: sumRev(filterDate(weeklyStart)),
            monthly: sumRev(filterDate(monthlyStart)),
            lastMonth: sumRev(filterDate(lastMonthStart, lastMonthEnd)),
            currentRevenue: sumRev(filterDate(monthlyStart)), // Simplify: dashboard mostly shows 'This Month' or selected. The UI handles specific period filters calling specific functions? No, the UI calls getRevenueStats with timePeriod.
            // But getRevenueStats returned `currentRevenue` based on the requested period.
            // Let's reimplement selection:
            orderCount: transactions.length,
            growth: 0
        }
        // Actually, the previous implementation had logic to switch "currentRevenue" based on timePeriod.
        // Let's restore that logic:

        let currentStart = monthlyStart
        let previousStart = lastMonthStart
        let previousEnd = lastMonthEnd

        if (timePeriod === 'daily') {
            currentStart = dailyStart
            previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
            previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
        } else if (timePeriod === 'weekly') {
            currentStart = weeklyStart
            previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14, 0, 0, 0, 0)
            previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8, 23, 59, 59, 999)
        } else if (timePeriod === 'yearly') {
            currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
            previousStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0)
            previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
        }

        const currentRevenue = sumRev(filterDate(currentStart))
        const previousRevenue = sumRev(filterDate(previousStart, previousEnd))
        const growth = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
            : currentRevenue > 0 ? 100 : 0

        return {
            daily: sumRev(filterDate(dailyStart)),
            weekly: sumRev(filterDate(weeklyStart)),
            monthly: sumRev(filterDate(monthlyStart)),
            lastMonth: sumRev(filterDate(lastMonthStart, lastMonthEnd)),
            currentRevenue,
            previousRevenue,
            orderCount: transactions.length,
            growth
        }

    } catch (error) {
        console.error('Error fetching revenue stats:', error)
        return { daily: 0, weekly: 0, monthly: 0, lastMonth: 0, currentRevenue: 0, previousRevenue: 0, growth: 0, orderCount: 0 }
    }
}

export async function getTopSellingItems(
    limit: number = 10,
    businessUnit?: string,
    startDate?: Date,
    endDate?: Date
): Promise<ItemSalesStats[]> {
    try {
        const items = await getItemSalesStats(businessUnit, startDate, endDate);
        return items.slice(0, limit);
    } catch (error) {
        console.error('Error fetching top selling items:', error);
        return [];
    }
}

export async function getLeastSellingItems(
    limit: number = 10,
    businessUnit?: string,
    startDate?: Date,
    endDate?: Date
): Promise<ItemSalesStats[]> {
    try {
        const items = await getItemSalesStats(businessUnit, startDate, endDate);
        return items.slice(-limit).reverse();
    } catch (error) {
        console.error('Error fetching least selling items:', error);
        return [];
    }
}

