"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Users,
    ShoppingBag,
    IndianRupee,
    Calendar,
    ArrowUpRight,
    Hotel,
    Wine,
    Flower2,
    Coffee,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"
import { signInWithCustomToken } from "firebase/auth"
import { db, auth } from "@/lib/firebase/config"

interface DashboardContentProps {
    initialStats: any
    initialBookings: any[]
    userName: string
    firebaseToken?: string
}

export default function DashboardContent({ initialStats, initialBookings, userName, firebaseToken }: DashboardContentProps) {
    const [stats, setStats] = useState(initialStats)
    const [allBookings, setAllBookings] = useState(initialBookings)
    const [isLive, setIsLive] = useState(false)

    useEffect(() => {
        if (firebaseToken) {
            signInWithCustomToken(auth, firebaseToken)
                .catch(err => console.error("Firebase sign-in failed", err))
        }
    }, [firebaseToken])

    useEffect(() => {
        let unsubOrders: (() => void) | undefined
        let unsubCustomers: (() => void) | undefined
        let unsubBills: (() => void) | undefined
        let unsubBookings: (() => void) | undefined

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsLive(true)

                // 1. Listen for Active Orders
                const ordersQuery = query(
                    collection(db, 'orders'),
                    where('status', 'in', ['pending', 'preparing', 'ready'])
                )

                unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
                    setStats((prev: any) => ({
                        ...prev,
                        activeOrders: snapshot.size
                    }))
                }, (error) => console.error("Orders listener error:", error))

                // 2. Listen for Customers
                const customersQuery = query(collection(db, 'customers'))
                unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
                    setStats((prev: any) => ({
                        ...prev,
                        totalCustomers: snapshot.size
                    }))
                }, (error) => console.error("Customers listener error:", error))

                // 3. Listen for Bills
                const billsQuery = query(collection(db, 'bills'))
                unsubBills = onSnapshot(billsQuery, (snapshot) => {
                    let cafeBarRevenue = 0
                    const revenueByUnit: any = { cafe: 0, bar: 0 }
                    let cafeCount = 0
                    let barCount = 0

                    snapshot.forEach(doc => {
                        const bill = doc.data()
                        if (bill.paymentStatus === 'paid') {
                            const amount = bill.grandTotal || 0
                            cafeBarRevenue += amount
                            if (bill.businessUnit) {
                                revenueByUnit[bill.businessUnit] = (revenueByUnit[bill.businessUnit] || 0) + amount
                            }
                        }
                        if (bill.businessUnit === 'cafe') cafeCount++
                        if (bill.businessUnit === 'bar') barCount++
                    })

                    setStats((prev: any) => ({
                        ...prev,
                        cafeBarRevenue,
                        totalRevenue: cafeBarRevenue + (prev.bookingsRevenue || 0),
                        revenueByUnit: {
                            ...prev.revenueByUnit,
                            cafe: revenueByUnit.cafe,
                            bar: revenueByUnit.bar
                        },
                        transactionCounts: {
                            ...prev.transactionCounts,
                            cafe: cafeCount,
                            bar: barCount
                        }
                    }))
                }, (error) => console.error("Bills listener error:", error))

                // 4. Listen for Bookings
                const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
                unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
                    let bookingsRevenue = 0
                    const bookingsByType: any = { garden: 0, hotel: 0 }
                    let gardenCount = 0
                    let hotelCount = 0

                    const bookings = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
                        startDate: doc.data().startDate?.toDate ? doc.data().startDate.toDate().toISOString() : doc.data().startDate,
                    }))

                    bookings.forEach((booking: any) => {
                        const amount = booking.totalPaid || 0
                        bookingsRevenue += amount

                        if (booking.type) {
                            bookingsByType[booking.type] = (bookingsByType[booking.type] || 0) + amount
                            if (booking.type === 'garden') gardenCount++
                            if (booking.type === 'hotel') hotelCount++
                        }
                    })

                    setAllBookings(bookings)

                    setStats((prev: any) => ({
                        ...prev,
                        bookingsRevenue,
                        totalRevenue: (prev.cafeBarRevenue || 0) + bookingsRevenue,
                        revenueByUnit: {
                            ...prev.revenueByUnit,
                            garden: bookingsByType.garden,
                            hotel: bookingsByType.hotel
                        },
                        transactionCounts: {
                            ...prev.transactionCounts,
                            garden: gardenCount,
                            hotel: hotelCount
                        }
                    }))
                }, (error) => console.error("Bookings listener error:", error))

            } else {
                setIsLive(false)
                if (unsubOrders) unsubOrders()
                if (unsubCustomers) unsubCustomers()
                if (unsubBills) unsubBills()
                if (unsubBookings) unsubBookings()
            }
        })

        return () => {
            unsubscribeAuth()
            if (unsubOrders) unsubOrders()
            if (unsubCustomers) unsubCustomers()
            if (unsubBills) unsubBills()
            if (unsubBookings) unsubBookings()
            setIsLive(false)
        }
    }, [])

    const quickLinks = [
        { title: "Hotel", icon: Hotel, href: "/dashboard/hotel", color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Bar & POS", icon: Wine, href: "/dashboard/bar", color: "text-purple-600", bg: "bg-purple-50" },
        { title: "Garden Events", icon: Flower2, href: "/dashboard/garden", color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Cafe Tables", icon: Coffee, href: "/dashboard/tables", color: "text-amber-600", bg: "bg-amber-50" },
    ]

    return (
        <div className="min-h-screen p-8 space-comfy">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, {userName}</p>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                    <div className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-sm font-medium text-slate-700">
                        {isLive ? 'Live Updates Active' : 'Connecting...'}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm text-slate-500">{format(new Date(), 'PPP')}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/dashboard/billing">
                    <Card className="bg-white border-slate-200 elevation-1 hover:elevation-2 transition-all cursor-pointer interactive-scale-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
                            <IndianRupee className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</div>
                            <p className="text-xs text-emerald-600 flex items-center mt-1">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                +12.5% from last month
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard/hotel">
                    <Card className="bg-white border-slate-200 elevation-1 hover:elevation-2 transition-all cursor-pointer interactive-scale-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Total Bookings</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">
                                {(stats.transactionCounts?.hotel || 0) + (stats.transactionCounts?.garden || 0)}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Hotel & Garden</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard/customers">
                    <Card className="bg-white border-slate-200 elevation-1 hover:elevation-2 transition-all cursor-pointer interactive-scale-sm">
                        <CardHeader className="flex flex-row items_center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Total Customers</CardTitle>
                            <Users className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stats.totalCustomers}</div>
                            <p className="text-xs text-slate-500 mt-1">Registered guests</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/dashboard/orders/new">
                    <Card className="bg-white border-slate-200 elevation-1 hover:elevation-2 transition-all cursor-pointer interactive-scale-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Active Orders</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stats.activeOrders}</div>
                            <p className="text-xs text-rose-600 mt-1">In progress</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Quick Access & Recent Activity */}
            <div className="grid gap-6 md:grid-cols-7">
                {/* Quick Access Grid */}
                <div className="md:col-span-4 space-y-6">
                    <h2 className="text-lg font-semibold text-slate-900">Quick Access</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {quickLinks.map((link) => (
                            <div
                                key={link.title}
                                className="tilt-3d"
                                onMouseMove={(e) => {
                                    const t = e.currentTarget as HTMLElement
                                    const r = t.getBoundingClientRect()
                                    const x = e.clientX - r.left
                                    const y = e.clientY - r.top
                                    const cx = r.width / 2
                                    const cy = r.height / 2
                                    const ry = ((x - cx) / cx) * 5
                                    const rx = -((y - cy) / cy) * 5
                                    t.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`
                                }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "" }}
                            >
                                <Link href={link.href}>
                                    <Card className="bg-white border-slate-200 elevation-1 hover:elevation-2 hover:border-slate-300 transition-all cursor-pointer h-full group interactive-scale-sm">
                                        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                                            <div className={`p-4 rounded-full ${link.bg} group-hover:scale-110 transition-transform`}>
                                                <link.icon className={`h-8 w-8 ${link.color}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{link.title}</h3>
                                                <p className="text-xs text-slate-500 mt-1">Manage & View</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* Revenue Breakdown */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-900">Revenue Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hotel className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium text-slate-700">Hotel</span>
                                    </div>
                                    <p className="text-xl font-bold text-slate-900">₹{stats.revenueByUnit?.hotel?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Flower2 className="h-4 w-4 text-emerald-500" />
                                        <span className="text-sm font-medium text-slate-700">Garden</span>
                                    </div>
                                    <p className="text-xl font-bold text-slate-900">₹{stats.revenueByUnit?.garden?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wine className="h-4 w-4 text-purple-500" />
                                        <span className="text-sm font-medium text-slate-700">Bar</span>
                                    </div>
                                    <p className="text-xl font-bold text-slate-900">₹{stats.revenueByUnit?.bar?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Coffee className="h-4 w-4 text-amber-500" />
                                        <span className="text-sm font-medium text-slate-700">Cafe</span>
                                    </div>
                                    <p className="text-xl font-bold text-slate-900">₹{stats.revenueByUnit?.cafe?.toLocaleString() || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Bookings */}
                <div className="md:col-span-3 space-y-6">
                    <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                    <Card className="bg-white border-slate-200 elevation-1 h-full">
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                                {allBookings.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                        <Calendar className="h-12 w-12 mb-2 opacity-20" />
                                        <p>No recent bookings</p>
                                    </div>
                                ) : (
                                    allBookings.slice(0, 10).map((booking: any) => (
                                        <div
                                            key={booking.id}
                                            className="p-4 hover:bg-slate-50 transition-colors tilt-3d"
                                            onMouseMove={(e) => {
                                                const t = e.currentTarget as HTMLElement
                                                const r = t.getBoundingClientRect()
                                                const x = e.clientX - r.left
                                                const y = e.clientY - r.top
                                                const cx = r.width / 2
                                                const cy = r.height / 2
                                                const ry = ((x - cx) / cx) * 3
                                                const rx = -((y - cy) / cy) * 3
                                                t.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`
                                            }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "" }}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <Badge variant="outline" className={`capitalize ${booking.type === 'hotel' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                                                    booking.type === 'garden' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                                                        'text-slate-600 border-slate-200 bg-slate-50'
                                                    }`}>
                                                    {booking.type}
                                                </Badge>
                                                <span className="text-xs text-slate-400">{format(new Date(booking.createdAt), 'MMM d, h:mm a')}</span>
                                            </div>
                                            <h4 className="font-medium text-slate-900">{booking.customer?.name || 'Guest'}</h4>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(booking.startDate), 'MMM d')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <IndianRupee className="h-3 w-3" />
                                                    {booking.totalAmount?.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
