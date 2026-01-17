"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, AlertCircle, Printer, Search, Plus, Minus, Hash, User, Users, ChevronRight, X, Coffee, Utensils, Wine, ArrowRight, ShoppingBag, Receipt, Percent } from "lucide-react";
import { LoadingLogo } from "@/components/ui/LoadingLogo";
import { getMenuItems } from "@/actions/menu";
import { createOrder } from "@/actions/orders";
import { playBeep, showToast, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useServerAuth } from "@/hooks/useServerAuth";
import { getBusinessSettings } from "@/actions/businessSettings";
import { generateBill, processPayment } from "@/actions/billing";
import { calculateBillTotals, getTierDisplayName, getDefaultDiscount, getTierColor } from "@/lib/discount-utils";
import { useReactToPrint } from "react-to-print";
import { InvoiceTemplate } from "@/components/billing/InvoiceTemplate";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, Smartphone } from "lucide-react";
import CustomerAutocomplete from "@/components/billing/CustomerAutocomplete";
import DiscountPanel from "@/components/billing/DiscountPanel";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { balloonFly, balloonReturn } from "@/lib/balloonFly";
import { useAutoSaveRunningOrder } from "@/hooks/useAutoSaveRunningOrder";
import { getRunningOrderByTable, finalizeRunningOrder, deleteRunningOrder } from "@/actions/runningOrders";
import ReprintBill from "@/components/billing/ReprintBill";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  isAvailable: boolean;
  measurement?: string | null;
  measurementUnit?: string | null;
  baseMeasurement?: number | null;
};

interface DineInOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  businessUnit: string;
  tableId: string;
  tableNumber: string;
  status?: string;
  orderId?: string;
}

