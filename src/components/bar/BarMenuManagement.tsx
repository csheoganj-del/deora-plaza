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
import { BarMenuItemDialog } from "@/components/bar/BarMenuItemDialog"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { deleteDocument } from "@/lib/supabase/database"
import { useRouter } from "next/navigation"

interface MenuItem {
    id: string
    name: string
    price: number
    category: string
    description: string | null
    isAvailable: boolean
    businessUnit: string
    measurement?: string | null
    measurementUnit?: string | null
    baseMeasurement?: number | null
}

interface BarMenuManagementProps {
    initialDrinks: MenuItem[]
    initialFood: MenuItem[]
}

export default function BarMenuManagement({ initialDrinks, initialFood }: BarMenuManagementProps) {
    const router = useRouter()
    const [drinks, setDrinks] = useState(initialDrinks)
    const [food, setFood] = useState(initialFood)
    const [activeTab, setActiveTab] = useState<'drinks' | 'food'>('drinks')
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false)
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)

    const items = activeTab === 'drinks' ? drinks : food
    const setItems = activeTab === 'drinks' ? setDrinks : setFood

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

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item)
        setDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteDocument('menu_items', id)
            setItems(prev => prev.filter(item => item.id !== id))
            router.refresh()
        } catch (error) {
            console.error("Failed to delete item:", error)
            alert("Failed to delete item. Please try again.")
        }
    }

    const handleBulkDelete = () => {
        if (selectedItems.size === 0) return
        setIsPasswordDialogOpen(true)
    }

    const handlePasswordSuccess = async (password: string) => {
        const deletePromises = Array.from(selectedItems).map(id => deleteDocument('menu_items', id))
        const results = await Promise.allSettled(deletePromises)
        
        const successCount = results.filter(result => result.status === 'fulfilled').length
        
        if (successCount > 0) {
            setItems(prev => prev.filter(item => !selectedItems.has(item.id)))
            setSelectedItems(new Set())
            router.refresh()
        }
        
        if (results.some(result => result.status === 'rejected')) {
            alert(`${results.filter(result => result.status === 'rejected').length} items failed to delete`)
        }
        
        setIsPasswordDialogOpen(false)
    }

    const toggleSelectAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set())
        } else {
            setSelectedItems(new Set(items.map(item => item.id)))
        }
    }

    const toggleSelectItem = (id: string) => {
        const newSelected = new Set(selectedItems)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedItems(newSelected)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#111827]"></h1>
                    <p className="text-[#9CA3AF] mt-1">Manage your bar drinks and food items</p>
                </div>
                <Button onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('drinks')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 ${
                                activeTab === 'drinks'
                                    ? 'border-[#EDEBFF]0 text-[#6D5DFB]'
                                    : 'border-transparent text-[#9CA3AF] hover:text-[#111827]'
                            }`}
                        >
                            Drinks ({drinks.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('food')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 ${
                                activeTab === 'food'
                                    ? 'border-[#EDEBFF]0 text-[#6D5DFB]'
                                    : 'border-transparent text-[#9CA3AF] hover:text-[#111827]'
                            }`}
                        >
                            Food ({food.length})
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] h-4 w-4" />
                            <Input
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="border border-[#9CA3AF] rounded-md px-3 py-2 text-sm"
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                            <Button
                                variant={showDuplicatesOnly ? "default" : "outline"}
                                onClick={handleToggleDuplicates}
                                size="sm"
                            >
                                Duplicates
                            </Button>
                        </div>
                    </div>

                    {selectedItems.size > 0 && (
                        <div className="mb-4 flex items-center justify-between bg-[#EDEBFF]/30 p-3 rounded-md">
                            <span className="text-sm text-[#6D5DFB]">
                                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                            </span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected
                            </Button>
                        </div>
                    )}

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedItems.size === items.length && items.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-[#9CA3AF]">
                                            No items found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item) => (
                                        <TableRow key={item.id} className={item.isAvailable ? "" : "opacity-60"}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedItems.has(item.id)}
                                                    onCheckedChange={() => toggleSelectItem(item.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-sm text-[#9CA3AF]">
                                                    {item.description || "No description"}
                                                    {item.measurement && (
                                                        <span className="inline-block ml-2 px-2 py-0.5 bg-[#EDEBFF]/30 text-[#6D5DFB] text-xs rounded-full">
                                                            {item.measurement} {item.measurementUnit}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-medium text-[#111827]">
                                                    {item.category}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                ₹{item.price.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => {
                                                                if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                                                                    handleDelete(item.id)
                                                                }
                                                            }}
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
                </div>
            </div>

            <BarMenuItemDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editingItem={editingItem}
                businessUnit={activeTab}
                onSuccess={() => {
                    router.refresh()
                    // Refresh the data
                    fetch('/api/bar/menu')
                        .then(res => res.json())
                        .then(data => {
                            setDrinks(data.drinks)
                            setFood(data.food)
                        })
                }}
            />

            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handlePasswordSuccess}
                title="Delete Selected Items"
                description={`Are you sure you want to delete ${selectedItems.size} items? This action cannot be undone.`}
            />
        </div>
    )
}

