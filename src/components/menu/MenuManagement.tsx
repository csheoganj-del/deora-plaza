"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search, Utensils, Tag, IndianRupee } from "lucide-react"
import { MenuItemDialog } from "./MenuItemDialog"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { deleteMenuItem } from "@/actions/menu"
import { getBusinessSettings } from "@/actions/businessSettings"
import { useRouter } from "next/navigation"
import { PremiumLiquidGlass, PremiumContainer, PremiumStatsCard } from "@/components/ui/glass/premium-liquid-glass"
import { Badge } from "@/components/ui/badge"

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
    const [passwordProtectionEnabled, setPasswordProtectionEnabled] = useState(true)

    useEffect(() => {
        getBusinessSettings().then(settings => {
            if (settings) {
                setPasswordProtectionEnabled(settings.enablePasswordProtection ?? true)
            }
        })
    }, [])

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

    const handleDelete = async (itemId: string, itemName: string) => {
        if (!passwordProtectionEnabled) {
            if (confirm(`Are you sure you want to delete ${itemName}?`)) {
                const result = await deleteMenuItem(itemId)
                if (result.success) {
                    setItems(prevItems => prevItems.filter(item => item.id !== itemId))
                    router.refresh()
                } else {
                    alert(`Failed to delete item: ${result.error || 'Unknown error'}`)
                }
            }
            return
        }
        setItemToDelete({ id: itemId, name: itemName })
        setPasswordAction('single')
        setIsPasswordDialogOpen(true)
    }

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) return

        if (!passwordProtectionEnabled) {
            if (confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) {
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
            return
        }

        setPasswordAction('bulk')
        setIsPasswordDialogOpen(true)
    }

    const handlePasswordSuccess = async (password: string) => {
        if (passwordAction === 'single' && itemToDelete) {
            const result = await deleteMenuItem(itemToDelete.id)

            if (result.success) {
                setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id))
                router.refresh()
            } else {
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

    // Stats
    const totalItems = items.length;
    const totalCategories = new Set(items.map(i => i.category)).size;
    const averagePrice = items.length > 0 ? (items.reduce((acc, curr) => acc + curr.price, 0) / items.length).toFixed(1) : "0";

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary">
                            <Utensils className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
                            Menu
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selectedItems.size > 0 && (
                        <Button
                            onClick={handleBulkDelete}
                            variant="destructive"
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete {selectedItems.size}
                        </Button>
                    )}
                    <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-white">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PremiumStatsCard
                    title="Total Items"
                    value={totalItems.toString()}
                    icon={<Utensils className="h-4 w-4 text-blue-400" />}
                />
                <PremiumStatsCard
                    title="Categories"
                    value={totalCategories.toString()}
                    icon={<Tag className="h-4 w-4 text-purple-400" />}
                />
                <PremiumStatsCard
                    title="Avg Price"
                    value={`₹${averagePrice}`}
                    icon={<IndianRupee className="h-4 w-4 text-green-400" />}
                />
            </div>

            <PremiumLiquidGlass className="flex flex-col" title="Menu Items">
                <div className="space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-96 pl-10 h-10 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                        />
                    </div>

                    <div className="border-b border-white/5 pb-1 w-full overflow-hidden">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeCategory === category
                                        ? "bg-white/10 text-white border border-white/20 shadow-lg"
                                        : "bg-transparent text-white/40 hover:bg-white/5"
                                        }`}
                                >
                                    {category}
                                    <span className="ml-1 opacity-50">
                                        ({category === "All" ? items.length : items.filter(i => i.category === category).length})
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar rounded-lg border border-white/5 bg-black/20">
                        {filteredItems.length === 0 ? (
                            <div className="text-center py-12 text-white/30">
                                <Utensils className="mx-auto h-12 w-12 opacity-50 mb-3" />
                                <p>No items found</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-white/60 font-medium border-b border-white/5">
                                    <tr>
                                        <th className="p-3 w-[50px]">
                                            <Checkbox
                                                checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                                                onCheckedChange={toggleSelectAll}
                                                className="border-white/20 data-[state=checked]:bg-primary"
                                            />
                                        </th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Price</th>
                                        <th className="p-3">Description</th>
                                        <th className="p-3 w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-3">
                                                <Checkbox
                                                    checked={selectedItems.has(item.id)}
                                                    onCheckedChange={() => toggleSelectItem(item.id)}
                                                    className="border-white/20 data-[state=checked]:bg-primary"
                                                />
                                            </td>
                                            <td className="p-3 font-medium text-white">{item.name}</td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/60 text-[10px]">
                                                    {item.category}
                                                </Badge>
                                            </td>
                                            <td className="p-3 font-bold text-white">₹{item.price}</td>
                                            <td className="p-3 text-white/40 max-w-xs truncate" title={item.description}>{item.description || '-'}</td>
                                            <td className="p-3">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#1a1a20] border-white/10 text-white">
                                                        <DropdownMenuItem onClick={() => handleEdit(item)} className="hover:bg-white/10 cursor-pointer">
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(item.id, item.name)}
                                                            className="text-red-400 hover:bg-white/10 hover:text-red-300 cursor-pointer"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </PremiumLiquidGlass>

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
                description={"Action cannot be undone."}
            />
        </div>
    )
}