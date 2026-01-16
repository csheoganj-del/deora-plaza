"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useServerAuth } from "@/hooks/useServerAuth";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { createClient } from "@/lib/supabase/client";
import { logoutCustomUser } from "@/actions/custom-auth";
import {
    LayoutDashboard, UtensilsCrossed, Armchair, FileText, Users, Hotel,
    Flower2, Wine, LogOut, ChevronRight, Handshake, FileSpreadsheet,
    BarChart3, Tag, MapPin, Package, Monitor, Smartphone, Edit3, Zap,
    Trophy, Calendar, Coffee, ChevronLeft, Plus, CheckCircle, ChefHat
} from "lucide-react";

const supabase = createClient();

// Sidebar Item Component
const SidebarItem = ({
    href,
    icon: Icon,
    name,
    isActive,
    isCollapsed,
    isBlinking
}: {
    href: string;
    icon: any;
    name: string;
    isActive: boolean;
    isCollapsed: boolean;
    isBlinking?: boolean;
}) => {
    return (
        <Link href={href}>
            <div className="relative group flex items-center py-3 px-3 mx-2 my-1">
                {/* Active/Hover Background Glow */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-xl transition-all duration-300",
                        isActive
                            ? "bg-gradient-to-r from-white/20 to-white/5 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10"
                            : isBlinking
                                ? "bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-amber-500/30 animate-pulse"
                                : "hover:bg-white/10"
                    )}
                />

                {/* Active Indicator Line (Left) */}
                {isActive && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#fae8b4] shadow-[0_0_10px_#fae8b4]"
                    />
                )}

                {/* Icon */}
                <div className={cn(
                    "relative z-10 p-2 rounded-lg transition-colors duration-300",
                    isActive ? "text-[#fae8b4]" : isBlinking ? "text-amber-400" : "text-white/60 group-hover:text-white"
                )}>
                    <Icon className={cn("w-5 h-5", isBlinking && "animate-bounce")} />
                </div>

                {/* Label (if not collapsed) */}
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                                "relative z-10 ml-2 text-sm font-medium whitespace-nowrap transition-colors duration-300",
                                isActive ? "text-white" : isBlinking ? "text-amber-200" : "text-white/60 group-hover:text-white"
                            )}
                        >
                            {name}
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 
            bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-lg 
            text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 
            transition-opacity pointer-events-none z-50 shadow-xl"
                    >
                        {name}
                        {/* Arrow */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-[#1a1a1a]/90" />
                    </div>
                )}
            </div>
        </Link>
    );
};

