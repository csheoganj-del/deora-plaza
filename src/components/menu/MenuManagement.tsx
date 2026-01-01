"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search } from "lucide-react"
import { MenuItemDialog } from "./MenuItemDialog"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { deleteMenuItem, getMenuItems } from "@/actions/menu"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface MenuManagementProps {
    initialItems: any[]
}

export default function MenuManagement({ initialItems }: MenuManagementProps) {
    const router = useRouter()
    const [items, setItems] = useState(initialItems)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeCategory, setActiveCategory] = useState("All")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single')
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null)

    // Get unique categories from items
    const categories = ["All", ...Array.from(new Set(items.map(item => item.category))).sort()]

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = activeCategory === "All" || item.category === activeCategory
        return matchesSearch && matchesCategory
    })

    const handleAdd = () => {
        setEditingItem(null)
        setDialogOpen(true)
    }

    const handleEdit = (item: any) => {
        setEditingItem(item)
        setDialogOpen(true)
    }

    const handleDelete = (itemId: string, itemName: string) => {
        setItemToDelete({ id: itemId, name: itemName })
        setPasswordAction('single')
        setIsPasswordDialogOpen(true)
    }

    const handleBulkDelete = () => {
        if (selectedItems.size === 0) return
        setPasswordAction('bulk')
        setIsPasswordDialogOpen(true)
    }

    const handlePasswordSuccess = async (password: string) => {
        if (passwordAction === 'single' && itemToDelete) {
            console.log("Deleting menu item:", itemToDelete.id, itemToDelete.name)
            const result = await deleteMenuItem(itemToDelete.id)
            console.log("Delete result:", result)

            if (result.success) {
                setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id))
                router.refresh()
            } else {
                console.error("Delete failed:", result.error)
                alert(`Failed to delete item: ${result.error || 'Unknown error'}`)
            }
        } else if (passwordAction === 'bulk') {
            const deletePromises = Array.from(selectedItems).map(id => deleteMenuItem(id))
            const results = await Promise.all(deletePromises)

            const successCount = results.filter(r => r.success).length

            if (successCount > 0) {
                setItems(prevItems => prevItems.filter(item => !selectedItems.has(item.id)))
                setSelectedItems(new Set())
                router.refresh()
            }

            if (results.some(r => !r.success)) {
                const errors = results.filter(r => !r.success).map(r => r.error).join(', ')
                alert(`Some items failed to delete: ${errors}`)
            }
        }

        setIsPasswordDialogOpen(false)
        setItemToDelete(null)
        setPasswordAction('single')
    }

    const toggleSelectAll = () => {
        if (selectedItems.size === filteredItems.length) {
            setSelectedItems(new Set())
        } else {
            setSelectedItems(new Set(filteredItems.map(item => item.id)))
        }
    }

    const toggleSelectItem = (itemId: string) => {
        const newSelected = new Set(selectedItems)
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId)
        } else {
            newSelected.add(itemId)
        }
        setSelectedItems(newSelected)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {selectedItems.size > 0 && (
                        <Button
                            onClick={handleBulkDelete}
                            variant="destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete {selectedItems.size} Selected
                        </Button>
                    )}
                    <Button onClick={handleAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-center w-full">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
                        <Input
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>

                {/* Category tabs with proper filtering */}
                <div className="w-full border-b border-[#F1F5F9] pb-1">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    activeCategory === category
                                        ? "bg-[#111827] text-white shadow-md"
                                        : "bg-[#F8FAFC] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#374151]"
                                }`}
                            >
                                {category}
                                {category !== "All" && (
                                    <span className="ml-1 text-xs opacity-75">
                                        ({items.filter(item => item.category === category).length})
                                    </span>
                                )}
                                {category === "All" && (
                                    <span className="ml-1 text-xs opacity-75">
                                        ({items.length})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="premium-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-[#9CA3AF] py-8">
                                    No menu items found. Click "Add Item" to create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => (
                                <TableRow key={item.id} className="hover:bg-[#F8FAFC]/80 group transition-colors">
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedItems.has(item.id)}
                                            onCheckedChange={() => toggleSelectItem(item.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-[#111827]">{item.name}</TableCell>
                                    <TableCell className="text-[#9CA3AF]">{item.category}</TableCell>
                                    <TableCell className="font-bold font-mono text-[#111827]">₹{item.price}</TableCell>
                                    <TableCell className="max-w-xs truncate text-[#9CA3AF]" title={item.description || ""}>
                                        {item.description || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className="text-[#EF4444]"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <MenuItemDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                item={editingItem}
            />

            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handlePasswordSuccess}
                title={passwordAction === 'bulk' ? "Delete Selected Items" : "Delete Item"}
                description={passwordAction === 'bulk'
                    ? `Are you sure you want to delete ${selectedItems.size} items?`
                    : `Are you sure you want to delete "${itemToDelete?.name}"?`}
            />
        </div>
    )
}