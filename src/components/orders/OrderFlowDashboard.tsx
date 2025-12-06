"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, TrendingUp, DollarSign, AlertCircle, Trash2 } from "lucide-react"
import { getKitchenOrders } from "@/actions/kitchen"
import OrderFlowTracker from "./OrderFlowTracker"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { deleteOrder as deleteOrderAction } from "@/actions/orders"

type Order = {
    id: string
    orderNumber: string
    roomNumber?: string
    tableNumber?: string
    businessUnit: string
    status: string
    totalAmount: number
    createdAt: string
    preparingAt?: string | null
    readyAt?: string | null
    isPaid?: boolean
    items: any[]
}

export default function OrderFlowDashboard() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(false)
            const data = await getKitchenOrders()
            setOrders(data as Order[])
        }

        fetchOrders()
        const interval = setInterval(fetchOrders, 10000)
        return () => clearInterval(interval)
    }, [])

    const stats = {
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        avgPrepTime: calculateAvgPrepTime(orders)
    }

    const byDepartment = {
        hotel: orders.filter(o => o.businessUnit === 'hotel'),
        restaurant: orders.filter(o => o.businessUnit === 'restaurant'),
        cafe: orders.filter(o => o.businessUnit === 'cafe'),
        bar: orders.filter(o => o.businessUnit === 'bar')
    }

    const [selectedOrders, setSelectedOrders] = useState<string[]>([])
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single')
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null)

    const handleSingleDelete = (orderId: string) => {
        setOrderToDelete(orderId)
        setPasswordAction('single')
        setIsPasswordDialogOpen(true)
    }

    const handleBulkDelete = () => {
        setPasswordAction('bulk')
        setIsPasswordDialogOpen(true)
    }

    const handlePasswordSuccess = async (password: string) => {
        if (password !== "KappuLokuHimu#1006") {
            throw new Error("Incorrect password")
        }

        setLoading(true)
        if (passwordAction === 'single' && orderToDelete) {
            await deleteOrderAction(orderToDelete, password)
            setOrders(prev => prev.filter(o => o.id !== orderToDelete))
            if (selectedOrder?.id === orderToDelete) setSelectedOrder(null)
        } else if (passwordAction === 'bulk') {
            await Promise.all(selectedOrders.map(id => deleteOrderAction(id, password)))
            setOrders(prev => prev.filter(o => !selectedOrders.includes(o.id)))
            if (selectedOrder && selectedOrders.includes(selectedOrder.id)) setSelectedOrder(null)
            setSelectedOrders([])
        }
        setLoading(false)
        setIsPasswordDialogOpen(false)
        setOrderToDelete(null)
    }

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Pending Orders</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Preparing</p>
                            <p className="text-3xl font-bold text-orange-600">{stats.preparing}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Ready</p>
                            <p className="text-3xl font-bold text-green-600">{stats.ready}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Avg Prep Time</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.avgPrepTime}m</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {selectedOrders.length > 0 && `${selectedOrders.length} selected`}
                </div>
                {selectedOrders.length > 0 && (
                    <Button variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                    </Button>
                )}
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
                    <TabsTrigger value="hotel">Room Service ({byDepartment.hotel.length})</TabsTrigger>
                    <TabsTrigger value="restaurant">Restaurant ({byDepartment.restaurant.length})</TabsTrigger>
                    <TabsTrigger value="cafe">Cafe ({byDepartment.cafe.length})</TabsTrigger>
                </TabsList>

                {(['all', 'hotel', 'restaurant', 'cafe'] as const).map(dept => (
                    <TabsContent key={dept} value={dept}>
                        <div className="space-y-4">
                            {(dept === 'all' ? orders : byDepartment[dept]).length === 0 ? (
                                <Card>
                                    <CardContent className="pt-10 text-center text-gray-500">
                                        No orders in this category
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                    {(dept === 'all' ? orders : byDepartment[dept]).map(order => (
                                        <div
                                            key={order.id}
                                            className="tilt-3d"
                                            onMouseMove={(e) => {
                                                const t = e.currentTarget as HTMLElement
                                                const r = t.getBoundingClientRect()
                                                const x = e.clientX - r.left
                                                const y = e.clientY - r.top
                                                const cx = r.width / 2
                                                const cy = r.height / 2
                                                const ry = ((x - cx) / cx) * 5
                                                const rx = -((y - cy) / cy) * 5
                                                t.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`
                                            }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "" }}
                                        >
                                        <Card
                                            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 relative group elevation-1"
                                            style={{
                                                borderLeftColor:
                                                    order.status === 'pending' ? '#fbbf24' :
                                                        order.status === 'preparing' ? '#fb923c' :
                                                            order.status === 'ready' ? '#22c55e' : '#3b82f6'
                                            }}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Checkbox
                                                    checked={selectedOrders.includes(order.id)}
                                                    onCheckedChange={() => toggleOrderSelection(order.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleSingleDelete(order.id)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-base">
                                                            {order.businessUnit === 'hotel' && `Room ${order.roomNumber}`}
                                                            {['restaurant', 'cafe'].includes(order.businessUnit) && `Table ${order.tableNumber}`}
                                                        </CardTitle>
                                                        <p className="text-xs text-gray-500 mt-1">#{order.orderNumber}</p>
                                                    </div>
                                                    <Badge className={
                                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                                                                order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                    }>
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Items</span>
                                                        <span className="font-semibold">{order.items?.length || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Amount</span>
                                                        <span className="font-semibold">₹{order.totalAmount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-gray-500 text-xs pt-1">
                                                        <Clock className="h-3 w-3" />
                                                        {calculateTimeAgo(order.createdAt)}
                                                    </div>
                                                    {order.isPaid && (
                                                        <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-300">
                                                            ✓ Paid
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {
                selectedOrder && (
                    <Card className="border-blue-200">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Order Details & Timeline</CardTitle>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <OrderFlowTracker orderId={selectedOrder.id} orderNumber={selectedOrder.orderNumber} />
                        </CardContent>
                    </Card>
                )
            }

            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handlePasswordSuccess}
                title={passwordAction === 'bulk' ? "Delete Selected Orders" : "Delete Order"}
                description={passwordAction === 'bulk'
                    ? `Are you sure you want to delete ${selectedOrders.length} orders?`
                    : "Are you sure you want to delete this order?"}
            />
        </div >
    )
}

function calculateAvgPrepTime(orders: Order[]): number {
    const completedOrders = orders.filter(o => o.readyAt && o.createdAt)
    if (completedOrders.length === 0) return 0

    const totalTime = completedOrders.reduce((sum, order) => {
        const created = new Date(order.createdAt).getTime()
        const ready = new Date(order.readyAt!).getTime()
        return sum + (ready - created)
    }, 0)

    return Math.round(totalTime / completedOrders.length / 60000)
}

function calculateTimeAgo(createdAt: string): string {
    const now = new Date().getTime()
    const created = new Date(createdAt).getTime()
    const diffMs = now - created
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    return `${Math.floor(diffMins / 60)}h ago`
}
