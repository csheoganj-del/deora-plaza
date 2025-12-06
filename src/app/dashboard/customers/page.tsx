"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
import CustomerList from "@/components/crm/CustomerList"
import CustomerProfile from "@/components/crm/CustomerProfile"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCustomer } from "@/actions/customers"

export default function CustomersPage() {
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newCustomer, setNewCustomer] = useState({ name: "", mobileNumber: "", email: "" })

    const handleCreate = async () => {
        const result = await createCustomer(newCustomer)
        if (result.success) {
            setSelectedCustomerId(newCustomer.mobileNumber)
            setIsCreateOpen(false)
            setNewCustomer({ name: "", mobileNumber: "", email: "" })
        } else {
            alert("Failed to create customer")
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4">
            <div className="w-80 flex flex-col border-r pr-4">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Customers</h1>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="icon" variant="outline">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className="elevation-1 tilt-3d"
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
                            <DialogHeader>
                                <DialogTitle>Add New Customer</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={newCustomer.name}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mobile Number</Label>
                                    <Input
                                        value={newCustomer.mobileNumber}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, mobileNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email (Optional)</Label>
                                    <Input
                                        value={newCustomer.email}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    />
                                </div>
                                <Button className="w-full" onClick={handleCreate}>Save Customer</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <CustomerList onSelect={(c) => setSelectedCustomerId(c.id)} />
            </div>

            <div className="flex-1 overflow-y-auto pl-4">
                {selectedCustomerId ? (
                    <CustomerProfile customerId={selectedCustomerId} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Users className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-xl">Select a customer to view details</p>
                    </div>
                )}
            </div>
        </div>
    )
}
