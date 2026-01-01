"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, AlertCircle, Printer, Search, Plus, Minus, Hash, User, Users, ChevronRight, X, Coffee, Utensils, Wine, ArrowRight } from "lucide-react";
import { LoadingLogo } from "@/components/ui/LoadingLogo";
import { getMenuItems } from "@/actions/menu";
import { createOrder } from "@/actions/orders";
import { playBeep, showToast } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useServerAuth } from "@/hooks/useServerAuth";
import { getBusinessSettings } from "@/actions/businessSettings";
import { generateBill, processPayment } from "@/actions/billing";
import { calculateBillTotals } from "@/lib/discount-utils";
import { useReactToPrint } from "react-to-print";
import { InvoiceTemplate } from "@/components/billing/InvoiceTemplate";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, Smartphone } from "lucide-react";
import CustomerAutocomplete from "@/components/billing/CustomerAutocomplete";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { getTierDisplayName, getDefaultDiscount, getTierColor } from "@/lib/discount-utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
}

export function DineInOrderDialog({
  isOpen,
  onClose,
  businessUnit,
  tableId,
  tableNumber,
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
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => { console.error(error); }
      );
    }
  }, []);

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

  // Customer and billing states
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerMobile, setManualCustomerMobile] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(5);
  const [showCustomerPanel, setShowCustomerPanel] = useState(true);

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

      // Small delay to ensure session is properly loaded
      const timer = setTimeout(() => {
        // Load business settings to check waiterless mode
        getBusinessSettings()
          .then((settings) => {
            setBusinessSettings(settings);

            // Check if waiterless mode is enabled for this specific business unit
            let isUnitWaiterless = false;
            if (settings) {
              switch (businessUnit) {
                case 'bar':
                  isUnitWaiterless = !!settings.barWaiterlessMode;
                  break;
                case 'cafe':
                  isUnitWaiterless = !!settings.cafeWaiterlessMode;
                  break;
                case 'hotel':
                  isUnitWaiterless = !!settings.hotelWaiterlessMode;
                  break;
                case 'garden':
                  isUnitWaiterless = !!settings.gardenWaiterlessMode;
                  break;
                default:
                  // Fallback to global setting if unit-specific setting not found
                  isUnitWaiterless = !!settings.waiterlessMode;
              }
            }

            const isWaiterless = isUnitWaiterless;
            setIsWaiterlessMode(isWaiterless);
            // Show customer panel by default in waiterless mode
            setShowCustomerPanel(isWaiterless);
          })
          .catch((err) => {
            console.error("Failed to load settings:", err);
            // Even if we can't load settings, check if this is a manager
            if (isManagerRole) {
              setIsWaiterlessMode(true);
              setShowCustomerPanel(true);
            } else {
              setIsWaiterlessMode(false);
            }
          });
      }, 100);

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
      return () => clearTimeout(timer);
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

  const addItem = (item: MenuItem) => {
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
    setCart((prev) => {
      const entry = prev[id];
      if (!entry) return prev;
      return { ...prev, [id]: { ...entry, qty: entry.qty + 1 } };
    });
  };

  const decQty = (id: string) => {
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

  const clearCart = () => setCart({});

  const subtotal = useMemo(() => {
    return Object.values(cart).reduce((s, e) => s + e.item.price * e.qty, 0);
  }, [cart]);

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

      const orderResult = await createOrder({
        businessUnit: orderType,
        type: "dine-in",
        tableId,
        tableNumber,
        guestCount,
        customerMobile: customerMobile,
        customerName: customerName,
        items: orderItemsPayload,
        location
      });

      let orderId;
      if (orderResult.success && (orderResult as any).orderId) {
        orderId = (orderResult as any).orderId;
      }

      if (orderResult.success) {
        playBeep(1000, 160);
        if (isWaiterlessMode) {
          await handleGenerateBill(orderId, orderItemsPayload);
        } else {
          showToast(`Order for Table ${tableNumber} placed successfully!`, "success");
          clearCart();
          onClose();
          router.refresh();
        }
      } else {
        const errorMessage = (orderResult as any).error || "Failed to create order";
        setError(typeof errorMessage === 'string' ? errorMessage : "Failed to create order");
        playBeep(500, 160);
      }
    } catch (error) {
      console.error(error);
      setError("An unexpected error occurred.");
      playBeep(500, 160);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateBill = async (orderId: string, items: any[]) => {
    try {
      const totals = calculateBillTotals(subtotal, discountPercent, gstEnabled ? gstPercentage : 0);
      const customerName = selectedCustomer ? selectedCustomer.name : manualCustomerName;
      const customerMobile = selectedCustomer ? selectedCustomer.mobileNumber : manualCustomerMobile;

      const billResult = await generateBill({
        orderId,
        businessUnit: orderType,
        customerMobile: customerMobile,
        customerName: customerName,
        subtotal: totals.subtotal,
        discountPercent: totals.discountPercent,
        discountAmount: totals.discountAmount,
        gstPercent: totals.gstPercent,
        gstAmount: totals.gstAmount,
        grandTotal: totals.grandTotal,
        source: "dine-in",
        address: businessSettings?.address || "",
        items,
      });

      if (billResult.success) {
        setGeneratedBill({
          id: billResult.billId,
          billNumber: billResult.billNumber,
          orderId,
          businessUnit: orderType,
          customerMobile: selectedCustomer?.mobileNumber,
          customerName: selectedCustomer?.name,
          subtotal: totals.subtotal,
          discountPercent: totals.discountPercent,
          discountAmount: totals.discountAmount,
          gstPercent: totals.gstPercent,
          gstAmount: totals.gstAmount,
          grandTotal: totals.grandTotal,
          paymentStatus: "pending",
          source: "dine-in",
          address: businessSettings?.address || "",
          createdAt: new Date(),
          items,
        });

        if (isWaiterlessMode) {
          // 1. Open billing page in new tab
          window.open(`/dashboard/billing?billId=${billResult.billId}`, '_blank');
          
          // 2. Print & Close
          setTimeout(() => {
            handlePrint();
            
            // 3. Close dialog after print trigger
            setTimeout(() => {
              clearCart();
              onClose();
              router.refresh();
            }, 1000);
          }, 500);
        } else {
          setShowBilling(true);
        }
      } else {
        setError(`Failed to generate bill: ${billResult.error}`);
      }
    } catch (error) {
      setError(`Failed to generate bill: ${error}`);
    }
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
    if (!generatedBill) return;
    setIsSubmitting(true);
    try {
      const paymentResult = await processPayment(generatedBill.id, paymentMethod, generatedBill.grandTotal);
      if (paymentResult.success) {
        playBeep(1000, 160);
        showToast(`Bill paid and printed for Table ${tableNumber}!`, "success");
        setTimeout(() => handlePrint(), 100);
        setTimeout(() => {
          clearCart();
          onClose();
          router.refresh();
        }, 500);
      } else {
        setError("Payment processing failed");
      }
    } catch (error) {
      setError("Payment processing failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment/Billing Modal
  if (showBilling && generatedBill) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6 space-y-4">
          {/* ... Existing billing UI logic is fine, keeping it concise ... */}
          <h3 className="text-lg font-semibold text-center">Payment & Print - {generatedBill.billNumber}</h3>
          <div className="flex justify-between items-center bg-[#DCFCE7] p-4 rounded-lg border border-green-200">
            <span className="font-medium text-green-800">Total Amount</span>
            <span className="text-2xl font-bold text-[#16A34A]">₹{generatedBill.grandTotal.toFixed(2)}</span>
          </div>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-3">
            <div>
              <RadioGroupItem value="cash" id="pay-cash" className="peer sr-only" />
              <Label htmlFor="pay-cash" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer hover:border-indigo-200 transition-all">
                <Banknote className="mb-1 h-5 w-5" /> <span className="text-xs">Cash</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="upi" id="pay-upi" className="peer sr-only" />
              <Label htmlFor="pay-upi" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer hover:border-indigo-200 transition-all">
                <Smartphone className="mb-1 h-5 w-5" /> <span className="text-xs">UPI</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="card" id="pay-card" className="peer sr-only" />
              <Label htmlFor="pay-card" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary cursor-pointer hover:border-indigo-200 transition-all">
                <CreditCard className="mb-1 h-5 w-5" /> <span className="text-xs">Card</span>
              </Label>
            </div>
          </RadioGroup>
          <Button onClick={handlePaymentAndPrint} className="w-full bg-[#6D5DFB] hover:bg-[#5B4EE5]" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Printer className="mr-2 h-4 w-4" />} Pay & Print
          </Button>
          <Button variant="outline" onClick={() => setShowBilling(false)} className="w-full">Back to Order</Button>
          <div className="hidden">
            <InvoiceTemplate ref={printRef} bill={generatedBill} order={{ id: generatedBill.orderId, businessUnit: generatedBill.businessUnit, items: generatedBill.items }} businessSettings={businessSettings} businessUnit={generatedBill.businessUnit} />
          </div>
        </div>
      </div>
    );
  }

  // MAIN POS UI
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm md:pl-20 overflow-hidden">
      <div className="bg-white w-full h-[90vh] max-w-7xl rounded-2xl shadow-2xl ring-1 ring-black/5 flex flex-col overflow-hidden">
        
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
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#F1F5F9] bg-white z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                Table {tableNumber}
                {isWaiterlessMode && <Badge variant="secondary" className="text-xs font-normal">Manager Mode</Badge>}
              </h3>
              <span className="text-xs text-[#9CA3AF]">Creating new dining order</span>
            </div>

            <div className="h-8 w-px bg-[#E5E7EB] mx-2 hidden md:block"></div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#F1F5F9]">
                <Hash className="h-4 w-4 text-[#9CA3AF]" />
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="bg-transparent text-sm font-medium outline-none text-[#111827]"
                >
                  <option value="cafe">Cafe & Rest.</option>
                  <option value="bar">Bar</option>
                  <option value="hotel">Hotel</option>
                  <option value="garden">Garden</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#F1F5F9]">
                <Users className="h-4 w-4 text-[#9CA3AF]" />
                <input
                  type="number"
                  min="1"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  className="w-8 bg-transparent text-sm font-medium outline-none text-[#111827] text-center"
                />
                <span className="text-xs text-[#9CA3AF]">Guests</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#9CA3AF] hover:text-[#111827]"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Main Content Area - Split Pane */}
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT: Menu Area (70%) */}
          <div className="w-[70%] flex flex-col border-r border-[#F1F5F9] bg-[#F8FAFC]/30">
            {/* Search Bar */}
            <div className="p-4 bg-white border-b border-[#F1F5F9] flex items-center gap-3 shrink-0">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search menu items..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EDEBFF] focus:bg-white transition-all disabled:opacity-50"
                  autoComplete="off"
                />
                {query && <button onClick={() => setQuery("")} className="absolute right-3 top-2.5"><X className="h-4 w-4 text-[#9CA3AF] hover:text-[#6B7280]" /></button>}
              </div>
              {businessUnit === 'bar' && (
                <div className="flex bg-[#F1F5F9] p-1 rounded-lg">
                  <button
                    onClick={() => { setBarMenuMode('drinks'); setMenuItems(barDrinks); }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${barMenuMode === 'drinks' ? 'bg-white shadow-sm text-[#6D5DFB]' : 'text-[#9CA3AF] hover:text-[#111827]'}`}
                  >
                    Drinks
                  </button>
                  <button
                    onClick={() => { setBarMenuMode('food'); setMenuItems(barFood); }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${barMenuMode === 'food' ? 'bg-white shadow-sm text-[#6D5DFB]' : 'text-[#9CA3AF] hover:text-[#111827]'}`}
                  >
                    Food
                  </button>
                </div>
              )}
            </div>

            {/* Menu Content: Categories Sidebar + Items Grid */}
            <div className="flex-1 flex overflow-hidden">
              {/* Categories Sidebar */}
              <div className="w-48 bg-white border-r border-[#F1F5F9] h-full overflow-y-auto hidden md:block shrink-0">
                <div className="p-2 space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2.5 text-xs font-medium rounded-md transition-all flex items-center justify-between group ${selectedCategory === cat ? 'bg-[#EDEBFF] text-[#5B4EE5]' : 'text-[#6B7280] hover:bg-[#F8FAFC]'}`}
                    >
                      <span className="truncate">{cat}</span>
                      {selectedCategory === cat && <ChevronRight className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid/List */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC]/30">
                {isLoading ? (
                  <LoadingLogo variant="compact" message="Loading menu..." />
                ) : filteredMenu.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-[#9CA3AF]">
                    <Coffee className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm">No items found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredMenu.map((item) => {
                      const inCart = cart[item.id]?.qty || 0;
                      return (
                        <div
                          key={item.id}
                          className={`bg-white rounded-xl p-3 border hover:border-indigo-200 transition-all shadow-sm flex flex-col justify-between h-[120px] group cursor-pointer ${inCart > 0 ? 'border-indigo-200 ring-1 ring-[#EDEBFF]' : 'border-[#F1F5F9]'}`}
                          onClick={() => addItem(item)}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-semibold text-[#111827] text-sm line-clamp-2 leading-tight group-hover:text-[#6D5DFB] transition-colors">{item.name}</h4>
                            </div>
                            <p className="text-xs text-[#9CA3AF] capitalize">{item.category}</p>
                          </div>

                          <div className="flex items-end justify-between mt-auto">
                            <span className="font-bold text-[#111827] text-sm">₹{Number(item.price).toFixed(0)}</span>

                            {inCart > 0 ? (
                              <div className="flex items-center bg-[#EDEBFF] rounded-lg p-0.5" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => decQty(item.id)} className="p-1.5 hover:bg-white rounded-md text-[#6D5DFB] transition-colors"><Minus className="h-3 w-3" /></button>
                                <span className="text-xs font-bold text-[#5B4EE5] w-6 text-center">{inCart}</span>
                                <button onClick={() => incQty(item.id)} className="p-1.5 hover:bg-white rounded-md text-[#6D5DFB] transition-colors"><Plus className="h-3 w-3" /></button>
                              </div>
                            ) : (
                              <button className="h-7 w-7 rounded-full bg-[#F8FAFC] text-[#6D5DFB] flex items-center justify-center group-hover:bg-[#6D5DFB] group-hover:text-white transition-all">
                                <Plus className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary (30%) */}
          <div className="w-[30%] flex flex-col bg-white h-full z-10 relative shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
            {/* Customer Panel */}
            {isWaiterlessMode && showCustomerPanel && (
              <div className="p-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
                <CustomerAutocomplete
                  onCustomerSelect={setSelectedCustomer}
                  onNameChange={setManualCustomerName}
                  onMobileChange={setManualCustomerMobile}
                  compact
                />
                <div className="mt-2 flex items-center justify-between text-xs text-[#9CA3AF]">
                  {/* Discount Logic */}
                  <div className="flex items-center gap-2">
                    <span>Disc %</span>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="w-10 bg-white border border-[#E5E7EB] rounded px-1 py-0.5 text-center focus:outline-none focus:border-indigo-300"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="gst-toggle" checked={gstEnabled} onCheckedChange={(c) => setGstEnabled(c as boolean)} className="h-3 w-3" />
                    <label htmlFor="gst-toggle" className="cursor-pointer">GST</label>
                  </div>
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[#111827]">Current Order</h4>
                {Object.keys(cart).length > 0 && (
                  <button onClick={clearCart} className="text-xs text-[#FEE2E2]0 hover:text-[#DC2626] hover:underline">Clear All</button>
                )}
              </div>

              {Object.keys(cart).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-[#9CA3AF] text-center">
                  <div className="bg-[#F8FAFC] p-4 rounded-full mb-3">
                    <div className="relative">
                      <Utensils className="h-6 w-6 text-[#9CA3AF]" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-[#9CA3AF]">Cart is empty</p>
                  <p className="text-xs mt-1 max-w-[150px]">Add items from the menu to start an order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.values(cart).map(({ item, qty }) => (
                    <div key={item.id} className="flex items-start gap-3 group">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#111827]">{item.name}</div>
                        <div className="text-xs text-[#9CA3AF]">₹{item.price} each</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-[#F8FAFC] rounded-md border border-[#E5E7EB] h-7">
                          <button onClick={() => decQty(item.id)} className="w-6 flex items-center justify-center hover:bg-[#F1F5F9] text-[#6B7280]">-</button>
                          <span className="text-xs font-semibold w-5 text-center">{qty}</span>
                          <button onClick={() => incQty(item.id)} className="w-6 flex items-center justify-center hover:bg-[#F1F5F9] text-[#6B7280]">+</button>
                        </div>
                        <div className="min-w-[40px] text-right font-medium text-sm">
                          ₹{(item.price * qty).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="p-4 bg-white border-t border-[#F1F5F9] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
              {Object.keys(cart).length > 0 && (
                <div className="mb-4 space-y-1 text-xs text-[#9CA3AF]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {(discountPercent > 0 || gstEnabled) && (
                    <>
                      {discountPercent > 0 && <div className="flex justify-between text-[#22C55E]"><span>Disc ({discountPercent}%)</span><span>-₹{((subtotal * discountPercent) / 100).toFixed(2)}</span></div>}
                      {gstEnabled && <div className="flex justify-between"><span>GST ({gstPercentage}%)</span><span>+₹{(((subtotal - (subtotal * discountPercent) / 100) * gstPercentage) / 100).toFixed(2)}</span></div>}
                    </>
                  )}
                  <div className="flex justify-between text-base font-bold text-[#111827] pt-2 border-t mt-2">
                    <span>Total</span>
                    <span>₹
                      {(() => {
                        const discounted = subtotal - (subtotal * discountPercent) / 100;
                        const gst = gstEnabled ? (discounted * gstPercentage) / 100 : 0;
                        return (discounted + gst).toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmitOrder}
                className="w-full h-12 text-sm font-semibold rounded-xl bg-[#111827] text-white hover:bg-black shadow-lg shadow-gray-200 disabled:opacity-50 transition-all hover:scale-[1.02]"
                disabled={Object.keys(cart).length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : Object.keys(cart).length === 0 ? (
                  "Add items to order" // Helper text state
                ) : (
                  <span className="flex items-center">
                    {isWaiterlessMode ? "Place Order & Bill" : "Confirm Order"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
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
    </div>
  );
}

function MeasurementSelectionModal({ isOpen, onClose, item, selectedMeasurement, onMeasurementChange, onConfirm }: any) {
  if (!isOpen || !item) return null;
  const commonMeasurements = [
    { value: "30ml", label: "30ml (Single)" },
    { value: "60ml", label: "60ml (Double)" },
    { value: "90ml", label: "90ml (Triple)" },
    { value: "150ml", label: "Small" },
    { value: "330ml", label: "Large" },
    { value: "750ml", label: "Bottle" }
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-lg font-bold mb-1">{item.name}</h3>
        <p className="text-sm text-[#9CA3AF] mb-4">Select measurement size</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {commonMeasurements.map((m) => (
            <button key={m.value} onClick={() => onMeasurementChange(m.value)} className={`p-3 rounded-lg border text-sm font-medium transition-all ${selectedMeasurement === m.value ? 'bg-[#6D5DFB] text-white border-[#6D5DFB]' : 'bg-white text-[#111827] hover:border-[#9CA3AF]'}`}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-[#6D5DFB] hover:bg-[#5B4EE5]" onClick={onConfirm}>Add</Button>
        </div>
      </div>
    </div>
  );
}

