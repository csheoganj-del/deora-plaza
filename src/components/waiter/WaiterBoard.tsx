"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Clock, MapPin, Hotel, Coffee, Utensils } from "lucide-react"
import { getOrders, updateOrderStatus } from "@/actions/orders"
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

export default function WaiterBoard() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "cafe" | "restaurant" | "hotel">("all")

    const fetchOrders = async () => {
        // Fetch all ready orders
        const allOrders = await getOrders()
        // @ts-ignore - Date serialization issue from server action
        const readyOrders = allOrders.filter((order: any) => order.status === "ready")
        setOrders(readyOrders)
        setLoading(false)
    }

    useEffect(() => {
        fetchOrders()
        const interval = setInterval(fetchOrders, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [])

    const handleMarkDelivered = async (orderId: string) => {
        await updateOrderStatus(orderId, "served")
        fetchOrders()
    }

    const filteredOrders = filter === "all"
        ? orders
        : orders.filter(order => order.businessUnit === filter)

    if (loading) {
        return <div className="flex h-full items-center justify-center text-slate-600">Loading orders...</div>
    }

    const roomServiceOrders = orders.filter(order => order.businessUnit === "hotel")
    const tableOrders = orders.filter(order => ["cafe", "restaurant"].includes(order.businessUnit))

    return (
        <div className="h-full flex flex-col">
            <Tabs defaultValue="all" className="flex-1 flex flex-col" onValueChange={(value) => setFilter(value as any)}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="all">
                        All Orders ({orders.length})
                    </TabsTrigger>
                    <TabsTrigger value="hotel">
                        <Hotel className="h-4 w-4 mr-2" />
                        Room Service ({roomServiceOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="cafe">
                        <Coffee className="h-4 w-4 mr-2" />
                        Cafe ({orders.filter(o => o.businessUnit === "cafe").length})
                    </TabsTrigger>
                    <TabsTrigger value="restaurant">
                        <Utensils className="h-4 w-4 mr-2" />
                        Restaurant ({orders.filter(o => o.businessUnit === "restaurant").length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={filter} className="flex-1 overflow-y-auto">
                    {filteredOrders.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-slate-500">
                            <div className="p-6 rounded-full bg-slate-100 mb-4">
                                <CheckCircle2 className="h-16 w-16 opacity-50" />
                            </div>
                            <p className="text-xl font-medium">No ready orders</p>
                            <p className="text-sm opacity-60">Orders ready for delivery will appear here</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pr-2">
                            {filteredOrders.map((order) => (
                                <Card key={order.id} className={cn(
                                    "flex flex-col border-l-4 transition-all duration-300 hover:shadow-lg",
                                    order.businessUnit === "hotel" ? "border-l-purple-500" :
                                        order.businessUnit === "cafe" ? "border-l-amber-500" :
                                            "border-l-green-500"
                                )}>
                                    <CardHeader className="pb-3 bg-slate-50 border-b">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className={cn(
                                                    "whitespace-nowrap",
                                                    order.businessUnit === "hotel" ? "bg-purple-100 text-purple-700 border-purple-300" :
                                                        order.businessUnit === "cafe" ? "bg-amber-100 text-amber-700 border-amber-300" :
                                                            "bg-green-100 text-green-700 border-green-300"
                                                )}>
                                                    {order.businessUnit === 'hotel' ? 'Room Service' :
                                                        order.businessUnit === 'cafe' ? 'Cafe' : 'Restaurant'}
                                                </Badge>
                                                <span className="text-xs text-slate-500 font-mono">#{order.orderNumber}</span>
                                            </div>
                                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-slate-500" />
                                                {order.businessUnit === 'hotel' && `Room ${order.roomNumber}`}
                                                {order.businessUnit === 'cafe' && `Cafe Table ${order.table?.tableNumber}`}
                                                {order.businessUnit === 'restaurant' && `Restaurant Table ${order.table?.tableNumber}`}
                                            </CardTitle>
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 py-4">
                                        <div className="space-y-2">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex flex-col border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start text-sm">
                                                        <span className="font-medium text-slate-700 flex gap-2">
                                                            <span className="font-bold text-blue-600">{item.quantity}x</span>
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    {item.specialInstructions && (
                                                        <p className="text-xs text-orange-600 italic mt-1 bg-orange-50 p-1 rounded border border-orange-200">
                                                            Note: {item.specialInstructions}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-3 pb-4 bg-slate-50 border-t">
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg"
                                            onClick={() => handleMarkDelivered(order.id)}
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Mark Delivered
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
