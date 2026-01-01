// Custom hook for takeaway order logic
// Extracts business logic from TakeawayOrderDialog component

import { useState, useEffect, useMemo } from "react";
import { getMenuItems } from "@/actions/menu";
import { getBusinessSettings } from "@/actions/businessSettings";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  isAvailable: boolean;
  businessUnit?: string;
}

export interface CartItem {
  item: MenuItem;
  qty: number;
}

export interface OrderTotals {
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  total: number;
}

export interface UseTakeawayOrderProps {
  isOpen: boolean;
  businessUnit: string;
  onClose: () => void;
}

export function useTakeawayOrder({ isOpen, businessUnit, onClose }: UseTakeawayOrderProps) {
  // Menu state
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bar-specific states
  const [barMenuMode, setBarMenuMode] = useState<'drinks' | 'food'>('drinks');
  const [barDrinks, setBarDrinks] = useState<MenuItem[]>([]);
  const [barFood, setBarFood] = useState<MenuItem[]>([]);

  // Cart state
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  // Customer and discount states
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerMobile, setManualCustomerMobile] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Load menu items
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
  }, [isOpen, businessUnit]);

  // Update menu items when barMenuMode changes (for bar business unit)
  useEffect(() => {
    if (businessUnit === 'bar') {
      const newMenuItems = barMenuMode === 'drinks' ? barDrinks : barFood;
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

  // Cart operations
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

  // Calculate totals using discount utilities
  const totals = useMemo(() => {
    const { calculateBillTotals } = require("@/lib/discount-utils");
    return calculateBillTotals(subtotal, discountPercent, gstEnabled ? gstPercentage : 0);
  }, [subtotal, discountPercent, gstEnabled, gstPercentage]);

  // Reset state when dialog closes
  const handleClose = () => {
    clearCart();
    setQuery("");
    setSelectedCategory("ALL");
    setError(null);
    onClose();
  };

  return {
    // State
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    menuItems,
    filteredMenuItems,
    categories,
    isLoading,
    error,
    barMenuMode,
    setBarMenuMode,
    cart,
    selectedCustomer,
    setSelectedCustomer,
    manualCustomerName,
    setManualCustomerName,
    manualCustomerMobile,
    setManualCustomerMobile,
    discountPercent,
    setDiscountPercent,
    gstEnabled,
    setGstEnabled,
    gstPercentage,
    businessSettings,
    isSubmitting,
    setIsSubmitting,
    subtotal,
    totals,

    // Actions
    addItem,
    incQty,
    decQty,
    removeItem,
    clearCart,
    handleClose,
  };
}

