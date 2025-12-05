"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCustomerDiscountInfo } from "@/actions/customers"
import { getDiscountHistory } from "@/actions/discounts"
import { getTierColor, getTierDisplayName, getDefaultDiscount } from "@/lib/discount-utils"
import { Percent, History, TrendingDown } from "lucide-react"

type DiscountPanelProps = {
    customerId?: string
    discountPercent: number
    onDiscountChange: (percent: number) => void
    subtotal: number
}

type DiscountHistoryItem = {
    id: string
    billId: string
    discountPercent: number
    discountAmount: number
    finalAmount: number
    createdAt: string
}

export default function DiscountPanel({
    customerId,
    discountPercent,
    onDiscountChange,
    subtotal,
}: DiscountPanelProps) {
    const [tier, setTier] = useState<string>("regular")
    const [suggestedDiscount, setSuggestedDiscount] = useState<number>(0)
    const [history, setHistory] = useState<DiscountHistoryItem[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (customerId) {
            loadCustomerDiscountInfo()
            loadDiscountHistory()
        } else {
            setTier("regular")
            setSuggestedDiscount(0)
            setHistory([])
        }
    }, [customerId])

    const loadCustomerDiscountInfo = async () => {
        if (!customerId) return
        setLoading(true)
        const info = await getCustomerDiscountInfo(customerId)
        if (info) {
            setTier(info.tier)
            setSuggestedDiscount(info.suggestedDiscount)
            // Auto-apply suggested discount if no discount is set
            if (discountPercent === 0 && info.suggestedDiscount > 0) {
                onDiscountChange(info.suggestedDiscount)
            }
        }
        setLoading(false)
    }

    const loadDiscountHistory = async () => {
        if (!customerId) return
        const historyData = await getDiscountHistory(customerId, 5)
        setHistory(historyData)
    }

    const calculatedDiscount = (subtotal * discountPercent) / 100

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Discount
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Customer Tier Info */}
                {customerId && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Customer Tier</span>
                            <Badge className={getTierColor(tier as any)}>
                                {getTierDisplayName(tier as any)}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Suggested Discount</span>
                            <span className="font-medium">{suggestedDiscount}%</span>
                        </div>
                        <Separator />
                    </div>
                )}

                {/* Discount Input */}
                <div className="space-y-2">
                    <Label htmlFor="discount-percent">Discount Percentage</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="discount-percent"
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={discountPercent}
                            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                            className="text-right"
                        />
                        <span className="text-muted-foreground">%</span>
                    </div>
                </div>

                {/* Discount Preview */}
                {discountPercent > 0 && (
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md space-y-1">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <TrendingDown className="h-4 w-4" />
                            <span className="font-medium">Discount Applied</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Discount Amount:</span>
                            <span className="font-medium">₹{calculatedDiscount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">After Discount:</span>
                            <span className="font-medium">₹{(subtotal - calculatedDiscount).toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {/* Discount History */}
                {customerId && history.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <History className="h-4 w-4" />
                                Recent Discounts
                            </div>
                            <div className="space-y-2">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between text-xs p-2 bg-muted rounded"
                                    >
                                        <div>
                                            <div className="font-medium">{item.discountPercent}% off</div>
                                            <div className="text-muted-foreground">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-muted-foreground">Saved</div>
                                            <div className="font-medium">₹{item.discountAmount.toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {!customerId && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                        Select a customer to see discount suggestions
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
