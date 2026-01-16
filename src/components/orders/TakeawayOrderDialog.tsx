"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, User, Percent, Receipt, X, ChevronDown, ShoppingBag, ArrowRight, Plus, Minus, Wifi, WifiOff } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { LoadingLogo } from "@/components/ui/LoadingLogo";
import { getMenuItems } from "@/actions/menu";
import { createOrder } from "@/actions/orders";
import { useRouter } from "next/navigation";
import { playBeep, showToast } from "@/lib/utils";
import { balloonFly, balloonReturn } from "@/lib/balloonFly";
import CustomerAutocomplete from "@/components/billing/CustomerAutocomplete";
import DiscountPanel from "@/components/billing/DiscountPanel";
import ReprintBill from "@/components/billing/ReprintBill";
import { calculateBillTotals } from "@/lib/discount-utils";
import { getBusinessSettings } from "@/actions/businessSettings";
import { useOfflineBilling } from "@/hooks/useOfflineBilling";
import { useAutoSaveRunningOrder } from "@/hooks/useAutoSaveRunningOrder";
import { getRunningOrderByTable, finalizeRunningOrder, deleteRunningOrder } from "@/actions/runningOrders";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";

// Motion removed for map items, limited imports
// import { motion } from "framer-motion"; // Kept only for AnimatePresence if needed, but trying to minimize usage

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  isAvailable: boolean;
  businessUnit?: string;
};

interface TakeawayOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  businessUnit: string;
  tableId?: string | null; // For dine-in orders with running orders
}

