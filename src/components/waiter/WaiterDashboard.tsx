"use client";

import { useState, useEffect, useMemo } from "react";
import {
    PremiumLiquidGlass,
    PremiumContainer,
    PremiumStatsCard
} from "@/components/ui/glass/premium-liquid-glass";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    Search,
    Edit3,
    Trash2,
    Utensils,
    ShoppingCart,
    Users,
    MapPin,
    RefreshCcw,
    CheckCircle2,
    X,
    ArrowLeft,
    Save,
    Minus,
    LayoutGrid,
    Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getMenuItems } from "@/actions/menu";
import { getOrders, updateOrderStatus, updateOrderItems, createOrder, deleteOrder as deleteOrderAction, updateOrderItemStatus } from "@/actions/orders";
import { getTables } from "@/actions/tables";
import { getBusinessSettings } from "@/actions/businessSettings";
import { PasswordDialog } from "@/components/ui/PasswordDialog";
import { formatDistanceToNow } from "date-fns";
import { cn, playBeep, speakKitchenAlert } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { balloonFly } from "@/lib/balloonFly";
import { clearKitchenHistory } from "@/actions/kitchen";
import CustomerAutocomplete from "@/components/billing/CustomerAutocomplete";
import DiscountPanel from "@/components/billing/DiscountPanel";
import { calculateBillTotals } from "@/lib/discount-utils";
import { ArrowRight, User, Receipt, Percent, ChevronDown } from "lucide-react";

// --- Types ---
interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: string;
    description?: string;
    prepTime: number;
    isAvailable: boolean;
    businessUnit: string;
}

interface OrderItem {
    id?: string;
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    specialInstructions?: string;
    category: string;
    status?: string;
}

interface Table {
    id: string;
    tableNumber: string;
    capacity: number;
    status: string;
    businessUnit: string;
}

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerMobile?: string;
    tableId: string | null;
    tableNumber: string | null;
    roomNumber?: string | null;
    businessUnit: string;
    status: "pending" | "preparing" | "ready" | "served" | "cancelled" | "bill_requested";
    totalAmount: number;
    createdAt: string;
    items: OrderItem[];
}

const supabase = createClient();

