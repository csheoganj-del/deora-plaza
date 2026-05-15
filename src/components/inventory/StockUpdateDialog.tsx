"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateStock } from "@/actions/inventory"
import { Plus, Minus } from "lucide-react"

type StockUpdateDialogProps = {
    item: any
    onUpdate: () => void
}

export function StockUpdateDialog({ item, onUpdate }: StockUpdateDialogProps) {
    const [open, setOpen] = useState(false)
    const [quantity, setQuantity] = useState("")
    const [loading, setLoading] = useState(false)

    const handleUpdate = async (type: "add" | "remove") => {
        const qty = parseFloat(quantity)
        if (isNaN(qty) || qty <= 0) return

        setLoading(true)
        const result = await updateStock(item.id, qty, type)
        if (result.success) {
            setOpen(false)
            setQuantity("")
            onUpdate()
        } else {
            alert("Failed to update stock")
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Update Stock</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Stock: {item.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current Stock:</span>
                        <span className="font-bold text-lg">{item.quantity} {item.unit}</span>
                    </div>
                    <div className="space-y-2">
                        <Label>Quantity to Adjust</Label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter amount"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="destructive"
                            onClick={() => handleUpdate("remove")}
                            disabled={loading || !quantity}
                        >
                            <Minus className="mr-2 h-4 w-4" /> Remove
                        </Button>
                        <Button
                            onClick={() => handleUpdate("add")}
                            disabled={loading || !quantity}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

