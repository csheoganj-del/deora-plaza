"use client"
// Force recompile - Room Service Workflow Buttons

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOrders, deleteOrder } from "@/actions/orders"
import { updateOrderStatus } from "@/actions/kitchen"
import { Clock, UtensilsCrossed, Trash2, ChefHat, CheckCircle, Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

type OrderItem = {
    id?: string
    menuItemId?: string
    name: string
    quantity: number
    price: number
}

type Order = {
    id: string
    orderNumber: string
    roomNumber: string
    businessUnit: string
    status: string
    createdAt: string
    items: OrderItem[]
    totalAmount: number
}

export default function RoomServiceOrders() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    const fetchOrders = async () => {
        console.log("RoomServiceOrders: Fetching orders for businessUnit='hotel'")
        const allOrders = await getOrders("hotel")
        console.log("RoomServiceOrders: Fetched orders:", allOrders)
        console.log("RoomServiceOrders: Number of orders:", allOrders.length)
        // @ts-ignore
        setOrders(allOrders)
        setLoading(false)
    }

    const handleDeleteOrder = async (orderId: string) => {
        const ok = confirm("Delete this order? This will also remove its charges from the booking, if linked.")
        if (!ok) return
        const res = await deleteOrder(orderId)
        if (!res?.success) {
            alert(res?.error || "Failed to delete order")
            return
        }
        await fetchOrders()
    }

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        const res = await updateOrderStatus(orderId, newStatus)
        if (!res?.success) {
            alert("Failed to update order status")
            return
        }
        await fetchOrders()
    }

    useEffect(() => {
        fetchOrders()
        const interval = setInterval(fetchOrders, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return <div className="flex items-center justify-center p-8 text-slate-500">Loading orders...</div>
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <div className="p-6 rounded-full bg-slate-100 mb-4">
                    <UtensilsCrossed className="h-16 w-16 opacity-50" />
                </div>
                <p className="text-xl font-medium">No room service orders</p>
                <p className="text-sm opacity-60">Orders will appear here when guests order food</p>
            </div>
        )
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-700 border-yellow-300"
            case "preparing":
                return "bg-orange-100 text-orange-700 border-orange-300"
            case "ready":
                return "bg-green-100 text-green-700 border-green-300"
            case "served":
                return "bg-blue-100 text-blue-700 border-blue-300"
            default:
                return "bg-slate-100 text-slate-700 border-slate-300"
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case "pending":
                return "Order Placed"
            case "preparing":
                return "Preparing"
            case "ready":
                return "Ready for Delivery"
            case "served":
                return "Delivered"
            default:
                return status
        }
    }

    // Group orders by room number
    const ordersByRoom = orders.reduce((acc, order) => {
        const room = order.roomNumber || "Unknown"
        if (!acc[room]) {
            acc[room] = []
        }
        acc[room].push(order)
        return acc
    }, {} as Record<string, Order[]>)

    return (
        <div className="space-y-6">
            {Object.entries(ordersByRoom).map(([roomNumber, roomOrders]) => (
                <div key={roomNumber} className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg">
                            Room {roomNumber}
                        </span>
                        <span className="text-sm text-slate-500">
                            ({roomOrders.length} {roomOrders.length === 1 ? 'order' : 'orders'})
                        </span>
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {roomOrders.map((order) => (
                            <Card key={order.id} className={cn(
                                "border-l-4",
                                order.status === "ready" ? "border-l-green-500" :
                                    order.status === "preparing" ? "border-l-orange-500" :
                                        order.status === "served" ? "border-l-blue-500" :
                                            "border-l-yellow-500"
                            )}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className={getStatusColor(order.status)}>
                                            {getStatusText(order.status)}
                                        </Badge>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 font-mono">#{order.orderNumber}</span>
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="h-7 w-7 inline-flex items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50"
                                                aria-label="Delete order"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <CardTitle className="text-base flex items-center gap-2 text-slate-700">
                                        <Clock className="h-4 w-4" />
                                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                    </CardTitle>

                                    {/* Action Buttons */}
                                    {/* Action Buttons */}
                                    <div className="mt-3 flex gap-2">
                                        {order.status === "ready" && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, "served")}
                                                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Mark Served
                                            </button>
                                        )}
                                        {order.status === "served" && (
                                            <div className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                                                <CheckCircle className="h-4 w-4" />
                                                Completed
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {order.items.map((item, idx) => (
                                            <div key={item.menuItemId || item.id || `${order.id}-${item.name}-${idx}`}
                                                className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                                                <span className="text-slate-700">
                                                    <span className="font-bold text-purple-600">{item.quantity}x</span> {item.name}
                                                </span>
                                                <span className="text-slate-500">₹{(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between font-semibold text-slate-900 pt-2 border-t">
                                            <span>Total</span>
                                            <span>₹{order.totalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