export default function WaiterDashboard({ initialTab = "new-order", soloMode = false }: { initialTab?: string; soloMode?: boolean }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(true);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);

    // New Order State
    const [currentCart, setCurrentCart] = useState<OrderItem[]>([]);
    const [selectedTableId, setSelectedTableId] = useState("");
    const [selectedBusinessUnit, setSelectedBusinessUnit] = useState("restaurant");
    const [menuSearch, setMenuSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // POS-like states
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [manualCustomerName, setManualCustomerName] = useState("");
    const [manualCustomerMobile, setManualCustomerMobile] = useState("");
    const [discountPercent, setDiscountPercent] = useState(0);
    const [gstEnabled, setGstEnabled] = useState(false);
    const [gstPercentage, setGstPercentage] = useState(5); // Default 5%
    const [isCustomerExpanded, setIsCustomerExpanded] = useState(false);
    const [isGstExpanded, setIsGstExpanded] = useState(false);
    const [isTablesExpanded, setIsTablesExpanded] = useState(true);

    // Track & Modify State
    const [orderSearch, setOrderSearch] = useState("");
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);

    // Deletion Security State
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single');
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
    const [passwordProtectionEnabled, setPasswordProtectionEnabled] = useState(true);
    const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

    const [audioEnabled, setAudioEnabled] = useState(false);
    // TTS Test Functions
    const testItemReady = () => {
        speakKitchenAlert("Table 5 ke liye Masala Chai taiyaar hai", true);
        toast.info("Testing: Item Ready Alert");
    };

    const testOrderReady = () => {
        speakKitchenAlert("Order number 123, Table 5 ke liye pura taiyaar hai", true);
        toast.success("Testing: Order Ready Alert");
    };

    const testReminder = () => {
        speakKitchenAlert("Table 5 ke liye order baaki hai", true);
        toast.warning("Testing: Reminder Alert");
    };

    // --- Initialization ---
    // Initialize audio on first user interaction to unlock browser autoplay restrictions
    useEffect(() => {
        const enableAudio = () => {
            if (!audioEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
                // Play a silent utterance to unlock the audio
                const utterance = new SpeechSynthesisUtterance('');
                utterance.volume = 0;
                window.speechSynthesis.speak(utterance);
                setAudioEnabled(true);
                console.log('🔊 [Waiter] Audio enabled for alerts');
            }
        };

        const handleInteraction = () => {
            enableAudio();
            // Remove listeners after first interaction
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
        };

        // Try to enable immediately (might work if already interacted)
        enableAudio();

        document.addEventListener('click', handleInteraction);
        document.addEventListener('keydown', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);

        return () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
        };
    }, [audioEnabled]);


    useEffect(() => {
        fetchInitialData();

        // Fetch business settings for password protection
        getBusinessSettings().then(settings => {
            if (settings) {
                setPasswordProtectionEnabled(settings.enablePasswordProtection ?? true);
            }
        });

        // Set up real-time subscriptions
        console.log("[WaiterDashboard] Setting up Realtime subscription for orders...");
        const channel = supabase
            .channel("waiter-dashboard-orders")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                (payload: any) => {
                    console.log("[WaiterDashboard] Realtime order change detected:", payload.eventType, payload.new?.orderNumber || payload.old?.id);

                    if (payload.new && payload.old) {
                        const newOrder = payload.new;
                        const oldOrder = payload.old;

                        // Construct user-friendly location string
                        const isTakeaway = newOrder.businessUnit === 'takeaway' || newOrder.type === 'takeaway'; // Handle both flags
                        const locationName = newOrder.businessUnit === 'hotel'
                            ? `Room ${newOrder.roomNumber || 'Unknown'}`
                            : isTakeaway
                                ? "Takeaway"
                                : `Table ${newOrder.tableNumber || newOrder.tableId || 'Unknown'}`;

                        // 1. Whole Order Ready Alert
                        if (newOrder.status === 'ready' && oldOrder.status !== 'ready') {
                            console.log("[Waiter] Order is READY, playing alert...");
                            playBeep(1000, 200);
                            toast.success(`Order ${newOrder.orderNumber} is READY!`, { duration: 5000 });

                            // Speak: "Order X for Table Y is ready"
                            const message = `Order number ${newOrder.orderNumber}, ${locationName} ke liye pura taiyaar hai`;
                            speakKitchenAlert(message, true);
                        }

                        // 2. Individual Item Ready Alert (Prevent items from getting cold!)
                        // Check if specific items changed to "prepared" (Kitchen finished cooking)
                        if (newOrder.items && oldOrder.items) {
                            try {
                                const newItems: any[] = typeof newOrder.items === 'string' ? JSON.parse(newOrder.items) : newOrder.items;
                                const oldItems: any[] = typeof oldOrder.items === 'string' ? JSON.parse(oldOrder.items) : oldOrder.items;

                                newItems.forEach(newItem => {
                                    const oldPageItem = oldItems.find((oi: any) => (oi.menuItemId === newItem.menuItemId) || (oi.id === newItem.id));

                                    // Trigger if status changed to 'prepared' (Kitchen -> Waiter handoff)
                                    // We ignore 'served' here as that's done by the waiter themselves
                                    if (newItem.status === 'prepared' && oldPageItem?.status !== 'prepared') {
                                        console.log(`[Waiter] Item Ready: ${newItem.name}`);
                                        playBeep(800, 100); // Shorter beep for items
                                        toast.info(`${newItem.name} Ready for ${locationName}`);

                                        // Speak: "Item X for Table Y is ready"
                                        const itemMessage = `${locationName} ke liye ${newItem.name} taiyaar hai`;
                                        speakKitchenAlert(itemMessage, true);
                                    }
                                });
                            } catch (e) {
                                console.error("Error parsing items for TTS diff:", e);
                            }
                        }
                    }

                    // Provide visual feedback for sync
                    if (payload.eventType !== 'DELETE') {
                        toast.info(`Update: Order ${payload.new?.orderNumber || 'synced'}`, {
                            duration: 2000,
                            position: 'bottom-right'
                        });
                    }
                    fetchOrdersOnly();
                }
            )
            .subscribe((status) => {
                console.log(`[WaiterDashboard] Realtime subscription status: ${status}`);
            });

        // Polling fallback (every 10 seconds)
        const pollInterval = setInterval(() => {
            console.log("[WaiterDashboard] Polling fallback triggered");
            fetchOrdersOnly();
        }, 10000);

        return () => {
            console.log("[WaiterDashboard] Cleaning up Realtime subscription and polling");
            channel.unsubscribe();
            clearInterval(pollInterval);
        };
    }, [selectedBusinessUnit]);

    const fetchInitialData = async () => {
        console.log(`[WaiterDashboard] Fetching initial data for unit: ${selectedBusinessUnit}`);
        setLoading(true);
        try {
            const [menuData, tablesData, ordersData] = await Promise.all([
                getMenuItems(selectedCategory === 'all' ? selectedBusinessUnit : undefined),
                getTables(selectedBusinessUnit),
                getOrders()
            ]);

            console.log(`[WaiterDashboard] Fetched ${menuData?.length || 0} menu items`);
            console.log(`[WaiterDashboard] Fetched ${tablesData?.length || 0} tables`);
            console.log(`[WaiterDashboard] Fetched ${ordersData?.length || 0} orders`);

            setMenuItems(menuData || []);
            setTables(tablesData || []);

            // Filter for orders that waiters need to handle (dine-in, takeaway, and room-service)
            const filtered = (ordersData || []).filter((o: any) => {
                const status = (o.status || "").toLowerCase();
                const type = (o.type || "").toLowerCase();
                const statusMatch = ['pending', 'preparing', 'ready', 'served', 'bill_requested', 'completed'].includes(status);
                // Include dine-in (all statuses), takeaway (when ready), and room-service (when ready for delivery)
                const typeMatch = type === 'dine-in' ||
                    (type === 'takeaway' && ['preparing', 'ready', 'served', 'bill_requested', 'completed'].includes(status)) ||
                    (type === 'room-service' && ['preparing', 'ready', 'served', 'bill_requested', 'completed'].includes(status));
                return statusMatch && typeMatch;
            });
            console.log(`[WaiterDashboard] Active orders after filter: ${filtered.length}`);
            setActiveOrders(filtered);
        } catch (error) {
            console.error("[WaiterDashboard] Error fetching initial data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrdersOnly = async () => {
        console.log("[WaiterDashboard] Refreshing orders list...");
        try {
            const ordersData = await getOrders();
            console.log(`[WaiterDashboard] Refreshed ${ordersData?.length || 0} orders`);

            // Filter for orders that waiters need to handle (dine-in, takeaway, and room-service)
            const filtered = (ordersData || []).filter((o: any) => {
                const status = (o.status || "").toLowerCase();
                const type = (o.type || "").toLowerCase();
                const statusMatch = ['pending', 'preparing', 'ready', 'served', 'bill_requested', 'completed'].includes(status);
                // Include dine-in (all statuses), takeaway (when ready), and room-service (when ready for delivery)
                // We added 'preparing' to takeaway so that partial item ready alerts show up
                const typeMatch = type === 'dine-in' ||
                    (type === 'takeaway' && ['preparing', 'ready', 'served', 'bill_requested', 'completed'].includes(status)) ||
                    (type === 'room-service' && ['preparing', 'ready', 'served', 'bill_requested', 'completed'].includes(status));
                return statusMatch && typeMatch;
            });

            console.log(`[WaiterDashboard] Active orders after filter: ${filtered.length}`);
            setActiveOrders(filtered);

            // Update editing order if it changed in DB
            if (editingOrder) {
                const updated = ordersData.find((o: any) => o.id === editingOrder.id);
                if (updated && JSON.stringify(updated.items) !== JSON.stringify(editingOrder.items)) {
                    // Handle merge if needed
                }
            }
        } catch (error) {
            console.error("[WaiterDashboard] Error refreshing orders:", error);
        }
    };

    // --- Handlers: New Order ---
    const addToCart = (item: MenuItem, e?: React.MouseEvent) => {
        // Fly animation logic
        if (e) {
            const source = e.currentTarget as HTMLElement;
            const target = document.querySelector(`[data-cart-item-id="${item.id}"]`) as HTMLElement
                || document.querySelector("[data-fly-target]") as HTMLElement;
            if (source && target) {
                balloonFly(source, target);
                playBeep(900, 60);
            }
        }

        if (editingOrder) {
            // ... (keep editing order logic)
            const existing = editingOrder.items.find(i => i.menuItemId === item.id);
            let updatedItems: OrderItem[];

            if (existing) {
                updatedItems = editingOrder.items.map(i =>
                    i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            } else {
                updatedItems = [...editingOrder.items, {
                    menuItemId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: 1,
                    category: item.category
                }];
            }

            setEditingOrder({
                ...editingOrder,
                items: updatedItems,
                totalAmount: updatedItems.reduce((s, i) => s + (i.price * i.quantity), 0)
            });
            toast.success(`Updated ${item.name}`);
            return;
        }

        const existing = currentCart.find(i => i.menuItemId === item.id);
        if (existing) {
            setCurrentCart(prev => prev.map(i =>
                i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            setCurrentCart(prev => [...prev, {
                menuItemId: item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                category: item.category
            }]);
        }
    };

    const removeFromCart = (menuItemId: string) => {
        setCurrentCart(prev => prev.filter(i => i.menuItemId !== menuItemId));
    };

    const submitNewOrder = async () => {
        if (currentCart.length === 0) return toast.error("Cart is empty");
        if (!selectedTableId) return toast.error("Select a table");

        const table = tables.find(t => t.id === selectedTableId);

        const result = await createOrder({
            tableId: selectedTableId,
            tableNumber: table?.tableNumber,
            customerName: selectedCustomer?.name || manualCustomerName || "Guest",
            customerMobile: selectedCustomer?.mobileNumber || manualCustomerMobile,
            type: "dine-in",
            businessUnit: selectedBusinessUnit,
            items: currentCart
        });

        if (result.success) {
            toast.success("Order submitted successfully");
            setCurrentCart([]);
            setSelectedTableId("");
            setManualCustomerName("");
            setManualCustomerMobile("");
            setSelectedCustomer(null);
            fetchInitialData();
        } else {
            toast.error(result.error || "Failed to submit order");
        }
    };

    // --- Handlers: Amendment ---
    const handleEditOrder = (order: Order) => {
        setEditingOrder({ ...order });
        if (order.businessUnit) {
            setSelectedBusinessUnit(order.businessUnit);
        }
        setSelectedCategory("all");
        setMenuSearch("");
        setActiveTab("new-order"); // Switch to menu to allow adding items
        toast.info(`Modifying ${order.orderNumber} - Add items or save changes`);
    };

    const updateQuantity = (menuItemId: string, delta: number) => {
        if (!editingOrder) return;

        const updatedItems = editingOrder.items.map(item => {
            if (item.menuItemId === menuItemId) {
                return { ...item, quantity: Math.max(0, item.quantity + delta) };
            }
            return item;
        }).filter(i => i.quantity > 0);

        setEditingOrder({
            ...editingOrder,
            items: updatedItems,
            totalAmount: updatedItems.reduce((s, i) => s + (i.price * i.quantity), 0)
        });
    };

    const saveAmendment = async () => {
        if (!editingOrder) return;

        const result = await updateOrderItems(
            editingOrder.id,
            editingOrder.items,
            editingOrder.totalAmount
        );

        if (result.success) {
            toast.success("Order updated successfully");
            setEditingOrder(null);
            setActiveTab("track");
            fetchOrdersOnly();
        } else {
            toast.error("Failed to update order");
        }
    };

    // --- Handlers: Status Changes ---
    const handleItemStatusUpdate = async (orderId: string, menuItemId: string, newStatus: string) => {
        try {
            const result = await updateOrderItemStatus(orderId, menuItemId, newStatus, { actor: 'waiter' });
            if (result.success) {
                toast.success(`Item marked as ${newStatus}`);
                if (newStatus === 'served') playBeep(880, 150);
                fetchInitialData();
            }
        } catch (error) {
            console.error("Error updating item status:", error);
        }
    };

    const markAsServed = async (orderId: string) => {
        const result = await updateOrderStatus(orderId, "served");
        if (result.success) {
            toast.success("Order served!");
            fetchOrdersOnly();
        } else {
            toast.error("Failed to update status");
        }
    };

    const requestBill = async (order: Order) => {
        const result = await updateOrderStatus(order.id, "bill_requested", {
            actor: "waiter",
            message: `Bill requested by waiter for ${order.tableNumber ? 'Table ' + order.tableNumber : 'Order ' + order.orderNumber}`
        });

        if (result.success) {
            toast.success("Bill request sent to manager");
            fetchOrdersOnly();
        } else {
            toast.error("Failed to request bill");
        }
    };

    const handleSingleDelete = async (orderId: string) => {
        if (!passwordProtectionEnabled) {
            if (confirm("Are you sure you want to delete this order?")) {
                setDeletingOrderId(orderId);
                const result = await deleteOrderAction(orderId);
                if (result.success) {
                    toast.success("Order deleted successfully");
                    fetchOrdersOnly();
                } else {
                    toast.error("Failed to delete order");
                }
                setDeletingOrderId(null);
            }
            return;
        }
        setOrderToDelete(orderId);
        setIsPasswordDialogOpen(true);
    };

    const handlePasswordSuccess = async (password: string) => {
        setLoading(true);
        if (orderToDelete) {
            const result = await deleteOrderAction(orderToDelete, password);
            if (result.success) {
                toast.success("Order deleted successfully");
                fetchOrdersOnly();
            } else {
                toast.error(result.error || "Failed to delete order");
            }
        }
        setLoading(false);
        setIsPasswordDialogOpen(false);
        setOrderToDelete(null);
    };

    const handleClearHistory = async () => {
        if (!confirm("Are you sure you want to CLEAR ALL HISTORY? This cannot be undone.")) return;

        setLoading(true);
        try {
            // Don't filter by business unit - clear all historical orders
            const result = await clearKitchenHistory();
            if (result.success) {
                toast.success("History cleared successfully");
                fetchOrdersOnly();
            } else {
                toast.error("Failed to clear history");
            }
        } catch (error) {
            console.error("Error clearing history:", error);
            toast.error("Error clearing history");
        } finally {
            setLoading(false);
        }
    };

    // --- Render Helpers ---
    const filteredMenuItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesUnit = item.businessUnit === selectedBusinessUnit;
        return matchesSearch && matchesCategory && matchesUnit && item.isAvailable;
    });

    const readyOrders = activeOrders.filter(o => {
        // Keep visible if:
        // 1. Status is 'ready' (Everything cooked)
        // 2. has 'prepared' items (Cooked but not served)
        // 3. has 'served' items AND status is NOT fully 'served'/'completed' (Partially served, waiting for rest)
        const isReady = o.status === "ready";
        const hasPrepared = o.items && o.items.some((i: any) => i.status === "prepared");
        const hasServed = o.items && o.items.some((i: any) => i.status === "served");
        const isFullyDone = ["served", "completed", "cancelled"].includes(o.status || "");

        return isReady || hasPrepared || (hasServed && !isFullyDone);
    });
    const progressingOrders = activeOrders.filter(o => ["pending", "preparing", "ready"].includes(o.status));
    const historyOrders = activeOrders.filter(o => ["served", "bill_requested", "completed", "cancelled"].includes(o.status));

    const totals = useMemo(() => {
        const subtotal = (editingOrder ? editingOrder.items : currentCart).reduce((sum, i) => sum + (i.price * i.quantity), 0);
        return calculateBillTotals(subtotal, discountPercent, gstEnabled ? gstPercentage : 0);
    }, [currentCart, editingOrder, discountPercent, gstEnabled, gstPercentage]);

    const categories = useMemo(() =>
        ["all", ...new Set(menuItems.filter(i => i.businessUnit === selectedBusinessUnit).map(i => i.category))],
        [menuItems, selectedBusinessUnit]
    );

    // Loading state - render in JSX instead of early return to avoid hooks violation
    if (loading && menuItems.length === 0) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <RefreshCcw className="w-8 h-8 animate-spin text-primary opacity-20" />
            </div>
        );
    }

    return (
        <div className={cn("space-y-6 max-w-7xl mx-auto px-4", soloMode && "pt-6")}>
            {/* Dashboard Header */}
            {!soloMode && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary">
                                <Utensils className="w-6 h-6" />
                            </div>
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
                                Waiter Dashboard
                            </h1>
                        </div>
                        <p className="text-white/50 mt-1 pl-[3.5rem]">Service Management & Order Control</p>
                    </motion.div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchOrdersOnly}
                            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
                        >
                            <RefreshCcw className={cn("w-4 h-4 text-primary", loading && "animate-spin")} />
                        </Button>
                        <PremiumStatsCard
                            title="Ready"
                            value={readyOrders.length.toString()}
                            icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                        />
                        <PremiumStatsCard
                            title="Active"
                            value={progressingOrders.length.toString()}
                            icon={<Clock className="w-4 h-4 text-blue-400" />}
                        />
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {editingOrder && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="bg-primary/10 border border-primary/30 p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Amending Order #{editingOrder.orderNumber}</h3>
                                    <p className="text-xs text-white/50">{editingOrder.customerName} • {editingOrder.tableNumber ? `Table ${editingOrder.tableNumber}` : 'Hotel Service'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={saveAmendment} className="bg-primary hover:bg-primary/90 text-white gap-2">
                                    <Save className="w-4 h-4" /> Save Changes
                                </Button>
                                <Button variant="outline" onClick={() => setEditingOrder(null)} className="border-white/10 hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl mb-6 flex overflow-x-auto no-scrollbar">
                    <TabsTrigger value="new-order" className="rounded-xl px-4 py-2 flex-1 md:flex-none">
                        <Plus className="w-4 h-4 mr-2" /> {editingOrder ? "Add Items" : "New Order"}
                    </TabsTrigger>
                    <TabsTrigger value="track" className="rounded-xl px-4 py-2 flex-1 md:flex-none">
                        <Edit3 className="w-4 h-4 mr-2" /> Track Active
                    </TabsTrigger>
                    <TabsTrigger value="ready" className="rounded-xl px-4 py-2 flex-1 md:flex-none relative">
                        <CheckCircle className="w-4 h-4 mr-2" /> Ready
                        {readyOrders.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white/20" />
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-4 py-2 flex-1 md:flex-none">
                        <Clock className="w-4 h-4 mr-2" /> History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="new-order">
                    <div className="flex flex-col lg:flex-row gap-6 h-[75vh]">
                        {/* Left Panel: Menu Selection (65%) */}
                        <div className="lg:w-[65%] flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden min-h-0">
                            {/* Search & Filters */}
                            <div className="p-4 bg-white/[0.03] border-b border-white/[0.06] space-y-4 shrink-0">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            placeholder="Search items..."
                                            className="pl-10 bg-white/[0.04] border-white/10 h-11 rounded-xl focus:ring-primary/50"
                                            value={menuSearch}
                                            onChange={(e) => setMenuSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex bg-white/[0.05] p-1 rounded-xl border border-white/[0.05] shrink-0">
                                        {(['restaurant', 'cafe', 'bar', 'hotel'] as const).map((unit) => (
                                            <button
                                                key={unit}
                                                onClick={() => setSelectedBusinessUnit(unit)}
                                                className={cn(
                                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                                    selectedBusinessUnit === unit
                                                        ? "bg-white/[0.12] text-white shadow-xl ring-1 ring-white/10"
                                                        : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
                                                )}
                                            >
                                                {unit}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                                                selectedCategory === cat
                                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                                            )}
                                        >
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Menu Items Grid - POS Pill Style */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {filteredMenuItems.map(item => {
                                        const qtyInCart = (editingOrder ? editingOrder.items : currentCart).find(i => i.menuItemId === item.id)?.quantity || 0;
                                        return (
                                            <motion.div
                                                key={item.id}
                                                id={`menu-item-${item.id}`}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                onClick={(e) => addToCart(item, e)}
                                                className={cn(
                                                    "relative overflow-hidden bg-white/[0.03] rounded-full pl-5 pr-3 py-2.5 border transition-all duration-300 group cursor-pointer active:scale-[0.97] flex items-center gap-3",
                                                    qtyInCart > 0
                                                        ? "border-primary/50 bg-white/[0.1] shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                                                        : "border-white/[0.06] hover:border-primary/30 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.08)]"
                                                )}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-white text-[11px] leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                                        {item.name}
                                                    </h4>
                                                    <span className="font-bold text-white/30 text-[9px] tracking-wide mt-0.5 block">₹{item.price}</span>
                                                </div>
                                                {qtyInCart > 0 ? (
                                                    <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center font-black text-[10px] shadow-lg shadow-primary/20">
                                                        {qtyInCart}
                                                    </div>
                                                ) : (
                                                    <div className="h-7 w-7 rounded-full bg-white/[0.05] text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Order Summary (35%) */}
                        <div data-fly-target className="lg:w-[35%] flex flex-col bg-black/40 border border-white/10 rounded-3xl overflow-hidden min-h-0">
                            <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0">
                                <h4 className="text-sm font-bold text-white tracking-tight">
                                    {editingOrder ? "Amending Order" : "Dine-in Order"}
                                </h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsTablesExpanded(!isTablesExpanded)}
                                        className={cn("p-1.5 rounded-lg transition-all", isTablesExpanded ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40")}
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setIsCustomerExpanded(!isCustomerExpanded)}
                                        className={cn("p-1.5 rounded-lg transition-all", isCustomerExpanded ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40")}
                                    >
                                        <User className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {/* Table Selector */}
                                <AnimatePresence>
                                    {isTablesExpanded && !editingOrder && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mb-6 overflow-hidden"
                                        >
                                            <div className="flex items-center gap-2 mb-3 text-white/40">
                                                <LayoutGrid className="h-3 w-3" />
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Select Table</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {tables.filter(t => t.businessUnit === selectedBusinessUnit).map(table => (
                                                    <button
                                                        key={table.id}
                                                        onClick={() => (table.status === 'available' || selectedTableId === table.id) && setSelectedTableId(table.id)}
                                                        className={cn(
                                                            "aspect-square rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center",
                                                            selectedTableId === table.id
                                                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                                : table.status === 'available'
                                                                    ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                                                    : "bg-red-500/10 border-red-500/20 text-red-400 opacity-40 cursor-not-allowed"
                                                        )}
                                                    >
                                                        {table.tableNumber}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Customer & Adjustments */}
                                <AnimatePresence>
                                    {isCustomerExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mb-6 overflow-hidden space-y-4"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-white/40">
                                                    <User className="h-3 w-3" />
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Customer Details</span>
                                                </div>
                                                <div className="p-1.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                                                    <CustomerAutocomplete
                                                        onCustomerSelect={setSelectedCustomer}
                                                        onNameChange={setManualCustomerName}
                                                        onMobileChange={setManualCustomerMobile}
                                                        initialName={manualCustomerName}
                                                        initialMobile={manualCustomerMobile}
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-2 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                                                <DiscountPanel
                                                    customerId={selectedCustomer?.mobileNumber}
                                                    discountPercent={discountPercent}
                                                    onDiscountChange={setDiscountPercent}
                                                    subtotal={totals.subtotal}
                                                    compact={true}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Cart Items */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-3 text-white/40">
                                        <ShoppingCart className="h-3 w-3" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Items ({(editingOrder ? editingOrder.items : currentCart).length})</span>
                                    </div>
                                    <AnimatePresence mode="popLayout">
                                        {(editingOrder ? editingOrder.items : currentCart).map(item => (
                                            <motion.div
                                                key={item.menuItemId}
                                                data-cart-item-id={item.menuItemId}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex justify-between items-center p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.03] group hover:bg-white/[0.06] transition-all"
                                            >
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <div className="font-bold text-[11px] text-white truncate tracking-tight">{item.name}</div>
                                                    <div className="text-[9px] text-white/30 mt-0.5 font-medium">₹{item.price} each</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center bg-white/[0.05] rounded-lg border border-white/[0.05] p-0.5">
                                                        <button
                                                            onClick={() => editingOrder ? updateQuantity(item.menuItemId, -1) : removeFromCart(item.menuItemId)}
                                                            className="p-1 hover:bg-white/10 rounded-md text-white/40 transition-all"
                                                        >
                                                            <Minus className="h-2.5 w-2.5" />
                                                        </button>
                                                        <span className="text-[11px] font-black text-white w-6 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => editingOrder ? updateQuantity(item.menuItemId, 1) : addToCart(menuItems.find(m => m.id === item.menuItemId)!)}
                                                            className="p-1 hover:bg-white/10 rounded-md text-primary transition-all"
                                                        >
                                                            <Plus className="h-2.5 w-2.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {(editingOrder ? editingOrder.items : currentCart).length === 0 && (
                                        <div className="text-center py-8 text-white/10 text-[10px] font-black uppercase tracking-widest border border-dashed border-white/5 rounded-2xl italic">Cart Empty</div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="shrink-0 bg-[#0a0a0a]/60 backdrop-blur-2xl border-t border-white/[0.08] p-4 space-y-3">
                                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3 space-y-2">
                                    <div className="flex justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                                        <span>Subtotal</span>
                                        <span>₹{totals.subtotal}</span>
                                    </div>
                                    {totals.discountAmount > 0 && (
                                        <div className="flex justify-between text-[10px] text-primary font-bold uppercase tracking-wider">
                                            <span>Discount</span>
                                            <span>-₹{totals.discountAmount}</span>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                                        <span className="text-[8px] text-white/40 font-black uppercase tracking-[0.2em]">Total</span>
                                        <span className="text-xl font-black text-white tracking-tighter">₹{Math.round(totals.total)}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={editingOrder ? saveAmendment : submitNewOrder}
                                    disabled={loading || (editingOrder ? editingOrder.items : currentCart).length === 0 || (!editingOrder && !selectedTableId)}
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all shadow-xl shadow-primary/10"
                                >
                                    {editingOrder ? (
                                        <><Save className="w-4 h-4 mr-2" /> Update Order</>
                                    ) : (
                                        <><ArrowRight className="w-4 h-4 mr-2" /> Fire to Kitchen</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="ready">
                    {/* Audio Test Panel */}
                    <div className="mb-6 p-4 rounded-3xl bg-white/5 border border-white/10 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 text-white/50 text-sm font-medium mr-auto">
                            <div className="p-2 rounded-full bg-white/5">
                                <Volume2 className="w-4 h-4" />
                            </div>
                            <span>Test Audio Alerts</span>
                        </div>
                        <Button variant="secondary" size="sm" onClick={testItemReady} className="bg-white/10 hover:bg-white/20 text-white border-0">
                            Item Ready
                        </Button>
                        <Button variant="secondary" size="sm" onClick={testOrderReady} className="bg-white/10 hover:bg-white/20 text-white border-0">
                            Order Ready
                        </Button>
                        <Button variant="secondary" size="sm" onClick={testReminder} className="bg-white/10 hover:bg-white/20 text-white border-0">
                            Reminder
                        </Button>
                    </div>

                    {readyOrders.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-white/10">
                            <CheckCircle2 className="w-24 h-24 mb-4 stroke-[1px]" />
                            <p className="text-2xl font-bold italic">All Desks Clear</p>
                            <p className="text-sm opacity-50">No orders awaiting delivery.</p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {readyOrders.map((order, idx) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="premium-glass p-8 border-l-8 border-l-green-500 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col gap-6"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-3xl font-black flex items-center gap-2">
                                                {order.roomNumber ? `RM ${order.roomNumber}` : `TBL ${order.tableNumber || 'N/A'}`}
                                            </h3>
                                            <p className="text-xs text-white/30 tracking-widest uppercase mt-1">#{order.orderNumber}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px] font-bold">READY</Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-full"
                                                onClick={() => handleSingleDelete(order.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        <p className="text-xs text-white/40 uppercase mb-2">Checklist:</p>
                                        {order.items.map((item, i) => (
                                            <div key={i} className={cn(
                                                "flex justify-between items-center p-3 rounded-xl border transition-all",
                                                item.status === 'prepared'
                                                    ? "bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                                    : "border-transparent border-b-white/5 pb-2 last:border-0"
                                            )}>
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "text-white/90 font-medium flex items-center gap-2",
                                                        item.status === 'served' && "line-through opacity-40"
                                                    )}>
                                                        <span className="text-primary font-black">{item.quantity}x</span>
                                                        {item.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={cn(
                                                            "text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded",
                                                            item.status === 'prepared' ? "bg-green-500 text-black" : "text-white/30 bg-white/5"
                                                        )}>
                                                            {item.status || 'pending'}
                                                        </span>
                                                        {item.status === 'prepared' && (
                                                            <span className="text-[9px] text-green-400 font-bold animate-pulse">
                                                                • PICK UP NOW
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {item.status === 'prepared' && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 bg-green-500 hover:bg-green-600 text-white border-0 font-bold shadow-lg shadow-green-500/20"
                                                        onClick={() => handleItemStatusUpdate(order.id, item.menuItemId || (item as any).id, 'served')}
                                                    >
                                                        SERVE
                                                    </Button>
                                                )}
                                                {item.status === 'served' && (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500/50" />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <Button
                                            onClick={() => markAsServed(order.id)}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white font-black h-14 rounded-2xl shadow-lg border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all"
                                        >
                                            MARK SERVED
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="track">
                    <PremiumLiquidGlass>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Order Pipeline</h3>
                            <div className="text-xs text-white/30 font-mono">Active: {progressingOrders.length}</div>
                        </div>
                        <div className="relative mb-8">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                            <Input
                                placeholder="Filter by Tablet, Room, or ID..."
                                className="pl-12 bg-white/5 border-white/10 h-14 rounded-2xl text-lg"
                                value={orderSearch}
                                onChange={(e) => setOrderSearch(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4">
                            {progressingOrders
                                .filter(o =>
                                    o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                                    o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                                    (o.tableNumber && o.tableNumber.includes(orderSearch))
                                )
                                .map((order, idx) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner",
                                                order.status === 'pending' ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                                            )}>
                                                {order.tableNumber || 'S'}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-xl text-white/90">{order.customerName}</h4>
                                                <div className="flex items-center gap-3 text-sm text-white/30">
                                                    <span>#{order.orderNumber}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(order.createdAt))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xl font-black text-primary">₹{order.totalAmount}</p>
                                                <Badge variant="outline" className={cn(
                                                    "text-[8px] font-black tracking-widest",
                                                    order.status === 'pending' ? "text-red-400 border-red-400/20" :
                                                        order.status === 'ready' ? "text-green-400 border-green-400/20" :
                                                            order.status === 'bill_requested' ? "text-amber-400 border-amber-400/20" :
                                                                order.status === 'served' ? "bg-white/10 text-white/40 border-white/10" :
                                                                    order.status === 'completed' ? "bg-green-500/10 text-green-500/50 border-green-500/20" :
                                                                        "text-blue-400 border-blue-400/20"
                                                )}>
                                                    {(order.status === 'bill_requested' ? 'BILL ASKED' : order.status).toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-2">
                                                {order.status !== 'bill_requested' && (
                                                    <Button
                                                        onClick={() => requestBill(order)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-12 px-4 rounded-2xl border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider hidden md:flex items-center gap-2"
                                                    >
                                                        <Receipt className="w-4 h-4" /> Ask Bill
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => handleEditOrder(order)}
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 text-primary hover:bg-primary hover:text-white transition-all active:scale-90"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleSingleDelete(order.id)}
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                                    disabled={deletingOrderId === order.id}
                                                >
                                                    {deletingOrderId === order.id ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                            {progressingOrders.length === 0 && (
                                <div className="text-center py-20 text-white/10 italic">
                                    No active orders found in the pipeline.
                                </div>
                            )}
                        </div>
                    </PremiumLiquidGlass>
                </TabsContent>

                <TabsContent value="history">
                    <PremiumLiquidGlass>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Order History</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleClearHistory}
                                disabled={historyOrders.length === 0 || loading}
                                className="border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all font-bold"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear History
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {historyOrders.map((order, idx) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group opacity-75 hover:opacity-100"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner bg-white/5 text-white/40">
                                            {order.tableNumber || (order.roomNumber ? 'R' : 'T')}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xl text-white/90">{order.customerName}</h4>
                                            <div className="flex items-center gap-3 text-sm text-white/30">
                                                <span>#{order.orderNumber}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(order.createdAt))} ago
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xl font-black text-white/60">₹{order.totalAmount}</p>
                                            <Badge variant="outline" className={cn(
                                                "text-[8px] font-black tracking-widest",
                                                order.status === 'bill_requested' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                    order.status === 'served' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                        "bg-white/10 text-white/40 border-white/10"
                                            )}>
                                                {order.status === 'bill_requested' ? 'BILL REQUESTED' : order.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {historyOrders.length === 0 && (
                                <div className="text-center py-20 text-white/10 italic">
                                    No history available.
                                </div>
                            )}
                        </div>
                    </PremiumLiquidGlass>
                </TabsContent>
            </Tabs >

            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handlePasswordSuccess}
                title="Delete Order"
                description="Are you sure you want to delete this order? This action cannot be undone."
            />
        </div >
    );
}
