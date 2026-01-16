"use client";

import { useState } from "react";
import {
    Coffee,
    ShoppingCart,
    Users,
    TrendingUp,
    Clock,
    Package,
    Plus,
    ArrowUpRight,
    MoreHorizontal
} from "lucide-react";
import { PremiumLiquidGlass, PremiumStatsCard, PremiumActionCard, PremiumContainer } from "@/components/ui/glass/premium-liquid-glass";
import { GlassButton } from "@/components/ui/glass/GlassFormComponents";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureBillForOrder } from "@/actions/billing";
import { getOrderById } from "@/actions/orders";
import ReprintBill from "@/components/billing/ReprintBill";
import { toast } from "sonner";
import { getUnitMetrics, type UnitMetrics } from "@/actions/unit-stats";
import { getOrders } from "@/actions/orders";

// Types
interface StatCardProps {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: any;
    delay?: number;
}

// Components
const StatCard = ({ title, value, change, isPositive, icon: Icon, delay = 0 }: StatCardProps) => (
    <PremiumStatsCard delay={delay} className="group">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                <Icon className="w-6 h-6 text-white/90" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border ${isPositive
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                {change}
            </div>
        </div>
        <div>
            <h3 className="text-sm font-medium text-white/60 mb-1">{title}</h3>
            <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        </div>
    </PremiumStatsCard>
);

const OrderRow = ({ order, index }: { order: any, index: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 + (index * 0.1) }}
        className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5 group"
    >
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F2B94B]/20 to-[#D9A441]/10 flex items-center justify-center border border-[#F2B94B]/20 text-[#F2B94B] font-medium text-sm">
                {order.id.slice(-2)}
            </div>
            <div>
                <h4 className="text-white font-medium">{order.customer}</h4>
                <p className="text-sm text-white/50">{order.items.join(", ")}</p>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="text-right">
                <div className="text-white font-medium">{order.total}</div>
                <div className="text-xs text-white/50">{order.type}</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${order.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                order.status === 'preparing' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}>
                {order.status}
            </div>
            <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                <MoreHorizontal className="w-4 h-4" />
            </button>
        </div>
    </motion.div>
);