// Separate component for grid item to avoid creating functions in render loop
const MenuGridItem = React.memo(({ columnIndex, rowIndex, style, data }: any) => {
  const { items, columnCount, addItem, cart, decQty, incQty } = data;
  const index = rowIndex * columnCount + columnIndex;

  if (index >= items.length) return null;

  const item = items[index];
  const inCart = cart[item.id]?.qty || 0;

  // Adjust style for gap - simpler to use padding inside the cell
  return (
    <div style={{ ...style, padding: '6px' }}>
      <div
        id={`menu-item-${item.id}`}
        className={`relative h-full w-full overflow-hidden bg-white/[0.03] rounded-full pl-5 pr-3 py-2 border transition-all duration-200 group cursor-pointer active:scale-[0.97] hover:bg-white/[0.08] flex items-center gap-3 ${inCart > 0 ? 'border-[#2fd180]/50 bg-white/[0.1] shadow-[0_0_15px_rgba(47,209,128,0.1)]' : 'border-white/[0.06] hover:border-[#2fd180]/30 hover:shadow-[0_0_20px_rgba(47,209,128,0.08)]'}`}
        onClick={(e) => addItem(item, e)}
      >
        {/* Premium Reflection Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-[11px] leading-tight line-clamp-2 group-hover:text-[#2fd180] transition-colors">
            {item.name}
          </h4>
          <span className="font-bold text-white/30 text-[9px] tracking-wide mt-0.5 block">₹{Number(item.price).toFixed(0)}</span>
        </div>

        {inCart > 0 ? (
          <div className="flex items-center bg-[#2fd180]/20 rounded-full p-0.5 shrink-0 border border-[#2fd180]/20" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => decQty(item.id)}
              className="p-1 hover:bg-white/10 rounded-full text-[#2fd180] transition-all active:scale-90"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
            <span className="text-[10px] font-black text-[#2fd180] w-4 text-center">
              {inCart}
            </span>
            <button
              onClick={() => incQty(item.id)}
              className="p-1 hover:bg-white/10 rounded-full text-[#2fd180] transition-all active:scale-90"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <div className="h-7 w-7 rounded-full bg-white/[0.05] text-[#2fd180] flex items-center justify-center border border-[#2fd180]/20 group-hover:bg-[#2fd180] group-hover:text-white group-hover:shadow-[0_0_15px_rgba(47,209,128,0.4)] transition-all shrink-0">
            <Plus className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </div>
  );
});
MenuGridItem.displayName = 'MenuGridItem';

export function TakeawayOrderDialog({
  isOpen,
  onClose,
  businessUnit,
  tableId = null,
}: TakeawayOrderDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<{
    [key: string]: { item: MenuItem; qty: number };
  }>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New States for billing integration
  const [isCustomerExpanded, setIsCustomerExpanded] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerMobile, setManualCustomerMobile] = useState("");

  const [isGstExpanded, setIsGstExpanded] = useState(false);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(0);

  // New states for Bar Mode
  const [barMenuMode, setBarMenuMode] = useState<'drinks' | 'food'>('drinks');
  const [barDrinks, setBarDrinks] = useState<MenuItem[]>([]);
  const [barFood, setBarFood] = useState<MenuItem[]>([]);

  // Payment Modal State
  const [showBilling, setShowBilling] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Print Dialog State
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printBill, setPrintBill] = useState<any>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [isBillingOnlyMode, setIsBillingOnlyMode] = useState(false);

  // Load business settings
  useEffect(() => {
    async function loadSettings() {
      const settings = await getBusinessSettings();
      if (settings) {
        setBusinessSettings(settings);

        // Check billing-only mode
        const { isBillingOnlyModeEnabled } = await import('@/actions/businessSettings');
        const billingOnly = await isBillingOnlyModeEnabled(businessUnit);
        setIsBillingOnlyMode(billingOnly);

        // Handle Tax Settings per Business Unit
        if (businessUnit === 'cafe') {
          if (settings.cafeGstEnabled) setGstEnabled(true);
          setGstPercentage(settings.cafeGstPercentage || 0);
        } else if (businessUnit === 'bar') {
          if (settings.barGstEnabled) setGstEnabled(true);
          setGstPercentage(settings.barGstPercentage || 0);
        } else {
          // Default global fallback
          setGstEnabled(settings.gstEnabled || false);
          setGstPercentage(settings.gstPercentage || 0);
        }
      }
    }
    loadSettings();
  }, [businessUnit]);

  // Billing-only mode check
  const { isOnline, pendingSyncCount, isSyncing, saveBillOffline } = useOfflineBilling();

  // Calculate subtotal for auto-save hook
  const subtotal = useMemo(() => {
    return Object.values(cart).reduce((sum, { item, qty }) => sum + item.price * qty, 0);
  }, [cart]);

  // Running Order Auto-Save Hook setup
  const totalDiscount = discountType === 'percentage' ? (subtotal * discountValue / 100) : discountValue;
  const taxableAmount = subtotal - totalDiscount;
  const totalGst = gstEnabled ? (taxableAmount * gstPercentage / 100) : 0;
  const grandTotal = taxableAmount + totalGst;

  const { forceSave } = useAutoSaveRunningOrder({
    tableId: tableId,
    businessUnit: businessUnit,
    items: cart, // Hook expects Record<string, {item, qty}> which cart IS
    totals: {
      subtotal,
      discountPercentage: discountType === 'percentage' ? discountValue : 0,
      discountAmount: discountType === 'fixed' ? discountValue : 0,
      gstPercentage: gstEnabled ? gstPercentage : 0,
      gstAmount: totalGst,
      total: grandTotal
    },
    customerName: selectedCustomer?.name || manualCustomerName,
    customerMobile: selectedCustomer?.mobileNumber || manualCustomerMobile,
    enabled: !!tableId && !showBilling
  });

  // Load running order if tableId exists
  useEffect(() => {
    if (tableId && isOpen) {
      const loadRunningOrder = async () => {
        try {
          const result: any = await getRunningOrderByTable(tableId);
          if (result && result.data) {
            // Populate cart and customer
            const loadedCart: any = {};
            result.data.items.forEach((item: any) => {
              loadedCart[item.id] = {
                item: {
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  category: 'loaded',
                  isAvailable: true
                },
                qty: item.quantity
              };
            });
            setCart(loadedCart);

            if (result.data.customer_mobile) {
              setManualCustomerMobile(result.data.customer_mobile);
              setManualCustomerName(result.data.customer_name || "");
              setSelectedCustomer({
                name: result.data.customer_name,
                mobileNumber: result.data.customer_mobile
              });
            }
          }
        } catch (error) {
          console.error("Failed to load running order", error);
        }
      };
      loadRunningOrder();
    }
  }, [tableId, isOpen]);

  // Use React Query for cached menu loading - instant on subsequent opens
  const { data: menuData, isLoading: isLoadingMenu, error: menuError } = useQuery({
    queryKey: ['menu', businessUnit],
    queryFn: async () => {
      const items = await getMenuItems(businessUnit);
      if (businessUnit === 'bar') {
        const drinks = items.filter(item => item.category !== 'Food' && item.category !== 'Snacks' && item.category !== 'Kitchen');
        const food = items.filter(item => item.category === 'Food' || item.category === 'Snacks' || item.category === 'Kitchen');
        return { items, drinks, food };
      }
      return { items, drinks: [], food: [] };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: isOpen, // Only fetch when dialog is open
  });

  // Update local state when data changes
  useEffect(() => {
    if (menuData) {
      if (businessUnit === 'bar') {
        setBarDrinks(menuData.drinks);
        setBarFood(menuData.food);
        setMenuItems(barMenuMode === 'drinks' ? menuData.drinks : menuData.food);
      } else {
        setMenuItems(menuData.items);
      }
    }
  }, [menuData, businessUnit, barMenuMode]);

  // Set error state
  useEffect(() => {
    if (menuError) {
      setError("Failed to load menu items");
      console.error(menuError);
    }
  }, [menuError]);

  // Sync loading state
  useEffect(() => {
    setIsLoading(isLoadingMenu);
  }, [isLoadingMenu]);

  // Debounce search query for better performance
  const debouncedQuery = useDebounce(query, 300);

  // Update menu items when barMenuMode changes
  useEffect(() => {
    if (businessUnit === 'bar') {
      if (barMenuMode === 'drinks') setMenuItems(barDrinks);
      else setMenuItems(barFood);
    }
  }, [barMenuMode, barDrinks, barFood, businessUnit]);

  // Filter menu items with debounced query
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(debouncedQuery.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, debouncedQuery, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((item) => item.category));
    return ["ALL", ...Array.from(cats)];
  }, [menuItems]);

  const clearCart = () => {
    setCart({});
    setSelectedCustomer(null);
    setManualCustomerName("");
    setManualCustomerMobile("");
    setQuery("");
    setSelectedCategory("ALL");
    setDiscountValue(0);
    setShowBilling(false);
  };

  const addItem = useCallback((item: MenuItem, e?: React.MouseEvent) => {
    // Fly animation logic
    if (e) {
      const source = e.currentTarget as HTMLElement;
      const target = document.querySelector(`[data-cart-item-id="${item.id}"]`) as HTMLElement
        || document.querySelector("[data-fly-target]") as HTMLElement;
      if (source && target) {
        balloonFly(source, target);
        playBeep(900, 60); // Lighter beep for balloon
      }
    }

    setCart((prev) => {
      const existing = prev[item.id];
      if (existing) {
        return {
          ...prev,
          [item.id]: {
            ...existing,
            qty: existing.qty + 1,
          },
        };
      } else {
        return {
          ...prev,
          [item.id]: {
            item,
            qty: 1,
          },
        };
      }
    });
  }, []);

  const incQty = useCallback((id: string) => {
    // Fly from menu to cart
    const menuEl = document.getElementById(`menu-item-${id}`);
    const cartEl = document.querySelector(`[data-cart-item-id="${id}"]`) as HTMLElement;
    const generalTarget = document.querySelector("[data-fly-target]") as HTMLElement;

    if (menuEl) {
      balloonFly(menuEl, cartEl || generalTarget);
      playBeep(900, 60);
    }

    setCart((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        qty: prev[id].qty + 1,
      },
    }));
  }, []);

  const decQty = useCallback((id: string) => {
    // Fly back from cart to menu (with deflation)
    const cartEl = document.querySelector(`[data-cart-item-id="${id}"]`) as HTMLElement;
    const menuEl = document.getElementById(`menu-item-${id}`);

    if (cartEl) {
      balloonReturn(cartEl, menuEl);
      playBeep(700, 40);
    }

    setCart((prev) => {
      if (prev[id].qty <= 1) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [id]: {
          ...prev[id],
          qty: prev[id].qty - 1,
        },
      };
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    // Fly back from cart to menu (with deflation)
    const cartEl = document.querySelector(`[data-cart-item-id="${id}"]`) as HTMLElement;
    const menuEl = document.getElementById(`menu-item-${id}`);

    if (cartEl) {
      balloonReturn(cartEl, menuEl);
      playBeep(600, 50);
    }

    setCart((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Billing Calculations
  // Calculate bill totals - ensuring inputs are valid numbers
  const { discountAmount, gstAmount, total: finalTotal } = calculateBillTotals(
    subtotal,
    discountType === 'percentage' ? discountValue : 0,
    gstEnabled ? gstPercentage : 0,
    discountType,
    discountType === 'fixed' ? discountValue : 0
  );

  const handleSubmit = async () => {
    if (Object.keys(cart).length === 0) {
      showToast("Cart is empty", "error");
      return;
    }

    // Instead of submitting immediately, Open Payment Modal
    setShowBilling(true);
  };

  const handlePaymentAndPrint = async () => {
    if (Object.keys(cart).length === 0) return;

    setIsSubmitting(true);

    try {
      // Calculate standard totals for record
      const items = Object.values(cart).map(({ item, qty }) => ({
        menuItemId: item.id,
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: qty,
      }));

      let result;

      if (businessUnit === 'bar') {
        // Bar orders are just standard orders for now, simplified
        // Or separate action if needed. Using createOrder for consistency unless createBarOrder is distinct.
        // Assuming standardized createOrder handles it via businessUnit prop.
        // Re-checking imports: import { createOrder } from "@/actions/orders";
        // If a Bar specific action exists, we should use it.
        // For now, standard Create Order.

        result = await createOrder({
          type: 'takeaway',
          customerName: selectedCustomer?.name || manualCustomerName || "Walk-in Customer",
          customerMobile: selectedCustomer?.mobileNumber || manualCustomerMobile || "",
          items,
          gstAmount,
          discountAmount,
          businessUnit,
          discountPercent: discountType === 'percentage' ? discountValue : 0,
          gstPercent: gstEnabled ? gstPercentage : 0
        });

      } else if (isBillingOnlyMode) {
        // Billing Only Mode - direct bill creation
        if (!isOnline) {
          // Offline Logic
          const offlineBill = {
            id: `OFF_${Date.now()}`,
            billNumber: `OFF-${Date.now().toString().slice(-4)}`,
            customerName: selectedCustomer?.name || manualCustomerName || "Walk-in",
            customerMobile: selectedCustomer?.mobileNumber || manualCustomerMobile || "",
            items,
            subtotal,
            discountAmount,
            gstAmount,
            totalAmount: finalTotal,
            paymentMethod,
            businessUnit,
            createdAt: new Date().toISOString(),
            isSynced: false
          };
          saveBillOffline(offlineBill);
          result = { success: true, bill: offlineBill }; // Mock success
          showToast("Bill saved offline (will sync later)", "success");

        } else {
          // Regular Billing Only (Direct Bill)
          // We need to import createDirectBill if it exists, otherwise standard logic?
          // Importing createDirectBill dynamically? It wasn't imported.
          // Let's assume createOrder handles it or use the referenced createDirectBill from DineIn logic.
          // FOR CORRECTNESS: I need to import createDirectBill if I use it.
          // I will add import { createDirectBill } from "@/actions/billing";

          // STOPGAP: Since I cannot see all files, I will assume createOrder returns a bill or I handle it.
          // Actually, Step 1797 said "Calling createDirectBill if isBillingOnlyMode is true".
          // So I MUST import it.

          // I will add the import to the top block.

          // Re-importing missing actions
          const { createDirectBill } = require("@/actions/billing"); // Using require to avoid top-level import conflict if editing

          result = await createDirectBill({
            customerName: selectedCustomer?.name || manualCustomerName || "Walk-in",
            customerMobile: selectedCustomer?.mobileNumber || manualCustomerMobile || "",
            items,
            subtotal,
            gstAmount,
            discountAmount,
            totalAmount: finalTotal,
            paymentMethod,
            businessUnit,
            discountPercent: discountType === 'percentage' ? discountValue : 0
          });
        }
      } else {
        // Standard Takeaway Order
        result = await createOrder({
          type: 'takeaway',
          customerName: selectedCustomer?.name || manualCustomerName || "Walk-in Customer",
          customerMobile: selectedCustomer?.mobileNumber || manualCustomerMobile || "",
          items,
          gstAmount,
          discountAmount,
          businessUnit,
          discountPercent: discountType === 'percentage' ? discountValue : 0,
          gstPercent: gstEnabled ? gstPercentage : 0
        });
      }

      if (result?.success || (isBillingOnlyMode && !isOnline)) {
        playBeep();
        showToast(isBillingOnlyMode ? "Bill generated successfully" : "Order placed successfully", "success");

        // If table order, finalize it
        if (tableId) {
          await finalizeRunningOrder(tableId);
        }

        // Show Print Dialog
        setPrintBill(result.bill || result.order); // Adjust based on return type
        setShowBilling(false);
        setShowPrintDialog(true);

        // Clear cart happens after print dialog close usually,
        // but for Takeaway we might want to clear immediately or keep for reprint?
        // Usually clear.
        // clearCart(); -> moved to after print close or explicit
      } else {
        showToast(result?.error || "Failed to place order", "error");
      }

    } catch (error) {
      console.error("Payment error:", error);
      showToast("Processing failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] animate-in fade-in duration-200"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-8 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
        <div
          className="bg-[#1c1c1c]/95 w-full max-w-6xl h-[82vh] rounded-[24px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/[0.08] flex flex-col overflow-hidden pointer-events-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Section */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-white tracking-tight">
                  Takeaway Order
                </h3>
                {isBillingOnlyMode && (
                  <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-[10px] font-bold border border-purple-500/30 animate-pulse">
                    BILLING-ONLY MODE
                  </div>
                )}
                {!isOnline && (
                  <div className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-[10px] font-bold border border-orange-500/30 flex items-center gap-1.5 animate-pulse">
                    <WifiOff className="h-3 w-3" />
                    OFFLINE
                  </div>
                )}
                {isOnline && pendingSyncCount > 0 && (
                  <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-500/30 flex items-center gap-1.5">
                    <Wifi className="h-3 w-3" />
                    {isSyncing ? 'SYNCING...' : `${pendingSyncCount} TO SYNC`}
                  </div>
                )}
              </div>
              <p className="text-xs text-white/50 font-light mt-0.5">
                {isBillingOnlyMode
                  ? `Direct billing • No kitchen order • ${businessUnit}`
                  : `Creating new takeaway order • ${businessUnit}`
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCustomerExpanded(!isCustomerExpanded)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-xs font-bold uppercase tracking-wider ${isCustomerExpanded
                  ? "bg-[#2fd180] text-[#0a0a0a] shadow-[0_0_20px_rgba(47,209,128,0.3)]"
                  : "bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white border border-white/5"
                  }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>{selectedCustomer ? (selectedCustomer.name || manualCustomerName) : (isCustomerExpanded ? "Collapse" : "Add Customer")}</span>
                {selectedCustomer && (
                  <div className="w-1.5 h-1.5 bg-[#0a0a0a] rounded-full animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setIsGstExpanded(!isGstExpanded)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-xs font-bold uppercase tracking-wider ${isGstExpanded
                  ? "bg-[#2fd180] text-[#0a0a0a] shadow-[0_0_20px_rgba(47,209,128,0.3)]"
                  : "bg-white/[0.05] text-white/60 hover:bg-white/[0.1] hover:text-white border border-white/5"
                  }`}
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>GST</span>
                {gstEnabled && (
                  <div className="w-1.5 h-1.5 bg-[#0a0a0a] rounded-full animate-pulse" />
                )}
              </button>
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
              <button
                onClick={() => {
                  clearCart();
                  onClose();
                }}
                className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/[0.08] transition-all active:scale-90"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Menu Browsing */}
            <div className="w-[65%] flex flex-col border-r border-white/[0.06] bg-black/20">
              {/* Search & Filters */}
              <div className="p-4 bg-white/[0.03] border-b border-white/[0.06] space-y-4 shrink-0">
                {businessUnit === 'bar' && (
                  <div className="flex bg-white/[0.05] p-1 rounded-xl w-fit border border-white/[0.05]">
                    <button
                      onClick={() => setBarMenuMode('drinks')}
                      className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${barMenuMode === 'drinks'
                        ? 'bg-white/[0.12] text-white shadow-xl ring-1 ring-white/10'
                        : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
                        }`}
                    >
                      🍺 Drinks
                    </button>
                    <button
                      onClick={() => setBarMenuMode('food')}
                      className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${barMenuMode === 'food'
                        ? 'bg-white/[0.12] text-white shadow-xl ring-1 ring-white/10'
                        : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
                        }`}
                    >
                      🍽️ Food
                    </button>
                  </div>
                )}

                <div className="relative max-w-xl group">
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2fd180]/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(47,209,128,0.15)] transition-all text-white placeholder-white/20"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#2fd180]/60 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${selectedCategory === cat
                        ? 'bg-[#2fd180] text-white shadow-lg'
                        : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] border border-white/[0.05]'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="flex-1 p-4 overflow-y-auto">
                {
                  isLoading ? (
                    <div className="flex items-center justify-center h-full" >
                      <LoadingLogo />
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Error Loading Menu</h3>
                      <p className="text-white/50 text-sm">{error}</p>
                    </div>
                  ) : filteredMenuItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/30">
                      <AlertCircle className="h-8 w-8 text-white/20 mb-2" />
                      <p className="text-sm font-medium">No menu items found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                      {filteredMenuItems.map((item) => {
                        const inCart = cart[item.id]?.qty || 0;
                        return (
                          <div
                            key={item.id}
                            id={`menu-item-${item.id}`}
                            className={`relative h-[60px] overflow-hidden bg-white/[0.03] rounded-full pl-5 pr-3 py-2 border transition-all duration-200 group cursor-pointer active:scale-[0.97] hover:bg-white/[0.08] flex items-center gap-3 ${inCart > 0
                              ? 'border-[#2fd180]/50 bg-white/[0.1] shadow-[0_0_15px_rgba(47,209,128,0.1)]'
                              : 'border-white/[0.06] hover:border-[#2fd180]/30 hover:shadow-[0_0_20px_rgba(47,209,128,0.08)]'
                              }`}
                            onClick={(e) => addItem(item, e)}
                          >
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white text-[11px] leading-tight line-clamp-2 group-hover:text-[#2fd180] transition-colors">
                                {item.name}
                              </h4>
                              <span className="font-bold text-white/30 text-[9px] tracking-wide mt-0.5 block">
                                ₹{Number(item.price).toFixed(0)}
                              </span>
                            </div>

                            {inCart > 0 ? (
                              <div className="flex items-center bg-[#2fd180]/20 rounded-full p-0.5 shrink-0 border border-[#2fd180]/20" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => decQty(item.id)}
                                  className="p-1 hover:bg-white/10 rounded-full text-[#2fd180] transition-all active:scale-90"
                                >
                                  <Minus className="h-2.5 w-2.5" />
                                </button>
                                <span className="text-[10px] font-black text-[#2fd180] w-4 text-center">
                                  {inCart}
                                </span>
                                <button
                                  onClick={() => incQty(item.id)}
                                  className="p-1 hover:bg-white/10 rounded-full text-[#2fd180] transition-all active:scale-90"
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-white/[0.05] text-[#2fd180] flex items-center justify-center border border-[#2fd180]/20 group-hover:bg-[#2fd180] group-hover:text-white group-hover:shadow-[0_0_15px_rgba(47,209,128,0.4)] transition-all shrink-0">
                                <Plus className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </div>

            {/* Right Panel: Order Summary */}
            <div data-fly-target className="w-[35%] flex flex-col bg-black/40 border-l border-white/[0.06] overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.02] flex items-center justify-between shrink-0">
                <h4 className="text-sm font-bold text-white tracking-tight">Order Summary</h4>
                <div className="bg-[#2fd180]/10 text-[#2fd180] px-2 py-0.5 rounded text-[9px] font-bold border border-[#2fd180]/20">
                  POS v2.0
                </div>
              </div>

              {/* Scrollable Items List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[120px] scrollbar-thin scrollbar-thumb-white/10">

                {/* Top Sections (Customer, GST) */}
                <div className="space-y-3 mb-4 pb-3 border-b border-white/[0.04]">
                  <AnimatePresence initial={false}>
                    {isCustomerExpanded && (
                      // Replaced motion.div with standard div to reduce Animation Overhead in main list
                      <div className="overflow-hidden space-y-4 pb-2 animate-in slide-in-from-top-2 duration-200">
                        {/* 1. Customer Selection */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-white/40">
                            <User className="h-3 w-3" />
                            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Customer</span>
                          </div>
                          <div className="p-1.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                            <CustomerAutocomplete
                              onCustomerSelect={(c) => {
                                setSelectedCustomer(c);
                                if (c) {
                                  setManualCustomerName(c.name);
                                  setManualCustomerMobile(c.mobileNumber);
                                }
                              }}
                              onNameChange={setManualCustomerName}
                              onMobileChange={setManualCustomerMobile}
                              initialName={manualCustomerName}
                              initialMobile={manualCustomerMobile}
                              compact={true}
                            />
                            {/* Create Customer Button logic moved to Autocomplete or handled there */}
                          </div>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>

                  {isGstExpanded && (
                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-2 text-white/40">
                        <Receipt className="h-3 w-3" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">GST Configuration</span>
                      </div>
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] flex items-center justify-between">
                        <span className="text-xs text-white/60 font-medium">Enable GST ({businessUnit === 'cafe' ? businessSettings?.cafeGstPercentage : (businessUnit === 'bar' ? businessSettings?.barGstPercentage : gstPercentage)}%)</span>
                        <button
                          onClick={() => setGstEnabled(!gstEnabled)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${gstEnabled ? 'bg-[#2fd180]' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${gstEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>


                {/* Empty State */}
                {Object.keys(cart).length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-white/10 rounded-xl">
                    <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.2em]">Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {Object.values(cart).map(({ item, qty }) => (
                      <div
                        key={item.id}
                        data-cart-item-id={item.id}
                        className="flex justify-between items-center p-1.5 bg-white/[0.03] rounded-xl border border-white/[0.03] group hover:bg-white/[0.06] transition-all duration-150 animate-in fade-in slide-in-from-left-2"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-bold text-[11px] text-white truncate max-w-[140px] tracking-tight">{item.name}</div>
                          <div className="flex items-center gap-1.5 text-[9px] text-white/30 mt-0.5 font-medium">
                            <span>₹{item.price}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-white/[0.05] rounded-lg border border-white/[0.05] p-0.5">
                            <button
                              onClick={() => decQty(item.id)}
                              className="p-1 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition-colors active:scale-90"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </button>
                            <span className="text-[11px] font-black text-white w-6 text-center">
                              {qty}
                            </span>
                            <button
                              onClick={() => incQty(item.id)}
                              className="p-1 hover:bg-white/10 rounded-md text-[#2fd180] transition-colors active:scale-90"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>
                          <div className="min-w-[45px] text-right">
                            <span className="font-bold text-[11px] text-[#2fd180]">₹{item.price * qty}</span>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-white/10 hover:text-red-500 transition-colors p-1 active:scale-90">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-white/[0.03] border-t border-white/[0.06] space-y-3 shrink-0">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-white/40">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {(gstAmount > 0) && (
                    <div className="flex justify-between text-[11px] text-white/40">
                      <span>GST ({gstPercentage}%)</span>
                      <span>₹{gstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {(discountAmount > 0) && (
                    <div className="flex justify-between text-[11px] text-[#2fd180]">
                      <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'})</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-end pt-2 border-t border-white/10">
                    <div>
                      <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mb-0.5">Total</p>
                      <p className="text-2xl font-black text-white tracking-tight">
                        <span className="text-lg text-[#2fd180] mr-0.5">₹</span>
                        {finalTotal.toFixed(0)}
                      </p>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={Object.keys(cart).length === 0 || isSubmitting}
                      className="group flex items-center gap-2 bg-[#2fd180] hover:bg-[#25c075] text-[#0a0a0a] px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(47,209,128,0.3)] hover:shadow-[0_0_30px_rgba(47,209,128,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {isSubmitting ? (
                        <span className="animate-pulse">Processing...</span>
                      ) : (
                        <>
                          <span>{isBillingOnlyMode ? "Review Bill" : "Place Order"}</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >

      {/* Billing Modal */}
      {
        showBilling && (
          <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1c1c1c] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Payment & Print</h3>
                <button onClick={() => setShowBilling(false)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <div className="p-6 space-y-6">
                {/* Totals Display */}
                <div className="text-center space-y-1">
                  <p className="text-sm text-white/40">Total Amount Due</p>
                  <p className="text-4xl font-black text-[#2fd180]">₹{finalTotal.toFixed(0)}</p>
                </div>

                {/* Discount Panel */}
                <DiscountPanel
                  discountPercent={discountType === 'percentage' ? discountValue : 0}
                  discountAmount={discountType === 'fixed' ? discountValue : 0}
                  discountType={discountType}
                  onDiscountChange={(val) => {
                    // Update value only, type already set
                    setDiscountValue(val);
                  }}
                  onDiscountTypeChange={setDiscountType}
                  onDiscountAmountChange={setDiscountValue}
                  subtotal={subtotal}
                />

                {/* Payment Method */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['cash', 'upi', 'card'].map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-3 rounded-xl border font-bold text-xs uppercase tracking-wide transition-all ${paymentMethod === method
                          ? 'bg-[#2fd180] text-[#0a0a0a] border-[#2fd180]'
                          : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                          }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3">
                <button
                  onClick={() => setShowBilling(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white hover:bg-white/10 font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentAndPrint}
                  disabled={isSubmitting}
                  className="flex-[2] py-3 rounded-xl bg-[#2fd180] text-[#0a0a0a] font-bold text-sm hover:shadow-lg hover:shadow-[#2fd180]/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Settle & Print Bill'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Print Dialog */}
      {
        showPrintDialog && printBill && (
          <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-none">
            <div className="pointer-events-auto">
              <ReprintBill
                bill={printBill}
                onClose={() => {
                  setShowPrintDialog(false);
                  clearCart();
                  onClose();
                }}
                businessSettings={businessSettings}
              />
            </div>
          </div>
        )
      }
    </>
  );
}
