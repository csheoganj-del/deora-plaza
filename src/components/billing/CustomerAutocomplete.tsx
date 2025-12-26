"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getCustomerSuggestions } from "@/actions/customers";
import { getTierColor, getTierDisplayName } from "@/lib/discount-utils";
import { Search, User, X, Phone, Crown } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  mobileNumber: string;
  discountTier: string;
  customDiscountPercent?: number;
  totalSpent: number;
  visitCount: number;
  lastVisit: string | null;
};

type CustomerAutocompleteProps = {
  onCustomerSelect: (customer: Customer | null) => void;
  onNameChange?: (name: string) => void;
  onMobileChange?: (mobile: string) => void;
  initialName?: string;
  initialMobile?: string;
  compact?: boolean;
};

export default function CustomerAutocomplete({
  onCustomerSelect,
  onNameChange,
  onMobileChange,
  initialName = "",
  initialMobile = "",
  compact = false,
}: CustomerAutocompleteProps) {
  const [name, setName] = useState(initialName);
  const [mobile, setMobile] = useState(initialMobile);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const searchQuery = name || mobile;
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Only search if we are NOT in selected mode (meaning the user is typing)
    if (selectedCustomer) return;

    const debounce = setTimeout(async () => {
      setLoading(true);
      const results = await getCustomerSuggestions(searchQuery);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setLoading(false);
    }, 300);

    return () => clearTimeout(debounce);
  }, [name, mobile, selectedCustomer]);

  const handleSelectCustomer = (customer: Customer) => {
    setName(customer.name);
    setMobile(customer.mobileNumber);
    setSelectedCustomer(customer);
    setShowSuggestions(false);
    onCustomerSelect(customer);

    if (onNameChange) onNameChange(customer.name);
    if (onMobileChange) onMobileChange(customer.mobileNumber);
  };

  const clearSelection = () => {
    setName("");
    setMobile("");
    setSelectedCustomer(null);
    setShowSuggestions(false);
    onCustomerSelect(null);
    if (onNameChange) onNameChange("");
    if (onMobileChange) onMobileChange("");
  }

  const handleNameChange = (value: string) => {
    setName(value);
    setSelectedCustomer(null); // Clear selected if typing
    if (onNameChange) onNameChange(value);
    if (!value) {
      onCustomerSelect(null);
    }
  };

  const handleMobileChange = (value: string) => {
    setMobile(value);
    setSelectedCustomer(null); // Clear selected if typing
    if (onMobileChange) onMobileChange(value);
    if (!value) {
      onCustomerSelect(null);
    }
  };

  // If we have a selected customer, show the "Selected Card" view
  if (selectedCustomer) {
    return (
      <div className="bg-[#EDEBFF] border border-[#EDEBFF] rounded-lg p-3 relative group">
        <button
          onClick={clearSelection}
          className="absolute top-2 right-2 text-[#6D5DFB] hover:text-[#5B4EE5] p-1 rounded-full hover:bg-[#EDEBFF] transition-colors"
          title="Remove Customer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-[#EDEBFF] flex items-center justify-center flex-shrink-0">
            <span className="text-[#5B4EE5] font-bold text-lg">
              {selectedCustomer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-semibold text-[#111827] flex items-center gap-2">
              {selectedCustomer.name}

              {selectedCustomer.discountTier !== 'basic' && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border-0 ${getTierColor(selectedCustomer.discountTier as any)}`}>
                  <Crown className="w-3 h-3 mr-1" />
                  {getTierDisplayName(selectedCustomer.discountTier as any)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-[#6B7280]">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {selectedCustomer.mobileNumber}
              </div>
              <div className="text-[#9CA3AF]">|</div>
              <div className="text-[#9CA3AF] font-medium">
                {selectedCustomer.visitCount} visits
              </div>
              <div className="text-[#9CA3AF]">|</div>
              <div className="text-[#111827] font-semibold">
                ₹{selectedCustomer.totalSpent.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-3">
      {/* Search Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Label htmlFor="customer-search-name" className="sr-only">Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
            <Input
              id="customer-search-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Search by Name"
              className="pl-9 bg-[#F8FAFC] border-[#E5E7EB] focus:bg-white transition-all shadow-sm focus:ring-2 focus:ring-[#EDEBFF] focus:border-indigo-300"
              autoComplete="off"
            />
            {name && (
              <button
                onClick={() => handleNameChange("")}
                className="absolute right-2 top-2.5 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <Label htmlFor="customer-search-mobile" className="sr-only">Mobile</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
            <Input
              id="customer-search-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => handleMobileChange(e.target.value)}
              placeholder="Search by Mobile"
              className="pl-9 bg-[#F8FAFC] border-[#E5E7EB] focus:bg-white transition-all shadow-sm focus:ring-2 focus:ring-[#EDEBFF] focus:border-indigo-300"
              autoComplete="off"
            />
            {mobile && (
              <button
                onClick={() => handleMobileChange("")}
                className="absolute right-2 top-2.5 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[50] mt-1 bg-white rounded-lg shadow-xl border border-[#E5E7EB] overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
            <div className="px-3 py-2 text-xs font-semibold text-[#9CA3AF] bg-[#F8FAFC] border-b sticky top-0 z-10">
              Found {suggestions.length} customers
            </div>
            {suggestions.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleSelectCustomer(customer)}
                className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] border-b last:border-0 transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-[#111827] group-hover:text-[#5B4EE5] transition-colors">
                      {customer.name}
                    </div>
                    <div className="text-sm text-[#9CA3AF] mt-0.5">
                      {customer.mobileNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="secondary"
                      className={`mb-1 ${getTierColor(customer.discountTier as any)}`}
                    >
                      {getTierDisplayName(customer.discountTier as any)}
                    </Badge>
                    <div className="text-xs text-[#9CA3AF] mt-1 flex flex-col items-end">
                      <span>{customer.visitCount} visits · ₹{customer.totalSpent.toLocaleString()}</span>
                      <span className="text-[#9CA3AF] text-[10px]">
                        Last: {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute right-3 top-2.5 pointer-events-none">
          <div className="animate-spin h-4 w-4 border-2 border-[#EDEBFF]0 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
}