export default function LiquidCafeDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [autoPrintBill, setAutoPrintBill] = useState<any>(null);
    const [metrics, setMetrics] = useState<UnitMetrics | null>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const processedRef = useRef(new Set<string>());

    // Realtime Subscription for Auto-Print
    useEffect(() => {
        const supabase = createClient();
        const channelName = `cafe-auto-print-v${Date.now()}`;
        console.log(`🖨️ Initializing Auto-Print Listener (${channelName})...`);
        toast.success("Auto-Print System Active", { duration: 2000 });

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                },
                async (payload) => {
                    const newOrder = payload.new as any;
                    console.log("🔔 [Dashboard] Order Update Received:", {
                        id: newOrder.id,
                        status: newOrder.status,
                        type: newOrder.type
                    });

                    if (newOrder.status === 'served') {
                        if (processedRef.current.has(newOrder.id)) {
                            console.log("ℹ️ [Dashboard] Order already processed:", newOrder.id);
                            return;
                        }

                        console.log("🚀 [Dashboard] Triggering Bill Creation for:", newOrder.id);

                        try {
                            const fullOrder = await getOrderById(newOrder.id);
                            if (!fullOrder) {
                                console.error("❌ [Dashboard] Could not fetch full order details");
                                return;
                            }

                            console.log("📋 [Dashboard] Order Type:", fullOrder.type);

                            if (fullOrder.type && fullOrder.type.toLowerCase() === 'takeaway') {
                                processedRef.current.add(newOrder.id);
                                toast.loading(`Preparing Takeaway Bill #${fullOrder.orderNumber || '...'}`, { id: 'bill-process' });

                                const result = await ensureBillForOrder(fullOrder.id);

                                if (result.success && result.bill) {
                                    console.log("✅ [Dashboard] Bill Created Successfully:", result.bill.billNumber);
                                    setAutoPrintBill(result.bill);
                                    toast.dismiss('bill-process');
                                    toast.success(`Bill Ready: ${result.bill.billNumber}`);
                                } else {
                                    console.error("❌ [Dashboard] Bill Creation Failed:", result.error);
                                    toast.dismiss('bill-process');
                                    toast.error(`Bill Failed: ${result.error}`);
                                    processedRef.current.delete(newOrder.id);
                                }
                            } else {
                                console.log("ℹ️ [Dashboard] Skipping: Not a takeaway order");
                            }
                        } catch (err) {
                            console.error("❌ [Dashboard] Exception in listener:", err);
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log(`📡 [Dashboard] Subscription Status: ${status}`);
                if (status === 'SUBSCRIBED') {
                    console.log("✅ [Dashboard] Listening for REALTIME updates on 'orders' table");
                }
            });

        return () => {
            console.log(`🔌 [Dashboard] Cleaning up channel ${channelName}`);
            supabase.removeChannel(channel);
        };
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const [metricsData, ordersData] = await Promise.all([
                getUnitMetrics('cafe', startOfDay.toISOString(), endOfDay.toISOString()),
                getOrders('cafe')
            ]);

            setMetrics(metricsData);
            // Filter for active orders (not completed/cancelled)
            const activeOnly = ordersData.filter((o: any) =>
                ['pending', 'preparing', 'ready', 'served'].includes(o.status)
            );
            setOrders(activeOnly);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [selectedDate]);

    // Map real data to UI
    const stats = [
        {
            title: "Revenue",
            value: `₹${metrics?.dailyRevenue.toLocaleString() || '0'}`,
            change: metrics && metrics.dailyRevenue > 0 ? "+100%" : "0%",
            isPositive: true,
            icon: TrendingUp
        },
        {
            title: "Active Orders",
            value: orders.length.toString(),
            change: `+${orders.filter(o => o.status === 'pending').length}`,
            isPositive: true,
            icon: ShoppingCart
        },
        {
            title: "Avg Order",
            value: `₹${Math.round(metrics?.averageOrderValue || 0)}`,
            change: "Stable",
            isPositive: true,
            icon: Clock
        },
        {
            title: "Dine-in Tables",
            value: `${metrics?.activeTables || 0}/${metrics?.totalTables || 0}`,
            change: "Live",
            isPositive: true,
            icon: Users
        },
    ];

    const mappedOrders = orders.map(order => ({
        id: order.orderNumber || order.id.slice(0, 8),
        customer: order.customerName || "Walk-in",
        items: (order.items || []).map((i: any) => i.name),
        total: `₹${order.totalAmount || 0}`,
        status: order.status,
        type: order.type || "Dine-in"
    }));

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-[#0f0f13] text-white selection:bg-[#F2B94B]/30">

            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-[#F2B94B]/5 blur-[100px]" />
            </div>

            <div className="relative z-10 p-8 max-w-[1600px] mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70"
                        >
                            Cafe Dashboard
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-white/50 mt-1"
                        >
                            {loading ? "Updating data..." : "Manage orders, inventory and staff in real-time"}
                        </motion.p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#F2B94B]/50 transition-colors"
                        />
                        <GlassButton
                            onClick={() => {
                                import("@/lib/utils").then(u => {
                                    u.speakKitchenAlert("Testing Text to Speech System. Verification in progress.", true);
                                });
                            }}
                            className="bg-white/5 hover:bg-white/10 text-xs py-1"
                        >
                            Test TTS
                        </GlassButton>
                        <GlassButton variant="secondary" icon={<Package className="w-4 h-4" />}>
                            Inventory
                        </GlassButton>
                        <GlassButton variant="primary">
                            <Plus className="w-4 h-4 mr-2" />
                            New Order
                        </GlassButton>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <StatCard key={i} {...stat} delay={i * 0.1} />
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Active Orders List */}
                    <div className="lg:col-span-2">
                        <PremiumContainer delay={0.4} className="h-full min-h-[500px]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-white">Active Orders</h2>
                                <GlassButton variant="ghost" size="sm">View All</GlassButton>
                            </div>

                            <div className="space-y-2">
                                {mappedOrders.length > 0 ? (
                                    mappedOrders.map((order, i) => (
                                        <OrderRow key={order.id} order={order} index={i} />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-white/30">
                                        <Coffee className="w-12 h-12 mb-4 opacity-20" />
                                        <p>No active orders for today</p>
                                    </div>
                                )}
                            </div>
                        </PremiumContainer>
                    </div>

                    {/* Side Panel (Popular Items & Quick Actions) */}
                    <div className="space-y-6">
                        <PremiumActionCard delay={0.5}>
                            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group text-left">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Coffee className="w-5 h-5" />
                                    </div>
                                    <div className="text-sm font-medium text-white">Add Item</div>
                                </button>
                                <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group text-left">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div className="text-sm font-medium text-white">Staff</div>
                                </button>
                            </div>
                        </PremiumActionCard>

                        <PremiumContainer delay={0.6}>
                            <h3 className="text-lg font-semibold text-white mb-4">Popular Items</h3>
                            <div className="space-y-4">
                                {metrics?.popularItems && metrics.popularItems.length > 0 ? (
                                    metrics.popularItems.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div>
                                                <div className="text-white font-medium">{item.name}</div>
                                                <div className="text-xs text-white/50">{item.count} orders</div>
                                            </div>
                                            <div className="text-emerald-400 text-sm font-medium">₹{item.revenue}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-white/30 text-sm py-4">No data available</div>
                                )}
                            </div>
                        </PremiumContainer>
                    </div>

                </div>

            </div>

            {/* Auto-Print Dialog Overlay */}
            {autoPrintBill && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-[#1c1c24] border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
                    >
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    New Takeaway Served!
                                </h2>
                                <p className="text-sm text-white/50 mt-1">Order #{autoPrintBill.billNumber}</p>
                            </div>
                            <button
                                onClick={() => setAutoPrintBill(null)}
                                className="p-2 hover:bg-white/10 rounded-full text-white/50 transition-colors"
                            >
                                <ArrowUpRight className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <div className="p-6">
                            <ReprintBill
                                bill={autoPrintBill}
                                onClose={() => setAutoPrintBill(null)}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
