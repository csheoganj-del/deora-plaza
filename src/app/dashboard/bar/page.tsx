"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getBarMenu } from "@/actions/bar";
import { createBarOrder } from "@/actions/bar";
import { Button } from "@/components/ui/hybrid/button";
import { Input } from "@/components/ui/hybrid/input";
import { Badge } from "@/components/ui/hybrid/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/hybrid/tabs";
import { Card, CardContent } from "@/components/ui/hybrid/card";
import {
  Beer,
  UtensilsCrossed,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Wine,
  Loader2,
  GlassWater,
} from "lucide-react";
import BarQueue from "@/components/bar/BarQueue";
import { PremiumLiquidGlass, PremiumContainer } from "@/components/ui/glass/premium-liquid-glass";
import { useServerAuth } from "@/hooks/useServerAuth";

import { LiquidButton } from "@/components/ui/LiquidButton";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  measurement?: string; // e.g., "30ml", "750ml", "1 bottle"
  measurementUnit?: string; // e.g., "ml", "bottle", "pint"
  baseMeasurement?: number; // e.g., 30 for 30ml, 750 for 750ml
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "drink" | "food";
  measurement?: string; // e.g., "30ml", "750ml", "1 bottle"
  measurementUnit?: string; // e.g., "ml", "bottle", "pint"
  baseMeasurement?: number; // e.g., 30 for 30ml, 750 for 750ml
};

