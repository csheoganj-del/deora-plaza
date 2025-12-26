"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"


import { getDailyRevenue, getRevenueStats } from "@/actions/billing"
import { RevenueChart } from "@/components/billing/RevenueChart"
import { Loader2, TrendingUp, IndianRupee } from "lucide-react"

export default function ReportsPage() {
    const [dailyRevenue, setDailyRevenue] = useState<{ total: number, count: number } | null>(null)
    const [revenueStats, setRevenueStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            const [daily, stats] = await Promise.all([
                getDailyRevenue("cafe"),
                getRevenueStats("cafe")
            ])
            setDailyRevenue(daily)
            setRevenueStats([
                { date: 'Today', total: stats.daily },
                { date: 'Week', total: stats.weekly },
                { date: 'Month', total: stats.monthly }
            ])
            setLoading(false)
        }
        loadData()
    }, [])

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="premium-card">
                    <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
                        <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">
                            Total Revenue (Today)
                        </h2>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-8">
                        <div className="text-2xl font-bold">₹{dailyRevenue?.total.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            {dailyRevenue?.count} orders today
                        </p>
                    </div>
                </div>
                <div className="premium-card">
                    <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
                        <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">
                            Active Orders
                        </h2>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-8">
                        <div className="text-2xl font-bold">+2</div>
                        <p className="text-xs text-muted-foreground">
                            +10% from last hour
                        </p>
                    </div>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="premium-card">
                    <div className="p-8 border-b border-[#E5E7EB]">
                        <h2 className="text-3xl font-bold text-[#111827]">Overview</h2>
                    </div>
                    <div className="p-8 pl-2">
                        <RevenueChart data={revenueStats} />
                    </div>
                </div>
            </div>
        </div>
    )
}