export function DineInOrderDialog({
  isOpen,
  onClose,
  businessUnit,
  tableId,
  tableNumber,
  status,
  orderId,
}: DineInOrderDialogProps) {
  const router = useRouter();
  const { data: session } = useServerAuth();
  const userRole = (session?.user as any)?.role || "user";
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<{
    [key: string]: { item: MenuItem; qty: number };
  }>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderType, setOrderType] = useState((businessUnit === 'restaurant' ? 'cafe' : businessUnit) || "cafe");
  const [guestCount, setGuestCount] = useState(1);
  // Waiterless manager mode states
  const [isWaiterlessMode, setIsWaiterlessMode] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Bar-specific states
  const [barMenuMode, setBarMenuMode] = useState<'drinks' | 'food'>('drinks');
  const [barDrinks, setBarDrinks] = useState<MenuItem[]>([]);
  const [barFood, setBarFood] = useState<MenuItem[]>([]);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [selectedItemForMeasurement, setSelectedItemForMeasurement] = useState<MenuItem | null>(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>("");

  // Printing State
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printBill, setPrintBill] = useState<any>(null);

  // Customer and billing states
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerMobile, setManualCustomerMobile] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(5);
  const [isCustomerExpanded, setIsCustomerExpanded] = useState(false);
  const [isGstExpanded, setIsGstExpanded] = useState(false);
  const [isBillingOnlyMode, setIsBillingOnlyMode] = useState(false);
  const [isBillingOnlyMode, setIsBillingOnlyMode] = useState(false);


  const isManagerRole = [
    "manager",
    "cafe_manager",
    "hotel_manager",
    "garden_manager",
    "super_admin",
    "owner",
  ].includes(userRole || "");

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      setCart({});
      setOrderType((businessUnit === 'restaurant' ? 'cafe' : businessUnit) || "cafe");
      setShowBilling(false);
      setGeneratedBill(null);
      setGuestCount(1);
      setSelectedCustomer(null);
      setManualCustomerName("");
      setManualCustomerMobile("");

      // First, try to load running order (persistent cart)
      if (tableId) {
        getRunningOrderByTable(tableId).then((runningOrder) => {
          if (runningOrder && runningOrder.items.length > 0) {
            // Load items into cart from running order
            const newCart: any = {};
            runningOrder.items.forEach((item: any) => {
              newCart[item.menuItemId] = {
                item: {
                  id: item.menuItemId,
                  name: item.name,
                  price: item.price,
                  isAvailable: true,
                  category: 'Other'
                },
                qty: item.quantity
              };
            });
            setCart(newCart);

            // Load customer info
            if (runningOrder.customerName) setManualCustomerName(runningOrder.customerName);
            if (runningOrder.customerMobile) setManualCustomerMobile(runningOrder.customerMobile);
            if (runningOrder.discountPercent) setDiscountPercent(runningOrder.discountPercent);

            console.log('✅ Loaded running order for table:', tableId);
            setIsLoading(false);
            return;
          }
        }).catch(err => {
          console.error("Failed to load running order:", err);
        });
      }

      // If no running order, load existing order if table is occupied
      if (status === 'occupied' && orderId) {
        setIsLoading(true);
        import('@/actions/orders').then(({ getOrderById }) => {
          getOrderById(orderId).then((existingOrder) => {
            if (existingOrder) {
              // Populate guest count
              if (existingOrder.guestCount) setGuestCount(existingOrder.guestCount);

              // Populate customer info
              if (existingOrder.customerName) setManualCustomerName(existingOrder.customerName);
              if (existingOrder.customerMobile) setManualCustomerMobile(existingOrder.customerMobile);
              if (existingOrder.discountPercent) setDiscountPercent(existingOrder.discountPercent);
              if (existingOrder.discountAmount) setDiscountAmount(existingOrder.discountAmount);

              // Populate cart
              if (existingOrder.items) {
                const newCart: any = {};
                existingOrder.items.forEach((item: any) => {
                  newCart[item.menuItemId] = {
                    item: {
                      id: item.menuItemId,
                      name: item.name,
                      price: item.price,
                      isAvailable: true,
                      category: item.category || 'Other'
                    },
                    qty: item.quantity
                  };
                });
                setCart(newCart);
              }
            }
            setIsLoading(false);
          }).catch(err => {
            console.error("Failed to load existing order:", err);
            setIsLoading(false);
          });
        });
      }

    }

    // Load business settings and check modes in parallel (no delay for faster opening)
    Promise.all([
      getBusinessSettings(),
      import('@/actions/businessSettings').then(m => m.isBillingOnlyModeEnabled(businessUnit))
    ]).then(([settings, billingOnly]) => {
      setBusinessSettings(settings);
      // setIsBillingOnlyMode(false); // Force disable billing mode per user request
      setIsBillingOnlyMode(billingOnly);

      // Check waiterless mode
      let isUnitWaiterless = false;
      if (settings) {
        switch (businessUnit) {
          case 'bar': isUnitWaiterless = !!settings.barWaiterlessMode; break;
          case 'cafe': isUnitWaiterless = !!settings.cafeWaiterlessMode; break;
          case 'hotel': isUnitWaiterless = !!settings.hotelWaiterlessMode; break;
          case 'garden': isUnitWaiterless = !!settings.gardenWaiterlessMode; break;
          default: isUnitWaiterless = !!settings.waiterlessMode;
        }
      }
      setIsWaiterlessMode(isUnitWaiterless);
      setIsCustomerExpanded(isUnitWaiterless);

      // Initialize GST - respect global gstEnabled toggle
      if (settings?.gstEnabled) {
        if (businessUnit === 'bar' && settings.barGstEnabled) {
          setGstEnabled(!!(settings.gstEnabled && settings.barGstEnabled));
          setGstPercentage(settings.barGstPercentage || 0);
        } else if (businessUnit === 'cafe' && settings.cafeGstEnabled) {
          setGstEnabled(!!(settings.gstEnabled && settings.cafeGstEnabled));
          setGstPercentage(settings.cafeGstPercentage || 0);
        } else if (businessUnit === 'hotel' && settings.hotelGstEnabled) {
          setGstEnabled(!!(settings.gstEnabled && settings.hotelGstEnabled));
          setGstPercentage(settings.hotelGstPercentage || 0);
        } else if (businessUnit === 'garden' && settings.gardenGstEnabled) {
          setGstEnabled(!!(settings.gstEnabled && settings.gardenGstEnabled));
          setGstPercentage(settings.gardenGstPercentage || 0);
        }
      }
    }).catch(err => {
      console.error("Failed to load settings:", err);
    });


    // Load menu items based on business unit
    if (businessUnit === 'cafe') {
      import('@/actions/menu').then(({ getMenuItems }) => {
        getMenuItems(businessUnit).then((rawItems) => {
          const availableItems = rawItems.filter(
            (item: MenuItem) => item.isAvailable,
          );
          setMenuItems(availableItems);
          setFilteredMenuItems(availableItems);
          setIsLoading(false);
        }).catch((err) => {
          setError("Failed to load menu. Please try again.");
          setIsLoading(false);
        });
      }).catch((err) => {
        setError("Failed to load menu actions.");
        setIsLoading(false);
      });
    } else if (businessUnit === 'bar') {
      import('@/actions/bar').then(({ getBarMenu }) => {
        getBarMenu().then((barMenu) => {
          setBarDrinks(barMenu.drinks.filter((item: MenuItem) => item.isAvailable));
          setBarFood(barMenu.food.filter((item: MenuItem) => item.isAvailable));
          setMenuItems(barMenuMode === 'drinks' ? barMenu.drinks.filter((item: MenuItem) => item.isAvailable) : barMenu.food.filter((item: MenuItem) => item.isAvailable));
          setFilteredMenuItems(barMenuMode === 'drinks' ? barMenu.drinks.filter((item: MenuItem) => item.isAvailable) : barMenu.food.filter((item: MenuItem) => item.isAvailable));
          setIsLoading(false);
        }).catch((err) => {
          setError("Failed to load bar menu. Please try again.");
          setIsLoading(false);
        });
      }).catch((err) => {
        setError("Failed to load bar actions.");
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [isOpen, userRole, isManagerRole, businessUnit]);

  useEffect(() => {
    if (businessUnit === 'bar') {
      setMenuItems(barMenuMode === 'drinks' ? barDrinks : barFood);
      setFilteredMenuItems(barMenuMode === 'drinks' ? barDrinks : barFood);
    }
  }, [barMenuMode, barDrinks, barFood, businessUnit]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menuItems.filter((m) => {
      if (selectedCategory !== "ALL" && m.category !== selectedCategory)
        return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.category || "").toLowerCase().includes(q)
      );
    });
  }, [menuItems, query, selectedCategory]);

  const addItem = (item: MenuItem, e?: React.MouseEvent) => {
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

    if (item.measurement) {
      setSelectedItemForMeasurement(item);
      setSelectedMeasurement(item.measurement || "");
      setShowMeasurementModal(true);
    } else {
      setCart((prev) => {
        const prevEntry = prev[item.id];
        const qty = prevEntry ? prevEntry.qty + 1 : 1;
        return { ...prev, [item.id]: { item, qty } };
      });
    }
  };

  const handleAddItemWithMeasurement = () => {
    if (!selectedItemForMeasurement) return;
    const itemWithMeasurement = {
      ...selectedItemForMeasurement,
      name: `${selectedItemForMeasurement.name} (${selectedMeasurement})`
    };
    setCart((prev) => {
      const prevEntry = prev[selectedItemForMeasurement.id];
      const qty = prevEntry ? prevEntry.qty + 1 : 1;
      return { ...prev, [selectedItemForMeasurement.id]: { item: itemWithMeasurement, qty } };
    });
    setShowMeasurementModal(false);
    setSelectedItemForMeasurement(null);
    setSelectedMeasurement("");
  };

  const incQty = (id: string) => {
    // Fly from menu to cart
    const menuEl = document.getElementById(`menu-item-${id}`);
    const cartEl = document.querySelector(`[data-cart-item-id="${id}"]`) as HTMLElement;
    const generalTarget = document.querySelector("[data-fly-target]") as HTMLElement;

    if (menuEl) {
      balloonFly(menuEl, cartEl || generalTarget);
      playBeep(900, 60);
    }

    setCart((prev) => {
      const entry = prev[id];
      if (!entry) return prev;
      return { ...prev, [id]: { ...entry, qty: entry.qty + 1 } };
    });
  };

  const decQty = (id: string) => {
    // Fly back from cart to menu (with deflation)
    const cartEl = document.querySelector(`[data-cart-item-id="${id}"]`) as HTMLElement;
    const menuEl = document.getElementById(`menu-item-${id}`);

    if (cartEl) {
      balloonReturn(cartEl, menuEl);
      playBeep(700, 40);
    }

    setCart((prev) => {
      const entry = prev[id];
      if (!entry) return prev;
      const newQty = entry.qty - 1;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { ...entry, qty: newQty } };
    });
  };

  const removeItem = (id: string) => {
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
  };

  const clearCart = () => setCart({});

  const subtotal = useMemo(() => {
    return Object.values(cart).reduce((s, e) => s + e.item.price * e.qty, 0);
  }, [cart]);

  const totals = useMemo(() => {
    return calculateBillTotals(
      subtotal,
      discountPercent,
      gstEnabled ? gstPercentage : 0,
      discountType, // Pass discount type
      discountAmount // Pass discount amount
    );
  }, [subtotal, discountPercent, gstEnabled, gstPercentage, discountType, discountAmount]);

  // Auto-save running order for table
  // MUST be after totals is defined
  useAutoSaveRunningOrder({
    tableId,
    businessUnit,
    items: cart,
    totals,
    customerName: manualCustomerName,
    customerMobile: manualCustomerMobile,
    enabled: !!tableId, // Auto-save for all table orders
  });

  const handleSubmitOrder = async () => {
    if (Object.keys(cart).length === 0) {
      setError("Cannot place an empty order.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const orderItemsPayload = Object.values(cart).map((e) => ({
      menuItemId: e.item.id,
      name: e.item.name,
      quantity: e.qty,
      price: e.item.price,
    }));

    try {
      const customerName = selectedCustomer ? selectedCustomer.name : manualCustomerName;
      const customerMobile = selectedCustomer ? selectedCustomer.mobileNumber : manualCustomerMobile;

      // Check if billing-only mode is enabled
      console.log('🔍 Billing mode check:', { isBillingOnlyMode, isWaiterlessMode, businessUnit: orderType });
      if (isBillingOnlyMode) {
        // BILLING-ONLY MODE (HYBRID): Skip kitchen, but occupy table
        // This allows creating an order that doesn't show on KDS, but keeps table occupied for later billing
        const orderResult = await createOrder({
          businessUnit: orderType,
          type: "dine-in",
          tableId,
          tableNumber,
          guestCount,
          customerMobile: customerMobile,
          customerName: customerName,
          items: orderItemsPayload,
          initialStatus: "served", // Skip KDS by marking as served immediately
          discountPercent: totals.discountPercentage,
          discountAmount: totals.discountAmount,
          gstPercent: totals.gstPercentage,
          gstAmount: totals.gstAmount
        });

        if (orderResult.success) {
          playBeep(1000, 160);
          const action = status === 'occupied' || orderId ? "updated" : "placed";
          showToast(`Order ${action} successfully! (Kitchen Skipped)`, "success");
          clearCart();
          onClose();
          router.refresh();
        } else {
          const errorMessage = (orderResult as any).error || "Failed to create order";
          setError(typeof errorMessage === 'string' ? errorMessage : "Failed to create order");
          playBeep(500, 160);
        }
      } else {
        // NORMAL MODE: Create order (goes to kitchen)
        const orderResult = await createOrder({
          businessUnit: orderType,
          type: "dine-in",
          tableId,
          tableNumber,
          guestCount,
          customerMobile: customerMobile,
          customerName: customerName,
          items: orderItemsPayload,
          discountPercent: totals.discountPercentage,
          discountAmount: totals.discountAmount,
          gstPercent: totals.gstPercentage,
          gstAmount: totals.gstAmount
        });

        let orderId;
        if (orderResult.success && (orderResult as any).orderId) {
          orderId = (orderResult as any).orderId;
        }

        if (orderResult.success) {
          playBeep(1000, 160);
          showToast(`Order for Table ${tableNumber} placed successfully!`, "success");
          clearCart();
          onClose();
          router.refresh();
        } else {
          const errorMessage = (orderResult as any).error || "Failed to create order";
          setError(typeof errorMessage === 'string' ? errorMessage : "Failed to create order");
          playBeep(500, 160);
        }
      }
    } catch (error) {
      console.error(error);
      setError("An unexpected error occurred.");
      playBeep(500, 160);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateBill = async (targetOrderId: string, items: any[]) => {
    // Just open the billing modal - Bill creation happens on "Settle & Print"
    setShowBilling(true);
  };

  useEffect(() => {
    if (selectedCustomer) {
      const tierDiscount = getDefaultDiscount(selectedCustomer.discountTier);
      const customDiscount = selectedCustomer.customDiscountPercent;
      setDiscountPercent(customDiscount || tierDiscount);
    } else {
      setDiscountPercent(0);
    }
  }, [selectedCustomer]);

  const handlePrint = useReactToPrint({ contentRef: printRef });

  const handlePaymentAndPrint = async () => {
    // Generate Bill AND Mark as Paid
    setIsSubmitting(true);
    try {
      if (!orderId) {
        setError("Order ID missing");
        setIsSubmitting(false);
        return;
      }

      const customerName = selectedCustomer ? selectedCustomer.name : manualCustomerName;
      const customerMobile = selectedCustomer ? selectedCustomer.mobileNumber : manualCustomerMobile;

      // 1. Create Bill (with Payment Status = PAID)
      const billResult = await generateBill({
        orderId,
        businessUnit: orderType,
        customerMobile: customerMobile,
        customerName: customerName,
        subtotal: totals.subtotal,
        discountPercent: totals.discountPercentage,
        discountAmount: totals.discountAmount, // Fixed: Uses live state
        gstPercent: totals.gstPercentage,
        gstAmount: totals.gstAmount,
        grandTotal: totals.total,
        paymentStatus: "paid", // Direct to Paid
        paymentMethod: paymentMethod, // Save method
        source: "dine-in",
        address: businessSettings?.address || "",
        items: Object.values(cart).map((e: any) => ({
          menuItemId: e.item.id,
          name: e.item.name,
          quantity: e.qty,
          price: e.item.price,
        })),
      });

      if (billResult.success) {
        // 2. Finalize running order
        if (tableId) {
          try {
            await finalizeRunningOrder(tableId);
            console.log('✅ Finalized running order after payment');
          } catch (error) {
            console.error('Failed to finalize running order:', error);
          }
        }

        playBeep(1000, 160);
        showToast(`Bill paid for Table ${tableNumber}!`, "success");

        // 3. Open Print Dialog
        const finalBillData = {
          id: billResult.billId,
          billNumber: billResult.billNumber,
          orderId,
          businessUnit: orderType,
          customerMobile: selectedCustomer?.mobileNumber,
          customerName: selectedCustomer?.name,
          subtotal: totals.subtotal,
          discountPercent: totals.discountPercentage,
          discountAmount: totals.discountAmount,
          gstPercent: totals.gstPercentage,
          gstAmount: totals.gstAmount,
          grandTotal: totals.total,
          paymentStatus: "paid", // It is paid now
          source: "dine-in",
          address: businessSettings?.address || "",
          createdAt: new Date(),
          items: Object.values(cart).map((e: any) => ({ // Ensure items are passed for print
            menuItemId: e.item.id,
            name: e.item.name,
            quantity: e.qty,
            price: e.item.price,
          })),
        };

        setPrintBill(finalBillData);
        setShowBilling(false);
        setShowPrintDialog(true);
        clearCart();
      } else {
        setError(`Failed to generate bill: ${billResult.error}`);
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      setError("Payment processing failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment/Billing Modal
  if (showBilling) {
    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-[#1c1c1c]/95 w-full max-w-sm rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/[0.08] p-8 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold text-white tracking-tight">Payment & Print</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2fd180]">NEW BILL</p>
          </div>

          {/* Discount Panel Integrated Here */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3">
            <DiscountPanel
              discountPercent={discountPercent}
              onDiscountChange={setDiscountPercent}
              discountType={discountType}
              onDiscountTypeChange={setDiscountType}
              discountAmount={discountAmount}
              onDiscountAmountChange={setDiscountAmount}
              subtotal={subtotal}
              customerId={selectedCustomer?.mobileNumber}
              compact={true}
            />
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] p-6 rounded-[24px] flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Total Amount Due</span>
            <span className="text-4xl font-black text-white tracking-tighter">₹{Math.round(totals.total)}</span>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Payment Method</label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-3">
              <div className="relative">
                <RadioGroupItem value="cash" id="pay-cash" className="peer sr-only" />
                <Label htmlFor="pay-cash" className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] p-4 hover:bg-white/[0.08] peer-data-[state=checked]:border-[#2fd180] peer-data-[state=checked]:bg-[#2fd180]/10 cursor-pointer transition-all">
                  <Banknote className={`mb-2 h-5 w-5 ${paymentMethod === 'cash' ? 'text-[#2fd180]' : 'text-white/40'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-wider ${paymentMethod === 'cash' ? 'text-white' : 'text-white/40'}`}>Cash</span>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem value="upi" id="pay-upi" className="peer sr-only" />
                <Label htmlFor="pay-upi" className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] p-4 hover:bg-white/[0.08] peer-data-[state=checked]:border-[#2fd180] peer-data-[state=checked]:bg-[#2fd180]/10 cursor-pointer transition-all">
                  <Smartphone className={`mb-2 h-5 w-5 ${paymentMethod === 'upi' ? 'text-[#2fd180]' : 'text-white/40'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-wider ${paymentMethod === 'upi' ? 'text-white' : 'text-white/40'}`}>UPI</span>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem value="card" id="pay-card" className="peer sr-only" />
                <Label htmlFor="pay-card" className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] p-4 hover:bg-white/[0.08] peer-data-[state=checked]:border-[#2fd180] peer-data-[state=checked]:bg-[#2fd180]/10 cursor-pointer transition-all">
                  <CreditCard className={`mb-2 h-5 w-5 ${paymentMethod === 'card' ? 'text-[#2fd180]' : 'text-white/40'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-wider ${paymentMethod === 'card' ? 'text-white' : 'text-white/40'}`}>Card</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={handlePaymentAndPrint}
              disabled={isSubmitting}
              className="w-full h-14 bg-[#2fd180] text-[#0a0a0a] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(47,209,128,0.2)] hover:shadow-[0_15px_40px_rgba(47,209,128,0.3)] disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  <span>Settle & Print Bill</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowBilling(false)}
              className="w-full h-12 text-[10px] font-black uppercase tracking-[0.15em] text-white/40 hover:text-white transition-all bg-white/[0.03] rounded-2xl border border-white/5"
            >
              Back to Order
            </button>
          </div>


        </div>
      </div>
    );
  }

  // MAIN POS UI
  return (
    <>
      {/* Backdrop Layer - ONLY blur + dim */}
      <div
        className="fixed inset-0 z-[1000] backdrop-blur-[12px] bg-black/60 transition-all duration-300"
        onClick={() => {
          clearCart();
          onClose();
        }}
      />

      {/* Modal Container - CLEAR glass, NO blur, Crisp layers */}
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-0 sm:p-4 md:p-8 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
        <div
          className="bg-[#1c1c1c]/95 w-full max-w-7xl h-[100dvh] sm:h-[85vh] rounded-none sm:rounded-[24px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-0 sm:border border-white/[0.08] flex flex-col overflow-hidden pointer-events-auto"
          role="dialog"
          aria-modal="true"
        >

          {/* Hidden invoice for waiterless printing */}
          <div className="hidden">
            {generatedBill && (
              <InvoiceTemplate
                ref={printRef}
                bill={generatedBill}
                order={{ id: generatedBill.orderId, businessUnit: generatedBill.businessUnit, items: generatedBill.items }}
                businessSettings={businessSettings}
                businessUnit={generatedBill.businessUnit}
              />
            )}
          </div>

          {/* 1. Header Row - Clean & Grouped */}
          <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                  Table {tableNumber}
                  {isBillingOnlyMode && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] font-bold">
                      BILLING ONLY
                    </Badge>
                  )}
                  {isWaiterlessMode && <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 border-amber-500/20 text-[10px] font-bold">MANAGER MODE</Badge>}
                </h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Dine-in Order • {businessUnit}</p>
              </div>

              <div className="w-[1px] h-8 bg-white/10 hidden md:block" />

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/[0.05] px-4 py-2 rounded-xl border border-white/[0.05]">
                  <Hash className="h-3.5 w-3.5 text-white/40" />
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none text-white/80"
                  >
                    <option value="cafe" className="bg-[#1c1c1c]">Cafe & Rest.</option>
                    <option value="bar" className="bg-[#1c1c1c]">Bar</option>
                    <option value="hotel" className="bg-[#1c1c1c]">Hotel</option>
                    <option value="garden" className="bg-[#1c1c1c]">Garden</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 bg-white/[0.05] px-4 py-2 rounded-xl border border-white/[0.05]">
                  <Users className="h-3.5 w-3.5 text-white/40" />
                  <div className="flex items-center gap-2">
                    <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="text-white/40 hover:text-white"><Minus className="h-3 w-3" /></button>
                    <span className="w-4 text-center text-xs font-bold text-white">{guestCount}</span>
                    <button onClick={() => setGuestCount(guestCount + 1)} className="text-white/40 hover:text-white"><Plus className="h-3 w-3" /></button>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/30 ml-1">Guests</span>
                </div>
              </div>
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
                onClick={onClose}
                className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/[0.08] transition-all active:scale-90"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Main Content Area - Split Pane */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

            {/* LEFT: Menu Area (Adaptive: Top 40% on Mobile, 65% width on Desktop) */}
            <div className="w-full h-[40vh] lg:h-auto lg:w-[65%] flex flex-col border-r border-white/[0.06] bg-black/20 shrink-0 lg:shrink">
              {/* Search & Categories */}
              <div className="p-4 bg-white/[0.03] border-b border-white/[0.06] space-y-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 group">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search menu items..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2fd180]/50 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(47,209,128,0.15)] transition-all text-white placeholder-white/20"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#2fd180]/60 transition-colors" />
                  </div>
                  {businessUnit === 'bar' && (
                    <div className="flex bg-white/[0.05] p-1 rounded-xl border border-white/[0.05]">
                      <button
                        onClick={() => { setBarMenuMode('drinks'); }}
                        className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${barMenuMode === 'drinks' ? 'bg-white/[0.12] text-white shadow-xl ring-1 ring-white/10' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'}`}
                      >
                        🍺 Drinks
                      </button>
                      <button
                        onClick={() => { setBarMenuMode('food'); }}
                        className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${barMenuMode === 'food' ? 'bg-white/[0.12] text-white shadow-xl ring-1 ring-white/10' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'}`}
                      >
                        🍽️ Food
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 border ${selectedCategory === cat
                        ? 'bg-[#2fd180] text-[#0a0a0a] border-[#2fd180] shadow-lg shadow-[#2fd180]/20'
                        : 'bg-white/[0.03] text-white/40 hover:bg-white/[0.08] border-white/5 hover:text-white/80'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full"><LoadingLogo /></div>
                ) : filteredMenu.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-white/20">
                    <Coffee className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">No items found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-3 pb-20 lg:pb-0">
                    {filteredMenu.map((item) => {
                      const inCart = cart[item.id]?.qty || 0;
                      return (
                        <div
                          key={item.id}
                          id={`menu-item-${item.id}`}
                          className={`relative overflow-hidden bg-white/[0.03] rounded-full pl-5 pr-3 py-2.5 border transition-all duration-300 group cursor-pointer active:scale-[0.97] hover:bg-white/[0.08] flex items-center gap-3 ${inCart > 0 ? 'border-[#2fd180]/50 bg-white/[0.1] shadow-[0_0_15px_rgba(47,209,128,0.1)]' : 'border-white/[0.06] hover:border-[#2fd180]/30 hover:shadow-[0_0_20px_rgba(47,209,128,0.08)]'}`}
                          onClick={(e) => addItem(item, e)}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-[11px] leading-tight break-words group-hover:text-[#2fd180] transition-colors">
                              {item.name}
                            </h4>
                            <span className="font-black text-white/30 text-[9px] tracking-wide mt-0.5 block">₹{Number(item.price).toFixed(0)}</span>
                          </div>

                          {inCart > 0 ? (
                            <div className="flex items-center bg-[#2fd180]/20 rounded-full p-0.5 shrink-0 border border-[#2fd180]/20" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => decQty(item.id)} className="p-1 hover:bg-white/10 rounded-full text-[#2fd180] transition-all active:scale-90"><Minus className="h-2.5 w-2.5" /></button>
                              <span className="text-[10px] font-black text-[#2fd180] w-4 text-center">{inCart}</span>
                              <button onClick={() => incQty(item.id)} className="p-1 hover:bg-white/10 rounded-full text-[#2fd180] transition-all active:scale-90"><Plus className="h-2.5 w-2.5" /></button>
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

            {/* RIGHT: Order Summary (Adaptive: Bottom 60% on Mobile, 35% width on Desktop) */}
            <div
              data-fly-target
              className="w-full flex-1 lg:flex-none lg:w-[35%] flex flex-col bg-[#1c1c1c] lg:bg-black/40 border-t lg:border-t-0 lg:border-l border-white/[0.08] lg:border-white/[0.06] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:shadow-none overflow-hidden"
            >
              {/* Header */}
              {/* Header */}
              <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.02] flex items-center justify-between shrink-0">
                <h4 className="text-sm font-bold text-white tracking-tight">Order Summary</h4>
                <div className="bg-[#2fd180]/10 text-[#2fd180] px-2 py-0.5 rounded text-[8px] font-black border border-[#2fd180]/20 tracking-tighter">
                  DINE-IN
                </div>
              </div>

              {/* Scrollable Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">

                {/* Collapsible Sections */}
                <div className="space-y-3">
                  <AnimatePresence>
                    {isCustomerExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-4 pb-2"
                      >
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Customer Details</label>
                          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-2">
                            <CustomerAutocomplete
                              onCustomerSelect={setSelectedCustomer}
                              onNameChange={setManualCustomerName}
                              onMobileChange={setManualCustomerMobile}
                              initialName={manualCustomerName}
                              initialMobile={manualCustomerMobile}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>



                  <AnimatePresence>
                    {isGstExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-3.5 w-3.5 text-[#2fd180]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Apply GST ({gstPercentage}%)</span>
                          </div>
                          <Checkbox
                            checked={gstEnabled}
                            onCheckedChange={(c) => setGstEnabled(c as boolean)}
                            className="h-4 w-4 border-white/20 data-[state=checked]:bg-[#2fd180] data-[state=checked]:border-[#2fd180]"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white/40 mb-3">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Items ({Object.values(cart).reduce((s, c) => s + c.qty, 0)})</span>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {Object.keys(cart).length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="py-12 text-center border border-dashed border-white/5 rounded-3xl"
                      >
                        <p className="text-[10px] text-white/10 uppercase font-black tracking-[0.2em]">Cart is empty</p>
                      </motion.div>
                    ) : (
                      Object.values(cart).map(({ item, qty }) => (
                        <motion.div
                          key={item.id}
                          data-cart-item-id={item.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex justify-between items-center p-3 bg-white/[0.03] rounded-2xl border border-white/[0.03] group hover:bg-white/[0.06] transition-all"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="font-bold text-[11px] text-white truncate tracking-tight">{item.name}</div>
                            <div className="text-[9px] text-white/30 font-bold mt-0.5">₹{item.price} × {qty}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center bg-white/[0.05] rounded-xl border border-white/[0.05] p-1">
                              <button onClick={() => decQty(item.id)} className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><Minus className="h-3 w-3" /></button>
                              <span className="text-xs font-black text-white w-6 text-center">{qty}</span>
                              <button onClick={() => incQty(item.id)} className="p-1 hover:bg-white/10 rounded-lg text-[#2fd180] transition-all"><Plus className="h-3 w-3" /></button>
                            </div>
                            <div className="min-w-[50px] text-right">
                              <span className="font-black text-[11px] text-[#2fd180]">₹{item.price * qty}</span>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-white/10 hover:text-red-500 transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              {/* Adjustments & Footer - Compressed */}
              <div className="shrink-0 bg-[#0a0a0a]/60 backdrop-blur-2xl border-t border-white/[0.08] p-4 space-y-3">

                {/* Hero Total Card - Condensed */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2fd180]/20 to-[#2fd180]/5 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
                  <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3 space-y-2">
                    <div className="flex justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                      <span>Subtotal</span>
                      <span>₹{totals.subtotal.toFixed(0)}</span>
                    </div>

                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-[10px] text-[#2fd180] font-bold uppercase tracking-wider">
                        <span>Discount ({totals.discountPercentage}%)</span>
                        <span>-₹{totals.discountAmount.toFixed(0)}</span>
                      </div>
                    )}

                    {totals.gstAmount > 0 && (
                      <div className="flex justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                        <span>GST ({gstPercentage}%)</span>
                        <span>₹{totals.gstAmount.toFixed(0)}</span>
                      </div>
                    )}

                    <div className="pt-1.5 border-t border-white/10">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[8px] text-white/40 font-black uppercase tracking-[0.2em]">Grand Total</span>
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-black text-white tracking-tighter">
                            ₹{Math.round(totals.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[9px] font-bold flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </div>
                )}

                {/* Generate Bill Button (Only for Occupied Tables) */}
                {(status === 'occupied' || orderId) && (
                  <button
                    onClick={() => {
                      if (orderId) {
                        handleGenerateBill(orderId, Object.values(cart).map((e: any) => ({
                          menuItemId: e.item.id,
                          name: e.item.name,
                          quantity: e.qty,
                          price: e.item.price,
                        })));
                      } else {
                        setError("Order ID missing for billing");
                      }
                    }}
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-2"
                  >
                    <Receipt className="h-4 w-4" />
                    Generate Bill
                  </button>
                )}

                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || Object.keys(cart).length === 0}
                  className={`w-full group relative overflow-hidden h-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 ${isSubmitting || Object.keys(cart).length === 0
                    ? "bg-white/[0.05] text-white/20 cursor-not-allowed border border-white/5"
                    : "bg-[#2fd180] text-[#0a0a0a] hover:shadow-[0_0_30px_rgba(47,209,128,0.4)] active:scale-[0.98] border-t border-white/20"
                    }`}
                >
                  {/* Shimmer Effect */}
                  {!isSubmitting && (
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent italic" />
                  )}

                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{status === 'occupied' || orderId ? "Update Order" : "Confirm Dine-in Order"}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MeasurementSelectionModal
        isOpen={showMeasurementModal}
        onClose={() => setShowMeasurementModal(false)}
        item={selectedItemForMeasurement}
        selectedMeasurement={selectedMeasurement}
        onMeasurementChange={setSelectedMeasurement}
        onConfirm={handleAddItemWithMeasurement}
      />

      {/* Auto-Print Popup */}
      {showPrintDialog && printBill && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto text-black">
            <ReprintBill
              bill={printBill}
              onClose={() => {
                setShowPrintDialog(false);
                setPrintBill(null);
                onClose(); // Close main dialog when print dialog is closed
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
      {/* Print Dialog Overlay */}
      {showPrintDialog && printBill && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-lg p-6 shadow-2xl relative pointer-events-auto">
            <ReprintBill
              bill={printBill}
              businessSettings={businessSettings}
              onClose={() => {
                setShowPrintDialog(false);
                onClose(); // Close the main dialog too
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

function MeasurementSelectionModal({ isOpen, onClose, item, selectedMeasurement, onMeasurementChange, onConfirm }: any) {
  if (!isOpen || !item) return null;
  const commonMeasurements = [
    { value: "30ml", label: "30ml" },
    { value: "60ml", label: "60ml" },
    { value: "90ml", label: "90ml" },
    { value: "150ml", label: "Small" },
    { value: "330ml", label: "Large" },
    { value: "750ml", label: "Bottle" }
  ];

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-all animate-in fade-in duration-200">
      <div className="bg-[#1c1c1c]/95 w-full max-w-sm rounded-[24px] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/[0.08] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">{item.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2fd180] mt-1">Select Measurement</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {commonMeasurements.map((m) => (
            <button
              key={m.value}
              onClick={() => onMeasurementChange(m.value)}
              className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedMeasurement === m.value
                ? 'bg-[#2fd180] text-[#0a0a0a] border-[#2fd180] shadow-[0_0_20px_rgba(47,209,128,0.2)]'
                : 'bg-white/[0.03] text-white/40 border-white/5 hover:bg-white/[0.08] hover:text-white'
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all bg-white/[0.03] rounded-2xl border border-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-[#2fd180] text-[#0a0a0a] rounded-2xl shadow-[0_10px_30px_rgba(47,209,128,0.2)] hover:shadow-[0_15px_40px_rgba(47,209,128,0.3)] transition-all active:scale-[0.98]"
          >
            Add to Order
          </button>
        </div>
      </div>

    </div>
  );
}
