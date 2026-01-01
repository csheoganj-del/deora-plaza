"use client"

import { useState, useEffect } from "react"

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
                    <Badge className={`text-lg px-3 py-1 capitalize ${customer.discountTier === 'gold' ? 'bg-[#F59E0B]/100' :
                        customer.discountTier === 'silver' ? 'bg-[#9CA3AF]' :
                            customer.discountTier === 'bronze' ? 'bg-[#D97706]' : 'bg-[#E5E7EB] text-[#111827]'
                        }`}>
                        {customer.discountTier} Member
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="premium-card">
                    <div className="p-8 pt-6 flex flex-col items-center">
                        <ShoppingBag className="h-8 w-8 mb-2 text-primary" />
                        <div className="text-2xl font-bold">{customer.visitCount}</div>
                        <p className="text-xs text-muted-foreground">Total Visits</p>
                    </div>
                </div>
                <div className="premium-card">
                    <div className="p-8 pt-6 flex flex-col items-center">
                        <Award className="h-8 w-8 mb-2 text-primary" />
                        <div className="text-2xl font-bold">₹{customer.totalSpent.toFixed(0)}</div>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                </div>
                <div className="premium-card">
                    <div className="p-8 pt-6 flex flex-col items-center">
                        <Calendar className="h-8 w-8 mb-2 text-primary" />
                        <div className="text-lg font-bold">
                            {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}
                        </div>
                        <p className="text-xs text-muted-foreground">Last Visit</p>
                    </div>
                </div>
            </div>

            <Separator />

            <div>
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                <div className="space-y-4">
                    {customer.orders && customer.orders.length > 0 ? (
                        customer.orders.map((order: any) => (
                            <div className="premium-card" key={order.id}>
                                <div className="p-8 border-b border-[#E5E7EB] pb-2">
                                    <div className="flex justify-between">
                                        <h2 className="text-3xl font-bold text-[#111827] text-base">Order #{order.orderNumber}</h2>
                                        <span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="premium-card-description">
                                        ₹{order.totalAmount.toFixed(2)} • {order.status}
                                    </div>
                                </div>
                                <div className="p-8 pb-4">
                                    <div className="text-sm">
                                        {(() => {
                                          try {
                                            const items = Array.isArray(order.items) 
                                              ? order.items 
                                              : (typeof order.items === 'string' ? JSON.parse(order.items) : []);
                                            
                                            return items.map((item: any) => (
                                              <span key={item.id} className="mr-2 inline-block bg-secondary px-2 py-1 rounded-md text-xs">
                                                  {item.quantity}x {item.name}
                                              </span>
                                            ));
                                          } catch (e) {
                                            console.warn('Failed to parse order.items in CustomerProfile:', e);
                                            return null;
                                          }
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-sm">No recent orders found.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

