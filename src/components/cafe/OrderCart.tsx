"use client"

import { Button } from "@/components/ui/button"


import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Trash2, Minus, Plus, ChefHat } from "lucide-react"

type CartItem = {
    id: string // menuItemId
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
    console.log("OrderCart rendered with items:", items.length)
    console.log("onSubmitOrder function:", typeof onSubmitOrder)
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    return (
        <div className="premium-card">
            <div className="p-8 border-b border-[#E5E7EB]">
                <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Order Cart
                </h2>
                {tableNumber && (
                    <p className="text-sm text-muted-foreground">Table {tableNumber}</p>
                )}
            </div>
            <div className="p-8 flex-1">
                <ScrollArea className="h-full">
                    {items.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            <p>No items added to cart</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between space-x-2">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">₹{item.price} x {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => onUpdateQuantity(item.id, -1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-4 text-center text-sm">{item.quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => onUpdateQuantity(item.id, 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-[#FEE2E2]0 hover:text-[#EF4444]"
                                            onClick={() => onRemoveItem(item.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
            <Separator />
            <div className="p-8 border-t border-[#E5E7EB] flex flex-col gap-4 p-4">
                <div className="flex w-full justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                </div>
                <Button
                    className="w-full"
                    size="lg"
                    disabled={items.length === 0}
                    onClick={() => {
                        console.log("Send to Kitchen button clicked!")
                        console.log("Items in cart:", items.length)
                        console.log("onSubmitOrder function type:", typeof onSubmitOrder)
                        if (onSubmitOrder) {
                            console.log("Calling onSubmitOrder...")
                            onSubmitOrder()
                        } else {
                            console.log("onSubmitOrder is not a function!")
                        }
                    }}
                >
                    Send to Kitchen
                </Button>
            </div>
        </div>
    )
}

