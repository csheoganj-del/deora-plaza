"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"


import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getDailyRevenue } from "@/actions/billing"
import { resetAllData, deleteAllGardenBookings, deleteAllBookings } from "@/actions/admin"
import { getBusinessSettings } from "@/actions/businessSettings"
import { IndianRupee, TrendingUp, Calendar, Trash2, AlertTriangle, Loader2, BarChart3, Users, CreditCard, RefreshCw, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useGardenStats } from "@/hooks/use-garden-stats"
import { format } from "date-fns"

export default function OwnerDashboard() {
    const [revenue, setRevenue] = useState({
        cafe: 0,
        bar: 0,
        hotel: 0,
        garden: 0,
        total: 0
    })
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
    const [resetPassword, setResetPassword] = useState("")
    const [showResetPassword, setShowResetPassword] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [dataStats, setDataStats] = useState<any>(null)
    const [isDeleteGardenDialogOpen, setIsDeleteGardenDialogOpen] = useState(false)
    const [deleteGardenPassword, setDeleteGardenPassword] = useState("")
    const [showDeleteGardenPassword, setShowDeleteGardenPassword] = useState(false)
    const [isDeletingGarden, setIsDeletingGarden] = useState(false)
    const [gardenBookingsCount, setGardenBookingsCount] = useState(0)
    const [isDeleteAllBookingsDialogOpen, setIsDeleteAllBookingsDialogOpen] = useState(false)
    const [deleteAllBookingsPassword, setDeleteAllBookingsPassword] = useState("")
    const [showDeleteAllBookingsPassword, setShowDeleteAllBookingsPassword] = useState(false)
    const [isDeletingAllBookings, setIsDeletingAllBookings] = useState(false)
    const [allBookingsCount, setAllBookingsCount] = useState(0)
    const [gardenPeriod, setGardenPeriod] = useState("all")

    const [activeTab, setActiveTab] = useState("all")
    const [passwordProtection, setPasswordProtection] = useState(true)

    // Garden stats
    const { stats: gardenStats, loading: gardenLoading } = useGardenStats(gardenPeriod)

    useEffect(() => {
        async function fetchRevenue() {
            // Fetch revenue for each business unit
            const cafeRev = await getDailyRevenue("cafe")
            const barRev = await getDailyRevenue("bar")
            const hotelRev = await getDailyRevenue("hotel")
            const gardenRev = await getDailyRevenue("garden")

            const total = cafeRev.total + barRev.total + hotelRev.total + gardenRev.total

            setRevenue({
                cafe: cafeRev.total,
                bar: barRev.total,
                hotel: hotelRev.total,
                garden: gardenRev.total,
                total
            })
        }

        fetchRevenue()

        // Poll for updates every 30 seconds to keep dashboard fresh
        const interval = setInterval(fetchRevenue, 30000)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        getBusinessSettings().then(settings => {
            if (settings) {
                setPasswordProtection(settings.enablePasswordProtection ?? true)
            }
        })
    }, [])

    const fetchData = async () => {
        // Fetch revenue data
        const cafeRev = await getDailyRevenue("cafe")
        const barRev = await getDailyRevenue("bar")
        const hotelRev = await getDailyRevenue("hotel")
        const gardenRev = await getDailyRevenue("garden")

        const total = cafeRev.total + barRev.total + hotelRev.total + gardenRev.total

        setRevenue({
            cafe: cafeRev.total,
            bar: barRev.total,
            hotel: hotelRev.total,
            garden: gardenRev.total,
            total
        })
    }

    const handleOpenResetDialog = async () => {
        // Fetch data stats
        const response = await fetch('/api/data/stats')
        const stats = await response.json()
        setDataStats(stats)
        setIsResetDialogOpen(true)
    }

    const handleResetData = async () => {
        if (passwordProtection && !resetPassword) {
            alert("Please enter password")
            return
        }

        // Removed password validation - allowing direct deletion
        // if (resetPassword !== "KappuLokuHimu#1006") {
        //     alert("Incorrect password")
        //     return
        // }

        if (!confirm("⚠️ WARNING: This will DELETE ALL DATA including bookings, bills, orders, and customers. This action cannot be undone. Are you sure?")) {
            return
        }

        setIsResetting(true)
        const result = await resetAllData(resetPassword)
        setIsResetting(false)

        if (result.success) {
            const count = (result as any).deletedCount || 0
            alert(`✅ Success! Deleted ${count} records. The system is now reset.`)
            setIsResetDialogOpen(false)
            setResetPassword("")
            // Refresh the page to show empty state
            window.location.reload()
        } else {
            alert(`❌ Error: ${result.error}`)
        }
    }

    const handleOpenDeleteGardenDialog = async () => {
        // Fetch garden bookings count
        const response = await fetch('/api/bookings/count?type=garden')
        const data = await response.json()
        setGardenBookingsCount(data.count)
        setIsDeleteGardenDialogOpen(true)
    }

    const handleDeleteGardenBookings = async () => {
        if (passwordProtection && !deleteGardenPassword) {
            alert("Please enter password")
            return
        }

        // Removed password validation - allowing direct deletion
        // if (deleteGardenPassword !== "KappuLokuHimu#1006") {
        //     alert("Incorrect password")
        //     return
        // }

        if (!confirm("⚠️ WARNING: This will DELETE ALL GARDEN BOOKINGS. This action cannot be undone. Are you sure?")) {
            return
        }

        setIsDeletingGarden(true)
        const result = await deleteAllGardenBookings(deleteGardenPassword)
        setIsDeletingGarden(false)

        if (result.success) {
            alert(`✅ Success! ${result.message}`)
            setIsDeleteGardenDialogOpen(false)
            setDeleteGardenPassword("")
            window.location.reload()
        } else {
            alert(`❌ Error: ${result.error}`)
        }
    }

    const handleOpenDeleteAllBookingsDialog = async () => {
        // Fetch all bookings count
        const response = await fetch('/api/bookings/count')
        const data = await response.json()
        setAllBookingsCount(data.count)
        setIsDeleteAllBookingsDialogOpen(true)
    }

    const handleDeleteAllBookings = async () => {
        if (passwordProtection && !deleteAllBookingsPassword) {
            alert("Please enter password")
            return
        }

        // Removed password validation - allowing direct deletion
        // if (deleteAllBookingsPassword !== "KappuLokuHimu#1006") {
        //     alert("Incorrect password")
        //     return
        // }

        if (!confirm("⚠️ WARNING: This will DELETE ALL HOTEL AND GARDEN BOOKINGS. This action cannot be undone. Are you sure?")) {
            return
        }

        setIsDeletingAllBookings(true)
        const result = await deleteAllBookings(deleteAllBookingsPassword)
        setIsDeletingAllBookings(false)

        if (result.success) {
            alert(`✅ Success! ${result.message}`)
            setIsDeleteAllBookingsDialogOpen(false)
            setDeleteAllBookingsPassword("")
            window.location.reload()
        } else {
            alert(`❌ Error: ${result.error}`)
        }
    }

    const ownerShare = revenue.total * 0.4 // 40% owner share
    const managerShare = revenue.total * 0.6 // 60% manager share

    const router = useRouter()
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Owner Dashboard</h2>
                <div className="flex items-center gap-2">
                    <Button onClick={fetchData} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Today's Revenue
                    </div>
                </div>
            </div>

            {/* Total Revenue Card */}
            <div className="premium-card cursor-pointer" onClick={() => router.push('/dashboard/billing?unit=all')}>
                <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Total Revenue (Today)
                    </h2>
                </div>
                <div className="p-8">
                    <div className="text-4xl font-bold text-primary">
                        ₹{revenue.total.toLocaleString('en-IN')}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-[#DCFCE7] p-4">
                            <div className="text-sm text-muted-foreground">Your Share (40%)</div>
                            <div className="text-2xl font-bold text-[#22C55E]">
                                ₹{ownerShare.toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="rounded-lg bg-[#EDEBFF]/20 p-4">
                            <div className="text-sm text-muted-foreground">Manager Share (60%)</div>
                            <div className="text-2xl font-bold text-[#6D5DFB]">
                                ₹{managerShare.toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link href="/dashboard/statistics" className="underline text-primary">View analytics</Link>
                        <button
                            className="px-3 py-1 border rounded text-[#111827] hover:bg-[#F1F5F9]"
                            onClick={() => router.push('/dashboard/billing?unit=all')}
                        >View combined billing</button>
                        <button
                            className="px-3 py-1 border rounded text-[#111827] hover:bg-[#F1F5F9]"
                            onClick={() => router.push('/dashboard/hotel')}
                        >Hotel bookings</button>
                        <button
                            className="px-3 py-1 border rounded text-[#111827] hover:bg-[#F1F5F9]"
                            onClick={() => router.push('/dashboard/garden')}
                        >Garden bookings</button>
                    </div>
                </div>
            </div>

            {/* Business Unit Breakdown */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="premium-card cursor-pointer" onClick={() => router.push('/dashboard/billing?unit=cafe')}>
                    <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
                        <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Cafe</h2>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-8">
                        <div className="text-2xl font-bold">₹{revenue.cafe.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.cafe * 0.4).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>

                <div className="premium-card cursor-pointer" onClick={() => router.push('/dashboard/billing?unit=bar')}>
                    <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
                        <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Bar</h2>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-8">
                        <div className="text-2xl font-bold">₹{revenue.bar.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.bar * 0.4).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>

                <div className="premium-card cursor-pointer" onClick={() => router.push('/dashboard/hotel')}>
                    <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
                        <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Hotel</h2>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-8">
                        <div className="text-2xl font-bold">₹{revenue.hotel.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.hotel * 0.4).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>

                <div className="premium-card cursor-pointer" onClick={() => router.push('/dashboard/garden')}>
                    <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
                        <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Garden</h2>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-8">
                        <div className="text-2xl font-bold">₹{revenue.garden.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.garden * 0.4).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Garden Payment Statistics */}
            <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Garden Payment Statistics
                    </h2>
                </div>
                <div className="p-8">
                    <div className="mb-4 flex flex-wrap gap-2">
                        <Button
                            variant={gardenPeriod === "all" ? "default" : "outline"}
                            onClick={() => setGardenPeriod("all")}
                            size="sm"
                        >
                            All Time
                        </Button>
                        <Button
                            variant={gardenPeriod === "today" ? "default" : "outline"}
                            onClick={() => setGardenPeriod("today")}
                            size="sm"
                        >
                            Today
                        </Button>
                        <Button
                            variant={gardenPeriod === "week" ? "default" : "outline"}
                            onClick={() => setGardenPeriod("week")}
                            size="sm"
                        >
                            This Week
                        </Button>
                        <Button
                            variant={gardenPeriod === "month" ? "default" : "outline"}
                            onClick={() => setGardenPeriod("month")}
                            size="sm"
                        >
                            This Month
                        </Button>
                        <Button
                            variant={gardenPeriod === "year" ? "default" : "outline"}
                            onClick={() => setGardenPeriod("year")}
                            size="sm"
                        >
                            This Year
                        </Button>
                    </div>

                    {gardenLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
                        </div>
                    ) : gardenStats ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-lg bg-[#BBF7D0] text-[#22C55E]">
                                            <IndianRupee className="h-5 w-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs text-[#9CA3AF]">Total Revenue</p>
                                            <p className="text-xl font-bold text-[#111827]">₹{gardenStats.totalRevenue.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-lg bg-[#EDEBFF]/30 text-[#6D5DFB]">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs text-[#9CA3AF]">Advance Payments</p>
                                            <p className="text-xl font-bold text-[#111827]">₹{gardenStats.advancePayments.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-lg bg-[#EDEBFF] text-[#C084FC]">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs text-[#9CA3AF]">Final Payments</p>
                                            <p className="text-xl font-bold text-[#111827]">₹{gardenStats.finalPayments.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs text-[#9CA3AF]">Total Guests</p>
                                            <p className="text-xl font-bold text-[#111827]">{gardenStats.totalGuests.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Payments Table */}
                            <div className="border rounded-lg">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-[#F8FAFC]">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                                                    Receipt
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                                                    Customer
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                                                    Event Type
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {gardenStats.paymentRecords.slice(0, 10).map((payment) => (
                                                <tr key={payment.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111827]">
                                                        #{payment.receiptNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF]">
                                                        {payment.customerMobile}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF]">
                                                        {payment.eventType}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111827]">
                                                        ₹{payment.amount.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.type === 'advance'
                                                            ? 'bg-[#EDEBFF]/30 text-[#6D5DFB]'
                                                            : payment.type === 'final'
                                                                ? 'bg-[#EDEBFF] text-purple-800'
                                                                : 'bg-[#F1F5F9] text-[#111827]'
                                                            }`}>
                                                            {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF]">
                                                        {format(new Date(payment.date), 'MMM dd, yyyy HH:mm')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {gardenStats.paymentRecords.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-[#9CA3AF]">No payments found for the selected period</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-[#9CA3AF]">Unable to load garden statistics</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Received vs Remaining */}
            <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Overview
                    </h2>
                </div>
                <div className="p-8">
                    {gardenLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
                        </div>
                    ) : gardenStats ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-lg bg-[#BBF7D0] text-[#22C55E]">
                                            <IndianRupee className="h-5 w-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs text-[#9CA3AF]">Total Expected</p>
                                            <p className="text-xl font-bold text-[#111827]">₹{gardenStats.totalExpectedRevenue.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-lg bg-[#EDEBFF]/30 text-[#6D5DFB]">
                                            <IndianRupee className="h-5 w-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs text-[#9CA3AF]">Payment Received</p>
                                            <p className="text-xl font-bold text-[#111827]">₹{gardenStats.totalRevenue.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E5E7EB]">
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
                                            <IndianRupee className="h-5 w-5" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-xs text-[#9CA3AF]">Remaining Payment</p>
                                            <p className="text-xl font-bold text-[#111827]">₹{gardenStats.totalPendingRevenue.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress visualization */}
                            <div className="pt-4">
                                <div className="flex justify-between text-sm text-[#6B7280] mb-1">
                                    <span>Payment Progress</span>
                                    <span>
                                        {gardenStats.totalExpectedRevenue > 0
                                            ? Math.round((gardenStats.totalRevenue / gardenStats.totalExpectedRevenue) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-[#E5E7EB] rounded-full h-2.5">
                                    <div
                                        className="bg-[#22C55E] h-2.5 rounded-full"
                                        style={{
                                            width: `${gardenStats.totalExpectedRevenue > 0
                                                ? Math.min((gardenStats.totalRevenue / gardenStats.totalExpectedRevenue) * 100, 100)
                                                : 0}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-[#9CA3AF]">Unable to load payment overview</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Settlement Status */}
            <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827]">Monthly Settlement Status</h2>
                </div>
                <div className="p-8">
                    <div className="text-sm text-muted-foreground">
                        This feature will track monthly settlements and payment status.
                        <br />
                        Coming soon: Settlement history and payment tracking.
                    </div>
                </div>
            </div>

            <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2 text-[#DC2626]">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone - Admin Controls
                    </h2>
                </div>
                <div className="p-8">
                    <p className="text-sm text-muted-foreground mb-4">
                        These actions are irreversible. Use with extreme caution.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="destructive"
                            onClick={handleOpenResetDialog}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Reset All Data
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleOpenDeleteGardenDialog}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Garden Bookings
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleOpenDeleteAllBookingsDialog}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete All Bookings
                        </Button>
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Dialog */}
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#DC2626]">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Data Reset
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All transaction data will be permanently deleted.
                        </DialogDescription>
                    </DialogHeader>

                    {dataStats && (
                        <div className="bg-[#F8FAFC] p-4 rounded-lg space-y-2">
                            <p className="font-semibold text-sm">Data to be deleted:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Garden Bookings:</div><div className="font-mono">{dataStats.gardenBookings}</div>
                                <div>Hotel Bookings:</div><div className="font-mono">{dataStats.hotelBookings}</div>
                                <div>Bills:</div><div className="font-mono">{dataStats.bills}</div>
                                <div>Orders:</div><div className="font-mono">{dataStats.orders}</div>
                                <div>Customers:</div><div className="font-mono">{dataStats.customers}</div>
                                <div className="font-bold">Total Records:</div><div className="font-mono font-bold">{dataStats.total}</div>
                            </div>
                        </div>
                    )}

                    {passwordProtection && (
                        <div className="space-y-2">
                            <Label htmlFor="reset-password">Enter Password to Confirm</Label>
                            <div className="relative">
                                <Input
                                    id="reset-password"
                                    type={showResetPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                    disabled={isResetting}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowResetPassword(!showResetPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
                                    aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Contact system administrator for password
                            </p>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsResetDialogOpen(false)
                                setResetPassword("")
                            }}
                            disabled={isResetting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleResetData}
                            disabled={isResetting}
                            className="gap-2"
                        >
                            {isResetting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Reset All Data
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Garden Bookings Confirmation Dialog */}
            <Dialog open={isDeleteGardenDialogOpen} onOpenChange={setIsDeleteGardenDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#DC2626]">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Delete Garden Bookings
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All garden bookings will be permanently deleted.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-[#F8FAFC] p-4 rounded-lg space-y-2">
                        <p className="font-semibold text-sm">Data to be deleted:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Garden Bookings:</div><div className="font-mono">{gardenBookingsCount}</div>
                        </div>
                    </div>

                    {passwordProtection && (
                        <div className="space-y-2">
                            <Label htmlFor="delete-garden-password">Enter Password to Confirm</Label>
                            <div className="relative">
                                <Input
                                    id="delete-garden-password"
                                    type={showDeleteGardenPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    value={deleteGardenPassword}
                                    onChange={(e) => setDeleteGardenPassword(e.target.value)}
                                    disabled={isDeletingGarden}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteGardenPassword(!showDeleteGardenPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
                                    aria-label={showDeleteGardenPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showDeleteGardenPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Contact system administrator for password
                            </p>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteGardenDialogOpen(false)
                                setDeleteGardenPassword("")
                            }}
                            disabled={isDeletingGarden}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteGardenBookings}
                            disabled={isDeletingGarden}
                            className="gap-2"
                        >
                            {isDeletingGarden ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Delete Garden Bookings
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Delete All Bookings Confirmation Dialog */}
            < Dialog open={isDeleteAllBookingsDialogOpen} onOpenChange={setIsDeleteAllBookingsDialogOpen} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#DC2626]">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Delete All Bookings
                        </DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All hotel and garden bookings will be permanently deleted.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-[#F8FAFC] p-4 rounded-lg space-y-2">
                        <p className="font-semibold text-sm">Data to be deleted:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Total Bookings:</div><div className="font-mono">{allBookingsCount}</div>
                        </div>
                    </div>

                    {passwordProtection && (
                        <div className="space-y-2">
                            <Label htmlFor="delete-all-bookings-password">Enter Password to Confirm</Label>
                            <div className="relative">
                                <Input
                                    id="delete-all-bookings-password"
                                    type={showDeleteAllBookingsPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    value={deleteAllBookingsPassword}
                                    onChange={(e) => setDeleteAllBookingsPassword(e.target.value)}
                                    disabled={isDeletingAllBookings}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteAllBookingsPassword(!showDeleteAllBookingsPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
                                    aria-label={showDeleteAllBookingsPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showDeleteAllBookingsPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Contact system administrator for password
                            </p>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteAllBookingsDialogOpen(false)
                                setDeleteAllBookingsPassword("")
                            }}
                            disabled={isDeletingAllBookings}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAllBookings}
                            disabled={isDeletingAllBookings}
                            className="gap-2"
                        >
                            {isDeletingAllBookings ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Delete All Bookings
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    )
}

