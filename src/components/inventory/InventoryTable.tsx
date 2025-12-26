"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2 } from "lucide-react"
import { StockUpdateDialog } from "./StockUpdateDialog"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { deleteInventoryItem } from "@/actions/inventory"
import { useRouter } from "next/navigation"

type InventoryTableProps = {
    items: any[]
    onUpdate: () => void
}

export default function InventoryTable({ items, onUpdate }: InventoryTableProps) {
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single')
    const [itemToDelete, setItemToDelete] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSingleDelete = (itemId: string) => {
        setItemToDelete(itemId)
        setPasswordAction('single')
        setIsPasswordDialogOpen(true)
    }

    const handleBulkDelete = () => {
        if (selectedItems.length === 0) return
        setPasswordAction('bulk')
        setIsPasswordDialogOpen(true)
    }

    const handlePasswordSuccess = async (password: string) => {
        // Password validation handled server-side
        setLoading(true)
        if (passwordAction === 'single' && itemToDelete) {
            await deleteInventoryItem(itemToDelete)
            if (selectedItems.includes(itemToDelete)) {
                setSelectedItems(prev => prev.filter(id => id !== itemToDelete))
            }
        } else if (passwordAction === 'bulk') {
            await Promise.all(selectedItems.map(id => deleteInventoryItem(id)))
            setSelectedItems([])
        }

        onUpdate()
        setLoading(false)
        setIsPasswordDialogOpen(false)
        setItemToDelete(null)
    }

    const toggleItemSelection = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        )
    }

    const toggleSelectAll = () => {
        if (selectedItems.length === items.length) {
            setSelectedItems([])
        } else {
            setSelectedItems(items.map(item => item.id))
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {selectedItems.length > 0 && `${selectedItems.length} selected`}
                </div>
                {selectedItems.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                    </Button>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={items.length > 0 && selectedItems.length === items.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Reorder Level</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedItems.includes(item.id)}
                                        onCheckedChange={() => toggleItemSelection(item.id)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{item.category}</Badge>
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell>{item.reorderLevel}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <StockUpdateDialog item={item} onUpdate={onUpdate} />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-[#FEE2E2]0 hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                                        onClick={() => handleSingleDelete(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handlePasswordSuccess}
                title={passwordAction === 'bulk' ? "Delete Selected Items" : "Delete Item"}
                description={passwordAction === 'bulk'
                    ? `Are you sure you want to delete ${selectedItems.length} items?`
                    : "Are you sure you want to delete this item?"}
            />
        </div>
    )
}