export default function GlassSidebar() {
    const pathname = usePathname();
    const { data: session } = useServerAuth();
    const { filterNavigationItems } = useModuleAccess();
    const role = session?.user?.role;
    const [isCollapsed, setIsCollapsed] = useState(false); // Default to open for better UX on large screens
    const [hasReadyOrders, setHasReadyOrders] = useState(false);
    const [hasActiveOrders, setHasActiveOrders] = useState(false);

    // Fetch and subscribe to orders for blinking effect
    useEffect(() => {
        const fetchOrderStatuses = async () => {
            // Ready orders for waiters
            const { count: readyCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'ready');

            setHasReadyOrders((readyCount || 0) > 0);

            // Active orders for kitchen (pending, preparing, ready, served)
            const { count: activeCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .in('status', ['pending', 'preparing', 'ready', 'served']);

            setHasActiveOrders((activeCount || 0) > 0);
        };

        fetchOrderStatuses();

        const channel = supabase
            .channel('sidebar-orders-monitor')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrderStatuses();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Same links definition as before
    const links = useMemo(() => [
        { name: "Tables", href: "/dashboard/tables", icon: Armchair, roles: ["cafe_manager", "waiter", "super_admin", "owner"], moduleKey: "enableTablesModule" },
        { name: "Kitchen Feed", href: "/dashboard/kitchen", icon: ChefHat, roles: ["cafe_manager", "super_admin", "owner"], moduleKey: "enableOrderManagementModule" },
        { name: "Order Pipeline", href: "/dashboard/waiter/track", icon: Edit3, roles: ["cafe_manager", "waiter", "super_admin", "owner"], moduleKey: "enableWaiterInterfaceModule" },
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "owner"], moduleKey: "enableAnalyticsModule" },
        { name: "Orders", href: "/dashboard/order-management", icon: Edit3, roles: ["super_admin", "owner"], moduleKey: "enableOrderManagementModule" },
        { name: "Bar Manage", href: "/dashboard/bar", icon: Wine, roles: ["bar_manager", "super_admin", "owner"], moduleKey: "enableBarModule" },
        { name: "Hotel", href: "/dashboard/hotel", icon: Hotel, roles: ["hotel_manager", "hotel_reception", "super_admin", "owner"], moduleKey: "enableHotelModule" },
        { name: "Garden", href: "/dashboard/garden", icon: Flower2, roles: ["garden_manager", "super_admin", "owner"], moduleKey: "enableGardenModule" },
        { name: "Billing", href: "/dashboard/billing", icon: FileText, roles: ["cafe_manager", "super_admin", "owner"], moduleKey: "enableBillingModule" },
        { name: "Statistics", href: "/dashboard/statistics", icon: BarChart3, roles: ["bar_manager", "hotel_manager", "manager", "super_admin", "owner"], moduleKey: "enableStatisticsModule" },
        { name: "GST Report", href: "/dashboard/gst-report", icon: FileSpreadsheet, roles: ["super_admin", "owner"], moduleKey: "enableGSTReportModule" },
        { name: "Settlements", href: "/dashboard/settlements", icon: Handshake, roles: ["super_admin", "owner"], moduleKey: "enableSettlementsModule" },
        { name: "Customers", href: "/dashboard/customers", icon: Users, roles: ["super_admin", "owner"], moduleKey: "enableCustomerModule" },
        { name: "Discounts", href: "/dashboard/discounts", icon: Tag, roles: ["super_admin", "owner", "manager"], moduleKey: "enableDiscountsModule" },
        { name: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed, roles: ["cafe_manager", "bar_manager", "super_admin", "owner"], moduleKey: "enableMenuModule" },
        { name: "Users", href: "/dashboard/users", icon: Users, roles: ["super_admin", "owner", "manager"], moduleKey: "enableUserManagementModule" },
    ], []);

    const visibleLinks = useMemo(() => {
        if (!role || !session?.user) return [];
        if (role === "super_admin" || role === "owner") return links;
        //@ts-ignore
        const roleFilteredLinks = links.filter(link => link.roles.includes(role));
        return filterNavigationItems(roleFilteredLinks as any);
    }, [role, session, links, filterNavigationItems]);

    return (
        <motion.div
            initial={{ width: isCollapsed ? 80 : 260 }}
            animate={{ width: isCollapsed ? 80 : 260 }}
            className="relative h-screen flex-shrink-0 z-50"
        >
            {/* Glass Container */}
            <div className="absolute inset-0 bg-[#0f0f13]/80 backdrop-blur-xl border-r border-white/10" />

            <div className="relative h-full flex flex-col">
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-8 p-1 bg-[#1a1a1a] border border-white/10 rounded-full text-white/70 hover:text-white transition-colors z-50"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Logo Area */}
                <div className="p-6 mb-2">
                    <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F2B94B] to-[#D9A441] shadow-[0_0_20px_rgba(242,185,75,0.3)] flex items-center justify-center text-black font-bold text-xl">
                            D
                        </div>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                >
                                    <h1 className="text-white font-bold text-lg tracking-tight">DEORA</h1>
                                    <p className="text-white/40 text-xs font-medium tracking-wider">PLAZA</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Scrollable Navigation */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2">
                    {visibleLinks.map((link) => (
                        <SidebarItem
                            key={link.href}
                            {...link}
                            isActive={pathname === link.href}
                            isCollapsed={isCollapsed}
                            isBlinking={
                                (link.name === "Kitchen Feed" && hasActiveOrders && pathname !== link.href)
                            }
                        />
                    ))}
                </div>

                {/* User Footer */}
                <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
                    <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 border border-white/20 shadow-lg flex items-center justify-center text-white text-sm font-medium">
                            {(session?.user as any)?.name?.[0] || (session?.user as any)?.username?.[0] || "U"}
                        </div>

                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 min-w-0"
                                >
                                    <p className="text-sm font-medium text-white truncate">{(session?.user as any)?.name || (session?.user as any)?.username || "User"}</p>
                                    <button
                                        onClick={() => logoutCustomUser()}
                                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 mt-0.5 transition-colors"
                                    >
                                        <LogOut size={12} />
                                        Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
