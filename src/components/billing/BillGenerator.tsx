"use client";

import { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { generateBill, processPayment } from "@/actions/billing";
import { getMenuItems } from "@/actions/menu";
import { updateOrderItems } from "@/actions/orders";
import { InvoiceTemplate } from "./InvoiceTemplate";
import CustomerAutocomplete from "./CustomerAutocomplete";
import DiscountPanel from "./DiscountPanel";
import { calculateBillTotals } from "@/lib/discount-utils";
import {
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { getBusinessSettings } from "@/actions/businessSettings";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

type BillGeneratorProps = {
  order: any;
  onClose: () => void;
  onAddItems?: () => void;
};

type SelectedCustomer = {
  id: string;
  name: string;
  mobileNumber: string;
  discountTier: string;
  customDiscountPercent?: number;
  totalSpent: number;
  visitCount: number;
  lastVisit: string | null;
};

export default function BillGenerator({
  order,
  onClose,
  onAddItems,
}: BillGeneratorProps) {
  const [selectedCustomer, setSelectedCustomer] =
    useState<SelectedCustomer | null>(null);
  // manual customer entry state
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerMobile, setManualCustomerMobile] = useState("");

  const [discountPercent, setDiscountPercent] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [loadingBusinessSettings, setLoadingBusinessSettings] = useState(true);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(0); // Will be set from business settings
  const [orderSource, setOrderSource] = useState("dine-in");
  const [externalPlatform, setExternalPlatform] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Item selector state
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localItems, setLocalItems] = useState<any[]>(() => {
    try {
      // Handle case where order.items might be a JSON string
      if (Array.isArray(order.items)) {
        return order.items.map((item: any) => ({ ...item }));
      } else if (typeof order.items === 'string') {
        const parsed = JSON.parse(order.items);
        return Array.isArray(parsed) ? parsed.map((item: any) => ({ ...item })) : [];
      }
      return [];
    } catch (e) {
      console.warn('Failed to parse order.items in BillGenerator:', e);
      return [];
    }
  });

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingBusinessSettings(true);
      const settings = await getBusinessSettings();
      setBusinessSettings(settings);
      // Set default GST percentage based on business unit from business settings
      // Use the new GST calculator logic
      // We will re-run this calculation when items change, so just setting defaults here
      // But we can check the default rate for a generic "food" item to populate the UI box
      if (settings?.gstEnabled) {
        const { calculateGst } = await import('@/lib/gst-calculator');

        // Determine business type
        let bType = order.businessUnit;
        if (bType === 'garden') bType = 'marriage_garden';

        // Get default rate for 'food' or 'room' based on unit
        const dummyAmount = 1000; // For hotel slab check
        const defaultGst = calculateGst(
          dummyAmount,
          bType,
          bType === 'hotel' ? 'room' : 'food',
          {
            ...settings,
            gstEnabled: !!settings.gstEnabled // Ensure boolean
          }
        );

        setGstEnabled(true);
        setGstPercentage(defaultGst.rate);
      }
      setLoadingBusinessSettings(false);
    };
    fetchSettings();
  }, []);

  const fetchMenuItems = async () => {
    setLoadingMenu(true);
    const items = await getMenuItems(order.businessUnit);
    setMenuItems(items);
    setLoadingMenu(false);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalGstAmount = 0;

    // Calculate subtotal
    subtotal = localItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // Calculate aggregated GST based on individual items
    // Since we don't have item categories fully piped in here yet, we'll try to guess or defaults
    // However, if we enabled the new gst-calculator logic, we need to apply it per item optionally
    // OR we just use the global/unit rate for everything like before but allow overrides.
    // Given the prompt wants integration:

    // For now, let's stick to the previous simple logic BUT use the rate determined by our new utility logic if possible.
    // Actually, simply summing GST for each item is better if rates differ (e.g. alcohol vs food).

    // Let's iterate items to calculate Total + GST
    let calculatedSubtotal = 0;
    let calculatedGst = 0;

    localItems.forEach((item: any) => {
      const itemTotal = item.price * item.quantity;
      calculatedSubtotal += itemTotal;

      if (gstEnabled && businessSettings) {
        // Determine item type for GST - naive check or default to 'food'
        // If we had 'category' in localItems, we could pass 'alcohol'.
        // For now, assuming food unless mapped. This is a limitation without robust menu data here.
        // We'll trust the checked 'gstEnabled' and 'gstPercentage' state as the MASTER overrides for now
        // to avoid breaking existing flow, but we update the display to show we are aware of the breakdown.

        // Wait, the user wants the advanced logic.
        // I will use the new utility to calculate the rate for this unit/context.

        // Import on the fly or just use the logic? 
        // Since I can't easily import a new file inside this function without refactoring imports, 
        // I'll stick to using the `gstPercentage` state which IS populating from the settings correctly.

        // BUT, the GST amount calculation needs to be standard:
        calculatedGst += (itemTotal * gstPercentage) / 100;
      }
    });

    // The logic above is effectively same as (subtotal * percent / 100) if percent is constant.

    // Re-using old utility for consistency with discount
    return calculateBillTotals(
      subtotal,
      discountPercent,
      gstEnabled ? gstPercentage : 0,
    );
  };

  const handleAddMenuItem = (menuItem: any) => {
    const existingIndex = localItems.findIndex(
      (item) => item.menuItemId === menuItem.id,
    );
    if (existingIndex >= 0) {
      // Item already exists, increase quantity
      const newItems = [...localItems];
      newItems[existingIndex].quantity += 1;
      setLocalItems(newItems);
    } else {
      // Add new item
      setLocalItems([
        ...localItems,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setLocalItems(localItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(index);
    } else {
      const newItems = [...localItems];
      newItems[index].quantity = newQuantity;
      setLocalItems(newItems);
    }
  };

  // We need an async effect or separate state for totals if we use async imports, 
  // but `calculateGst` is consistent and synchronous if we have settings.
  // We'll define a robust synchronous calculator here since we need it for render.

  const calculateRobustTotals = () => {
    let subtotal = 0;

    localItems.forEach((item) => {
      subtotal += (item.price * item.quantity);
    });

    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;

    let totalGstAmount = 0;
    let effectiveGstRate = 0;

    if (gstEnabled && businessSettings) {
      // We will mimic the gst-calculator logic here synchronously to avoid import issues in render cycle
      // Or we can assume the `gstPercentage` state is the "Effective Average Rate" or we calculate per item.

      // For the purpose of this bill generator which may contain mixed items (Food + Alcohol),
      // we should ideally iterate.

      let aggregatedGst = 0;

      localItems.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        const itemDiscounted = itemTotal - (itemTotal * discountPercent / 100);

        let rate = gstPercentage; // Default to the selected global rate

        // Apply Bar Alcohol Rule
        if (order.businessUnit === 'bar' && (item.category === 'Alcohol' || item.category === 'Liquor' || item.name.toLowerCase().includes('beer') || item.name.toLowerCase().includes('whisky'))) {
          rate = 0;
        }

        // Apply Hotel Room Slab Rule
        if (order.businessUnit === 'hotel' && (item.type === 'room' || item.category === 'Room')) {
          if (item.price <= 1000) rate = 0;
          else if (item.price <= 7500) rate = 12;
          else rate = 18;
        }

        aggregatedGst += (itemDiscounted * rate) / 100;
      });

      totalGstAmount = aggregatedGst;
      if (taxableAmount > 0) {
        effectiveGstRate = (totalGstAmount / taxableAmount) * 100;
      }
    }

    const grandTotal = taxableAmount + totalGstAmount;

    return {
      subtotal,
      discountPercent,
      discountAmount,
      gstPercent: effectiveGstRate, // This might be a blended rate now
      gstAmount: totalGstAmount,
      grandTotal
    };
  };

  const totals = calculateRobustTotals();

  const handleGenerateBill = async () => {
    if (!businessSettings) {
      alert("Business settings are not loaded yet. Please wait.");
      return;
    }
    setLoading(true);

    // Update order with local items first
    await updateOrderItems(order.id, localItems, totals.subtotal);

    // Determine customer details to send
    const customerName = selectedCustomer ? selectedCustomer.name : manualCustomerName;
    const customerMobile = selectedCustomer ? selectedCustomer.mobileNumber : manualCustomerMobile;

    const result = await generateBill({
      orderId: order.id,
      businessUnit: order.businessUnit,
      customerMobile: customerMobile,
      customerName: customerName,
      subtotal: totals.subtotal,
      discountPercent: totals.discountPercent,
      discountAmount: totals.discountAmount,
      gstPercent: totals.gstPercent,
      gstAmount: totals.gstAmount,
      grandTotal: totals.grandTotal,
      source: orderSource,
      externalPlatform: orderSource === 'external' ? externalPlatform : undefined,
      address: businessSettings.address,
      items: localItems,
    });

    if (result.success) {
      setBill({
        id: result.billId,
        billNumber: result.billNumber,
        orderId: order.id,
        businessUnit: order.businessUnit,
        customerMobile: customerMobile,
        customerName: customerName,
        subtotal: totals.subtotal,
        discountPercent: totals.discountPercent,
        discountAmount: totals.discountAmount,
        gstPercent: totals.gstPercent,
        gstAmount: totals.gstAmount,
        grandTotal: totals.grandTotal,
        paymentStatus: "paid",
        source: orderSource,
        externalPlatform: orderSource === 'external' ? externalPlatform : undefined,
        address: businessSettings.address,
        createdAt: new Date(),
        items: localItems,
      });
    } else {
      const errorMessage = result.error || "Failed to generate bill";
      console.error("Bill generation error:", result);
      alert(`Failed to generate bill: ${errorMessage}`);
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!bill) return;
    setLoading(true);
    const result = await processPayment(
      bill.id,
      paymentMethod,
      amountPaid || bill.grandTotal,
    );
    if (result.success) {
      alert("Payment successful!");
      onClose();
    } else {
      alert("Payment failed");
    }
    setLoading(false);
  };

  // Payment View
  if (bill) {
    return (
      <div className="p-6">
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827] text-center">Payment & Print</h2>
          </div>
          <div className="p-8 space-y-4">
            <div className="flex justify-between items-center bg-[#DCFCE7] p-4 rounded-lg border border-green-200">
              <span className="font-medium text-green-800">Total Due</span>
              <span className="text-2xl font-bold text-[#16A34A]">
                ₹{bill.grandTotal.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2">
              <Label>Amount Paid</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] font-bold">
                  ₹
                </span>
                <Input
                  type="number"
                  value={amountPaid || bill.grandTotal}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value))}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="grid grid-cols-3 gap-3"
              >
                <div>
                  <RadioGroupItem
                    value="cash"
                    id="pay-cash"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="pay-cash"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <Banknote className="mb-1 h-5 w-5" />
                    <span className="text-xs">Cash</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="upi"
                    id="pay-upi"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="pay-upi"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <Smartphone className="mb-1 h-5 w-5" />
                    <span className="text-xs">UPI</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="card"
                    id="pay-card"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="pay-card"
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <CreditCard className="mb-1 h-5 w-5" />
                    <span className="text-xs">Card</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              onClick={handlePayment}
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Payment
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handlePrint()}
            >
              <Printer className="mr-2 h-4 w-4" /> Print Invoice
            </Button>
          </div>
        </div>

        <div className="hidden">
          <InvoiceTemplate
            ref={printRef}
            bill={bill}
            order={order}
            businessSettings={businessSettings}
            businessUnit={order.businessUnit}
          />
        </div>
      </div>
    );
  }

  // Main Billing Form - Compact & Scrollable
  return (
    <div className="max-h-[80vh] overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Order Items - Editable with Item Selector */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] pb-3 flex flex-row items-center justify-between">
            <h2 className="text-3xl font-bold text-[#111827] text-base">
              Order Items ({localItems.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowItemSelector(!showItemSelector);
                if (!showItemSelector && menuItems.length === 0) {
                  fetchMenuItems();
                }
              }}
            >
              {showItemSelector ? (
                <X className="h-4 w-4 mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {showItemSelector ? "Close" : "Add Items"}
            </Button>
          </div>
          <div className="p-8">
            {/* Item Selector */}
            {showItemSelector && (
              <div className="mb-4 p-3 bg-[#F8FAFC] rounded-lg border">
                <Label className="text-sm font-medium mb-2 block">
                  Select Items to Add
                </Label>

                {/* Search Input */}
                <Input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2 h-8"
                />

                {loadingMenu ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {menuItems
                      .filter((item) =>
                        item.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                      )
                      .map((menuItem: any) => (
                        <div
                          key={menuItem.id}
                          className="flex items-center justify-between p-2 hover:bg-white rounded cursor-pointer"
                          onClick={() => handleAddMenuItem(menuItem)}
                        >
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {menuItem.name}
                            </span>
                            <span className="text-xs text-[#9CA3AF] ml-2">
                              ₹{menuItem.price}
                            </span>
                          </div>
                          <Plus className="h-4 w-4 text-[#9CA3AF]" />
                        </div>
                      ))}
                    {menuItems.filter((item) =>
                      item.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                    ).length === 0 && (
                        <div className="text-center py-4 text-sm text-[#9CA3AF]">
                          No items found
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* Current Items - Editable */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {localItems.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                >
                  <span className="flex-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateQuantity(
                          index,
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-16 h-7 text-center"
                      min="0"
                    />
                    <span className="w-16 text-right font-medium">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] pb-3">
            <h2 className="text-3xl font-bold text-[#111827] text-base">Customer Details</h2>
          </div>
          <div className="p-8 space-y-3">
            <CustomerAutocomplete
              onCustomerSelect={(customer) => setSelectedCustomer(customer)}
              onNameChange={setManualCustomerName}
              onMobileChange={setManualCustomerMobile}
            />

            <div>
              <Label className="text-sm mb-2 block">Order Source</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {["dine-in", "takeaway", "external"].map((source) => (
                    <Button
                      key={source}
                      variant={orderSource === source ? "default" : "outline"}
                      size="sm"
                      onClick={() => setOrderSource(source)}
                      className="capitalize"
                    >
                      {source === 'external' ? 'External Platform' : source}
                    </Button>
                  ))}
                </div>

                {orderSource === 'external' && (
                  <div>
                    <Label className="text-sm mb-2 block">Select Platform</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["zomato", "swiggy", "uber_eats", "foodpanda", "other"].map((platform) => (
                        <Button
                          key={platform}
                          variant={externalPlatform === platform ? "default" : "outline"}
                          size="sm"
                          onClick={() => setExternalPlatform(platform)}
                          className="capitalize text-xs"
                        >
                          {platform.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Discounts & Taxes */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] pb-3">
            <h2 className="text-3xl font-bold text-[#111827] text-base">Discounts & Taxes</h2>
          </div>
          <div className="p-8 space-y-3">
            <DiscountPanel
              customerId={selectedCustomer?.mobileNumber}
              discountPercent={discountPercent}
              onDiscountChange={setDiscountPercent}
              subtotal={totals.subtotal}
            />

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="gst-toggle"
                  checked={gstEnabled}
                  onCheckedChange={(checked) =>
                    setGstEnabled(checked as boolean)
                  }
                />
                <Label htmlFor="gst-toggle" className="cursor-pointer text-sm">
                  Enable GST
                </Label>
              </div>
              {gstEnabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(Number(e.target.value))}
                    className="w-16 h-8 text-sm"
                  />
                  <span className="text-sm">%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary & Generate */}
        <div className="premium-card">
          <div className="p-8 pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>

            {totals.discountPercent > 0 && (
              <div className="flex justify-between text-sm text-[#22C55E]">
                <span>Discount ({totals.discountPercent}%)</span>
                <span>-₹{totals.discountAmount.toFixed(2)}</span>
              </div>
            )}

            {gstEnabled && (
              <div className="flex justify-between text-sm">
                <span>GST ({gstPercentage}%)</span>
                <span>₹{totals.gstAmount.toFixed(2)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center">
              <span className="font-bold">Grand Total</span>
              <span className="text-2xl font-bold text-primary">
                ₹{totals.grandTotal.toFixed(2)}
              </span>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerateBill}
              disabled={loading || loadingBusinessSettings || !businessSettings}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? "Processing..." : "Generate Bill & Pay"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

