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
import { Percent, History, TrendingDown } from "lucide-react";

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
};

export default function DiscountPanel({
  customerId,
  discountPercent,
  onDiscountChange,
  subtotal,
  compact = false, // Default to false for backward compatibility
}: DiscountPanelProps) {
  const [tier, setTier] = useState<string>("regular");
  const [suggestedDiscount, setSuggestedDiscount] = useState<number>(0);
  const [history, setHistory] = useState<DiscountHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  const calculatedDiscount = (subtotal * discountPercent) / 100;

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

      {/* Discount Input */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Input
            id="discount-percent"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={discountPercent}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            className="text-right py-1 h-8 text-xs"
          />
          <span className="text-muted-foreground text-xs">%</span>
        </div>

        {/* Discount Preview */}
        {discountPercent > 0 && (
          <div className="bg-[#DCFCE7] dark:bg-green-950 p-1.5 rounded text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Save:</span>
              <span className="font-medium">₹{calculatedDiscount.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">₹{(subtotal - calculatedDiscount).toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>
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

