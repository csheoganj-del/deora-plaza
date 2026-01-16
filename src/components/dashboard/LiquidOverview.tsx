"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BarChart3,
    Users,
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    CreditCard
} from "lucide-react";
import { PremiumLiquidGlass, PremiumStatsCard, PremiumActionCard, PremiumContainer } from "@/components/ui/glass/premium-liquid-glass";
import { GlassButton } from "@/components/ui/glass/GlassFormComponents";
import { motion } from "framer-motion";
import { getDashboardStats } from "@/actions/dashboard";

const OverviewStatCard = ({ title, value, change, isPositive, icon: Icon, delay = 0, link }: any) => {
    const router = useRouter();

    return (
        <PremiumStatsCard
            delay={delay}
            className="group cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => link && router.push(link)}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:border-white/20 transition-colors shadow-inner">
                    <Icon className="w-6 h-6 text-white/90" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border backdrop-blur-md ${isPositive
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                </div>
            </div>
            <div>
                <h3 className="text-sm font-medium text-white/60 mb-1">{title}</h3>
                <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
            </div>
        </PremiumStatsCard>
    );
};

export default function LiquidOverview() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({
        totalRevenue: 0,
        activeOrders: 0,
        totalCustomers: 0,
        avgSale: 0,
        recentOrders: []
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const stats = await getDashboardStats();
                // Calculate average sale if revenue and order count are available, otherwise 0
                // We use 'transactionCounts' sum as total transactions or just use total transactions if available.
                // The action returns `transactionCounts` but not a total count of all transactions explicitly for avg calc.
                // Let's approximate Avg Sale using Total Revenue / (Active Orders + some completed orders count?). 
                // Actually the action returns `recentOrders` but not total completed orders count explicitly in the top level return?
                // Wait, `getRevenueStats` returns `orderCount`. `getDashboardStats` returns `transactionCounts` split by unit.

                const totalTx = (stats.transactionCounts?.cafe || 0) +
                    (stats.transactionCounts?.bar || 0) +
                    (stats.transactionCounts?.garden || 0) +
                    (stats.transactionCounts?.hotel || 0);

                const avgSale = totalTx > 0 ? (stats.totalRevenue / totalTx) : 0;

                setData({
                    ...stats,
                    avgSale
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const stats = [
        {
            title: "Total Revenue",
            value: loading ? "..." : formatCurrency(data.totalRevenue),
            change: "+0%",
            isPositive: true,
            icon: DollarSign,
            link: "/dashboard/billing?unit=all&filter=paid"
        },
        {
            title: "Due Payments",
            value: loading ? "..." : formatCurrency(data.pendingRevenue || 0),
            change: "Pending",
            isPositive: false,
            icon: CreditCard,
            link: "/dashboard/billing?filter=pending"
        },
        {
            title: "Active Orders",
            value: loading ? "..." : data.activeOrders.toString(),
            change: "Now",
            isPositive: true,
            icon: Activity,
            link: "/dashboard/orders?filter=active"
        },
        {
            title: "Total Bookings",
            value: loading ? "..." : (data.activeBookings || 0).toString(),
            change: "All Time",
            isPositive: true,
            icon: BarChart3,
            link: "/dashboard/billing?unit=all"
        },
        {
            title: "Total Customers",
            value: loading ? "..." : data.totalCustomers.toString(),
            change: "Total",
            isPositive: true,
            icon: Users,
            link: "/dashboard/customers"
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70"
                    >
                        Dashboard Overview
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/50 mt-1"
                    >
                        Welcome back! Here's what's happening today.
                    </motion.p>
                </div>

                <div className="flex gap-3">
                    <GlassButton variant="secondary">Download Report</GlassButton>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <OverviewStatCard key={i} {...stat} delay={i * 0.1} />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Chart Section */}
                <div className="lg:col-span-2">
                    <PremiumContainer delay={0.4} className="h-[400px] flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-blue-500/5 group-hover:opacity-100 transition-opacity opacity-50" />
                        <div className="text-white/30 text-center relative z-10">
                            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Revenue Analytics Chart</p>
                            <p className="text-xs text-white/20 mt-1">Coming Soon</p>
                        </div>
                    </PremiumContainer>
                </div>

                {/* Live Activity Feed */}
                <div className="space-y-6">
                    <PremiumLiquidGlass variant="card" delay={0.5} className="h-full">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#F2B94B]" />
                            Live Activity
                        </h3>
                        <div className="space-y-4 relative">
                            {/* Activity Items */}
                            {loading ? (
                                <div className="text-white/40 text-sm text-center py-4">Loading activity...</div>
                            ) : data.recentOrders.length === 0 ? (
                                <div className="text-white/40 text-sm text-center py-4">No recent activity</div>
                            ) : (
                                data.recentOrders.map((order: any, i: number) => (
                                    <div key={order.id || i} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0">
                                        <div className={`w-2 h-2 rounded-full mt-2 shadow-[0_0_8px] ${order.status === 'ready' ? 'bg-emerald-400 shadow-emerald-400/50' :
                                            order.status === 'preparing' ? 'bg-amber-400 shadow-amber-400/50' :
                                                'bg-blue-400 shadow-blue-400/50'
                                            }`} />
                                        <div>
                                            <p className="text-sm text-white font-medium">
                                                {/* Use orderNumber if available, else short ID */}
                                                {order.orderNumber ? order.orderNumber : `Order #${order.id?.slice(0, 8)}`}
                                                <span className="opacity-70 ml-2 capitalize">- {order.status}</span>
                                            </p>
                                            <p className="text-xs text-white/40 mt-0.5">
                                                {new Date(order.createdAt).toLocaleTimeString()} •
                                                {/* Display human readable location */}
                                                {order.roomNumber
                                                    ? ` Room ${order.roomNumber}`
                                                    : order.tableNumber
                                                        ? ` Table ${order.tableNumber}`
                                                        : order.tableId
                                                            ? ` Table ${order.tableId.slice(0, 4)}...`
                                                            : ' Takeaway'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </PremiumLiquidGlass>
                </div>

            </div>
        </div>
    );
}
