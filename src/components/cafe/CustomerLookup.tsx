"use client";

import { useState, useEffect, useRef } from "react";
import { getCustomerSuggestions } from "@/actions/customers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


import { Search, Star, Award, Crown, User } from "lucide-react";

type CustomerLookupProps = {
  onSelectCustomer: (customer: any) => void;
};

export default function CustomerLookup({
  onSelectCustomer,
}: CustomerLookupProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      const results = await getCustomerSuggestions(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setLoading(false);
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setQuery(customer.name);
    setShowSuggestions(false);
    onSelectCustomer(customer);
  };

  const handleClearSelection = () => {
    setSelectedCustomer(null);
    setQuery("");
    setSuggestions([]);
    onSelectCustomer(null);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "gold":
        return <Crown className="h-4 w-4 text-[#F59E0B]" />;
      case "silver":
        return <Award className="h-4 w-4 text-[#9CA3AF]" />;
      case "bronze":
        return <Star className="h-4 w-4 text-orange-600" />;
      default:
        return <User className="h-4 w-4 text-[#9CA3AF]" />;
    }
  };

  const getTierBadge = (tier: string) => {
    const colors: any = {
      gold: "bg-[#F59E0B]/10 text-[#F59E0B]800 border-[#F59E0B]/20/20300",
      silver: "bg-[#F1F5F9] text-[#111827] border-[#9CA3AF]",
      bronze: "bg-orange-100 text-orange-800 border-orange-300",
      none: "bg-[#F8FAFC] text-[#6B7280]",
    };
    return colors[tier] || colors.none;
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <div className="relative">
        <Input
          placeholder="Type customer name or mobile number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className="pr-10"
        />
        {selectedCustomer && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-7 w-7 p-0"
            onClick={handleClearSelection}
          >
            ✕
          </Button>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {suggestions.map((customer) => (
              <div
                key={customer.id}
                className="p-3 hover:bg-[#F8FAFC] cursor-pointer border-b last:border-b-0 transition-colors"
                onClick={() => handleSelectCustomer(customer)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTierIcon(customer.discountTier)}
                      <h4 className="font-semibold text-sm truncate">
                        {customer.name}
                      </h4>
                    </div>
                    <p className="text-xs text-[#9CA3AF] mb-1">
                      📱 {customer.mobileNumber}
                    </p>
                    <div className="flex gap-3 text-xs text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{customer.visitCount || 0}</span> visits
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">₹{(customer.totalSpent || 0).toLocaleString()}</span> spent
                      </span>
                    </div>
                  </div>
                  <Badge className={getTierBadge(customer.discountTier)}>
                    {customer.discountTier?.toUpperCase() || 'NEW'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Customer Card */}
      {selectedCustomer && (
        <div className="premium-card">
          <div className="p-8 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{selectedCustomer.name}</h3>
                {getTierIcon(selectedCustomer.discountTier)}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedCustomer.mobileNumber}
              </p>
            </div>
            <div className="flex justify-between items-center mt-2">
              <Badge className={getTierBadge(selectedCustomer.discountTier)}>
                {selectedCustomer.discountTier?.toUpperCase() || 'NEW'} TIER
              </Badge>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {selectedCustomer.visitCount || 0} visits • ₹
                  {(selectedCustomer.totalSpent || 0).toLocaleString()}
                </p>
              </div>
            </div>
            {selectedCustomer.discountTier && selectedCustomer.discountTier !== "none" && (
              <div className="mt-2 text-sm text-[#22C55E] font-medium">
                🎉 Loyalty discount will be applied!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

