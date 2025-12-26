"use client"

import { useState, useEffect } from "react"
import { getRevenueStats } from "@/actions/billing"
import { getItemSalesStats, getCategoryStats, getPaymentMethodStats, getTimeBasedStats } from "@/actions/statistics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function TestStatisticsPage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [revenueStats, setRevenueStats] = useState<any>(null)
    const [itemStats, setItemStats] = useState<any[]>([])

    useEffect(() => {
        loadStatistics()
    }, [])

    const loadStatistics = async () => {
        setLoading(true)
        setError(null)
        try {
            console.log('Loading statistics...')
            
            const revenue = await getRevenueStats()
            console.log('Revenue stats:', revenue)
            setRevenueStats(revenue)
            
            const items = await getItemSalesStats()
            console.log('Item stats:', items)
            setItemStats(items)
        } catch (error) {
            console.error('Error loading statistics:', error)
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#FEE2E2]0 mb-4">Error Loading Statistics</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <button 
                        onClick={loadStatistics}
                        className="px-4 py-2 bg-[#6D5DFB] text-white rounded hover:bg-[#6D5DFB]/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Test Statistics Page</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="premium-card">
                    <div className="p-8 border-b border-[#E5E7EB]">
                        <h2 className="text-3xl font-bold text-[#111827]">Daily Revenue</h2>
                    </div>
                    <div className="p-8">
                        <p className="text-2xl font-semibold text-[var(--text-primary)]">₹{revenueStats?.daily?.toLocaleString() || '0'}</p>
                    </div>
                </div>
                
                <div className="premium-card">
                    <div className="p-8 border-b border-[#E5E7EB]">
                        <h2 className="text-3xl font-bold text-[#111827]">Monthly Revenue</h2>
                    </div>
                    <div className="p-8">
                        <p className="text-2xl font-semibold text-[var(--text-primary)]">₹{revenueStats?.monthly?.toLocaleString() || '0'}</p>
                    </div>
                </div>
                
                <div className="premium-card">
                    <div className="p-8 border-b border-[#E5E7EB]">
                        <h2 className="text-3xl font-bold text-[#111827]">Last Month</h2>
                    </div>
                    <div className="p-8">
                        <p className="text-2xl font-semibold text-[var(--text-primary)]">₹{revenueStats?.lastMonth?.toLocaleString() || '0'}</p>
                    </div>
                </div>
                
                <div className="premium-card">
                    <div className="p-8 border-b border-[#E5E7EB]">
                        <h2 className="text-3xl font-bold text-[#111827]">Growth</h2>
                    </div>
                    <div className="p-8">
                        <p className="text-2xl font-semibold text-[var(--text-primary)]">{revenueStats?.growth?.toFixed(1) || '0'}%</p>
                    </div>
                </div>
            </div>
            
            <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827]">Top Selling Items ({itemStats.length})</h2>
                </div>
                <div className="p-8">
                    {itemStats.length > 0 ? (
                        <div className="space-y-3">
                            {itemStats.slice(0, 10).map((item, index) => (
                                <div key={item.itemId} className="flex justify-between items-center p-2 border rounded">
                                    <div>
                                        <p className="font-medium">{item.itemName}</p>
                                        <p className="text-sm text-muted-foreground">{item.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-[var(--text-primary)]">₹{item.revenue.toLocaleString()}</p>
                                        <p className="text-sm text-muted-foreground">{item.quantity} sold</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No item data available</p>
                    )}
                </div>
            </div>
        </div>
    )
}

