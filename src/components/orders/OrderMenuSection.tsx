// OrderMenuSection component - Handles menu display and filtering
// Extracted from TakeawayOrderDialog for better maintainability

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MenuItem } from "@/hooks/useTakeawayOrder";

interface OrderMenuSectionProps {
  query: string;
  setQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  filteredMenuItems: MenuItem[];
  isLoading: boolean;
  error: string | null;
  barMenuMode?: 'drinks' | 'food';
  setBarMenuMode?: (mode: 'drinks' | 'food') => void;
  businessUnit: string;
  onAddItem: (item: MenuItem) => void;
}

export function OrderMenuSection({
  query,
  setQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  filteredMenuItems,
  isLoading,
  error,
  barMenuMode,
  setBarMenuMode,
  businessUnit,
  onAddItem
}: OrderMenuSectionProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[#FEE2E2]0">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] h-4 w-4" />
          <Input
            placeholder="Search menu items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Category" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Bar-specific menu mode toggle */}
        {businessUnit === 'bar' && setBarMenuMode && (
          <div className="flex gap-2">
            <Button
              variant={barMenuMode === 'drinks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBarMenuMode('drinks')}
            >
              Drinks
            </Button>
            <Button
              variant={barMenuMode === 'food' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBarMenuMode('food')}
            >
              Food
            </Button>
          </div>
        )}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMenuItems.map((item) => (
          <div className="premium-card hover:shadow-md transition-shadow">
            <div className="p-8 p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="ml-2">
                  {item.category}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center mt-3">
                <span className="text-lg font-bold text-primary">
                  ₹{item.price.toFixed(2)}
                </span>
                <Button
                  size="sm"
                  onClick={() => onAddItem(item)}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredMenuItems.length === 0 && !isLoading && !error && (
        <div className="text-center py-8">
          <p className="text-[#9CA3AF]">No menu items found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

