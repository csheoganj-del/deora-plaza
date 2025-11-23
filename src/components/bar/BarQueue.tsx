"use client"

import { useState, useEffect } from "react"
import { getBarOrders, updateBarOrderStatus } from "@/actions/bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, CheckCircle2, Coffee } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type OrderItem = {
    id: string
    name: string
    quantity: number
    specialInstructions: string | null
}

type Order = {
    id: string
    orderNumber: string
    tableId: string | null
    status: string
    createdAt: Date
    items: OrderItem[]
    type: string
}

export default function BarQueue() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    const fetchOrders = async () => {
        const data = await getBarOrders()
        setOrders(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchOrders()
        const interval = setInterval(fetchOrders, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [])

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        await updateBarOrderStatus(orderId, newStatus)
        fetchOrders()
    }

    if (loading) {
        return <div className="text-white">Loading queue...</div>
    }

    return (
        <div className="h-full space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Active Orders</h2>
                <Badge variant="outline" className="text-white border-white/20">
                    {orders.length} Pending
                </Badge>
            </div>

            <ScrollArea className="h-[calc(100%-3rem)]">
                <div className="grid gap-4 pr-4">
                    {orders.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            No active orders
                        </div>
                    ) : (
                        orders.map((order) => (
                            <Card key={order.id} className="bg-black/40 border-white/10 backdrop-blur-md text-white">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                            #{order.orderNumber}
                                        </Badge>
                                        <span className="text-sm font-medium text-gray-300">
                                            {order.type === "dine-in" ? "Table Service" : "Takeaway"}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-400">
                                        <Clock className="mr-1 h-3 w-3" />
                                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex justify-between text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <span className="font-bold text-amber-400">{item.quantity}x</span>
                                                        {item.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            {order.status === "preparing" && (
                                                <Button
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(order.id, "ready")}
                                                >
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Mark Ready
                                                </Button>
                                            )}
                                            {order.status === "ready" && (
                                                <Button
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(order.id, "served")}
                                                >
                                                    <Coffee className="mr-2 h-4 w-4" />
                                                    Mark Served
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
