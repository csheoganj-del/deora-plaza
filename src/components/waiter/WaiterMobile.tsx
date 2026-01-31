"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Plus,
    Minus,
    ShoppingCart,
    Search,
    ArrowLeft,
    Check,
    Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { getMenuItems } from "@/actions/menu";
import { getTables } from "@/actions/tables";
import { createOrder, getOrders, updateOrderItems, updateOrderStatus } from "@/actions/orders";
import { cn } from "@/lib/utils";

interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: string;
    isAvailable: boolean;
}

interface CartItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
}

interface Table {
    id: string;
    tableNumber: string;
    status: string;
}

export default function WaiterMobile() {
    const queryClient = useQueryClient();
    const [selectedTableId, setSelectedTableId] = useState("");
    const [selectedTableNumber, setSelectedTableNumber] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"menu" | "cart">("menu");

    // React Query - instant loading!
    const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
        queryKey: ["menu", "all"],
        queryFn: async () => {
            console.log("[WaiterMobile] Fetching menu items...");
            const items = await getMenuItems();
            console.log("[WaiterMobile] Menu items fetched:", items?.length);
            return items || [];
        },
        staleTime: Infinity, // Menu rarely changes
    });

    const { data: tables = [], isLoading: tablesLoading } = useQuery<Table[]>({
        queryKey: ["tables", "cafe"], // Changed from 'all' to 'cafe'
        queryFn: async () => {
            console.log("[WaiterMobile] Fetching tables...");
            const cafeTables = await getTables("cafe"); // Fetch only cafe tables
            console.log("[WaiterMobile] Tables fetched:", cafeTables?.length, cafeTables);
            return cafeTables || [];
        },
    });

    const { data: activeOrders = [] } = useQuery<any[]>({
        queryKey: ["orders", "cafe-active"],
        queryFn: async () => {
            const orders = await getOrders("cafe");
            return orders.filter((o: any) => ['pending', 'preparing', 'ready', 'served'].includes(o.status));
        }
    });

    // Mutation for creating orders
    const createOrderMutation = useMutation({
        mutationFn: (orderData: any) => createOrder(orderData),
        onSuccess: () => {
            toast.success("Order sent to kitchen!");
            setCart([]);
            setSelectedTableId("");
            setSelectedTableNumber("");
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: () => {
            toast.error("Failed to create order");
        },
    });

    // Filtered menu
    const filteredMenu = useMemo(() => {
        return menuItems.filter(
            (item) =>
                item.isAvailable &&
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [menuItems, searchQuery]);

    // Cart total
    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [cart]);

    const addToCart = (item: MenuItem) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.menuItemId === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.menuItemId === item.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [
                ...prev,
                {
                    menuItemId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: 1,
                },
            ];
        });
    };

    const updateQuantity = (menuItemId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) =>
                    item.menuItemId === menuItemId
                        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const updateOrderMutation = useMutation({
        mutationFn: (data: { orderId: string; items: any[]; total: number }) => updateOrderItems(data.orderId, data.items, data.total),
        onSuccess: () => {
            toast.success("Order updated successfully!");
            setCart([]);
            setSelectedTableId("");
            setSelectedTableNumber("");
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["tables"] });
        },
        onError: () => {
            toast.error("Failed to update order");
        }
    });

    const requestBillMutation = useMutation({
        mutationFn: (orderId: string) => updateOrderStatus(orderId, "bill_requested"),
        onSuccess: () => {
            toast.success("Bill requested!");
            setSelectedTableId("");
            setSelectedTableNumber("");
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["tables"] });
        },
        onError: () => {
            toast.error("Failed to request bill");
        }
    });

    const submitOrder = () => {
        if (!selectedTableId) {
            toast.error("Please select a table");
            return;
        }
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }

        // Check if updating an existing order
        const existingOrder = activeOrders.find(o => o.tableId === selectedTableId && ['pending', 'preparing', 'ready', 'served'].includes(o.status));

        if (existingOrder) {
            // Merge existing items with new cart items
            const newItems = cart.map(item => ({
                menuItemId: item.menuItemId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                status: 'pending', // New items start as pending
                category: menuItems.find(m => m.id === item.menuItemId)?.category || 'other'
            }));

            // We need to keep existing items and append new ones
            // Actually, updateOrderItems expects the FULL list of items usually, checking implementation...
            // Looking at standard patterns, usually we append. 
            // Let's check updateOrderItems implementation in actions/orders.ts
            // specific implementation: actions/orders.ts: updateOrderItems takes (orderId, items, total)
            // It replaces the items list. So we must merge.

            const existingItemsParsed = typeof existingOrder.items === 'string' ? JSON.parse(existingOrder.items) : existingOrder.items;
            const mergedItems = [...existingItemsParsed, ...newItems];

            // Calculate new total
            const newTotal = mergedItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

            updateOrderMutation.mutate({
                orderId: existingOrder.id,
                items: mergedItems,
                total: newTotal
            });
        } else {
            // Create New Order
            createOrderMutation.mutate({
                tableId: selectedTableId,
                tableNumber: selectedTableNumber,
                items: cart,
                type: "dine-in",
                businessUnit: "cafe", // Default to cafe for waiter orders
            });
        }
    };

    const handleRequestBill = () => {
        const existingOrder = activeOrders.find(o => o.tableId === selectedTableId && ['pending', 'preparing', 'ready', 'served'].includes(o.status));
        if (existingOrder) {
            requestBillMutation.mutate(existingOrder.id);
        }
    };

    // Table Selection Screen
    if (!selectedTableId) {
        return (
            <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">Select Table</h1>
                    <p className="text-white/60 text-sm">Choose a table to start order</p>
                </div>

                {tablesLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-white/60">Loading tables...</div>
                    </div>
                ) : tables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="text-white/60 text-center">
                            <p className="mb-2">No tables found</p>
                            <p className="text-sm">Please add tables in the admin panel</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {tables.map((table) => (
                            <button
                                key={table.id}
                                onClick={() => {
                                    setSelectedTableId(table.id);
                                    setSelectedTableNumber(table.tableNumber);
                                }}
                                className={cn(
                                    "p-6 rounded-2xl border-2 transition-all active:scale-95",
                                    table.status === "available"
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                )}
                            >
                                <div className="text-3xl font-bold">{table.tableNumber}</div>
                                <div className="text-xs mt-1 capitalize">{table.status}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Order Screen (Menu + Cart)
    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => {
                            setSelectedTableId("");
                            setSelectedTableNumber("");
                            setCart([]);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="text-center">
                        <div className="text-white font-bold">Table {selectedTableNumber}</div>
                        <div className="text-white/60 text-xs">
                            {activeOrders.find(o => o.tableId === selectedTableId && ['pending', 'preparing', 'ready', 'served'].includes(o.status))
                                ? "Update Order"
                                : "New Order"}
                        </div>
                    </div>
                    <button
                        onClick={handleRequestBill}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            activeOrders.find(o => o.tableId === selectedTableId && ['pending', 'preparing', 'ready', 'served'].includes(o.status))
                                ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                                : "opacity-0 pointer-events-none"
                        )}
                        disabled={!activeOrders.find(o => o.tableId === selectedTableId && ['pending', 'preparing', 'ready', 'served'].includes(o.status))}
                    >
                        <Receipt className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                <TabsList className="w-full bg-white/5 p-1 rounded-none">
                    <TabsTrigger value="menu" className="flex-1 rounded-lg data-[state=active]:bg-primary">
                        Menu
                    </TabsTrigger>
                    <TabsTrigger value="cart" className="flex-1 rounded-lg data-[state=active]:bg-primary relative">
                        Cart
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Menu Tab */}
                <TabsContent value="menu" className="flex-1 overflow-y-auto p-4 mt-0">
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <Input
                                placeholder="Search menu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {filteredMenu.map((item) => {
                            const inCart = cart.find((i) => i.menuItemId === item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all active:scale-95 text-left",
                                        inCart
                                            ? "bg-primary/20 border-primary/50"
                                            : "bg-white/5 border-white/10"
                                    )}
                                >
                                    <div className="font-bold text-white text-sm leading-tight mb-2">
                                        {item.name}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/80 font-semibold">₹{item.price}</span>
                                        {inCart && (
                                            <Badge className="bg-primary text-white">
                                                {inCart.quantity}
                                            </Badge>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* Cart Tab */}
                <TabsContent value="cart" className="flex-1 overflow-y-auto p-4 mt-0">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/40">
                            <ShoppingCart className="w-16 h-16 mb-4" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map((item) => (
                                <div
                                    key={item.menuItemId}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="font-bold text-white">{item.name}</div>
                                            <div className="text-white/60 text-sm">₹{item.price}</div>
                                        </div>
                                        <div className="text-white font-bold">
                                            ₹{item.price * item.quantity}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateQuantity(item.menuItemId, -1)}
                                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
                                        >
                                            <Minus className="w-4 h-4 text-white" />
                                        </button>
                                        <div className="flex-1 text-center text-white font-bold">
                                            {item.quantity}
                                        </div>
                                        <button
                                            onClick={() => updateQuantity(item.menuItemId, 1)}
                                            className="w-10 h-10 rounded-full bg-primary hover:bg-primary/80 flex items-center justify-center transition-colors active:scale-95"
                                        >
                                            <Plus className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Floating Action Button */}
            {cart.length > 0 && (
                <div className="p-4 border-t border-white/10 bg-slate-900/95 backdrop-blur">
                    <Button
                        onClick={submitOrder}
                        disabled={createOrderMutation.isPending}
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl active:scale-95 transition-transform"
                    >
                        <Check className="w-5 h-5 mr-2" />
                        {activeOrders.find(o => o.tableId === selectedTableId && ['pending', 'preparing', 'ready', 'served'].includes(o.status))
                            ? "Add to Order"
                            : "Submit Order"} • ₹{cartTotal}
                    </Button>
                </div>
            )}
        </div>
    );
}
