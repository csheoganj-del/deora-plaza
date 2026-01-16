"use client"
// Force recompile - Room Service Workflow Buttons

import { useState, useEffect } from "react"


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
        return <div className="flex items-center justify-center p-8 text-white/50">Loading orders...</div>
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-white/50">
                <div className="p-6 rounded-full bg-white/5 mb-4">
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
                return "bg-amber-500/10 text-amber-400 border-[#F59E0B]/20/20300"
            case "preparing":
                return "bg-orange-100 text-orange-700 border-orange-300"
            case "ready":
                return "bg-emerald-500/10 text-emerald-400 border-green-300"
            case "served":
                return "bg-purple-500/10/30 text-[#6D5DFB] border-[#EDEBFF]/40"
            default:
                return "bg-white/5 text-white border-[#9CA3AF]"
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
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg">
                            Room {roomNumber}
                        </span>
                        <span className="text-sm text-white/50">
                            ({roomOrders.length} {roomOrders.length === 1 ? 'order' : 'orders'})
                        </span>
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {roomOrders.map((order) => (
                            <div className={cn(
                                "premium-card border-l-4",
                                order.status === "ready" ? "border-l-green-500" :
                                    order.status === "preparing" ? "border-l-orange-500" :
                                        order.status === "served" ? "border-l-[#6D5DFB]" :
                                            "border-l-[#F59E0B]"
                            )}>
                                <div className="p-8 border-b border-[#E5E7EB] pb-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className={getStatusColor(order.status)}>
                                            {getStatusText(order.status)}
                                        </Badge>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-white/50 font-mono">#{order.orderNumber}</span>
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="h-7 w-7 inline-flex items-center justify-center rounded border border-red-200 text-rose-400 hover:bg-rose-500/10"
                                                aria-label="Delete order"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-bold text-white text-base flex items-center gap-2 text-white">
                                        <Clock className="h-4 w-4" />
                                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                    </h2>

                                    {/* Action Buttons */}
                                    {/* Action Buttons */}
                                    <div className="mt-3 flex gap-2">
                                        {order.status === "ready" && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, "served")}
                                                className="flex-1 px-4 py-2 bg-[#6D5DFB] hover:bg-[#6D5DFB]/90 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Mark Served
                                            </button>
                                        )}
                                        {order.status === "served" && (
                                            <div className="flex-1 px-4 py-2 bg-white/5 text-white/60 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                                                <CheckCircle className="h-4 w-4" />
                                                Completed
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="space-y-2">
                                        {(() => {
                                            try {
                                                const items = Array.isArray(order.items) 
                                                    ? order.items 
                                                    : (typeof order.items === 'string' ? JSON.parse(order.items) : []);
                                                
                                                return items.map((item: any, idx: number) => (
                                                    <div key={item.menuItemId || item.id || `${order.id}-${item.name}-${idx}`}
                                                        className="flex justify-between text-sm border-b border-[#F1F5F9] pb-2 last:border-0">
                                                        <span className="text-white">
                                                            <span className="font-bold text-purple-300">{item.quantity}x</span> {item.name}
                                                        </span>
                                                        <span className="text-white/50">₹{(item.price * item.quantity).toLocaleString()}</span>
                                                    </div>
                                                ));
                                            } catch (error) {
                                                console.error("Error parsing order items:", error);
                                                return null;
                                            }
                                        })()}
                                        <div className="flex justify-between font-semibold text-white pt-2 border-t">
                                            <span>Total</span>
                                            <span>₹{order.totalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

