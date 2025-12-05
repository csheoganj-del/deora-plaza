"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCustomerDetails } from "@/actions/customers"
import { Loader2, ShoppingBag, Calendar, Award } from "lucide-react"

export default function CustomerProfile({ customerId }: { customerId: string }) {
    const [customer, setCustomer] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadDetails() {
            if (!customerId) return
            setLoading(true)
            const data = await getCustomerDetails(customerId)
            setCustomer(data)
            setLoading(false)
        }
        loadDetails()
    }, [customerId])

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (!customer) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{customer.name}</h2>
                    <p className="text-muted-foreground">{customer.mobileNumber}</p>
                </div>
                <div className="text-right">
                    <Badge className={`text-lg px-3 py-1 capitalize ${customer.discountTier === 'gold' ? 'bg-yellow-500' :
                        customer.discountTier === 'silver' ? 'bg-slate-400' :
                            customer.discountTier === 'bronze' ? 'bg-amber-700' : 'bg-slate-200 text-slate-800'
                        }`}>
                        {customer.discountTier} Member
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center">
                        <ShoppingBag className="h-8 w-8 mb-2 text-primary" />
                        <div className="text-2xl font-bold">{customer.visitCount}</div>
                        <p className="text-xs text-muted-foreground">Total Visits</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center">
                        <Award className="h-8 w-8 mb-2 text-primary" />
                        <div className="text-2xl font-bold">₹{customer.totalSpent.toFixed(0)}</div>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center">
                        <Calendar className="h-8 w-8 mb-2 text-primary" />
                        <div className="text-lg font-bold">
                            {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}
                        </div>
                        <p className="text-xs text-muted-foreground">Last Visit</p>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            <div>
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                <div className="space-y-4">
                    {customer.orders && customer.orders.length > 0 ? (
                        customer.orders.map((order: any) => (
                            <Card key={order.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between">
                                        <CardTitle className="text-base">Order #{order.orderNumber}</CardTitle>
                                        <span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <CardDescription>
                                        ₹{order.totalAmount.toFixed(2)} • {order.status}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <div className="text-sm">
                                        {order.items.map((item: any) => (
                                            <span key={item.id} className="mr-2 inline-block bg-secondary px-2 py-1 rounded-md text-xs">
                                                {item.quantity}x {item.name}
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-sm">No recent orders found.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
