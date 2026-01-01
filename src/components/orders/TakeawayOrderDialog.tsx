"use client";

import { useState, useEffect, useMemo } from "react";
import { AlertCircle, User, Percent, Receipt, X, ChevronDown, ShoppingBag, ArrowRight } from "lucide-react";
import { LoadingLogo } from "@/components/ui/LoadingLogo";
import { getMenuItems } from "@/actions/menu";
import { createOrder } from "@/actions/orders";
import { useRouter } from "next/navigation";
import { playBeep, showToast } from "@/lib/utils";
import CustomerAutocomplete from "@/components/billing/CustomerAutocomplete";
import DiscountPanel from "@/components/billing/DiscountPanel";
import { calculateBillTotals } from "@/lib/discount-utils";
import { getBusinessSettings } from "@/actions/businessSettings";

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
}

export function TakeawayOrderDialog({
  isOpen,
  onClose,
  businessUnit,
}: TakeawayOrderDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [cart, setCart] = useState<{
    [key: string]: { item: MenuItem; qty: number };
  }>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  // Bar-specific states
  const [barMenuMode, setBarMenuMode] = useState<'drinks' | 'food'>('drinks');
  const [barDrinks, setBarDrinks] = useState<MenuItem[]>([]);
  const [barFood, setBarFood] = useState<MenuItem[]>([]);

  // Customer and discount states
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerMobile, setManualCustomerMobile] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [orderSource, setOrderSource] = useState("takeaway");
  const [externalPlatform, setExternalPlatform] = useState("");
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);

  // Get location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => { /* Silently handle location error */ }
      );
    }
  }, []);

  // Fetch business settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getBusinessSettings();
        setBusinessSettings(settings);

        if (settings?.gstEnabled) {
          if (businessUnit === 'bar' && settings.barGstEnabled) {
            setGstEnabled(true);
            setGstPercentage(settings.barGstPercentage || 0);
          } else if (businessUnit === 'cafe' && settings.cafeGstEnabled) {
            setGstEnabled(true);
            setGstPercentage(settings.cafeGstPercentage || 0);
          } else {
            setGstEnabled(settings.gstEnabled);
            setGstPercentage(settings.gstPercentage || 0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch business settings:", err);
      }
    };

    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, businessUnit]);

  // Auto-collapse info panel when items are added
  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      setIsInfoExpanded(false);
    } else {
      setIsInfoExpanded(true);
    }
  }, [Object.keys(cart).length]);

  // Load menu items
  useEffect(() => {
    if (!isOpen) return;

    const loadMenu = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (businessUnit === 'bar') {
          const { getBarMenu } = await import('@/actions/bar');
          const barMenu = await getBarMenu();

          const availableDrinks = barMenu.drinks.filter((item: MenuItem) => item.isAvailable);
          const availableFood = barMenu.food.filter((item: MenuItem) => item.isAvailable);

          setBarDrinks(availableDrinks);
          setBarFood(availableFood);
          setMenuItems(barMenuMode === 'drinks' ? availableDrinks : availableFood);
        } else {
          const rawItems = await getMenuItems(businessUnit);
          const availableItems = rawItems.filter((item: MenuItem) => item.isAvailable);
          setMenuItems(availableItems);
        }
      } catch (err) {
        console.error("Failed to load menu:", err);
        setError("Failed to load menu. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadMenu();
  }, [isOpen, businessUnit, barMenuMode]);

  // Update menu items when barMenuMode changes
  useEffect(() => {
    if (businessUnit === 'bar') {
      const newMenuItems = barMenuMode === 'drinks' ? barDrinks : barFood;
      setMenuItems(newMenuItems);
      setSelectedCategory("ALL");
      setQuery("");
    }
  }, [barMenuMode, barDrinks, barFood, businessUnit]);

  // Filter menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, query, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(menuItems.map((item) => item.category))];
    return ["ALL", ...cats];
  }, [menuItems]);

  const clearCart = () => {
    setCart({});
    setSelectedCustomer(null);
    setManualCustomerName("");
    setManualCustomerMobile("");
    setDiscountPercent(0);
  };

  const addItem = (item: MenuItem) => {
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
  };

  const incQty = (id: string) => {
    setCart((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        qty: prev[id].qty + 1,
      },
    }));
  };

  const decQty = (id: string) => {
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
  };

  const removeItem = (id: string) => {
    setCart((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return Object.values(cart).reduce(
      (sum, { item, qty }) => sum + item.price * qty,
      0,
    );
  }, [cart]);

  // Calculate totals
  const totals = useMemo(() => {
    return calculateBillTotals(subtotal, discountPercent, gstEnabled ? gstPercentage : 0);
  }, [subtotal, discountPercent, gstEnabled, gstPercentage]);

  const handleSubmit = async () => {
    if (Object.keys(cart).length === 0) {
      setError("Please add at least one item to the order.");
      playBeep(500, 160);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (businessUnit === 'bar') {
        const { createBarOrder } = await import('@/actions/bar');

        const orderItemsPayload = Object.values(cart).map((e) => ({
          menuItemId: e.item.id,
          name: e.item.name,
          quantity: e.qty,
          price: e.item.price,
          businessUnit: e.item.businessUnit || (barMenuMode === 'drinks' ? 'bar' : 'cafe'),
        }));

        const orderResult = await createBarOrder({
          items: orderItemsPayload,
          customerMobile: selectedCustomer?.mobileNumber || manualCustomerMobile || undefined,
        });

        if (orderResult.success) {
          playBeep(1000, 160);
          showToast(`Bar takeaway order placed successfully!`, "success");
          clearCart();
          onClose();
          router.refresh();
        } else {
          const errorMessage = orderResult.error;
          setError(typeof errorMessage === "string" ? errorMessage : "Failed to create order. Please try again.");
          playBeep(500, 160);
          showToast("Failed to create order. Please try again.", "error");
        }
      } else {
        const orderItemsPayload = Object.values(cart).map((e) => ({
          menuItemId: e.item.id,
          name: e.item.name,
          quantity: e.qty,
          price: e.item.price,
        }));

        const orderResult = await createOrder({
          businessUnit,
          type: "takeaway",
          customerMobile: selectedCustomer?.mobileNumber || manualCustomerMobile || undefined,
          customerName: selectedCustomer?.name || manualCustomerName || undefined,
          items: orderItemsPayload,
          location,
        });

        if (orderResult.success) {
          playBeep(1000, 160);
          showToast(`Takeaway order placed successfully!`, "success");
          clearCart();
          onClose();
          router.refresh();
        } else {
          const errorMessage = orderResult.error;
          setError(typeof errorMessage === "string" ? errorMessage : "Failed to create order. Please try again.");
          playBeep(500, 160);
          showToast("Failed to create order. Please try again.", "error");
        }
      }
    } catch (error) {
      console.error("An error occurred during order submission:", error);
      setError("An unexpected error occurred during submission.");
      playBeep(500, 160);
      showToast("An unexpected error occurred during submission.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
        <div
          className="bg-[#1c1c1c]/95 w-full max-w-[90vw] xl:max-w-7xl h-[90vh] rounded-[24px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/[0.08] flex flex-col overflow-hidden pointer-events-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Section - Calm & Stable */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold text-white tracking-tight">
                Takeaway Order
              </h3>
              <p className="text-sm text-white/50 font-light mt-0.5">
                Creating new takeaway order • {businessUnit}
              </p>
            </div>
            <button
              onClick={() => {
                clearCart();
                onClose();
              }}
              className="p-2.5 text-white/40 hover:text-white rounded-full hover:bg-white/[0.08] transition-all active:scale-90"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Menu Browsing */}
            <div className="w-[70%] flex flex-col border-r border-white/[0.06] bg-black/20">
              {/* Search & Filters */}
              <div className="p-6 bg-white/[0.03] border-b border-white/[0.06] space-y-5 shrink-0">
                {businessUnit === 'bar' && (
                  <div className="flex bg-white/[0.05] p-1.5 rounded-xl w-fit border border-white/[0.05]">
                    <button
                      onClick={() => setBarMenuMode('drinks')}
                      className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${barMenuMode === 'drinks'
                        ? 'bg-white/[0.12] text-white shadow-xl ring-1 ring-white/10'
                        : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
                        }`}
                    >
                      🍺 Drinks
                    </button>
                    <button
                      onClick={() => setBarMenuMode('food')}
                      className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${barMenuMode === 'food'
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
                    className="w-full pl-12 pr-4 py-3.5 text-base bg-white/[0.06] border border-white/[0.1] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2fd180]/40 focus:bg-white/[0.08] transition-all text-white placeholder-white/30"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#2fd180]/60 transition-colors">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {query && (
                    <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                      <X className="h-5 w-5 text-white/20 hover:text-white/50 transition-colors" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${selectedCategory === cat
                        ? 'bg-[#2fd180] text-white shadow-lg shadow-[#2fd180]/20'
                        : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] border border-white/[0.05]'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Grid - Solid-on-Glass */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingLogo />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="bg-red-500/10 p-4 rounded-full mb-6 ring-1 ring-red-500/20">
                      <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Error Loading Menu</h3>
                    <p className="text-white/50 mb-8 max-w-sm">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-8 py-3 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl transition-all border border-white/10"
                    >
                      Retry Now
                    </button>
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-white/30">
                    <div className="bg-white/[0.03] p-6 rounded-3xl mb-4 border border-white/[0.05]">
                      <AlertCircle className="h-8 w-8 text-white/20" />
                    </div>
                    <p className="text-lg font-medium">No menu items found</p>
                    <p className="text-sm">Try searching for something else</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredMenuItems.map((item) => {
                      const inCart = cart[item.id]?.qty || 0;
                      return (
                        <div
                          key={item.id}
                          className={`bg-white/[0.04] rounded-2xl p-5 border transition-all duration-300 group cursor-pointer active:scale-[0.97] hover:bg-white/[0.07] ${inCart > 0 ? 'border-[#2fd180]/40 ring-1 ring-[#2fd180]/10 bg-white/[0.08]' : 'border-white/[0.05] hover:border-white/10'}`}
                          onClick={() => addItem(item)}
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white text-base leading-tight mb-1 group-hover:text-[#2fd180] transition-colors line-clamp-2">
                                {item.name}
                              </h4>
                              <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-4">{item.category}</p>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.03]">
                              <span className="font-bold text-white text-lg">₹{Number(item.price).toFixed(0)}</span>

                              {inCart > 0 ? (
                                <div className="flex items-center bg-[#2fd180]/10 rounded-xl p-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => decQty(item.id)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-[#2fd180] transition-all"
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                                    </svg>
                                  </button>
                                  <span className="text-sm font-bold text-[#2fd180] w-7 text-center">
                                    {inCart}
                                  </span>
                                  <button
                                    onClick={() => incQty(item.id)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-[#2fd180] transition-all"
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button className="h-10 w-10 rounded-full bg-white/[0.05] text-[#2fd180] flex items-center justify-center border border-[#2fd180]/20 group-hover:bg-[#2fd180] group-hover:text-white group-hover:border-transparent transition-all shadow-lg shadow-black/20">
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Order Summary - POS Optimized */}
            <div className="w-[30%] flex flex-col bg-black/55 border-l border-white/[0.06] overflow-hidden relative shadow-2xl">
              {/* 1. Header Section */}
              <div className="p-4 border-b border-white/[0.04] shrink-0 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-white tracking-tight">Order Summary</h4>
                  <div className="bg-[#2fd180]/20 text-[#2fd180] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-[#2fd180]/30">
                    POS v2.0
                  </div>
                </div>
              </div>

              {/* 2. Collapsible Info Section (Customer, Source, Discounts) */}
              <div className="shrink-0 border-b border-white/[0.02]">
                <button
                  onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                  className="w-full h-8 flex items-center justify-between px-4 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                >
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    {isInfoExpanded ? 'Hide Customer Info' : 'Show Customer Info'}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-white/30 transition-transform duration-300 ${isInfoExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isInfoExpanded && (
                  <div className="p-4 space-y-4 bg-white/[0.02] border-b border-white/[0.04] animate-in slide-in-from-top-2 duration-300 overflow-hidden">
                    {/* Customer Information */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/40">
                        <User className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Customer</span>
                      </div>
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                        <CustomerAutocomplete
                          onCustomerSelect={(customer) => {
                            setSelectedCustomer(customer);
                            if (customer) {
                              setManualCustomerName(customer.name);
                              setManualCustomerMobile(customer.mobileNumber);
                            }
                          }}
                          onNameChange={setManualCustomerName}
                          onMobileChange={setManualCustomerMobile}
                          initialName={manualCustomerName}
                          initialMobile={manualCustomerMobile}
                        />
                      </div>
                    </div>

                    {/* Order Source */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/40">
                        <Receipt className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Source</span>
                      </div>
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-3">
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/20 rounded-lg border border-white/[0.04]">
                          {["takeaway", "external"].map((source) => (
                            <button
                              key={source}
                              onClick={() => setOrderSource(source)}
                              className={`px-2 py-2 text-xs font-semibold rounded-md transition-all duration-200 ${orderSource === source
                                ? "bg-white/[0.08] text-[#2fd180] shadow-sm ring-1 ring-white/10"
                                : "text-white/30 hover:text-white/50"
                                }`}
                            >
                              {source === 'external' ? 'External' : 'Takeaway'}
                            </button>
                          ))}
                        </div>

                        {orderSource === 'external' && (
                          <div className="animate-in slide-in-from-top-1 duration-200">
                            <div className="grid grid-cols-3 gap-1">
                              {["zomato", "swiggy", "uber_eats", "foodpanda", "other"].map((platform) => (
                                <button
                                  key={platform}
                                  onClick={() => setExternalPlatform(platform)}
                                  className={`px-1 py-1.5 text-[10px] font-medium rounded-md border transition-all ${externalPlatform === platform
                                    ? "bg-[#2fd180]/15 text-[#2fd180] border-[#2fd180]/20"
                                    : "bg-white/[0.02] text-white/30 border-white/[0.04] hover:bg-white/[0.05]"
                                    }`}
                                >
                                  {platform.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Discounts */}
                    {Object.keys(cart).length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-white/40">
                          <Percent className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Adjustments</span>
                        </div>
                        <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                          <DiscountPanel
                            customerId={selectedCustomer?.mobileNumber}
                            discountPercent={discountPercent}
                            onDiscountChange={setDiscountPercent}
                            subtotal={subtotal}
                          />

                          {businessSettings?.gstEnabled && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <label className="flex items-center gap-2 text-sm text-white/70">
                                <input
                                  type="checkbox"
                                  checked={gstEnabled}
                                  onChange={(e) => setGstEnabled(e.target.checked)}
                                  className="rounded border-white/20 bg-white/10 text-[#2fd180] focus:ring-[#2fd180]/50"
                                />
                                <span>GST ({gstPercentage}%)</span>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Items Header (Floating-style reassurance) */}
              <div className="px-5 py-3 bg-white/[0.02] border-b border-white/[0.04] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Items</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-white/60">
                    {Object.values(cart).reduce((sum, { qty }) => sum + qty, 0)}
                  </span>
                </div>
                <div className="text-sm font-black text-[#2fd180]">
                  ₹{subtotal.toFixed(0)}
                </div>
              </div>

              {/* 4. Scrollable Items (The Hero Zone) */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {Object.keys(cart).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="bg-white/[0.03] p-10 rounded-full mb-6 border border-white/[0.05] animate-pulse">
                      <ShoppingBag className="h-10 w-10 text-white/10" />
                    </div>
                    <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[200px]">
                      Select items from the left to build the order
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2.5">
                    {Object.values(cart).map(({ item, qty }) => (
                      <div key={item.id} className="flex justify-between items-center p-3.5 bg-white/[0.06] rounded-2xl border border-white/[0.04] group hover:border-[#2fd180]/40 transition-all active:scale-[0.98]">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="font-bold text-xs text-white truncate group-hover:text-[#2fd180] transition-colors capitalize">{item.name}</div>
                          <div className="text-[10px] text-white/50 mt-0.5 flex items-center gap-2 font-medium">
                            <span className="bg-white/5 px-1.5 py-0.5 rounded">₹{item.price}</span>
                            <span>×</span>
                            <span className="text-white/80 font-bold">{qty}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-xs text-white tracking-tight">₹{(item.price * qty).toFixed(0)}</span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-white/10 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Sticky Footer (Totals & Action) */}
              <div className="shrink-0 bg-[#121212]/80 backdrop-blur-2xl border-t border-white/[0.08] p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                {Object.keys(cart).length > 0 && (
                  <div className="mb-5 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between text-xs font-medium text-white/40 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>₹{totals.subtotal.toFixed(0)}</span>
                    </div>
                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-xs font-bold text-[#2fd180] uppercase tracking-widest">
                        <span>Discount ({totals.discountPercentage}%)</span>
                        <span>-₹{totals.discountAmount.toFixed(0)}</span>
                      </div>
                    )}
                    {totals.gstAmount > 0 && (
                      <div className="flex justify-between text-xs font-medium text-white/40 uppercase tracking-widest">
                        <span>GST ({gstPercentage}%)</span>
                        <span>₹{totals.gstAmount.toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2">
                      <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Grand Total</span>
                      <span className="text-4xl font-black text-white tracking-tighter">
                        ₹{Math.round(totals.total)}
                      </span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[11px] font-bold flex items-center gap-3 animate-bounce">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || Object.keys(cart).length === 0}
                  className="w-full h-16 bg-gradient-to-br from-[#2fd180] to-[#1fac60] text-white rounded-[20px] font-black text-lg hover:shadow-[0_20px_40px_-10px_rgba(47,209,128,0.4)] disabled:opacity-20 disabled:grayscale transition-all active:scale-[0.96] shadow-2xl flex items-center justify-center gap-3 border border-white/10 group overflow-hidden relative"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-[3px] border-white border-t-transparent" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 flex items-center gap-2">
                        Place Order
                        {Object.keys(cart).length > 0 && (
                          <span className="bg-black/20 px-2 py-0.5 rounded-lg text-xs">
                            {Object.values(cart).reduce((sum, { qty }) => sum + qty, 0)} items
                          </span>
                        )}
                      </span>
                      <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}