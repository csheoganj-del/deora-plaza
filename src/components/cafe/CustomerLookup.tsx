"use client"

import { useState } from "react"
import { searchCustomers } from "@/actions/customers"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Star, Award, Crown } from "lucide-react"

type CustomerLookupProps = {
    onSelectCustomer: (customer: any) => void
}

export default function CustomerLookup({ onSelectCustomer }: CustomerLookupProps) {
    const [mobile, setMobile] = useState("")
    const [customer, setCustomer] = useState<any>(null)
    const [searching, setSearching] = useState(false)

    const handleSearch = async () => {
        if (!mobile || mobile.length < 10) return

        setSearching(true)
        const results = await searchCustomers(mobile)
        if (results.length > 0) {
            setCustomer(results[0])
            onSelectCustomer(results[0])
        } else {
            setCustomer(null)
            onSelectCustomer(null)
        }
        setSearching(false)
    }

    const getTierIcon = (tier: string) => {
        switch (tier) {
            case "gold": return <Crown className="h-4 w-4 text-yellow-500" />
            case "silver": return <Award className="h-4 w-4 text-gray-400" />
            case "bronze": return <Star className="h-4 w-4 text-orange-600" />
            default: return null
        }
    }

    const getTierBadge = (tier: string) => {
        const colors: any = {
            gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
            silver: "bg-gray-100 text-gray-800 border-gray-300",
            bronze: "bg-orange-100 text-orange-800 border-orange-300",
            none: "bg-gray-50 text-gray-600"
        }
        return colors[tier] || colors.none
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input
                    placeholder="Customer Mobile (10 digits)"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    maxLength={10}
                />
                <Button onClick={handleSearch} disabled={searching || mobile.length < 10}>
                    <Search className="h-4 w-4" />
                </Button>
            </div>

            {customer && (
                <Card className="border-2 border-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold">{customer.name}</h3>
                                    {getTierIcon(customer.discountTier)}
                                </div>
                                <p className="text-sm text-muted-foreground">{customer.mobileNumber}</p>
                            </div>
                            <div className="text-right">
                                <Badge className={getTierBadge(customer.discountTier)}>
                                    {customer.discountTier.toUpperCase()} TIER
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {customer.visitCount} visits | ₹{customer.totalSpent.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        {customer.discountTier !== "none" && (
                            <div className="mt-2 text-sm text-green-600 font-medium">
                                🎉 Auto discount will be applied!
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
