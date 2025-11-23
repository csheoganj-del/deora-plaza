"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Phone, Star } from "lucide-react"
import { searchCustomers } from "@/actions/customers"
import { useDebounce } from "@/hooks/use-debounce" // We might need to create this hook or implement debounce manually

type Customer = {
    id: string
    name: string
    mobileNumber: string
    discountTier: string
    visitCount: number
}

export default function CustomerList({ onSelect }: { onSelect: (customer: Customer) => void }) {
    const [query, setQuery] = useState("")
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(false)

    // Simple manual debounce for now to avoid creating extra files if not needed
    const handleSearch = async (value: string) => {
        setQuery(value)
        if (value.length < 2) {
            setCustomers([])
            return
        }

        setLoading(true)
        const results = await searchCustomers(value)
        setCustomers(results)
        setLoading(false)
    }

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or mobile..."
                    className="pl-8"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {customers.length === 0 && query.length >= 2 && !loading && (
                    <div className="text-center text-muted-foreground py-8">
                        No customers found.
                    </div>
                )}

                {customers.map((customer) => (
                    <Card
                        key={customer.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => onSelect(customer)}
                    >
                        <CardContent className="p-4 flex items-center gap-4">
                            <Avatar>
                                <AvatarFallback>{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium">{customer.name}</h3>
                                    {customer.discountTier !== 'none' && (
                                        <Badge variant="secondary" className="text-xs capitalize">
                                            {customer.discountTier}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <Phone className="h-3 w-3" />
                                    {customer.mobileNumber}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
