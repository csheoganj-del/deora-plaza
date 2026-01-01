"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"

type MenuItem = {
    id: string
    name: string
    price: number
    category: string
    description: string | null
}

type CartItem = {
    id: string // menuItemId
    name: string
    price: number
    quantity: number
}

type MenuGridProps = {
    items: MenuItem[]
    onAddItem: (item: MenuItem, quantityChange: number) => void // Modified signature
    cartItems: CartItem[] // Added cartItems prop
}

export default function MenuGrid({ items, onAddItem, cartItems }: MenuGridProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("All")
    const [searchQuery, setSearchQuery] = useState("")


    const categories = ["All", ...Array.from(new Set(items.map((item) => item.category)))]


    const filteredItems = items.filter((item) => {
        const categoryMatch = selectedCategory === "All" || item.category === selectedCategory
        const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
        return categoryMatch && searchMatch
    })

    return (
        <div className="space-y-4 h-full flex flex-col bg-white p-4 rounded-lg">
            {/* Search Bar */}
            <div className="flex-shrink-0 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-[#9CA3AF]" />
                <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-[#9CA3AF] rounded-lg focus:outline-none focus:border-[#6D5DFB] focus:ring-2 focus:ring-[#EDEBFF]/40"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#6B7280]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>



            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0 bg-[#F8FAFC] p-2 rounded-lg border border-[#E5E7EB] w-full max-w-full">
                {categories.map((category) => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category)}
                        className={`whitespace-nowrap font-semibold text-sm px-3 py-1.5 ${
                            selectedCategory === category 
                                ? 'bg-[#6D5DFB] text-white shadow-md' 
                                : 'border-2 bg-white text-[#111827] hover:bg-[#F1F5F9]'
                        }`}
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"> {/* Updated to responsive grid with more columns */}
                    {filteredItems.map((item) => {
                        const currentQuantity = cartItems.find((cartItem) => cartItem.id === item.id)?.quantity || 0;

                        return (
                            <div 
                                key={item.id}
                                className="premium-card flex items-center justify-between p-3 rounded-lg shadow-sm transition-all hover:shadow-md hover:border-[var(--rajasthani-teal-light)] active:scale-98"
                            >
                                <div className="flex-1 min-w-0">
                                    <h2
                                        className="text-base font-bold text-[#111827] leading-snug cursor-pointer hover:underline"
                                        onClick={() => onAddItem(item, 1)} // Add item on name click
                                    >
                                        {item.name}
                                    </h2>
                                    {item.description && (
                                        <p className="text-xs text-[#6B7280] line-clamp-1">
                                            {item.description}
                                        </p>
                                    )}
                                    <Badge className="mt-1 bg-white text-[var(--rajasthani-teal)] px-2 py-1 text-xs font-semibold rounded-full shadow-sm">
                                        {item.category}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-md font-bold text-[#111827]">
                                        ₹{item.price}
                                    </span>
                                    {/* Quantity Selector */}
                                    <div className="flex items-center border border-[#9CA3AF] rounded-md">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-[var(--rajasthani-teal)] hover:bg-[#F1F5F9] p-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onAddItem(item, -1)
                                            }}
                                            disabled={currentQuantity === 0}
                                        >
                                            -
                                        </Button>
                                        <span className="w-7 text-center text-sm font-semibold text-[#111827]">
                                            {currentQuantity}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-[var(--rajasthani-teal)] hover:bg-[#F1F5F9] p-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onAddItem(item, 1)
                                            }}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

