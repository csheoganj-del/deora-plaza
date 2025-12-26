"use client";
// Takeaway Order Dialog - Hotel Room Service Style UI

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, User, Percent, Receipt } from "lucide-react";
import { LoadingLogo } from "@/components/ui/LoadingLogo";
import { getMenuItems } from "@/actions/menu";
import { createOrder } from "@/actions/orders";
import { useRouter } from "next/navigation";
import { playBeep, showToast } from "@/lib/utils";
import CustomerAutocomplete from "@/components/billing/CustomerAutocomplete";
import DiscountPanel from "@/components/billing/DiscountPanel";
import { calculateBillTotals } from "@/lib/discount-utils";
import { getBusinessSettings } from "@/actions/businessSettings";
import { generateBill } from "@/actions/billing";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  isAvailable: boolean;
  businessUnit?: string; // Added for bar menu items
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
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
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
  const [showBilling, setShowBilling] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<any>(null);
  const [orderSource, setOrderSource] = useState("takeaway");
  const [externalPlatform, setExternalPlatform] = useState("");

  // Fetch business settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getBusinessSettings();
        setBusinessSettings(settings);

        // Set default GST percentage based on business unit
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

  useEffect(() => {
    if (!isOpen) return;

    const loadMenu = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (businessUnit === 'bar') {
          // For bar, load both bar drinks and cafe food menus
          const { getBarMenu } = await import('@/actions/bar');
          const barMenu = await getBarMenu();

          const availableDrinks = barMenu.drinks.filter((item: MenuItem) => item.isAvailable);
          const availableFood = barMenu.food.filter((item: MenuItem) => item.isAvailable);

          console.log('Bar menu loaded:', { drinks: availableDrinks.length, food: availableFood.length });
          console.log('Available food items:', availableFood);

          setBarDrinks(availableDrinks);
          setBarFood(availableFood);

          // Set initial menu based on barMenuMode
          setMenuItems(barMenuMode === 'drinks' ? availableDrinks : availableFood);
        } else {
          // For other business units, load standard menu filtered by business unit
          const rawItems = await getMenuItems(businessUnit);
          const availableItems = rawItems.filter(
            (item: MenuItem) => item.isAvailable,
          );
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

  // Update menu items when barMenuMode changes (for bar business unit)
  useEffect(() => {
    if (businessUnit === 'bar') {
      const newMenuItems = barMenuMode === 'drinks' ? barDrinks : barFood;
      console.log('Switching menu mode:', { barMenuMode, newItemsCount: newMenuItems.length });
      setMenuItems(newMenuItems);

      // Reset selected category to "ALL" when switching modes to avoid category mismatch
      setSelectedCategory("ALL");
      setQuery(""); // Also reset search query for better UX
    }
  }, [barMenuMode, barDrinks, barFood, businessUnit]);

  // Filter menu items based on search query and category
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;
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
    setCustomerName("");
    setCustomerMobile("");
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

  // Calculate totals using discount utilities
  const totals = useMemo(() => {
    return calculateBillTotals(subtotal, discountPercent, gstEnabled ? gstPercentage : 0);
  }, [subtotal, discountPercent, gstEnabled, gstPercentage]);

  const handleGenerateBillForBarOrder = async (orders: any[]) => {
    try {
      // For bar orders, we need to generate bills for each order created
      // Typically, we'll focus on the main drink order if both drinks and food were ordered
      const mainOrder = orders.find((order: any) => order.businessUnit === 'bar') || orders[0];

      if (!mainOrder) {
        console.error('No order found for billing');
        showToast('No order found for billing', 'error');
        return;
      }

      const totals = calculateBillTotals(
        subtotal,
        discountPercent,
        gstEnabled ? gstPercentage : 0,
      );

      // Use selected customer OR manual input
      const customerName = selectedCustomer ? selectedCustomer.name : manualCustomerName;
      const customerMobile = selectedCustomer ? selectedCustomer.mobileNumber : manualCustomerMobile;

      const billResult = await generateBill({
        orderId: mainOrder.id,
        businessUnit: mainOrder.businessUnit,
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
        address: businessSettings?.address || "",
        items: Object.values(cart).map(({ item, qty }) => ({
          menuItemId: item.id,
          name: item.name,
          quantity: qty,
          price: item.price,
        })),
      });

      if (billResult.success) {
        setGeneratedBill({
          id: billResult.billId,
          billNumber: billResult.billNumber,
          orderId: mainOrder.id,
          businessUnit: mainOrder.businessUnit,
          customerMobile: selectedCustomer?.mobileNumber,
          customerName: selectedCustomer?.name,
          subtotal: totals.subtotal,
          discountPercent: totals.discountPercent,
          discountAmount: totals.discountAmount,
          gstPercent: totals.gstPercent,
          gstAmount: totals.gstAmount,
          grandTotal: totals.grandTotal,
          paymentStatus: "paid",
          source: orderSource,
          externalPlatform: orderSource === 'external' ? externalPlatform : undefined,
          address: businessSettings?.address || "",
          createdAt: new Date(),
          items: Object.values(cart).map(({ item, qty }) => ({
            menuItemId: item.id,
            name: item.name,
            quantity: qty,
            price: item.price,
          })),
        });
        setShowBilling(true);
        clearCart();
      } else {
        console.error("Bill generation failed:", billResult);
        console.error("Bill result error details:", billResult.error);
        const errorMessage =
          typeof billResult.error === "string"
            ? billResult.error
            : "Failed to generate bill";
        setError(errorMessage);
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Error generating bill for bar order:", error);
      setError("Failed to generate bill. Please try again.");
      showToast("Failed to generate bill. Please try again.", "error");
    }
  };

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
        // For bar, use createBarOrder which handles dual menu ordering
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

          // For bar takeaway orders, automatically generate bill
          if (businessUnit === 'bar' && orderResult.orders) {
            await handleGenerateBillForBarOrder(orderResult.orders);
          } else {
            clearCart();
            onClose();
            router.refresh();
          }
        } else {
          const errorMessage = orderResult.error;
          if (typeof errorMessage === "string") {
            setError(errorMessage);
          } else if (
            errorMessage &&
            typeof errorMessage === "object" &&
            "message" in errorMessage
          ) {
            setError((errorMessage as any).message as string);
          } else {
            setError("Failed to create order. Please try again.");
          }
          playBeep(500, 160);
          showToast("Failed to create order. Please try again.", "error");
        }
      } else {
        // For other business units, use standard createOrder
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
          if (typeof errorMessage === "string") {
            setError(errorMessage);
          } else if (
            errorMessage &&
            typeof errorMessage === "object" &&
            "message" in errorMessage
          ) {
            setError((errorMessage as any).message as string);
          } else {
            setError("Failed to create order. Please try again.");
          }
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

  // Show billing dialog if bill was generated
  if (showBilling && generatedBill) {
    const BillGenerator = dynamic(() => import("@/components/billing/BillGenerator"), {
      loading: () => <div>Loading billing...</div>,
    });

    return (
      <BillGenerator
        order={{
          id: generatedBill.orderId,
          businessUnit: generatedBill.businessUnit,
          items: generatedBill.items,
          customerName: generatedBill.customerName,
          customerMobile: generatedBill.customerMobile,
        }}
        onClose={() => {
          setShowBilling(false);
          setGeneratedBill(null);
          onClose();
          router.refresh();
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-xl ring-1 ring-black/5">
        {/* Header - More compact */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">
              Takeaway Order ({businessUnit})
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                clearCart();
                onClose();
              }}
              className="p-1.5 text-[#9CA3AF] hover:text-[#111827] rounded-full hover:bg-[#F1F5F9]"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row h-[calc(100vh-120px)]">
          {/* Left: Menu Items */}
          <div className="w-full md:w-[65%] border-r p-3 overflow-hidden flex flex-col">
            {/* Search and Filters - More compact */}
            <div className="mb-3 space-y-2">
              {businessUnit === 'bar' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      console.log('Switching to drinks mode');
                      setBarMenuMode('drinks');
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium ${barMenuMode === 'drinks'
                        ? 'bg-[#6D5DFB] text-white'
                        : 'bg-[#F1F5F9] text-[#111827] hover:bg-[#E5E7EB]'
                      }`}
                  >
                    Drinks 🍺
                  </button>
                  <button
                    onClick={() => {
                      console.log('Switching to food mode');
                      setBarMenuMode('food');
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium ${barMenuMode === 'food'
                        ? 'bg-[#22C55E] text-white'
                        : 'bg-[#F1F5F9] text-[#111827] hover:bg-[#E5E7EB]'
                      }`}
                  >
                    Food 🍽️
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-[#6D5DFB]"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${selectedCategory === cat
                        ? 'bg-[#6D5DFB] text-white'
                        : 'bg-[#F1F5F9] text-[#111827] hover:bg-[#E5E7EB]'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid - More compact cards */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingLogo />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <AlertCircle className="h-12 w-12 text-[#FEE2E2]0 mb-4" />
                  <h3 className="text-lg font-medium text-[#EF4444] mb-2">
                    Error Loading Menu
                  </h3>
                  <p className="text-[#6B7280] mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626]"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[#9CA3AF]">
                  No menu items found
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                  {filteredMenuItems.map((it) => (
                    <div
                      key={it.id}
                      className="border rounded p-1.5 hover:shadow-sm transition-shadow bg-white"
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="font-medium text-[11px] leading-tight truncate">{it.name}</h4>
                        <span className="text-[11px] font-medium text-[#6D5DFB] whitespace-nowrap ml-1">
                          ₹{Number(it.price).toFixed(0)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mt-0.5">
                        <div className="text-[9px] text-[#9CA3AF] truncate">{it.category}</div>

                        {businessUnit === 'bar' && (
                          <div className="text-[9px]">
                            {it.businessUnit === 'bar' || (it as any).businessUnit === undefined && barMenuMode === 'drinks' ? (
                              <span className="text-[#6D5DFB]">🍺</span>
                            ) : (
                              <span className="text-[#22C55E]">🍽️</span>
                            )}
                          </div>
                        )}

                        {cart[it.id] ? (
                          <div className="flex items-center border rounded-full px-1 py-0.5">
                            <button
                              onClick={() => decQty(it.id)}
                              className="px-0.5 text-[#6B7280] hover:text-[#111827] text-[9px]"
                            >
                              -
                            </button>
                            <span className="px-0.5 text-[9px] font-medium">
                              {cart[it.id].qty}
                            </span>
                            <button
                              onClick={() => incQty(it.id)}
                              className="px-0.5 text-[#6B7280] hover:text-[#111827] text-[9px]"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem(it)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[#6D5DFB] text-white hover:bg-[#5B4EE5]"
                            aria-label={`Add ${it.name}`}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary - Optimized layout */}
          <div className="w-full md:w-[35%] p-2 bg-[#F8FAFC] flex flex-col">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto">
                <h4 className="text-sm font-semibold mb-2">Order Summary</h4>

                {businessUnit === 'bar' && (
                  <div className="mb-2 p-1.5 bg-[#EDEBFF]/30 rounded text-[9px] text-[#6D5DFB]">
                    <div className="font-medium">Bar Orders</div>
                    <div>Drinks: Bar • Food: Cafe</div>
                  </div>
                )}

                {/* Customer Information Section - More compact */}
                <div className="mb-3 p-2 bg-white rounded border border-[#E5E7EB]">
                  <h5 className="text-[10px] font-semibold uppercase text-[#9CA3AF] flex items-center gap-1 mb-1">
                    <User className="h-2.5 w-2.5" />
                    Customer
                  </h5>

                  <CustomerAutocomplete
                    compact // Use compact version
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

                {/* Order Source Section */}
                <div className="mb-3 p-2 bg-white rounded border border-[#E5E7EB]">
                  <h5 className="text-[10px] font-semibold uppercase text-[#9CA3AF] flex items-center gap-1 mb-1.5">
                    <Receipt className="h-2.5 w-2.5" />
                    Order Source
                  </h5>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      {["takeaway", "external"].map((source) => (
                        <button
                          key={source}
                          onClick={() => setOrderSource(source)}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${orderSource === source
                              ? "bg-[#6D5DFB] text-white border-[#6D5DFB]"
                              : "bg-white text-[#111827] border-[#9CA3AF] hover:bg-[#F8FAFC]"
                            }`}
                        >
                          {source === 'external' ? 'External Platform' : source}
                        </button>
                      ))}
                    </div>

                    {orderSource === 'external' && (
                      <div>
                        <div className="text-[10px] font-medium text-[#6B7280] mb-1">Platform:</div>
                        <div className="grid grid-cols-2 gap-1">
                          {["zomato", "swiggy", "uber_eats", "foodpanda", "other"].map((platform) => (
                            <button
                              key={platform}
                              onClick={() => setExternalPlatform(platform)}
                              className={`px-1.5 py-0.5 text-[9px] rounded border transition-colors ${externalPlatform === platform
                                  ? "bg-[#DCFCE7]0 text-white border-[#DCFCE7]0"
                                  : "bg-white text-[#6B7280] border-[#9CA3AF] hover:bg-[#F8FAFC]"
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

                {/* Discount Panel - More compact */}
                <div className="mb-3 p-2 bg-white rounded border border-[#E5E7EB]">
                  <h5 className="text-[10px] font-semibold uppercase text-[#9CA3AF] flex items-center gap-1 mb-1.5">
                    <Percent className="h-2.5 w-2.5" />
                    Discounts & Taxes
                  </h5>

                  <DiscountPanel
                    compact // Use compact version
                    customerId={selectedCustomer?.mobileNumber}
                    discountPercent={discountPercent}
                    onDiscountChange={setDiscountPercent}
                    subtotal={subtotal}
                  />

                  {/* GST Toggle - More compact */}
                  {businessSettings?.gstEnabled && (
                    <div className="mt-2 pt-2 border-t border-[#F1F5F9]">
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={gstEnabled}
                          onChange={(e) => setGstEnabled(e.target.checked)}
                          className="rounded border-[#9CA3AF] text-[#6D5DFB] focus:ring-[#EDEBFF]0 h-3.5 w-3.5"
                        />
                        <span>GST ({gstPercentage}%)</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Order Items - More compact */}
                <div className="divide-y">
                  {Object.keys(cart).length === 0 ? (
                    <div className="text-xs text-center text-[#9CA3AF] py-3">
                      No items in cart
                    </div>
                  ) : (
                    Object.values(cart).map(({ item, qty }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-1 text-[11px]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <div className="truncate font-medium">
                              {item.name}
                            </div>
                            {businessUnit === 'bar' && (
                              <div className="text-[9px]">
                                {item.businessUnit === 'bar' || (item as any).businessUnit === undefined && barMenuMode === 'drinks' ? (
                                  <span className="text-[#6D5DFB]">🍺</span>
                                ) : (
                                  <span className="text-[#22C55E]">🍽️</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-[9px] text-[#9CA3AF]">
                            ₹{Number(item.price).toFixed(0)} × {qty} = ₹{(item.price * qty).toFixed(0)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <div className="flex items-center border rounded-full px-1 py-0.5">
                            <button
                              onClick={() => decQty(item.id)}
                              className="px-0.5 text-[#6B7280] text-[10px]"
                            >
                              -
                            </button>
                            <span className="px-1 text-[10px] font-medium">{qty}</span>
                            <button
                              onClick={() => incQty(item.id)}
                              className="px-0.5 text-[#6B7280] text-[10px]"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-[#FEE2E2]0 hover:text-[#DC2626] ml-1"
                            aria-label={`Remove ${item.name}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Order Summary and Submit - More compact */}
              <div className="mt-2 pt-2 border-t border-[#E5E7EB]">
                <div className="space-y-1 text-xs mb-2">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Subtotal:</span>
                    <span>₹{subtotal.toFixed(0)}</span>
                  </div>

                  {discountPercent > 0 && (
                    <div className="flex justify-between text-[#22C55E]">
                      <span>Discount ({discountPercent}%):</span>
                      <span>-₹{totals.discountAmount.toFixed(0)}</span>
                    </div>
                  )}

                  {gstEnabled && (
                    <div className="flex justify-between">
                      <span>GST ({gstPercentage}%):</span>
                      <span>₹{totals.gstAmount.toFixed(0)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-medium text-sm pt-1 border-t border-[#E5E7EB] mt-1">
                    <span>Total:</span>
                    <span>₹{totals.grandTotal.toFixed(0)}</span>
                  </div>
                </div>

                {error && (
                  <div className="mb-2 p-1.5 bg-[#FEE2E2] text-[#DC2626] rounded text-xs">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || Object.keys(cart).length === 0}
                  className="w-full py-2 bg-[#6D5DFB] text-white rounded font-medium hover:bg-[#5B4EE5] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Placing...
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-1.5 h-3.5 w-3.5" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

