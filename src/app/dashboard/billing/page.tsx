"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getUnbilledOrders } from "@/actions/billing"
import BillGenerator from "@/components/billing/BillGenerator"
import { Loader2, Receipt } from "lucide-react"

export default function BillingPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchOrders = async () => {
        const data = await getUnbilledOrders()
        setOrders(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const handleBillGenerated = () => {
        setSelectedOrder(null)
        fetchOrders()
    }

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4">
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">Billing & Payments</h1>
                    <p className="text-muted-foreground">Select an order to generate bill</p>
                </div>

                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Receipt className="h-12 w-12 mb-4 opacity-20" />
                        <p>No pending orders for billing</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {orders.map((order) => (
                            <Card
                                key={order.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${selectedOrder?.id === order.id ? 'border-primary ring-1 ring-primary' : ''}`}
                                onClick={() => setSelectedOrder(order)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">
                                            {order.table ? `Table ${order.table.tableNumber}` : "Takeaway"}
                                        </CardTitle>
                                        <Badge variant="outline">#{order.orderNumber}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground mb-2">
                                        {new Date(order.createdAt).toLocaleTimeString()}
                                    </div>
                                    <div className="font-bold text-lg">
                                        ₹{order.totalAmount.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {order.items.length} items
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {selectedOrder && (
                <div className="w-[400px] border-l pl-4">
                    <BillGenerator order={selectedOrder} onClose={handleBillGenerated} />
                </div>
            )}
        </div>
    )
}
