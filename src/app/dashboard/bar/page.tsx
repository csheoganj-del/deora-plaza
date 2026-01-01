"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getBarMenu } from "@/actions/bar";
import { createBarOrder } from "@/actions/bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
    <div className="flex h-[calc(100vh-6rem)] bg-[var(--bg-main)] relative overflow-hidden rounded-xl border border-[var(--glass-border)] shadow-sm">
      {/* Abstract Glass Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6D5DFB]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#EDEBFF]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex-1 flex flex-col p-6 overflow-hidden relative z-10 text-[var(--text-primary)]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#6D5DFB] to-[#EDEBFF] flex items-center justify-center shadow-lg shadow-[#6D5DFB]/20">
                <Wine className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                Bar & Lounge
              </h1>
            </div>
            <p className="text-[#9CA3AF] font-medium ml-16 mt-1">
              Manage bar orders and inventory
            </p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              placeholder="Search menu..."
              className="pl-10 h-11 bg-[var(--glass-bg)] backdrop-blur-sm border-[var(--glass-border)] focus:ring-[#6D5DFB] rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs
          defaultValue="drinks"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="bg-[var(--glass-bg)]/50 p-1 rounded-xl w-auto inline-flex h-auto mb-6">
            <TabsTrigger
              value="drinks"
              className="data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm data-[state=active]:text-[#6D5DFB] data-[state=active]:shadow-sm px-6 py-2 rounded-lg font-medium transition-all"
            >
              <Wine className="mr-2 h-4 w-4" /> Signature Drinks
            </TabsTrigger>
            <TabsTrigger
              value="food"
              className="data-[state=active]:bg-white/40 data-[state=active]:backdrop-blur-sm data-[state=active]:text-[#6D5DFB] data-[state=active]:shadow-sm px-6 py-2 rounded-lg font-medium transition-all"
            >
              <UtensilsCrossed className="mr-2 h-4 w-4" /> Bar Snacks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drinks" className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
              {filteredDrinks.map((item) => (
                <div className="premium-card cursor-pointer" key={item.id} onClick={() => handleAddItem(item, "drink")}>
                  <div className="p-8 p-4 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant="outline"
                          className="border-[#EDEBFF] text-[#6D5DFB] bg-[#EDEBFF]/20"
                        >
                          {item.category}
                        </Badge>
                        <span className="font-bold text-[#111827]">
                          ₹{item.price}
                        </span>
                      </div>
                      <h3 className="font-bold text-[var(--text-primary)] mb-1 group-hover:text-[#6D5DFB] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#9CA3AF] line-clamp-2">
                        {item.description}
                      </p>
                      {item.measurement && (
                        <p className="text-xs text-[#6D5DFB] font-medium mt-1">
                          {item.measurement} serving
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full mt-4 bg-[var(--glass-bg)] hover:bg-[#EDEBFF]/30 hover:text-[#6D5DFB]"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="food" className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
              {filteredFood.map((item) => (
                <div className="premium-card cursor-pointer" key={item.id} onClick={() => handleAddItem(item, "food")}>
                  <div className="p-8 p-4 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant="outline"
                          className="border-[#EDEBFF] text-[#6D5DFB] bg-[#EDEBFF]/20"
                        >
                          {item.category}
                        </Badge>
                        <span className="font-bold text-[#111827]">
                          ₹{item.price}
                        </span>
                      </div>
                      <h3 className="font-bold text-[var(--text-primary)] mb-1 group-hover:text-[#6D5DFB] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#9CA3AF] line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full mt-4 bg-[var(--glass-bg)] hover:bg-[#EDEBFF]/30 hover:text-[#6D5DFB]"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="w-96 glass-panel border-l border-white/40 flex flex-col h-full shadow-2xl z-20">
        <div className="p-4 border-b border-white/20 bg-white/30 backdrop-blur-md">
          <h2 className="font-bold text-lg text-[#111827] flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#6D5DFB]" />
            Current Order
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#9CA3AF] space-y-4">
              <div className="h-16 w-16 rounded-full bg-[var(--glass-bg)] flex items-center justify-center">
                <Beer className="h-8 w-8 text-[#9CA3AF]" />
              </div>
              <p>Cart is empty</p>
              <p className="text-xs text-center max-w-[200px]">
                Select items from the menu to start a new order
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div className="premium-card">
                  <div className="flex-1">
                    <p className="font-medium text-[#111827] text-sm">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      ₹{item.price} x {item.quantity}
                      {item.measurement ? ` (${item.measurement} each)` : ''}
                      {item.measurement ? ` = ₹${item.price * item.quantity}` : ''}
                    </p>
                    {item.measurement && (
                      <p className="text-xs text-[#9CA3AF]">
                        Total: {item.quantity * (item.baseMeasurement || 0)}{item.measurementUnit}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full hover:bg-[#E5E7EB]"
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-bold w-4 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full hover:bg-[#E5E7EB]"
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/20 bg-white/30 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-[#9CA3AF]">
              <span>Subtotal</span>
              <span>₹{totalAmount}</span>
            </div>
            <div className="flex justify-between text-sm text-[#9CA3AF]">
              <span>Tax (5%)</span>
              <span>₹{Math.round(totalAmount * 0.05)}</span>
            </div>
            <Separator className="bg-[#E5E7EB]" />
            <div className="flex justify-between font-bold text-lg text-[#111827]">
              <span>Total</span>
              <span>₹{Math.round(totalAmount * 1.05)}</span>
            </div>
          </div>

          <LiquidButton
            className="w-full h-12 text-lg"
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

        <div className="border-t border-white/20 bg-white/20 p-4 max-h-48 overflow-y-auto">
          <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">
            Active Queue
          </h3>
          <BarQueue />
        </div>
      </div>
    </div>
  );
}

