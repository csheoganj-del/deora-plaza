"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getCustomerSuggestions } from "@/actions/customers"
import { getTierColor, getTierDisplayName } from "@/lib/discount-utils"
import { Search, User } from "lucide-react"

type Customer = {
    id: string
    name: string
    mobileNumber: string
    discountTier: string
    customDiscountPercent?: number
    totalSpent: number
    visitCount: number
    lastVisit: string | null
}

type CustomerAutocompleteProps = {
    onCustomerSelect: (customer: Customer | null) => void
    initialName?: string
    initialMobile?: string
}

export default function CustomerAutocomplete({
    onCustomerSelect,
    initialName = "",
    initialMobile = "",
}: CustomerAutocompleteProps) {
    const [name, setName] = useState(initialName)
    const [mobile, setMobile] = useState(initialMobile)
    const [suggestions, setSuggestions] = useState<Customer[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const searchQuery = name || mobile
        if (searchQuery.length < 2) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        const debounce = setTimeout(async () => {
            setLoading(true)
            const results = await getCustomerSuggestions(searchQuery)
            setSuggestions(results)
            setShowSuggestions(results.length > 0)
            setLoading(false)
        }, 300)

        return () => clearTimeout(debounce)
    }, [name, mobile])

    const handleSelectCustomer = (customer: Customer) => {
        setName(customer.name)
        setMobile(customer.mobileNumber)
        setShowSuggestions(false)
        onCustomerSelect(customer)
    }

    const handleNameChange = (value: string) => {
        setName(value)
        if (!value) {
            onCustomerSelect(null)
        }
    }

    const handleMobileChange = (value: string) => {
        setMobile(value)
        if (!value) {
            onCustomerSelect(null)
        }
    }

    return (
        <div className="relative space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                    <Label htmlFor="customer-name">Customer Name</Label>
                    <div className="relative">
                        <Input
                            id="customer-name"
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Enter name"
                            className="pr-8"
                        />
                        <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="customer-mobile">Mobile Number</Label>
                    <Input
                        id="customer-mobile"
                        type="tel"
                        value={mobile}
                        onChange={(e) => handleMobileChange(e.target.value)}
                        placeholder="Enter mobile"
                    />
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 border border-gray-200 rounded-md shadow-xl bg-white !important z-[999] w-full max-w-md mt-1">
                    <div className="p-2 space-y-1">
                        {suggestions.map((customer) => (
                            <button
                                key={customer.id}
                                onClick={() => handleSelectCustomer(customer)}
                                className="w-full text-left p-3 hover:bg-accent rounded-md transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-2">
                                        <User className="h-4 w-4 mt-1 text-muted-foreground" />
                                        <div>
                                            <div className="font-medium">{customer.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {customer.mobileNumber}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    variant="secondary"
                                                    className={getTierColor(customer.discountTier as any)}
                                                >
                                                    {getTierDisplayName(customer.discountTier as any)}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {customer.visitCount} visits
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right text-sm">
                                        <div className="text-muted-foreground">Total Spent</div>
                                        <div className="font-medium">₹{customer.totalSpent.toLocaleString()}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {loading && (
                <div className="text-sm text-muted-foreground">Searching customers...</div>
            )}
        </div>
    )
}
