"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createMenuItem, updateMenuItem } from "@/actions/menu"
import { useRouter } from "next/navigation"

interface MenuItemDialogProps {
    isOpen: boolean
    onClose: () => void
    item?: any
}

export function MenuItemDialog({ isOpen, onClose, item }: MenuItemDialogProps) {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        businessUnit: "shared"
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || "",
                description: item.description || "",
                price: item.price?.toString() || "",
                category: item.category || "",
                businessUnit: item.businessUnit || "shared"
            })
        } else {
            setFormData({
                name: "",
                description: "",
                price: "",
                category: "",
                businessUnit: "shared"
            })
        }
    }, [item, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Prevent double submission
        if (submitting) return

        setSubmitting(true)

        try {
            const data = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category,
                businessUnit: formData.businessUnit
            }

            let result
            if (item) {
                result = await updateMenuItem(item.id, data)
            } else {
                result = await createMenuItem(data)
            }

            if (result.success) {
                router.refresh()
                onClose()
            } else {
                alert("Failed to save menu item")
            }
        } catch (error) {
            console.error(error)
            alert("An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit" : "Add"} Menu Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="category">Category *</Label>
                        <Input
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="e.g., Beverages, Snacks, Main Course"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="price">Price (₹) *</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
