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
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, ArrowRightLeft } from "lucide-react"
import { MenuItemDialog } from "./MenuItemDialog"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { BulkMoveDialog } from "./BulkMoveDialog"
import { bulkUpdateMenuItems, deleteMenuItem, getMenuItems } from "@/actions/menu"
import { useRouter } from "next/navigation"
import { CategoryManager } from "@/components/menu/CategoryManager"
import { FolderTree } from "lucide-react"
import { getCategories, Category } from "@/actions/categories"
import { toast } from "@/hooks/use-toast"

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

    const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false)

    // Load categories on mount
    // Load categories on mount
    useEffect(() => {
        if (!isCategoriesLoaded) {
            import("@/actions/categories").then(({ getCategories }) => {
                getCategories("all").then((data) => {
                    setCategories(data)
                    setIsCategoriesLoaded(true)
                })
            })
        }
    }, [isCategoriesLoaded])

    // Filter categories for the tabs: Only show Root categories (no parent) and "All"
    const displayCategories = [
        "All",
        ...categories
            .filter(c => !c.parent_id) // Only root categories
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) // Sort by order
            .map(c => c.name)
    ]
    // Filter out potential duplicates just in case until DB is cleaned
    const uniqueDisplayCategories = Array.from(new Set(displayCategories));

    // Find duplicates based on name
    const duplicateNames = new Set(
        items
            .map(item => item.name.toLowerCase())
            .filter((name, index, arr) => arr.indexOf(name) !== arr.lastIndexOf(name))
    )

    const duplicateItems = items.filter(item => duplicateNames.has(item.name.toLowerCase()))

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())

        // Revised Category Matching Logic
        let matchesCategory = false;
        if (selectedCategory === "All") {
            matchesCategory = true;
        } else {
            // Find the selected category object
            const selectedCatObj = categories.find(c => c.name === selectedCategory);

            if (selectedCatObj) {
                // If it's a known category, check if item belongs to it OR any of its children
                const childCategoryIds = new Set(
                    categories
                        .filter(c => c.parent_id === selectedCatObj.id)
                        .map(c => c.id)
                );

                // Item is a match if:
                // 1. Its category_id matches the selected category
                // 2. Its category_id matches a child category
                // 3. (Legacy) Its text category matches the selected category name
                // 4. (Legacy) Its text category matches a child category name

                const itemCatName = item.category;
                const itemCatId = item.category_id;

                // Check by ID (preferred)
                if (itemCatId) {
                    matchesCategory = itemCatId === selectedCatObj.id || childCategoryIds.has(itemCatId);
                }
                // Fallback: Check by Name
                else if (itemCatName) {
                    matchesCategory = itemCatName === selectedCategory ||
                        categories.some(c => c.name === itemCatName && c.parent_id === selectedCatObj.id);
                }
            } else {
                // Should technically not happen if filtered correctly, but fallback to direct string match
                matchesCategory = item.category === selectedCategory;
            }
        }

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

    const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false)

    const handleBulkMoveConfirm = async (categoryId: string, categoryName: string) => {
        const selectedIds = Array.from(selectedItems)
        const result = await bulkUpdateMenuItems(selectedIds, {
            category: categoryName,
            category_id: categoryId
        })

        if (result.success) {
            toast({
                title: "Items moved successfully",
                description: `Moved ${selectedIds.length} items to ${categoryName}`
            })
            setItems(prev => prev.map(item =>
                selectedIds.includes(item.id)
                    ? { ...item, category: categoryName, category_id: categoryId }
                    : item
            ))
            setSelectedItems(new Set()) // Clear selection
        } else {
            toast({
                title: "Failed to move items",
                description: result.error,
                variant: "destructive"
            })
        }
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
                <div>
                    <h1 className="text-3xl font-bold text-[hsl(var(--charcoal-text))]">Menu Management</h1>
                    <p className="text-[#9CA3AF] mt-1">Manage items for all business units</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCategoryManagerOpen(true)}>
                        <FolderTree className="mr-2 h-4 w-4" />
                        Manage Categories
                    </Button>
                    {selectedItems.size > 0 && (
                        <>
                            <Button
                                onClick={() => setIsBulkMoveOpen(true)}
                                variant="outline"
                                className="mr-2"
                            >
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                Move {selectedItems.size} Items
                            </Button>
                            <Button
                                onClick={handleBulkDelete}
                                variant="destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete {selectedItems.size} Selected
                            </Button>
                        </>
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                    <Button
                        variant={showDuplicatesOnly ? "secondary" : "outline"}
                        onClick={handleToggleDuplicates}
                        className={`h-9 ${showDuplicatesOnly ? "text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100" : "text-[#6B7280]"}`}
                        title="Same name across categories"
                    >
                        {showDuplicatesOnly ? `Showing ${duplicateItems.length} Duplicates` : "Show Duplicate Items"}
                    </Button>
                </div>

                {/* Categories - Horizontal Scroll */}
                <div className="w-full border-b border-[#F1F5F9] pb-1">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
                        {uniqueDisplayCategories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`
                                    whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all
                                    ${selectedCategory === category
                                        ? "bg-[#111827] text-white shadow-md"
                                        : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F8FAFC] hover:border-[#9CA3AF]"}
                                `}
                            >
                                {category}
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

            <CategoryManager
                isOpen={categoryManagerOpen}
                onClose={() => setCategoryManagerOpen(false)}
            />

            <BulkMoveDialog
                isOpen={isBulkMoveOpen}
                onClose={() => setIsBulkMoveOpen(false)}
                onConfirm={handleBulkMoveConfirm}
                selectedCount={selectedItems.size}
            />
        </div>
    )
}

