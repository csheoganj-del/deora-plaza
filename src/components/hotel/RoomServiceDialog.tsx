"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, AlertCircle, X, Coffee, Wine, Hotel as HotelIcon, Search } from "lucide-react";
import { playBeep, showToast } from "@/lib/utils";
import { getMenuItems } from "@/actions/menu";
import { createOrder, linkOrderToBooking } from "@/actions/orders";
import { getActiveBookingForRoom } from "@/actions/hotel";
import { PremiumLiquidGlass } from "@/components/ui/glass/premium-liquid-glass";

type MenuItem = {
    id: string;
    name: string;
    price: number;
    category: string;
    businessUnit?: string;
    description: string | null;
    isAvailable: boolean;
};

type Room = {
    id?: string;
    number: string;
};

interface RoomServiceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room | null;
}

export default function RoomServiceDialog({
    isOpen,
    onClose,
    room,
}: RoomServiceDialogProps) {
    const [query, setQuery] = useState("");
    const [selectedUnit, setSelectedUnit] = useState<"all" | "cafe" | "bar" | "hotel">("all");
    const [cart, setCart] = useState<{ [key: string]: { item: MenuItem; qty: number } }>({});

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeBooking, setActiveBooking] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch initial data when dialog opens
    useEffect(() => {
        if (isOpen && room) {
            setIsLoading(true);
            setError(null);
            setCart({});

            Promise.all([
                getMenuItems(),
                getActiveBookingForRoom(room.id || "", room.number),
            ])
                .then(([rawItems, booking]) => {
                    // Filter for available items from cafe, bar, and hotel
                    const availableItems = rawItems.filter(
                        (item: MenuItem) =>
                            item.isAvailable &&
                            ["cafe", "bar", "hotel"].includes(item.businessUnit || "")
                    );

                    setMenuItems(availableItems);
                    setActiveBooking(booking);

                    if (!booking) {
                        setError("No active booking found for this room. Cannot place order.");
                    }

                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("Failed to load room service data:", err);
                    setError("Failed to load menu or booking data.");
                    setIsLoading(false);
                });
        }
    }, [isOpen, room]);

    // Filtered menu based on search and business unit
    const filteredMenu = useMemo(() => {
        const q = query.trim().toLowerCase();
        return menuItems.filter((m) => {
            // Filter by business unit
            if (selectedUnit !== "all" && m.businessUnit !== selectedUnit) return false;

            // Filter by search query
            if (!q) return true;
            return (
                m.name.toLowerCase().includes(q) ||
                (m.category || "").toLowerCase().includes(q)
            );
        });
    }, [menuItems, query, selectedUnit]);

    // Cart handlers
    const addItem = (item: MenuItem) => {
        setCart((prev) => {
            const prevEntry = prev[item.id];
            const qty = prevEntry ? prevEntry.qty + 1 : 1;
            return { ...prev, [item.id]: { item, qty } };
        });
    };

    const incQty = (id: string) => {
        setCart((prev) => {
            const entry = prev[id];
            if (!entry) return prev;
            return { ...prev, [id]: { ...entry, qty: entry.qty + 1 } };
        });
    };

    const decQty = (id: string) => {
        setCart((prev) => {
            const entry = prev[id];
            if (!entry) return prev;
            const newQty = entry.qty - 1;
            if (newQty <= 0) {
                const { [id]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [id]: { ...entry, qty: newQty } };
        });
    };

    const clearCart = () => setCart({});

    // Totals
    const { subtotal, tax, total } = useMemo(() => {
        let sub = 0;
        let t = 0;

        Object.values(cart).forEach((entry) => {
            const itemTotal = entry.item.price * entry.qty;
            sub += itemTotal;

            // Calculate tax for Cafe items (5%)
            if (entry.item.businessUnit === 'cafe') {
                t += itemTotal * 0.05;
            }
        });

        return {
            subtotal: sub,
            tax: t,
            total: sub + t
        };
    }, [cart]);

    // Group cart items by business unit for order creation
    const handleSubmitOrder = async () => {
        console.log("=== ROOM SERVICE ORDER SUBMISSION STARTED ===");
        console.log("Room:", room);
        console.log("Active Booking:", activeBooking);
        console.log("Cart:", cart);
        console.log("Cart keys length:", Object.keys(cart).length);

        if (!room || !activeBooking || Object.keys(cart).length === 0) {
            const errorMsg = "Cannot place an empty order or no active booking found.";
            console.error("VALIDATION FAILED:", {
                hasRoom: !!room,
                hasActiveBooking: !!activeBooking,
                cartLength: Object.keys(cart).length
            });
            setError(errorMsg);
            showToast(errorMsg, "error");
            playBeep(500, 160);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const cartItems = Object.values(cart);
            console.log("Cart items:", cartItems);

            // Group by business unit
            const cafeItems = cartItems.filter((e) => e.item.businessUnit === "cafe");
            const barItems = cartItems.filter((e) => e.item.businessUnit === "bar");
            const hotelItems = cartItems.filter((e) => e.item.businessUnit === "hotel");

            console.log("Grouped items:", {
                cafe: cafeItems.length,
                bar: barItems.length,
                hotel: hotelItems.length
            });

            const orderIds: string[] = [];

            // Create separate orders for each business unit
            if (cafeItems.length > 0) {
                console.log("Creating cafe order...");
                const payload = cafeItems.map((e) => ({
                    menuItemId: e.item.id,
                    name: e.item.name,
                    quantity: e.qty,
                    price: e.item.price,
                }));

                console.log("Cafe payload:", payload);
                const result = await createOrder({
                    businessUnit: "cafe",
                    roomNumber: room.number,
                    source: "room-service",
                    type: "room-service",
                    items: payload,
                });

                console.log("Cafe order result:", result);
                if (result.success && result.orderId) {
                    orderIds.push(result.orderId);
                } else {
                    console.error("Cafe order failed:", result.error);
                }
            }

            if (barItems.length > 0) {
                console.log("Creating bar order...");
                const payload = barItems.map((e) => ({
                    menuItemId: e.item.id,
                    name: e.item.name,
                    quantity: e.qty,
                    price: e.item.price,
                }));

                console.log("Bar payload:", payload);
                const result = await createOrder({
                    businessUnit: "bar",
                    roomNumber: room.number,
                    source: "room-service",
                    type: "room-service",
                    items: payload,
                });

                console.log("Bar order result:", result);
                if (result.success && result.orderId) {
                    orderIds.push(result.orderId);
                } else {
                    console.error("Bar order failed:", result.error);
                }
            }

            if (hotelItems.length > 0) {
                console.log("Creating hotel order...");
                const payload = hotelItems.map((e) => ({
                    menuItemId: e.item.id,
                    name: e.item.name,
                    quantity: e.qty,
                    price: e.item.price,
                }));

                console.log("Hotel payload:", payload);
                const result = await createOrder({
                    businessUnit: "hotel",
                    roomNumber: room.number,
                    source: "room-service",
                    type: "room-service",
                    items: payload,
                });

                console.log("Hotel order result:", result);
                if (result.success && result.orderId) {
                    orderIds.push(result.orderId);
                } else {
                    console.error("Hotel order failed:", result.error);
                }
            }

            console.log("All order IDs:", orderIds);

            // Link all orders to booking
            for (const orderId of orderIds) {
                console.log(`Linking order ${orderId} to booking ${activeBooking.id}`);
                await linkOrderToBooking(orderId, activeBooking.id, room.number);
            }

            if (orderIds.length > 0) {
                console.log("✅ Orders created successfully!");
                playBeep(1000, 160);
                showToast(
                    `Room service order for Room ${room.number} placed successfully`,
                    "success"
                );
                clearCart();
                onClose?.();
            } else {
                console.error("❌ No orders were created");
                setError("Failed to create orders. Please try again.");
                showToast("Failed to create orders", "error");
                playBeep(500, 160);
            }
        } catch (error) {
            console.error("❌ Order submission error:", error);
            console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
            setError("An unexpected error occurred.");
            showToast("An unexpected error occurred", "error");
            playBeep(500, 160);
        } finally {
            setIsSubmitting(false);
            console.log("=== ROOM SERVICE ORDER SUBMISSION ENDED ===");
        }
    };

    if (!isOpen) return null;

    const unitTabs = [
        { id: "all" as const, label: "All", icon: null },
        { id: "cafe" as const, label: "Food", icon: Coffee },
        { id: "bar" as const, label: "Drinks", icon: Wine },
        { id: "hotel" as const, label: "Hotel", icon: HotelIcon },
    ];

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm pointer-events-auto"
            role="dialog"
            aria-modal="true"
        >
            <PremiumLiquidGlass
                variant="container"
                className="w-full max-w-6xl max-h-[80vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-white">Room Service</h3>
                        <span className="text-sm text-white/60">
                            Room: <span className="font-medium text-white">{room?.number}</span>
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            clearCart();
                            onClose?.();
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-white/80" />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Body */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Left: Menu */}
                    <div className="w-full md:w-[70%] border-r border-white/10 flex flex-col min-h-0">
                        <div className="p-4 space-y-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search menu items..."
                                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            {/* Business Unit Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {unitTabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setSelectedUnit(tab.id)}
                                            className={`flex items-center gap-2 text-xs whitespace-nowrap px-4 py-2 rounded-lg border transition-colors ${selectedUnit === tab.id
                                                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                                }`}
                                        >
                                            {Icon && <Icon className="w-3.5 h-3.5" />}
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center p-10 text-sm text-white/60">
                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    Loading menu...
                                </div>
                            ) : filteredMenu.length === 0 ? (
                                <div className="p-4 text-sm text-center text-white/60">
                                    No items found.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredMenu.map((item) => {
                                        const inCart = cart[item.id]?.qty || 0;
                                        const unitColor =
                                            item.businessUnit === "cafe"
                                                ? "text-amber-400"
                                                : item.businessUnit === "bar"
                                                    ? "text-purple-400"
                                                    : "text-blue-400";

                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-medium text-white truncate">
                                                            {item.name}
                                                        </div>
                                                        <span className={`text-xs ${unitColor}`}>
                                                            {item.businessUnit}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-white/50 mt-0.5">
                                                        ₹{Number(item.price).toFixed(2)}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-3">
                                                    {inCart > 0 && (
                                                        <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                                                            <button
                                                                onClick={() => decQty(item.id)}
                                                                className="px-1 text-white/70 hover:text-white"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="px-2 font-medium text-white text-sm">
                                                                {inCart}
                                                            </span>
                                                            <button
                                                                onClick={() => incQty(item.id)}
                                                                className="px-1 text-white/70 hover:text-white"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => addItem(item)}
                                                        className="text-sm px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Cart */}
                    <div className="w-full md:w-[30%] p-4 flex flex-col min-h-0">
                        <h4 className="text-sm font-semibold text-white mb-3 flex-shrink-0">Your Order</h4>

                        <div className="max-h-[400px] overflow-y-auto space-y-2 mb-4 min-h-0">
                            {Object.keys(cart).length === 0 ? (
                                <div className="text-sm text-center text-white/60 py-6">
                                    No items in cart
                                </div>
                            ) : (
                                Object.values(cart).map(({ item, qty }) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-medium text-white text-sm">
                                                {item.name}
                                            </div>
                                            <div className="text-xs text-white/50">
                                                ₹{Number(item.price).toFixed(2)} × {qty}
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-white ml-3">
                                            ₹{(item.price * qty).toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-white/10 pt-4 space-y-3 flex-shrink-0">
                            <div className="space-y-1 mb-2">
                                <div className="flex items-center justify-between text-white/60 text-sm">
                                    <div>Subtotal</div>
                                    <div>₹{subtotal.toFixed(2)}</div>
                                </div>
                                {tax > 0 && (
                                    <div className="flex items-center justify-between text-white/60 text-sm">
                                        <div>GST (5%)</div>
                                        <div>₹{tax.toFixed(2)}</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-lg border-t border-white/10 pt-2">
                                <div className="text-white font-semibold">Total</div>
                                <div className="font-bold text-white">
                                    ₹{total.toFixed(2)}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSubmitOrder}
                                    disabled={Object.keys(cart).length === 0 || isSubmitting || !activeBooking}
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${Object.keys(cart).length === 0 || isSubmitting || !activeBooking
                                        ? "bg-white/10 text-white/40 cursor-not-allowed"
                                        : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                                            Placing...
                                        </>
                                    ) : (
                                        "Place Order"
                                    )}
                                </button>
                                <button
                                    onClick={clearCart}
                                    className="px-4 py-2.5 text-sm rounded-lg border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </PremiumLiquidGlass>
        </div>,
        document.body
    );
}
