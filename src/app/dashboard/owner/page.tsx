"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDailyRevenue } from "@/actions/billing"
import { IndianRupee, TrendingUp, Calendar } from "lucide-react"

export default function OwnerDashboard() {
    const [revenue, setRevenue] = useState({
        cafe: 0,
        bar: 0,
        hotel: 0,
        garden: 0,
        total: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchRevenue() {
            // Fetch revenue for each business unit
            const cafeRev = await getDailyRevenue("cafe")
            const barRev = await getDailyRevenue("bar")
            const hotelRev = await getDailyRevenue("hotel")
            const gardenRev = await getDailyRevenue("garden")

            const total = cafeRev.total + barRev.total + hotelRev.total + gardenRev.total

            setRevenue({
                cafe: cafeRev.total,
                bar: barRev.total,
                hotel: hotelRev.total,
                garden: gardenRev.total,
                total
            })
            setLoading(false)
        }
        fetchRevenue()
    }, [])

    const ownerShare = revenue.total * 0.4 // 40% owner share
    const managerShare = revenue.total * 0.6 // 60% manager share

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Owner Dashboard</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Today's Revenue
                </div>
            </div>

            {/* Total Revenue Card */}
            <Card className="border-2 border-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Total Revenue (Today)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-primary">
                        ₹{revenue.total.toLocaleString('en-IN')}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-green-50 p-4">
                            <div className="text-sm text-muted-foreground">Your Share (40%)</div>
                            <div className="text-2xl font-bold text-green-600">
                                ₹{ownerShare.toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-4">
                            <div className="text-sm text-muted-foreground">Manager Share (60%)</div>
                            <div className="text-2xl font-bold text-blue-600">
                                ₹{managerShare.toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Business Unit Breakdown */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cafe</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.cafe.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.cafe * 0.4).toLocaleString('en-IN')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bar</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.bar.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.bar * 0.4).toLocaleString('en-IN')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hotel</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.hotel.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.hotel * 0.4).toLocaleString('en-IN')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Garden</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{revenue.garden.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Your share: ₹{(revenue.garden * 0.4).toLocaleString('en-IN')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Settlement Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Settlement Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        This feature will track monthly settlements and payment status.
                        <br />
                        Coming soon: Settlement history and payment tracking.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
