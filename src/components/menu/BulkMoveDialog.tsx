"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getCategories, Category } from "@/actions/categories"
import { Loader2 } from "lucide-react"

interface BulkMoveDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (categoryId: string, categoryName: string) => Promise<void>
    selectedCount: number
}

export function BulkMoveDialog({
    isOpen,
    onClose,
    onConfirm,
    selectedCount,
}: BulkMoveDialogProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadCategories()
            setSelectedCategory("")
        }
    }, [isOpen])

    const loadCategories = async () => {
        setIsLoading(true)
        const data = await getCategories('all')
        setCategories(data)
        setIsLoading(false)
    }

    const handleConfirm = async () => {
        if (!selectedCategory) return

        setIsSaving(true)
        const categoryObj = categories.find(c => c.id === selectedCategory)
        if (categoryObj) {
            await onConfirm(selectedCategory, categoryObj.name)
        }
        setIsSaving(false)
        onClose()
    }

    // Filter to show logical groupings
    const parentCategories = categories.filter(c => !c.parent_id)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Move Items</DialogTitle>
                    <DialogDescription>
                        Move {selectedCount} selected item{selectedCount !== 1 ? 's' : ''} to a new category.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                            Category
                        </Label>
                        <div className="col-span-3">
                            <Select
                                value={selectedCategory}
                                onValueChange={setSelectedCategory}
                                disabled={isLoading || isSaving}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select destination..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {parentCategories.map(parent => (
                                        <div key={parent.id}>
                                            <SelectItem value={parent.id} className="font-semibold">
                                                {parent.name}
                                            </SelectItem>
                                            {categories
                                                .filter(c => c.parent_id === parent.id)
                                                .map(child => (
                                                    <SelectItem key={child.id} value={child.id} className="pl-6">
                                                        — {child.name}
                                                    </SelectItem>
                                                ))
                                            }
                                        </div>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedCategory || isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Move Items
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

