"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, ChefHat, Utensils } from "lucide-react"
import { getKitchenOrders, updateOrderStatus } from "@/actions/kitchen"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

type OrderItem = {
    id: string
    name: string
    quantity: number
    specialInstructions?: string | null
}

type Order = {
    id: string
    orderNumber: string
    tableId: string | null
    table?: { tableNumber: string } | null
    roomNumber?: string | null
    businessUnit: string
    status: string
    createdAt: Date
    type: string
    items: OrderItem[]
}

export default function KitchenBoard() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    const fetchOrders = async () => {
        const data = await getKitchenOrders()
        // @ts-ignore - Date serialization issue from server action
        setOrders(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchOrders()
        const interval = setInterval(fetchOrders, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [])

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        await updateOrderStatus(orderId, newStatus)
        fetchOrders()
    }

    if (loading) {
        return <div className="flex h-full items-center justify-center text-white">Loading orders...</div>
    }

    if (orders.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-gray-500">
                <div className="p-6 rounded-full bg-white/5 mb-4">
                    <ChefHat className="h-16 w-16 opacity-50" />
                </div>
                <p className="text-xl font-medium">No active orders</p>
                <p className="text-sm opacity-60">New orders will appear here automatically</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 h-full overflow-y-auto pr-2">
            {orders.map((order) => (
                <Card key={order.id} className={cn(
                    "flex flex-col border-l-4 bg-black/40 backdrop-blur-md text-white transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10",
                    order.status === "ready" ? "border-l-green-500 border-white/10" : "border-l-amber-500 border-white/10"
                )}>
                    <CardHeader className="pb-3 bg-white/5 border-b border-white/5">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 whitespace-nowrap">
                                        {order.type === 'dine-in' ? 'Dine-in' : 'Takeaway'}
                                    </Badge>
                                    <span className="text-xs text-gray-400 font-mono">#{order.orderNumber}</span>
                                </div>
                                <Badge variant={order.status === "ready" ? "success" : "secondary"} className={cn(
                                    "flex items-center gap-1 whitespace-nowrap",
                                    order.status === "preparing" && "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse"
                                )}>
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                </Badge>
                            </div>
                            <CardTitle className="text-xl font-bold text-white truncate w-full">
                                {order.businessUnit === 'hotel' && `Room ${order.roomNumber}`}
                                {order.businessUnit === 'cafe' && `Cafe Table ${order.table?.tableNumber}`}
                                {order.businessUnit === 'restaurant' && `Restaurant Table ${order.table?.tableNumber}`}
                                {order.businessUnit === 'bar' && 'Bar Order'}
                                {!['hotel', 'cafe', 'restaurant', 'bar'].includes(order.businessUnit) && 'Counter Order'}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 py-4">
                        <div className="space-y-3">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex flex-col border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start text-sm">
                                        <span className="font-medium text-gray-200 flex gap-2">
                                            <span className="font-bold text-amber-400">{item.quantity}x</span>
                                            {item.name}
                                        </span>
                                    </div>
                                    {item.specialInstructions && (
                                        <p className="text-xs text-orange-300/90 italic mt-1 bg-orange-500/10 p-1 rounded border border-orange-500/20">
                                            Note: {item.specialInstructions}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="pt-3 pb-4 bg-white/5 border-t border-white/5">
                        {order.status === "pending" && (
                            <Button
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-lg shadow-amber-900/20"
                                onClick={() => handleStatusUpdate(order.id, "preparing")}
                            >
                                <ChefHat className="mr-2 h-4 w-4" />
                                Start Preparing
                            </Button>
                        )}
                        {order.status === "preparing" && (
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg shadow-green-900/20"
                                onClick={() => handleStatusUpdate(order.id, "ready")}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark Ready
                            </Button>
                        )}
                        {order.status === "ready" && (
                            <Button
                                className="w-full border-white/20 text-white hover:bg-white/10"
                                variant="outline"
                                disabled
                            >
                                <Utensils className="mr-2 h-4 w-4" />
                                Waiting for Waiter
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
