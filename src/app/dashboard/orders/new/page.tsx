"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import MenuGrid from "@/components/cafe/MenuGrid";
import OrderCart from "@/components/cafe/OrderCart";
import { getMenuItems } from "@/actions/menu";
import { createOrder } from "@/actions/orders";
import { Loader2 } from "lucide-react";
import CustomerLookup from "@/components/cafe/CustomerLookup";
import { useServerAuth } from "@/hooks/useServerAuth";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
};

import { Suspense } from "react";

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewOrderContent />
    </Suspense>
  );
}

function NewOrderContent() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");
  const tableNumber = searchParams.get("tableNumber");

  const { data: session, status } = useServerAuth();

  // Use React Query for menu items - instant loading after first fetch!
  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ["menu", "cafe"],
    queryFn: () => getMenuItems("cafe"),
    staleTime: 5 * 60 * 1000, // Menu stays fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Cache persists for 30 minutes
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);

  console.log("NewOrderContent rendered with cart length:", cart.length);

  const handleAddItem = (item: MenuItem, quantityChange: number) => {
    console.log(
      "Adding item to cart:",
      item,
      "Quantity change:",
      quantityChange,
    );
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        const newQuantity = existing.quantity + quantityChange;
        if (newQuantity <= 0) {
          console.log("Removing item from cart");
          return prev.filter((i) => i.id !== item.id);
        }
        console.log("Updating item quantity to:", newQuantity);
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: newQuantity } : i,
        );
      }
      if (quantityChange > 0) {
        console.log("Adding new item to cart");
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: quantityChange,
          },
        ];
      }
      return prev;
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    console.log("Updating quantity for item:", id, "Delta:", delta);
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQuantity = Math.max(0, item.quantity + delta);
            console.log("New quantity:", newQuantity);
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveItem = (id: string) => {
    console.log("Removing item from cart:", id);
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmitOrder = async () => {
    console.log("=== HANDLE SUBMIT ORDER FUNCTION CALLED ===");
    console.log("=== SUBMIT ORDER STARTED ===");
    console.log("Current cart items:", cart);

    if (cart.length === 0) {
      alert("Please add items to the cart before submitting.");
      return;
    }

    // Check if user is authenticated
    if (status !== "authenticated" || !session?.user) {
      alert("You must be logged in to create an order.");
      return;
    }

    // Check if user has appropriate role
    const userRole = session.user?.role;
    const allowedRoles = [
      "super_admin",
      "owner",
      "manager",
      "cafe_manager",
      "bar_manager",
      "waiter",
    ];

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log("User role not allowed:", userRole);
      alert("You don't have permission to create orders.");
      return;
    }

    setLoading(true);
    try {
      console.log("Preparing order data...");
      const result = await createOrder({
        tableId: tableId || undefined,
        customerMobile: customer?.mobileNumber,
        customerName: customer?.name,
        items: cart.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions,
        })),
        type: "dine-in",
        businessUnit: "cafe",
      });

      if (result && result.success) {
        alert("Order sent to kitchen successfully!");
        setCart([]);
      } else {
        const errorMessage = result?.error || "Failed to create order.";
        console.error("Order creation failed:", errorMessage);
        alert(`Failed to create order: ${errorMessage}`);
      }
    } catch (error) {
      console.error("=== UNCAUGHT ERROR IN SUBMIT ORDER ===");
      console.error("Error submitting order:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      alert("An unexpected error occurred while submitting the order.");
    } finally {
      console.log("Submit order process completed");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#111827]">New Order</h1>
          {tableNumber && <p className="text-[#6B7280]">Table {tableNumber}</p>}
        </div>

        <CustomerLookup onSelectCustomer={setCustomer} />

        {menuLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <MenuGrid
            items={menuItems}
            onAddItem={handleAddItem}
            cartItems={cart.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            }))}
          />
        )}
      </div>

      <div className="w-96 border-l border-[#E5E7EB] flex flex-col">
        <OrderCart
          items={cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }))}
          onRemoveItem={handleRemoveItem}
          onUpdateQuantity={handleUpdateQuantity}
          onSubmitOrder={handleSubmitOrder}
          tableNumber={tableNumber || undefined}
        />
      </div>
    </div>
  );
}

