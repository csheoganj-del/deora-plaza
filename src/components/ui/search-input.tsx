"use client"

import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { debounce } from '@/lib/performance'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  placeholder?: string
  onSearch: (query: string) => void
  debounceMs?: number
  className?: string
  autoFocus?: boolean
}

export function SearchInput({ 
  placeholder = "Search...", 
  onSearch, 
  debounceMs = 300,
  className,
  autoFocus = false
}: SearchInputProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query)
    }, debounceMs),
    [onSearch, debounceMs]
  )

  // Trigger search on value change
  useEffect(() => {
    debouncedSearch(value)
  }, [value, debouncedSearch])

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear()
      e.currentTarget.blur()
    }
  }

  return (
    <div className={cn("relative group", className)}>
      <Search className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
        isFocused ? "text-[#F59E0B]" : "text-[#9CA3AF]"
      )} />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        className={cn(
          "pl-10 pr-10 transition-all",
          isFocused && "ring-2 ring-[#FEF3C7]0 border-[#FEF3C7]0"
        )}
        aria-label="Search"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F1F5F9]"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

/**
 * Enhanced search with filters
 */
interface SearchWithFiltersProps extends SearchInputProps {
  filters?: {
    label: string
    value: string
    active: boolean
  }[]
  onFilterChange?: (filterValue: string) => void
}

export function SearchWithFilters({
  filters,
  onFilterChange,
  ...searchProps
}: SearchWithFiltersProps) {
  return (
    <div className="space-y-3">
      <SearchInput {...searchProps} />
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={filter.active ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange?.(filter.value)}
              className={cn(
                "text-xs transition-all",
                filter.active && "bg-[#F59E0B]/100 hover:bg-[#F59E0B] text-white"
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

