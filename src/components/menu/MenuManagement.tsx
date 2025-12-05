"use client"

import { useState } from "react"
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
import { deleteMenuItem } from "@/actions/menu"
import { useRouter } from "next/navigation"

interface MenuManagementProps {
    initialItems: any[]
}

export default function MenuManagement({ initialItems }: MenuManagementProps) {
    const router = useRouter()
    const [items, setItems] = useState(initialItems)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false)

    const categories = ["All", ...Array.from(new Set(items.map(item => item.category)))]

    // Find duplicates based on name
    const duplicateNames = new Set(
        items
            .map(item => item.name.toLowerCase())
            .filter((name, index, arr) => arr.indexOf(name) !== arr.lastIndexOf(name))
    )

    const duplicateItems = items.filter(item => duplicateNames.has(item.name.toLowerCase()))

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
        const matchesDuplicateFilter = !showDuplicatesOnly || duplicateNames.has(item.name.toLowerCase())
        return matchesSearch && matchesCategory && matchesDuplicateFilter
    })

    const handleAdd = () => {
        setEditingItem(null)
        setDialogOpen(true)
    }

    const handleToggleDuplicates = () => {
        const newShowDuplicates = !showDuplicatesOnly
        setShowDuplicatesOnly(newShowDuplicates)

        if (newShowDuplicates && duplicateItems.length > 0) {
            // Auto-select duplicates, keeping only the FIRST occurrence of each name
            const nameSeen = new Set<string>()
            const duplicatesToSelect = new Set<string>()

            // Iterate through ALL items to maintain order
            items.forEach(item => {
                const lowerName = item.name.toLowerCase()

                // Only process items that are duplicates
                if (duplicateNames.has(lowerName)) {
                    if (nameSeen.has(lowerName)) {
                        // This is a duplicate occurrence, select it for deletion
                        duplicatesToSelect.add(item.id)
                    } else {
                        // This is the first occurrence, keep it (don't select)
                        nameSeen.add(lowerName)
                    }
                }
            })

            setSelectedItems(duplicatesToSelect)
        } else {
            setSelectedItems(new Set())
        }
    }

    const handleEdit = (item: any) => {
        setEditingItem(item)
        setDialogOpen(true)
    }

    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single')
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null)

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
        if (password !== "KappuLokuHimu#1006") {
            throw new Error("Incorrect password")
        }

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

            if (successCount < selectedItems.size) {
                alert(`Deleted ${successCount} of ${selectedItems.size} items. Some deletions failed.`)
            }
        }
        setIsPasswordDialogOpen(false)
        setItemToDelete(null)
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
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
                    <p className="text-gray-600 mt-1">Manage items for all business units</p>
                </div>
                <div className="flex gap-2">
                    {selectedItems.size > 0 && (
                        <Button
                            onClick={handleBulkDelete}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete {selectedItems.size} Selected
                        </Button>
                    )}
                    <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button
                    variant={showDuplicatesOnly ? "default" : "outline"}
                    onClick={handleToggleDuplicates}
                    className={showDuplicatesOnly ? "bg-orange-600 hover:bg-orange-700" : ""}
                >
                    {showDuplicatesOnly ? `Showing ${duplicateItems.length} Duplicates` : "Show Duplicates Only"}
                </Button>
                <div className="flex gap-2">
                    {categories.map(category => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            onClick={() => setSelectedCategory(category)}
                            size="sm"
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="border rounded-lg">
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
                                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                    No menu items found. Click "Add Item" to create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedItems.has(item.id)}
                                            onCheckedChange={() => toggleSelectItem(item.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>₹{item.price}</TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {item.description || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
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
                                                    className="text-red-600"
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
