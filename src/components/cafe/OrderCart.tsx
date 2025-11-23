"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return (
        <Card className="flex h-full flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                    <span>Current Order</span>
                    {tableNumber && <span className="text-sm font-normal text-muted-foreground">Table {tableNumber}</span>}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[calc(100vh-300px)] p-4">
                    {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <ChefHat className="mb-4 h-12 w-12 opacity-20" />
                            <p>No items in order</p>
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
                                            className="h-6 w-6 text-red-500 hover:text-red-600"
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
            </CardContent>
            <Separator />
            <CardFooter className="flex flex-col gap-4 p-4">
                <div className="flex w-full justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                </div>
                <Button
                    className="w-full"
                    size="lg"
                    disabled={items.length === 0}
                    onClick={onSubmitOrder}
                >
                    Send to Kitchen
                </Button>
            </CardFooter>
        </Card>
    )
}
