"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Loader2, AlertCircle, ShoppingCart } from "lucide-react";
import { playBeep, showToast } from "@/lib/utils";
import { getMenuItems } from "@/actions/menu";
import { createOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Type Definitions
type MenuItem = {
    id: string;
    name: string;
    price: number;
    category: string;
    description: string | null;
    isAvailable: boolean;
};

interface BarKitchenOrderDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BarKitchenOrderDialog({
    isOpen,
    onClose,
}: BarKitchenOrderDialogProps) {
    const [query, setQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [cart, setCart] = useState<{ [key: string]: { item: MenuItem; qty: number } }>({});
    const [tableIdentifier, setTableIdentifier] = useState("");

    // State for data fetching and submission
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch initial data when the dialog opens
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setError(null);
            setCart({});
            setTableIdentifier("");

            getMenuItems()
                .then((rawItems) => {
                    // Filter for available items
                    const availableItems = rawItems.filter((item: MenuItem) => item.isAvailable);
                    setMenuItems(availableItems);
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("Failed to load menu data:", err);
                    setError("Failed to load menu data.");
                    setIsLoading(false);
                });
        }
    }, [isOpen]);

    // Derive categories
    const categories = useMemo(() => {
        const set = new Set<string>();
        menuItems.forEach((m) => {
            if (m.category) set.add(m.category);
        });
        return ["ALL", ...Array.from(set)];
    }, [menuItems]);

    // Filter menu
    const filteredMenu = useMemo(() => {
        const q = query.trim().toLowerCase();
        return menuItems.filter((m) => {
            if (selectedCategory !== "ALL" && m.category !== selectedCategory) return false;
            if (!q) return true;
            return (
                m.name.toLowerCase().includes(q) ||
                (m.category || "").toLowerCase().includes(q)
            );
        });
    }, [menuItems, query, selectedCategory]);

    // Cart Handlers
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
    const subtotal = useMemo(() => {
        return Object.values(cart).reduce((s, e) => s + e.item.price * e.qty, 0);
    }, [cart]);

    // Submission
    const handleSubmitOrder = async () => {
        if (Object.keys(cart).length === 0) {
            setError("Cart is empty.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const orderItemsPayload = Object.values(cart).map((e) => ({
            menuItemId: e.item.id,
            name: e.item.name,
            quantity: e.qty,
            price: e.item.price,
        }));

        const tableNum = tableIdentifier.trim() || "Counter (Bar)";

        try {
            const result = await createOrder({
                businessUnit: "bar", // Mark as Bar unit
                type: "dine-in",     // Treat as internal dine-in for tracking
                source: "bar-kitchen",
                tableNumber: tableNum,
                customerName: "Bar Guest", // or generic
                items: orderItemsPayload,
            });

            if (result.success) {
                playBeep(1000, 160);
                showToast(`Kitchen order placed for ${tableNum}`, "success");
                clearCart();
                onClose();
            } else {
                setError(typeof result.error === 'string' ? result.error : "Failed to create order");
                showToast("Failed to create order", "error");
            }
        } catch (error) {
            console.error("Submission error:", error);
            setError("Unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" /> Bar to Kitchen Order
                        </h2>
                        <p className="text-sm text-slate-500">Order food for bar guests. Charges will be added to Settlements.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">Close</button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm flex items-center gap-2 px-6">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                )}

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Menu */}
                    <div className="flex-1 flex flex-col border-r bg-white">
                        {/* Search & Filter */}
                        <div className="p-4 border-b space-y-3">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search food..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${selectedCategory === cat
                                                ? "bg-slate-900 text-white"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Items Grid */}
                        <div className="flex-1 overflow-y-auto p-4 content-start">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                </div>
                            ) : filteredMenu.length === 0 ? (
                                <div className="text-center text-slate-400 py-10">No items found</div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredMenu.map(item => {
                                        const qty = cart[item.id]?.qty || 0;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => addItem(item)}
                                                className={`
                                                    p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md
                                                    ${qty > 0 ? "border-green-500 bg-green-50 ring-1 ring-green-500" : "border-slate-200 bg-white hover:border-slate-300"}
                                                `}
                                            >
                                                <div className="font-semibold text-sm text-slate-900 truncate">{item.name}</div>
                                                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                                                    <span>{item.category}</span>
                                                    <span className="font-medium">₹{item.price}</span>
                                                </div>
                                                {qty > 0 && (
                                                    <div className="mt-2 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded inline-block">
                                                        {qty} in cart
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Cart */}
                    <div className="w-96 bg-slate-50 flex flex-col border-l shadow-inner">
                        <div className="p-4 border-b bg-white">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                                Table / Seat Number
                            </label>
                            <Input
                                placeholder="e.g. T4 or Bar Counter"
                                value={tableIdentifier}
                                onChange={(e) => setTableIdentifier(e.target.value)}
                                className="bg-white"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {Object.keys(cart).length === 0 ? (
                                <div className="text-center text-slate-400 py-10 text-sm">
                                    Cart is empty.<br />Select items to order.
                                </div>
                            ) : (
                                Object.values(cart).map(({ item, qty }) => (
                                    <div key={item.id} className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="font-medium text-sm truncate">{item.name}</div>
                                            <div className="text-xs text-slate-500">₹{item.price} x {qty}</div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-100 rounded-md p-1">
                                            <button onClick={() => decQty(item.id)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-slate-600">-</button>
                                            <span className="text-sm font-bold w-4 text-center">{qty}</span>
                                            <button onClick={() => incQty(item.id)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-slate-600">+</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-white border-t space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-slate-500 text-sm font-medium">Total</span>
                                <span className="text-2xl font-bold text-slate-900">₹{subtotal}</span>
                            </div>
                            <Button
                                onClick={handleSubmitOrder}
                                disabled={isSubmitting || Object.keys(cart).length === 0}
                                className="w-full h-12 text-base font-bold bg-[#6D5DFB] hover:bg-[#5B4EE5]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                                    </>
                                ) : (
                                    "Send to Kitchen"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
