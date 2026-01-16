"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type HotelSearchBarProps = {
    onSearch: (query: string) => void
    placeholder?: string
}

export default function HotelSearchBar({ onSearch, placeholder = "Search rooms or guests..." }: HotelSearchBarProps) {
    const [query, setQuery] = useState("")

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            onSearch(query)
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [query, onSearch])

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10 bg-white border-[#E5E7EB]"
            />
            {query && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuery("")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                >
                    <X className="h-4 w-4 text-white/50" />
                </Button>
            )}
        </div>
    )
}

