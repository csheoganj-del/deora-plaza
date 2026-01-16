"use client";

import { useEffect, useState } from "react";
;
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCustomerDiscountInfo } from "@/actions/customers";
import { getDiscountHistory } from "@/actions/discounts";
import { getTierColor, getTierDisplayName, getDefaultDiscount } from "@/lib/discount-utils";
import { Percent, History, TrendingDown, DollarSign } from "lucide-react";

type DiscountHistoryItem = {
  id: string;
  billId: string;
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
  createdAt: string;
};

type DiscountPanelProps = {
  customerId?: string;
  discountPercent: number;
  onDiscountChange: (percent: number) => void;
  subtotal: number;
  compact?: boolean; // Add compact prop
  // New props for fixed amount support
  discountType?: 'percentage' | 'fixed';
  discountAmount?: number;
  onDiscountTypeChange?: (type: 'percentage' | 'fixed') => void;
  onDiscountAmountChange?: (amount: number) => void;
};

export default function DiscountPanel({
  customerId,
  discountPercent,
  onDiscountChange,
  subtotal,
  compact = false, // Default to false for backward compatibility
  discountType = 'percentage',
  discountAmount = 0,
  onDiscountTypeChange,
  onDiscountAmountChange,
}: DiscountPanelProps) {
  const [tier, setTier] = useState<string>("regular");
  const [suggestedDiscount, setSuggestedDiscount] = useState<number>(0);
  const [history, setHistory] = useState<DiscountHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (customerId) {
      loadCustomerDiscountInfo();
      loadDiscountHistory();
    } else {
      setTier("regular");
      setSuggestedDiscount(0);
      setHistory([]);
    }
  }, [customerId]);

  const loadCustomerDiscountInfo = async () => {
    if (!customerId) return;
    setLoading(true);
    const info = await getCustomerDiscountInfo(customerId);
    if (info) {
      setTier(info.tier);
      setSuggestedDiscount(info.suggestedDiscount);
      // Auto-apply suggested discount if no discount is set
      if (discountPercent === 0 && info.suggestedDiscount > 0) {
        onDiscountChange(info.suggestedDiscount);
      }
    }
    setLoading(false);
  };

  const loadDiscountHistory = async () => {
    if (!customerId) return;
    const historyData = await getDiscountHistory(customerId, 5);
    setHistory(historyData);
  };

  // Calculate discount based on type
  const calculatedDiscount = discountType === 'percentage'
    ? (subtotal * discountPercent) / 100
    : discountAmount;

  return compact ? (
    // Compact version
    <div className="space-y-2">
      {/* Customer Tier Info */}
      {customerId && (
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Tier:</span>
          <Badge className={`text-[8px] px-1 py-0 ${getTierColor(tier as any)}`}>
            {getTierDisplayName(tier as any)}
          </Badge>
        </div>
      )}

      {/* Inline Discount Control */}
      <div className="space-y-2">
        {/* Discount Toggle */}
        <label className="flex items-center gap-2 text-[10px] text-white/40 hover:text-white/70 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showManual || discountPercent > 0 || discountAmount > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setShowManual(true);
              } else {
                setShowManual(false);
                onDiscountChange(0);
                onDiscountAmountChange?.(0);
              }
            }}
            className="h-3 w-3 rounded border-white/20 bg-white/10 text-[#2fd180] focus:ring-0 focus:ring-offset-0"
          />
          <span className="font-bold uppercase tracking-widest">Apply Discount</span>
        </label>

        {/* Discount Type Toggle & Input */}
        {(showManual || discountPercent > 0 || discountAmount > 0) && (
          <div className="space-y-2 animate-in slide-in-from-right-2 fade-in duration-200">
            {/* Type Selector */}
            <div className="flex gap-1 p-0.5 bg-white/[0.05] rounded-md">
              <button
                onClick={() => {
                  onDiscountTypeChange?.('percentage');
                  onDiscountAmountChange?.(0);
                }}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-bold transition-all ${discountType === 'percentage'
                    ? 'bg-[#2fd180] text-[#0a0a0a] shadow-sm'
                    : 'text-white/40 hover:text-white/60'
                  }`}
              >
                <Percent className="h-3 w-3" />
                %
              </button>
              <button
                onClick={() => {
                  onDiscountTypeChange?.('fixed');
                  onDiscountChange(0);
                }}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-bold transition-all ${discountType === 'fixed'
                    ? 'bg-[#2fd180] text-[#0a0a0a] shadow-sm'
                    : 'text-white/40 hover:text-white/60'
                  }`}
              >
                <DollarSign className="h-3 w-3" />
                ₹
              </button>
            </div>

            {/* Input based on type */}
            <div className="flex items-center justify-between">
              {discountType === 'percentage' ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    id="discount-percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    autoFocus={showManual}
                    value={discountPercent}
                    onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                    className="w-14 h-6 text-right pr-1 py-0 text-[11px] bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2fd180]/50 focus-visible:bg-white/[0.08] placeholder-white/20 text-white font-bold"
                    placeholder="0"
                  />
                  <span className="text-white/40 text-[10px] font-bold">%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-white/40 text-[10px] font-bold">₹</span>
                  <Input
                    id="discount-amount"
                    type="number"
                    min="0"
                    max={subtotal}
                    step="1"
                    autoFocus={showManual}
                    value={discountAmount}
                    onChange={(e) => onDiscountAmountChange?.(parseFloat(e.target.value) || 0)}
                    className="w-16 h-6 text-right pr-1 py-0 text-[11px] bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2fd180]/50 focus-visible:bg-white/[0.08] placeholder-white/20 text-white font-bold"
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Discount Preview (only show calculated amount if > 0) */}
      {calculatedDiscount > 0 && (
        <div className="flex justify-between items-center px-2 py-1 bg-[#2fd180]/10 rounded border border-[#2fd180]/20 text-[9px] animate-in fade-in slide-in-from-top-1">
          <span className="text-[#2fd180]/80 font-medium">
            Saving {discountType === 'percentage' && `(${discountPercent}%)`}
          </span>
          <span className="text-[#2fd180] font-bold">₹{calculatedDiscount.toFixed(0)}</span>
        </div>
      )}
    </div>
  ) : (
    // Original version
    <div className="premium-card">
      <div className="p-8 border-b border-[#E5E7EB]">
        <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Discount
        </h2>
      </div>
      <div className="p-8 space-y-4">
        {/* Customer Tier Info */}
        {customerId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Customer Tier</span>
              <Badge className={getTierColor(tier as any)}>
                {getTierDisplayName(tier as any)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Suggested Discount</span>
              <span className="font-medium">{suggestedDiscount}%</span>
            </div>
            <Separator />
          </div>
        )}

        {/* Discount Input */}
        <div className="space-y-2">
          <Label htmlFor="discount-percent">Discount Percentage</Label>
          <div className="flex items-center gap-2">
            <Input
              id="discount-percent"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={discountPercent}
              onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
              className="text-right"
            />
            <span className="text-muted-foreground">%</span>
          </div>

          {/* Discount Preview */}
          {discountPercent > 0 && (
            <div className="bg-[#DCFCE7] dark:bg-green-950 p-3 rounded-md space-y-1">
              <div className="flex items-center gap-2 text-[#16A34A] dark:text-green-300">
                <TrendingDown className="h-4 w-4" />
                <span className="font-medium">Discount Applied</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount Amount:</span>
                <span className="font-medium">₹{calculatedDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">After Discount:</span>
                <span className="font-medium">₹{(subtotal - calculatedDiscount).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Discount History */}
        {customerId && history.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <History className="h-4 w-4" />
                Recent Discounts
              </div>
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-xs p-2 bg-muted rounded"
                  >
                    <div className="font-medium">{item.discountPercent}% off</div>
                    <div className="text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground">Saved</div>
                      <div className="font-medium">₹{item.discountAmount.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!customerId && (
          <div className="text-sm text-muted-foreground text-center py-2">
            Select a customer to see discount suggestions
          </div>
        )}
      </div>
    </div>
  );
}

