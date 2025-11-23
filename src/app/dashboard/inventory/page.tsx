"use client"

import { useState, useEffect } from "react"
import { getInventoryItems, addInventoryItem } from "@/actions/inventory"
import InventoryTable from "@/components/inventory/InventoryTable"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newItem, setNewItem] = useState({ name: "", quantity: 0, unit: "kg", minThreshold: 5 })

    const fetchItems = async () => {
        const data = await getInventoryItems("cafe")
        setItems(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const handleAddItem = async () => {
        setLoading(true)
        const result = await addInventoryItem({ ...newItem, businessUnit: "cafe" })
        if (result.success) {
            setIsAddOpen(false)
            setNewItem({ name: "", quantity: 0, unit: "kg", minThreshold: 5 })
            fetchItems()
        } else {
            alert("Failed to add item")
        }
        setLoading(false)
    }

    if (loading && items.length === 0) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Inventory Item</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Item Name</Label>
                                <Input
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Initial Quantity</Label>
                                    <Input
                                        type="number"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit</Label>
                                    <Select
                                        value={newItem.unit}
                                        onValueChange={(val) => setNewItem({ ...newItem, unit: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kg">kg</SelectItem>
                                            <SelectItem value="ltr">ltr</SelectItem>
                                            <SelectItem value="pcs">pcs</SelectItem>
                                            <SelectItem value="g">g</SelectItem>
                                            <SelectItem value="ml">ml</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Low Stock Threshold</Label>
                                <Input
                                    type="number"
                                    value={newItem.minThreshold}
                                    onChange={(e) => setNewItem({ ...newItem, minThreshold: parseFloat(e.target.value) })}
                                />
                            </div>
                            <Button className="w-full" onClick={handleAddItem}>Save Item</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <InventoryTable items={items} onUpdate={fetchItems} />
        </div>
    )
}
