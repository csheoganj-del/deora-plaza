"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"


import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Loader2,
    TrendingUp,
    TrendingDown,
    IndianRupee,
    ShoppingBag,
    BarChart3,
    PieChart,
    Calendar,
    DollarSign,
    Package
} from "lucide-react"
import {
    getRevenueStats,
    getCategoryStats,
    getPaymentMethodStats,
    getTimeBasedStats,
    getTopSellingItems,
    getLeastSellingItems
} from "@/actions/statistics"
import { useSupabaseSession } from "@/hooks/useSupabaseSession"
import { RevenueChart } from "@/components/billing/RevenueChart"



// --- Live Tracking Component ---
function LiveTrackingGrid() {
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLocations = async () => {
        try {
            // Dynamic import to avoid server/client issues
            const { getAllUserLocations } = await import("@/actions/location");
            const data = await getAllUserLocations();
            setLocations(data);
        } catch (e) {
            console.error("Failed to fetch locations", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
        const interval = setInterval(fetchLocations, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="text-sm text-[#9CA3AF]">Loading live locations...</div>;
    if (locations.length === 0) return <div className="text-sm text-[#9CA3AF]">No active users tracked recently.</div>;

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {locations.map((loc) => (
                <div className="premium-card">
                    <div className="p-4 bg-[#F8FAFC] border-b border-[#E5E7EB]">
                        <div className="flex justify-between items-center">
                            <div className="font-semibold text-sm truncate text-[#111827]">{loc.userName || 'Unknown'}</div>
                            <Badge variant="outline" className="text-xs uppercase scale-90 origin-right">{loc.userRole?.replace('_', ' ')}</Badge>
                        </div>
                        <div className="text-xs text-[#6B7280]">{new Date(loc.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div className="p-0 relative h-40 group">
                        {/* Map Placeholder / Image */}
                        <div className="absolute inset-0 bg-[#F1F5F9] flex items-center justify-center">
                            {/* 
                  Using static map image or iframe would be better, but for "live" feel without API key:
                  We can use OpenStreetMap static image or just a link.
                  For this MVP, we provide a direct link button over a placeholder.
                */}
                            <div className="text-center opacity-40">
                                <div className="mx-auto w-8 h-8 rounded-full border-2 border-[#9CA3AF] flex items-center justify-center mb-1">
                                    <div className="w-4 h-4 rounded-full bg-[#6D5DFB] animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        {/* Map Iframe (Leaflet is complex to embed directly in card without client lib, using simple approach first) */}
                        <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            marginHeight={0}
                            marginWidth={0}
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${loc.longitude - 0.01}%2C${loc.latitude - 0.01}%2C${loc.longitude + 0.01}%2C${loc.latitude + 0.01}&layer=mapnik&marker=${loc.latitude}%2C${loc.longitude}`}
                            style={{ border: 0 }}
                            className="z-0 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
                        ></iframe>
                
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-all cursor-pointer"
                            title="View on Google Maps"
                        >
                            <div className="glass-card px-3 py-1 rounded-full shadow-lg text-xs font-bold text-[#6D5DFB] flex items-center gap-1">
                                Open Map <TrendingUp className="w-3 h-3" />
                            </div>
                        </a>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Money Flow Component ---
function MoneyFlowCard({ revenue, timePeriod }: { revenue: any, timePeriod: string }) {
    return (
        <div className="premium-card relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <IndianRupee className="w-32 h-32" />
            </div>
            <div className="p-8 border-b border-[#E5E7EB]">
                <h3 className="text-lg font-medium text-[#111827]">Money Flow ({timePeriod})</h3>
            </div>
            <div className="p-8 space-y-6 relative z-10">
                <div>
                    <p className="text-sm text-[#6B7280]">Total Revenue</p>
                    <div className="text-4xl font-bold tracking-tight text-[#111827]">
                        ₹{(revenue?.currentRevenue ?? 0).toLocaleString()}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E5E7EB]">
                    <div>
                        <p className="text-xs text-[#22C55E] font-medium mb-1">Collected / Advance</p>
                        {/* Mocking collection data as 80% for now or fetching if available */}
                        <div className="text-xl font-semibold text-[#111827]">₹{((revenue?.currentRevenue ?? 0) * 0.8).toLocaleString()}</div>
                    </div>
                    <div>
                        <p className="text-xs text-[#F59E0B] font-medium mb-1">Pending Due</p>
                        <div className="text-xl font-semibold text-[#111827]">₹{((revenue?.currentRevenue ?? 0) * 0.2).toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function TotalStats({ revenueStats, timePeriod }: any) {
    if (!revenueStats) return null;
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="premium-card">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium text-[#6B7280]">Total Revenue</h3>
                    <IndianRupee className="h-4 w-4 text-[#9CA3AF]" />
                </div>
                <div className="px-6 pb-6">
                    <div className="text-2xl font-bold text-[#111827]">₹{(revenueStats?.currentRevenue ?? revenueStats?.monthly ?? 0).toLocaleString()}</div>
                    <p className="text-xs text-[#6B7280] capitalize">This {timePeriod.replace('ly', '')}</p>
                    {revenueStats.growth !== undefined && (
                        <p className={`text-xs flex items-center mt-1 ${revenueStats.growth >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                            {revenueStats.growth >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {revenueStats.growth >= 0 ? '+' : ''}{revenueStats.growth.toFixed(1)}% vs prev.
                        </p>
                    )}
                </div>
            </div>
            <div className="premium-card">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium text-[#6B7280]">Sales Count</h3>
                    <ShoppingBag className="h-4 w-4 text-[#9CA3AF]" />
                </div>
                <div className="px-6 pb-6">
                    <div className="text-2xl font-bold text-[#111827]">{revenueStats?.orderCount ?? 0}</div>
                    <p className="text-xs text-[#6B7280]">Total orders/bookings</p>
                </div>
            </div>
            {/* Additional stats like Last Month and Daily */}
            <div className="premium-card">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium text-[#6B7280]">Daily Revenue</h3>
                    <DollarSign className="h-4 w-4 text-[#9CA3AF]" />
                </div>
                <div className="px-6 pb-6">
                    <div className="text-2xl font-bold text-[#111827]">₹{revenueStats?.daily?.toLocaleString() || '0'}</div>
                    <p className="text-xs text-[#6B7280]">Today</p>
                </div>
            </div>
        </div>
    )
}

export default function StatisticsPage() {
    const { data: session } = useSupabaseSession()
    const userRole = (session?.user as any)?.role || 'user'
    const userBusinessUnit = (session?.user as any)?.businessUnit

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
    const [businessUnit, setBusinessUnit] = useState<string>(userBusinessUnit || 'all')
    const [revenueStats, setRevenueStats] = useState<any>(null)
    const [topItems, setTopItems] = useState<any[]>([])
    const [leastItems, setLeastItems] = useState<any[]>([])
    const [categoryStats, setCategoryStats] = useState<any[]>([])
    const [paymentStats, setPaymentStats] = useState<any[]>([])
    const [timeStats, setTimeStats] = useState<any[]>([])

    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'owner'
    // Non-admin users can only see their own business unit
    const effectiveBusinessUnit = !isAdmin ? userBusinessUnit : businessUnit

    useEffect(() => {
        loadStatistics()
    }, [timePeriod, effectiveBusinessUnit])

    const loadStatistics = async () => {
        setLoading(true)
        setError(null)
        try {
            const unit = effectiveBusinessUnit === 'all' ? undefined : effectiveBusinessUnit
            const endDate = new Date()
            const startDate = new Date()

            if (timePeriod === 'daily') {
                startDate.setHours(0, 0, 0, 0)
            } else if (timePeriod === 'weekly') {
                startDate.setDate(startDate.getDate() - 7)
                startDate.setHours(0, 0, 0, 0)
            } else if (timePeriod === 'monthly') {
                startDate.setDate(1)
                startDate.setHours(0, 0, 0, 0)
            } else if (timePeriod === 'yearly') {
                startDate.setMonth(0, 1)
                startDate.setHours(0, 0, 0, 0)
            }

            const [
                revenue,
                topSelling,
                leastSelling,
                categories,
                payments,
                timeBased
            ] = await Promise.all([
                getRevenueStats(unit, timePeriod),
                getTopSellingItems(10, unit, startDate, endDate),
                getLeastSellingItems(10, unit, startDate, endDate),
                getCategoryStats(unit, startDate, endDate),
                getPaymentMethodStats(unit, startDate, endDate),
                getTimeBasedStats(
                    timePeriod === 'daily' ? 'hourly' : timePeriod === 'weekly' || timePeriod === 'monthly' ? 'daily' : 'monthly',
                    unit,
                    startDate,
                    endDate
                )
            ])

            setRevenueStats(revenue)
            setTopItems(topSelling)
            setLeastItems(leastSelling)
            setCategoryStats(categories)
            setPaymentStats(payments)
            setTimeStats(timeBased)
        } catch (error) {
            console.error('Error loading statistics:', error)
            setError(error instanceof Error ? error.message : 'An unknown error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#FEE2E2]0 mb-4">Error Loading Statistics</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={loadStatistics}>Retry</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC] relative overflow-hidden">
            <div className="flex-1 flex flex-col p-6 overflow-hidden relative z-10 w-full">

                <div className="flex items-center justify-between space-y-2 mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                        </div>
                        <p className="text-[#6B7280] font-medium italic pl-14">
                            {isAdmin ? 'Comprehensive business insights' : 'Your business performance metrics'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isAdmin && userBusinessUnit && (
                            <div className="px-3 py-2 bg-[#F1F5F9] rounded-md text-sm font-medium">
                                {userBusinessUnit.charAt(0).toUpperCase() + userBusinessUnit.slice(1)} Department
                            </div>
                        )}
                        {isAdmin && (
                            <Select value={effectiveBusinessUnit} onValueChange={setBusinessUnit}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Business Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Units</SelectItem>
                                    <SelectItem value="cafe">Cafe</SelectItem>
                                    <SelectItem value="bar">Bar</SelectItem>
                                    <SelectItem value="hotel">Hotel</SelectItem>
                                    <SelectItem value="garden">Garden</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <Select value={timePeriod} onValueChange={(v: any) => setTimePeriod(v)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Time Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-8">

                    {/* Admin Specific View: Live Map & Money Flow */}
                    {isAdmin && effectiveBusinessUnit === 'all' && (
                        <div className="space-y-6">
                            {/* Live Maps */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-[#111827] flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#FEE2E2]0 animate-pulse" />
                                        Live Activity Tracking
                                    </h3>
                                    <Button variant="outline" size="sm" onClick={() => window.open('/dashboard/map', '_blank')} className="text-xs">
                                        Full Screen Map
                                    </Button>
                                </div>
                                <LiveTrackingGrid />
                            </section>

                            {/* Money Flow */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <MoneyFlowCard revenue={revenueStats} timePeriod={timePeriod} />
                                {/* Aggregate Stats */}
                                <div className="premium-card">
                                    <div className="p-8 border-b border-[#E5E7EB]">
                                        <h2 className="text-3xl font-bold text-[#111827]">Business Overview</h2>
                                    </div>
                                    <div className="p-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b pb-2">
                                                <span className="text-sm font-medium text-[#6B7280]">Active Bookings</span>
                                                {/* Placeholder or real data if available */}
                                                <span className="font-bold">24</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b pb-2">
                                                <span className="text-sm font-medium text-[#6B7280]">Total Guests</span>
                                                <span className="font-bold">142</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-[#6B7280]">Pending Actions</span>
                                                <Badge variant="destructive">5</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Standard Detailed Stats */}
                    <div>
                        <h3 className="text-lg font-semibold text-[#111827] mb-4">Detailed Metrics</h3>
                        <TotalStats revenueStats={revenueStats} timePeriod={timePeriod} />

                        <Tabs defaultValue="items" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="items">Item Sales</TabsTrigger>
                                <TabsTrigger value="categories">Categories</TabsTrigger>
                                <TabsTrigger value="payments">Payment Methods</TabsTrigger>
                                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                            </TabsList>

                            <TabsContent value="items" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="premium-card">
                                        <div className="p-8 border-b border-[#E5E7EB]">
                                            <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-[#22C55E]" />
                                                Top Selling Items
                                            </h2>
                                        </div>
                                        <div className="p-8">
                                            <div className="space-y-3">
                                                {topItems.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                                                ) : (
                                                    topItems.map((item, index) => (
                                                        <div key={item.itemId} className="flex items-center justify-between p-2 rounded-lg border">
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                                                                    {index + 1}
                                                                </Badge>
                                                                <div>
                                                                    <p className="font-medium">{item.itemName}</p>
                                                                    <p className="text-xs text-muted-foreground">{item.category}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold">₹{item.revenue.toLocaleString()}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {item.quantity} sold • {item.orderCount} orders
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="premium-card">
                                        <div className="p-8 border-b border-[#E5E7EB]">
                                            <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                                                <TrendingDown className="h-5 w-5 text-[#EF4444]" />
                                                Least Selling Items
                                            </h2>
                                        </div>
                                        <div className="p-8">
                                            <div className="space-y-3">
                                                {leastItems.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                                                ) : (
                                                    leastItems.map((item, index) => (
                                                        <div key={item.itemId} className="flex items-center justify-between p-2 rounded-lg border">
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                                                                    {index + 1}
                                                                </Badge>
                                                                <div>
                                                                    <p className="font-medium">{item.itemName}</p>
                                                                    <p className="text-xs text-muted-foreground">{item.category}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold">₹{item.revenue.toLocaleString()}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {item.quantity} sold • {item.orderCount} orders
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="categories" className="space-y-4">
                                <div className="premium-card">
                                    <div className="p-8 border-b border-[#E5E7EB]">
                                        <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                                            <PieChart className="h-5 w-5" />
                                            Revenue by Category
                                        </h2>
                                    </div>
                                    <div className="p-8">
                                        <div className="space-y-3">
                                            {categoryStats.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                                            ) : (
                                                categoryStats.map((cat) => {
                                                    const totalRevenue = categoryStats.reduce((sum, c) => sum + c.revenue, 0)
                                                    const percentage = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0
                                                    return (
                                                        <div key={cat.category} className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary">{cat.category}</Badge>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {cat.items} items
                                                                    </span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold">₹{cat.revenue.toLocaleString()}</p>
                                                                    <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                                                                </div>
                                                            </div>
                                                            <div className="w-full bg-secondary rounded-full h-2">
                                                                <div
                                                                    className="bg-primary h-2 rounded-full transition-all"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                {cat.quantity} items sold • {cat.orderCount} orders
                                                            </p>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="payments" className="space-y-4">
                                <div className="premium-card">
                                    <div className="p-8 border-b border-[#E5E7EB]">
                                        <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                                            <ShoppingBag className="h-5 w-5" />
                                            Payment Method Analysis
                                        </h2>
                                    </div>
                                    <div className="p-8">
                                        <div className="space-y-3">
                                            {paymentStats.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                                            ) : (
                                                paymentStats.map((payment) => (
                                                    <div key={payment.method} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium capitalize">{payment.method}</p>
                                                                <p className="text-xs text-muted-foreground">{payment.count} transactions</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold">₹{payment.revenue.toLocaleString()}</p>
                                                                <p className="text-xs text-muted-foreground">{payment.percentage.toFixed(1)}%</p>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-secondary rounded-full h-2">
                                                            <div
                                                                className="bg-primary h-2 rounded-full transition-all"
                                                                style={{ width: `${payment.percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="timeline" className="space-y-4">
                                <div className="premium-card">
                                    <div className="p-8 border-b border-[#E5E7EB]">
                                        <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5" />
                                            Revenue Timeline
                                        </h2>
                                    </div>
                                    <div className="p-8">
                                        {timeStats.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                                        ) : (
                                            <RevenueChart data={timeStats.map(stat => ({
                                                date: stat.hour !== undefined
                                                    ? `${stat.hour}:00`
                                                    : stat.day || stat.week || stat.month || '',
                                                total: stat.revenue
                                            }))} />
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}



