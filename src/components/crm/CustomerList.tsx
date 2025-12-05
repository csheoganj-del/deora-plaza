"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Phone, Star, Trash2 } from "lucide-react"
import { searchCustomers, deleteCustomer } from "@/actions/customers"
import { useDebounce } from "@/hooks/use-debounce" // We might need to create this hook or implement debounce manually
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordDialog } from "@/components/ui/PasswordDialog"

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

    // Load all customers on mount
    useEffect(() => {
        loadAllCustomers()
    }, [])

    const loadAllCustomers = async () => {
        setLoading(true)
        const results = await searchCustomers("") // Empty query returns all
        setCustomers(results)
        setLoading(false)
    }

    // Simple manual debounce for now to avoid creating extra files if not needed
    const handleSearch = async (value: string) => {
        setQuery(value)

        setLoading(true)
        const results = await searchCustomers(value)
        setCustomers(results)
        setLoading(false)
    }

    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single')
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)

    const handleSingleDelete = (customerId: string) => {
        setCustomerToDelete(customerId)
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
        if (passwordAction === 'single' && customerToDelete) {
            await deleteCustomer(customerToDelete)
            setCustomers(prev => prev.filter(c => c.id !== customerToDelete))
            if (selectedCustomers.includes(customerToDelete)) {
                setSelectedCustomers(prev => prev.filter(id => id !== customerToDelete))
            }
        } else if (passwordAction === 'bulk') {
            await Promise.all(selectedCustomers.map(id => deleteCustomer(id)))
            setCustomers(prev => prev.filter(c => !selectedCustomers.includes(c.id)))
            setSelectedCustomers([])
        }
        setLoading(false)
        setIsPasswordDialogOpen(false)
        setCustomerToDelete(null)
    }

    const toggleCustomerSelection = (customerId: string) => {
        setSelectedCustomers(prev =>
            prev.includes(customerId)
                ? prev.filter(id => id !== customerId)
                : [...prev, customerId]
        )
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

            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {selectedCustomers.length > 0 && `${selectedCustomers.length} selected`}
                </div>
                {selectedCustomers.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {loading && (
                    <div className="text-center text-muted-foreground py-8">
                        Loading customers...
                    </div>
                )}

                {!loading && customers.length === 0 && query.length > 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        No customers found matching "{query}".
                    </div>
                )}

                {!loading && customers.length === 0 && query.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        No customers yet. Create your first booking to add customers!
                    </div>
                )}

                {customers.map((customer) => (
                    <Card
                        key={customer.id}
                        className="cursor-pointer hover:bg-accent transition-colors relative group"
                        onClick={() => onSelect(customer)}
                    >
                        <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Checkbox
                                checked={selectedCustomers.includes(customer.id)}
                                onCheckedChange={() => toggleCustomerSelection(customer.id)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleSingleDelete(customer.id)
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
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

            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handlePasswordSuccess}
                title={passwordAction === 'bulk' ? "Delete Selected Customers" : "Delete Customer"}
                description={passwordAction === 'bulk'
                    ? `Are you sure you want to delete ${selectedCustomers.length} customers?`
                    : "Are you sure you want to delete this customer?"}
            />
        </div>
    )
}
