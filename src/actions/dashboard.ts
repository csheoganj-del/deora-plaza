"use server"

import { queryDocuments } from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"

export async function getDashboardStats() {
    try {
        // Run all independent queries in parallel
        const [
            activeOrdersData,
            customersData,
            paidBillsData,
            gardenBookingsData,
            hotelBookingsData,
            recentOrdersData,
            usersData
        ] = await Promise.all([
            // 1. Active Orders Count
            supabaseServer
                .from('orders')
                .select('status', { count: 'exact' })
                .in('status', ['pending', 'preparing', 'ready']),

            // 2. Total Customers Count
            supabaseServer
                .from('customers')
                .select('mobileNumber', { count: 'exact' }),

            // 3. Paid Bills (Revenue)
            supabaseServer
                .from('bills')
                .select('grandTotal, businessUnit')
                .eq('paymentStatus', 'paid'),

            // 4. Garden Bookings (Revenue)
            supabaseServer
                .from('bookings')
                .select('totalPaid, totalAmount, type, payments')
                .eq('type', 'garden'),

            // 5. Hotel Bookings (Revenue)
            supabaseServer
                .from('bookings')
                .select('totalPaid, totalAmount, type, payments')
                .eq('type', 'hotel'),

            // 6. Recent Orders (Full data needed for UI)
            supabaseServer
                .from('orders')
                .select('*')
                .order('createdAt', { ascending: false })
                .limit(10),

            // 7. Users snapshot for presence analytics
            supabaseServer
                .from('users')
                .select('devices, lastLoginAt, lastLoginSource, role, businessUnit, name')
        ])

        // Extract data and counts
        const activeOrdersCount = activeOrdersData.count || 0
        const totalCustomers = customersData.count || 0

        // Calculate Revenue (Bills)
        let cafeBarRevenue = 0
        const revenueByUnit: any = { cafe: 0, bar: 0, garden: 0, hotel: 0 }

        if (!paidBillsData.error && paidBillsData.data) {
            paidBillsData.data.forEach((bill: any) => {
                const amount = bill.grandTotal || 0
                cafeBarRevenue += amount
                if (bill.businessUnit) {
                    revenueByUnit[bill.businessUnit] = (revenueByUnit[bill.businessUnit] || 0) + amount
                }
            })
        }

        const cafeOrdersCount = revenueByUnit.cafe && !paidBillsData.error && paidBillsData.data ?
            paidBillsData.data.filter((d: any) => d.businessUnit === 'cafe').length : 0
        const barOrdersCount = revenueByUnit.bar && !paidBillsData.error && paidBillsData.data ?
            paidBillsData.data.filter((d: any) => d.businessUnit === 'bar').length : 0

        // Calculate Revenue (Bookings)
        let bookingsRevenue = 0
        let pendingRevenue = 0
        let activeBookingsCount = 0

        if (!gardenBookingsData.error && gardenBookingsData.data) {
            gardenBookingsData.data.forEach((booking: any) => {
                let paid = booking.totalPaid || 0
                // Fallback: Calculate from payments array if totalPaid is 0 but payments exist
                if (paid === 0 && booking.payments && Array.isArray(booking.payments)) {
                    paid = booking.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
                }

                const total = booking.totalAmount || paid // fallback to paid if totalAmount missing
                bookingsRevenue += paid
                const pending = Math.max(0, total - paid)
                pendingRevenue += pending
                revenueByUnit.garden += paid

                // Count as active if pending balance > 0 or status implies active service
                if (booking.status !== 'cancelled' && (pending > 0 || ['confirmed', 'checked_in', 'pending'].includes(booking.status))) {
                    activeBookingsCount++
                }
            })
        }

        if (!hotelBookingsData.error && hotelBookingsData.data) {
            hotelBookingsData.data.forEach((booking: any) => {
                let paid = booking.totalPaid || 0
                // Fallback here too for consistency, though hotel bookings key was correct
                if (paid === 0 && booking.payments && Array.isArray(booking.payments)) {
                    paid = booking.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
                }

                const total = booking.totalAmount || paid
                bookingsRevenue += paid
                const pending = Math.max(0, total - paid)
                pendingRevenue += pending
                revenueByUnit.hotel += paid

                // Count as active if pending balance > 0 or status implies active service
                if (booking.status !== 'cancelled' && (pending > 0 || ['confirmed', 'checked_in', 'pending'].includes(booking.status))) {
                    activeBookingsCount++
                }
            })
        }

        const totalRevenue = cafeBarRevenue + bookingsRevenue

        const recentOrders = !recentOrdersData.error && recentOrdersData.data ?
            recentOrdersData.data.map((order: any) => ({
                id: order.id,
                ...order
            })) : []

        // Presence analytics
        const now = Date.now()
        const onlineWindowMs = 2 * 60 * 1000
        let onlineUsersCount = 0
        const devicesOnline: any = { web: 0, android: 0, ios: 0 }
        const recentLogins: any[] = []
        const usersOnlineList: any[] = []
        const usersOfflineList: any[] = []

        if (!usersData.error && usersData.data) {
            usersData.data.forEach((user: any) => {
                const devices = user.devices || {}
                let userOnline = false
                let lastSeen = 0
                Object.values(devices).forEach((dev: any) => {
                    const t = dev?.lastSeenAt
                    let dLast = 0
                    if (!t) {
                        dLast = 0
                    } else if (typeof t === 'string') {
                        dLast = new Date(t).getTime()
                    } else if (t instanceof Date) {
                        dLast = t.getTime()
                    } else if (typeof t === 'number') {
                        dLast = t
                    }
                    if (dLast) {
                        lastSeen = Math.max(lastSeen, dLast)
                    }
                    if (dLast && (now - dLast) < onlineWindowMs) {
                        userOnline = true
                        const p = (dev?.platform || '').toLowerCase()
                        if (p === 'web' || p === 'android' || p === 'ios') {
                            devicesOnline[p] = (devicesOnline[p] || 0) + 1
                        }
                    }
                })
                if (userOnline) {
                    onlineUsersCount++
                    usersOnlineList.push({ id: user.id, name: user.name || user.id })
                } else {
                    const ago = lastSeen ? Math.floor((now - lastSeen) / 60000) : null
                    usersOfflineList.push({ id: user.id, name: user.name || user.id, agoMinutes: ago })
                }

                const lli = user.lastLoginAt
                let lliTime = 0
                if (typeof lli === 'string') lliTime = new Date(lli).getTime()
                else if (lli instanceof Date) lliTime = lli.getTime()
                else if (typeof lli === 'number') lliTime = lli
                if (lliTime) {
                    recentLogins.push({
                        id: user.id,
                        name: user.name || user.id,
                        role: user.role,
                        businessUnit: user.businessUnit,
                        source: user.lastLoginSource || 'unknown',
                        time: new Date(lliTime).toISOString()
                    })
                }
            })
        }

        recentLogins.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        const recentLoginsTop = recentLogins.slice(0, 10)
        usersOfflineList.sort((a, b) => {
            const ax = a.agoMinutes ?? Number.MAX_SAFE_INTEGER
            const bx = b.agoMinutes ?? Number.MAX_SAFE_INTEGER
            return ax - bx
        })
        const usersOnlineTop = usersOnlineList.slice(0, 8)
        const usersOfflineTop = usersOfflineList.slice(0, 8)

        return {
            totalRevenue,
            pendingRevenue,
            cafeBarRevenue,
            bookingsRevenue,
            revenueByUnit,
            transactionCounts: {
                cafe: cafeOrdersCount,
                bar: barOrdersCount,
                garden: (gardenBookingsData.data?.length) || 0,
                hotel: (hotelBookingsData.data?.length) || 0
            },
            activeOrders: activeOrdersCount,
            activeBookings: activeBookingsCount,
            totalCustomers,
            recentOrders,
            onlineUsersCount,
            devicesOnline,
            recentLogins: recentLoginsTop,
            usersOnline: usersOnlineTop,
            usersOffline: usersOfflineTop
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return {
            totalRevenue: 0,
            pendingRevenue: 0,
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