export default function BarPage() {
  const { data: session } = useServerAuth();
  const [drinkMenu, setDrinkMenu] = useState<MenuItem[]>([]);
  const [foodMenu, setFoodMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("drinks");
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    async function loadMenus() {
      const { drinks, food } = await getBarMenu();
      setDrinkMenu(drinks);
      setFoodMenu(food);
      if ((drinks?.length || 0) === 0 && (food?.length || 0) === 0) {
        setDisabled(true);
      }
      setLoading(false);
    }
    loadMenus();
  }, []);

  const handleAddItem = (item: MenuItem, type: "drink" | "food") => {
    setCart((prev) => {
      // For drinks with measurements, we add the measurement to the cart item
      const newItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        type,
        measurement: item.measurement,
        measurementUnit: item.measurementUnit,
        baseMeasurement: item.baseMeasurement
      };

      // Check if item already exists in cart
      const existingIndex = prev.findIndex((i) => i.id === item.id);

      if (existingIndex >= 0) {
        // If item exists, increase quantity
        const updatedCart = [...prev];
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + 1
        };
        return updatedCart;
      }

      // If new item, add to cart
      return [...prev, newItem];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQuantity = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const items = cart.map((item) => ({
        menuItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        businessUnit: item.type === "drink" ? "bar" : "restaurant",
        measurement: item.measurement,
        measurementUnit: item.measurementUnit,
        baseMeasurement: item.baseMeasurement
      }));

      const result = await createBarOrder({
        items,
      });

      if (result.success) {
        setCart([]);
      }
    } catch (error) {
      console.error("Failed to create order", error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const filteredDrinks = drinkMenu.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredFood = foodMenu.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
      {/* Left Panel - Menu */}
      <div className="lg:col-span-2 h-full flex flex-col space-y-6">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
              Bar & Lounge
            </h1>
            <p className="text-white/50 mt-1">Manage bar orders and inventory</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              placeholder="Search menu..."
              className="w-full pl-10 h-11 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]/50 placeholder:text-white/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Menu Content */}
        <PremiumLiquidGlass className="flex-1 overflow-hidden flex flex-col" title="Menu">
          <Tabs
            defaultValue="drinks"
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-6 border-b border-white/5 pb-4">
              <TabsList className="bg-white/5 p-1 rounded-xl w-auto inline-flex h-auto">
                <TabsTrigger
                  value="drinks"
                  className="data-[state=active]:bg-[#6D5DFB] data-[state=active]:text-white text-white/60 px-6 py-2 rounded-lg font-medium transition-all"
                >
                  <Wine className="mr-2 h-4 w-4" /> Signature Drinks
                </TabsTrigger>
                <TabsTrigger
                  value="food"
                  className="data-[state=active]:bg-[#6D5DFB] data-[state=active]:text-white text-white/60 px-6 py-2 rounded-lg font-medium transition-all"
                >
                  <UtensilsCrossed className="mr-2 h-4 w-4" /> Bar Snacks
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <TabsContent value="drinks" className="mt-0 h-full">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 pb-20">
                  {filteredDrinks.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddItem(item, "drink")}
                      className="group relative p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D5DFB] bg-[#6D5DFB]/10 px-2 py-0.5 rounded-full border border-[#6D5DFB]/20">
                            {item.category}
                          </span>
                          <span className="font-bold text-white">₹{item.price}</span>
                        </div>
                        <h3 className="font-semibold text-white group-hover:text-[#6D5DFB] transition-colors mb-1">{item.name}</h3>
                        <p className="text-xs text-white/40 line-clamp-2">{item.description}</p>
                        {item.measurement && (
                          <p className="text-xs text-[#6D5DFB] font-medium mt-1">{item.measurement} serving</p>
                        )}
                      </div>
                      <button className="w-full mt-4 py-2 rounded-lg bg-white/5 hover:bg-[#6D5DFB] text-white/60 hover:text-white transition-all text-xs font-medium flex items-center justify-center gap-2">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="food" className="mt-0 h-full">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 pb-20">
                  {filteredFood.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddItem(item, "food")}
                      className="group relative p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D5DFB] bg-[#6D5DFB]/10 px-2 py-0.5 rounded-full border border-[#6D5DFB]/20">
                            {item.category}
                          </span>
                          <span className="font-bold text-white">₹{item.price}</span>
                        </div>
                        <h3 className="font-semibold text-white group-hover:text-[#6D5DFB] transition-colors mb-1">{item.name}</h3>
                        <p className="text-xs text-white/40 line-clamp-2">{item.description}</p>
                      </div>
                      <button className="w-full mt-4 py-2 rounded-lg bg-white/5 hover:bg-[#6D5DFB] text-white/60 hover:text-white transition-all text-xs font-medium flex items-center justify-center gap-2">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </PremiumLiquidGlass>
      </div>

      {/* Right Panel - Cart */}
      <div className="h-full flex flex-col space-y-6">
        <PremiumLiquidGlass className="flex-1 flex flex-col overflow-hidden" title="Current Order">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-white/20" />
                </div>
                <p>Cart is empty</p>
                <p className="text-xs text-center max-w-[200px] text-white/20">
                  Select items from the menu to start a new order
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between group hover:border-[#6D5DFB]/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-white text-sm truncate pr-2">{item.name}</p>
                        <p className="text-xs font-bold text-white">₹{item.price * item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span>₹{item.price} each</span>
                        {item.measurement && (
                          <span>• {item.measurement}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 bg-black/20 rounded-lg p-0.5">
                      <button
                        className="h-6 w-6 rounded-md hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateQuantity(item.id, -1);
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-white">{item.quantity}</span>
                      <button
                        className="h-6 w-6 rounded-md hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateQuantity(item.id, 1);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/40">
                <span>Subtotal</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm text-white/40">
                <span>Tax (5%)</span>
                <span>₹{Math.round(totalAmount * 0.05)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-white pt-2 border-t border-white/5">
                <span>Total</span>
                <span>₹{Math.round(totalAmount * 1.05)}</span>
              </div>
            </div>

            <LiquidButton
              className="w-full h-12 text-lg font-bold"
              disabled={cart.length === 0 || loading}
              onClick={handleSubmitOrder}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Place Order"
              )}
            </LiquidButton>
          </div>
        </PremiumLiquidGlass>

        {/* Active Queue (Small panel) */}
        <PremiumLiquidGlass className="h-48 overflow-hidden flex flex-col" title="Active Queue">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <BarQueue />
          </div>
        </PremiumLiquidGlass>
      </div>
    </div>
  );
}

