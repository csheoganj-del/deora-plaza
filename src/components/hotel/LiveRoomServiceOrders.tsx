"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFreshOrders, markOrdersAsCompleted } from "@/actions/orders"; // Use FRESH server action & clear action
import { PremiumLiquidGlass } from "@/components/ui/glass/premium-liquid-glass";
import { Badge } from "@/components/ui/badge";
import { Clock, ChefHat, CheckCircle2, Utensils, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Order {
    id: string;
    orderNumber: string;
    roomNumber: string;
    status: string;
    totalAmount: number;
    items: any[];
    createdAt: string;
    businessUnit: string;
    type: string;
}

interface LiveRoomServiceOrdersProps {
    className?: string;
}

export function LiveRoomServiceOrders({ className }: LiveRoomServiceOrdersProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const supabase = createClient();
    const { toast } = useToast();

    const fetchOrders = async () => {
        try {
            // Use getFreshOrders server action - safe, uncached, and bypasses RLS if needed
            const allOrders = await getFreshOrders();

            console.log("[LiveRoomService] Fetched orders (fresh server action):", allOrders?.length);

            // Filter for hotel room service orders that are active
            const roomServiceOrders = (allOrders || []).filter((o: any) => {
                const isRoomService = o.type === 'room-service';
                const isActive = ['pending', 'preparing', 'ready', 'served'].includes(o.status);
                // Allow both hotel and cafe generic orders if they are room service
                const isValidUnit = ['hotel', 'cafe'].includes(o.businessUnit);

                const passes = isRoomService && isActive && isValidUnit;

                if (o.type === 'room-service') {
                    console.log(`[Debug] Order ${o.orderNumber}: BU=${o.businessUnit}, Type=${o.type}, Status=${o.status}, Passes=${passes}`);
                }
                return passes;
            });

            console.log("[LiveRoomService] Filtered hotel orders:", roomServiceOrders.length);
            setOrders(roomServiceOrders);
        } catch (error) {
            console.error("[LiveRoomService] Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // 1. Initial Fetch
        fetchOrders();

        // 2. Polling Fallback (every 10 seconds)
        // This ensures data is definitely up to date even if Real-time fails
        const intervalId = setInterval(() => {
            console.log("[LiveRoomService] Polling for fresh data...");
            fetchOrders();
        }, 10000);

        // 3. Real-time subscription
        console.log("[LiveRoomService] Setting up real-time subscription...");
        const channel = supabase
            .channel("hotel-live-room-service")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders"
                },
                (payload: any) => {
                    console.log("[LiveRoomService] Order change detected:", payload.eventType);
                    // Refresh on ANY order change to be perfectly safe
                    // The fetchOrders function will filter the relevant ones
                    fetchOrders();
                }
            )
            .subscribe((status) => {
                console.log("[LiveRoomService] Subscription status:", status);
            });

        return () => {
            console.log("[LiveRoomService] Cleaning up subscription");
            clearInterval(intervalId);
            channel.unsubscribe();
        };
    }, []);

    const handleClearServed = async () => {
        const servedOrders = orders.filter(o => o.status === 'served');
        if (servedOrders.length === 0) return;

        setClearing(true);
        try {
            const ids = servedOrders.map(o => o.id);
            const result = await markOrdersAsCompleted(ids);

            if (result.success) {
                toast({ title: "History Cleared", description: `Archived ${ids.length} served orders.` });
                fetchOrders(); // Immediate refresh
            } else {
                toast({ title: "Error", description: "Failed to clear history", variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to clear history:", error);
            toast({ title: "Error", description: "Exception clearing history", variant: "destructive" });
        } finally {
            setClearing(false);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return {
                    label: 'Pending',
                    icon: Clock,
                    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    iconColor: 'text-amber-400'
                };
            case 'preparing':
                return {
                    label: 'Preparing',
                    icon: ChefHat,
                    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    iconColor: 'text-blue-400'
                };
            case 'ready':
                return {
                    label: 'Ready',
                    icon: CheckCircle2,
                    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    iconColor: 'text-emerald-400'
                };
            case 'served':
                return {
                    label: 'Served',
                    icon: Utensils,
                    color: 'bg-white/5 text-white/50 border-white/10',
                    iconColor: 'text-white/50'
                };
            default:
                return {
                    label: status,
                    icon: Clock,
                    color: 'bg-white/5 text-white/50 border-white/10',
                    iconColor: 'text-white/50'
                };
        }
    };

    const hasServedOrders = orders.some(o => o.status === 'served');

    if (loading) {
        return (
            <PremiumLiquidGlass title="Live Room Service Orders" className={className}>
                <div className="text-center py-8 text-white/40">Loading orders...</div>
            </PremiumLiquidGlass>
        );
    }

    if (orders.length === 0) {
        return (
            <PremiumLiquidGlass title="Live Room Service Orders" className={className}>
                <div className="text-center py-8">
                    <Utensils className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40">No active room service orders</p>
                </div>
            </PremiumLiquidGlass>
        );
    }

    return (
        <PremiumLiquidGlass className={className}>
            {/* Custom Header since PremiumLiquidGlass doesn't support title/headerAction props directly */}
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Live Room Service Orders</h2>
                    {orders.length > 0 && (
                        <Badge variant="secondary" className="bg-white/10 text-white/70 hover:bg-white/20 h-5 px-1.5 min-w-[1.25rem] justify-center">
                            {orders.length}
                        </Badge>
                    )}
                </div>
                {hasServedOrders && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearServed}
                        disabled={clearing}
                        className="text-white/50 hover:text-white hover:bg-white/10 h-7 text-xs gap-1"
                    >
                        {clearing ? <Clock className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Clear History
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;

                    let timeAgo = 'Just now';
                    try {
                        const date = new Date(order.createdAt);
                        if (!isNaN(date.getTime())) {
                            timeAgo = formatDistanceToNow(date, { addSuffix: true });
                        }
                    } catch (e) {
                        console.error("Date error:", e);
                    }

                    return (
                        <div
                            key={order.id}
                            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-white">Room {order.roomNumber}</span>
                                        <span className="text-white/30">•</span>
                                        <span className="text-sm text-white/50">#{order.orderNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/40">
                                        <Clock className="w-3 h-3" />
                                        {timeAgo}
                                    </div>
                                </div>

                                <div className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium",
                                    statusConfig.color
                                )}>
                                    <StatusIcon className={cn("w-3.5 h-3.5", statusConfig.iconColor)} />
                                    {statusConfig.label}
                                </div>
                            </div>

                            {/* Items */}
                            {order.items && order.items.length > 0 && (
                                <div className="space-y-1.5 mb-3">
                                    {order.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <span className="text-white/70">
                                                {item.quantity}x {item.name}
                                            </span>
                                            <span className="text-white/40">₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Total */}
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                <span className="text-sm font-medium text-white/50">Total</span>
                                <span className="text-lg font-bold text-white">₹{order.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </PremiumLiquidGlass>
    );
}
