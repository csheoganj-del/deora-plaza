"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Minus, Plus, ChefHat } from "lucide-react"

type CartItem = {
    id: string
    name: string
    price: number
    quantity: number
}

type OrderCartProps = {
    items: CartItem[]
    onUpdateQuantity: (id: string, delta: number) => void
    onRemoveItem: (id: string) => void
    onSubmitOrder: () => void
    tableNumber?: string
}

export default function OrderCart({
    items,
    onUpdateQuantity,
    onRemoveItem,
    onSubmitOrder,
    tableNumber
}: OrderCartProps) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = subtotal

    return (
        <div className="flex h-full flex-col bg-white border-0">
            {/* Cart Items */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 px-4">
                        <ChefHat className="mb-3 h-20 w-20 opacity-10" />
                        <p className="text-base font-semibold text-slate-600">No items yet</p>
                        <p className="text-sm text-slate-500 text-center mt-1">Select items from the menu on the left to add to your order</p>
                    </div>
                ) : (
                    <ScrollArea className="flex-1">
                        <div className="space-y-3 p-4">
                            {items.map((item) => {
                                const itemTotal = item.price * item.quantity
                                return (
                                    <div
                                        key={item.id}
                                        className="bg-slate-50 border-l-4 border-l-[var(--rajasthani-teal)] rounded-lg p-3 space-y-2 hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 break-words">
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-slate-600 mt-1 font-medium">
                                                    ₹{item.price.toFixed(2)} each
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                                                onClick={() => onRemoveItem(item.id)}
                                                title="Remove item"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                                            <div className="flex items-center gap-1 bg-white border-2 border-slate-300 rounded-lg p-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-700 hover:bg-slate-200 p-0"
                                                    onClick={() => onUpdateQuantity(item.id, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-5 text-center text-sm font-bold text-slate-900">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-700 hover:bg-slate-200 p-0"
                                                    onClick={() => onUpdateQuantity(item.id, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <span className="text-sm font-bold text-[var(--rajasthani-teal)] text-right">
                                                ₹{itemTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Summary and Button */}
            {items.length > 0 && (
                <div className="flex-shrink-0 border-t-2 border-slate-200 p-4 space-y-3 bg-slate-50">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-semibold text-slate-700">
                            <span>Subtotal:</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-slate-900 bg-[var(--rajasthani-teal)] text-white p-3 rounded-lg">
                            <span>Total:</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                    <Button
                        className="w-full bg-gradient-to-r from-[var(--rajasthani-teal)] to-[var(--rajasthani-teal-dark)] hover:from-[var(--rajasthani-teal-light)] hover:to-[var(--rajasthani-teal)] text-white font-bold text-base py-3"
                        size="lg"
                        onClick={onSubmitOrder}
                    >
                        View Cart & Checkout ({items.length} Items) - ₹{total.toFixed(2)}
                    </Button>
                </div>
            )}
        </div>
    )
}
