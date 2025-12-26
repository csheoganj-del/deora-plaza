// OrderCartSection component - Handles cart display and management
// Extracted from TakeawayOrderDialog for better maintainability

import { Trash2, Plus, Minus, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
;
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CartItem } from "@/hooks/useTakeawayOrder";

interface OrderCartSectionProps {
  cart: Record<string, CartItem>;
  subtotal: number;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  totals: {
    subtotal: number;
    discountAmount: number;
    gstAmount: number;
    grandTotal: number;
  };
  gstEnabled: boolean;
  gstPercentage: number;
  onIncQty: (id: string) => void;
  onDecQty: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export function OrderCartSection({
  cart,
  subtotal,
  discountPercent,
  setDiscountPercent,
  totals,
  gstEnabled,
  gstPercentage,
  onIncQty,
  onDecQty,
  onRemoveItem,
  onClearCart
}: OrderCartSectionProps) {
  const cartItems = Object.values(cart);

  if (cartItems.length === 0) {
    return (
      <div className="premium-card">
        <div className="p-8 p-6">
          <div className="text-center text-[#9CA3AF]">
            <p>Your cart is empty</p>
            <p className="text-sm mt-2">Add items from the menu to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cart Items */}
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB] pb-3">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-[#111827] text-lg">Order Summary</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCart}
              className="text-[#FEE2E2]0 hover:text-[#EF4444]"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
        <div className="p-8 space-y-4">
          {cartItems.map(({ item, qty }) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-[#6B7280]">
                  <IndianRupee className="inline h-3 w-3" />
                  {item.price.toFixed(2)} × {qty}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDecQty(item.id)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{qty}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onIncQty(item.id)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  className="h-8 w-8 p-0 text-[#FEE2E2]0 hover:text-[#EF4444] ml-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Details */}
      <div className="premium-card">
        <div className="p-8 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-medium">
              <IndianRupee className="inline h-3 w-3" />
              {totals.subtotal.toFixed(2)}
            </span>
          </div>

          {/* Discount Input */}
          <div className="flex items-center gap-2">
            <Label htmlFor="discount" className="text-sm">Discount %</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
              className="w-20 h-8"
            />
            {totals.discountAmount > 0 && (
              <span className="text-sm text-[#22C55E] font-medium">
                -<IndianRupee className="inline h-3 w-3" />
                {totals.discountAmount.toFixed(2)}
              </span>
            )}
          </div>

          {/* GST */}
          {gstEnabled && (
            <div className="flex justify-between text-sm">
              <span>GST ({gstPercentage}%)</span>
              <span className="font-medium">
                <IndianRupee className="inline h-3 w-3" />
                {totals.gstAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* Grand Total */}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">
              <IndianRupee className="inline h-4 w-4" />
              {totals.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

