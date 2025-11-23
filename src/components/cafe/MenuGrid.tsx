"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

type MenuItem = {
    id: string
    name: string
    price: number
    category: string
    description: string | null
}

type MenuGridProps = {
    items: MenuItem[]
    onAddItem: (item: MenuItem) => void
}

export default function MenuGrid({ items, onAddItem }: MenuGridProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("All")

    const categories = ["All", ...Array.from(new Set(items.map((item) => item.category)))]

    const filteredItems = selectedCategory === "All"
        ? items
        : items.filter((item) => item.category === selectedCategory)

    return (
        <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category)}
                        className="whitespace-nowrap"
                    >
                        {category}
                    </Button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filteredItems.map((item) => (
                    <Card
                        key={item.id}
                        className="cursor-pointer transition-all hover:shadow-md"
                        onClick={() => onAddItem(item)}
                    >
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-medium line-clamp-1">{item.name}</CardTitle>
                                <Badge variant="secondary" className="ml-2">₹{item.price}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                {item.description || item.category}
                            </p>
                            <Button size="sm" className="w-full" variant="secondary">
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
