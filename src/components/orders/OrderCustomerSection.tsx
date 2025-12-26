// OrderCustomerSection component - Handles customer information and order submission
// Extracted from TakeawayOrderDialog for better maintainability

import { useState } from "react";
import { User, Phone, Save, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
;
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTakeawayOrder } from "@/hooks/useTakeawayOrder";

interface OrderCustomerSectionProps {
  selectedCustomer: any;
  setSelectedCustomer: (customer: any) => void;
  manualCustomerName: string;
  setManualCustomerName: (name: string) => void;
  manualCustomerMobile: string;
  setManualCustomerMobile: (mobile: string) => void;
  isSubmitting: boolean;
  onPlaceOrder: () => void;
  businessUnit: string;
  totals: {
    subtotal: number;
    discountAmount: number;
    gstAmount: number;
    grandTotal: number;
  };
  cart: Record<string, any>;
}

export function OrderCustomerSection({
  selectedCustomer,
  setSelectedCustomer,
  manualCustomerName,
  setManualCustomerName,
  manualCustomerMobile,
  setManualCustomerMobile,
  isSubmitting,
  onPlaceOrder,
  businessUnit,
  totals,
  cart
}: OrderCustomerSectionProps) {
  const [orderType, setOrderType] = useState<'takeaway' | 'dine-in'>('takeaway');
  const [tableNumber, setTableNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const cartItemsCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

  const canPlaceOrder = cartItemsCount > 0 && 
    (selectedCustomer || (manualCustomerName && manualCustomerMobile));

  return (
    <div className="space-y-4">
      {/* Customer Information */}
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </h2>
        </div>
        <div className="p-8 space-y-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">Select Customer</Label>
            <Select
              value={selectedCustomer?.id || ''}
              onValueChange={(value) => {
                if (value) {
                  // This would need to be implemented based on your customer data
                  // setSelectedCustomer(customers.find(c => c.id === value));
                } else {
                  setSelectedCustomer(null);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Search or select customer..." />
              </SelectTrigger>
              <SelectContent>
                {/* Customer options would go here */}
              </SelectContent>
            </Select>
          </div>

          {/* Manual Customer Entry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={manualCustomerName}
                onChange={(e) => setManualCustomerName(e.target.value)}
                disabled={!!selectedCustomer}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerMobile">Mobile Number</Label>
              <Input
                id="customerMobile"
                placeholder="10-digit mobile"
                value={manualCustomerMobile}
                onChange={(e) => setManualCustomerMobile(e.target.value)}
                disabled={!!selectedCustomer}
                maxLength={10}
              />
            </div>
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="takeaway"
                  checked={orderType === 'takeaway'}
                  onCheckedChange={() => setOrderType('takeaway')}
                />
                <Label htmlFor="takeaway">Takeaway</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dinein"
                  checked={orderType === 'dine-in'}
                  onCheckedChange={() => setOrderType('dine-in')}
                />
                <Label htmlFor="dinein">Dine In</Label>
              </div>
            </div>
          </div>

          {/* Table Number (for dine-in) */}
          {orderType === 'dine-in' && (
            <div className="space-y-2">
              <Label htmlFor="tableNumber">Table Number</Label>
              <Input
                id="tableNumber"
                placeholder="Enter table number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Special Instructions</Label>
            <Input
              id="instructions"
              placeholder="Any special requests or notes..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Summary
          </h2>
        </div>
        <div className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#6B7280]">Items:</span>
              <span className="ml-2 font-medium">{cartItemsCount}</span>
            </div>
            <div>
              <span className="text-[#6B7280]">Type:</span>
              <span className="ml-2 font-medium capitalize">{orderType}</span>
            </div>
            {orderType === 'dine-in' && tableNumber && (
              <div>
                <span className="text-[#6B7280]">Table:</span>
                <span className="ml-2 font-medium">{tableNumber}</span>
              </div>
            )}
            <div>
              <span className="text-[#6B7280]">Business Unit:</span>
              <span className="ml-2 font-medium capitalize">{businessUnit}</span>
            </div>
          </div>

          {/* Total Amount */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-xl font-bold text-primary">
                ₹{totals.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Place Order Button */}
          <Button
            onClick={onPlaceOrder}
            disabled={!canPlaceOrder || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Placing Order...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Place Order
              </>
            )}
          </Button>

          {!canPlaceOrder && cartItemsCount > 0 && (
            <p className="text-sm text-[#F59E0B] text-center">
              Please add customer information to place the order
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

