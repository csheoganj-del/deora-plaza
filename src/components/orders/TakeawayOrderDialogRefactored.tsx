// Refactored TakeawayOrderDialog - Now uses smaller, focused components
// Much more maintainable and easier to understand

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTakeawayOrder } from "@/hooks/useTakeawayOrder";
import { OrderMenuSection } from "./OrderMenuSection";
import { OrderCartSection } from "./OrderCartSection";
import { OrderCustomerSection } from "./OrderCustomerSection";
import { createBarOrder } from "@/actions/bar";
import { createOrder } from "@/actions/orders";

interface TakeawayOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  businessUnit: string;
}

export function TakeawayOrderDialogRefactored({ isOpen, onClose, businessUnit }: TakeawayOrderDialogProps) {
  const {
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
    isSubmitting,
    setIsSubmitting,
    subtotal,
    totals,
    addItem,
    incQty,
    decQty,
    removeItem,
    clearCart,
    handleClose
  } = useTakeawayOrder({ isOpen, businessUnit, onClose });

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

  const handlePlaceOrder = async () => {
    if (Object.keys(cart).length === 0) {
      alert("Please add items to your order");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = Object.values(cart).map(({ item, qty }) => ({
        menuItemId: item.id,
        name: item.name,
        quantity: qty,
        price: item.price,
        specialInstructions: "",
        businessUnit: item.businessUnit || (barMenuMode === "drinks" ? "bar" : "cafe")
      }));

      const orderData = {
        type: "takeaway" as const,
        businessUnit,
        customerMobile: selectedCustomer?.mobileNumber || manualCustomerMobile,
        customerName: selectedCustomer?.name || manualCustomerName,
        items: orderItems,
        source: "pos" as const,
        discountPercent,
        gstPercent: totals.gstAmount > 0 ? (totals.gstAmount / (subtotal - totals.discountAmount)) * 100 : 0,
      };

      let result;
      if (businessUnit === "bar") {
        result = await createBarOrder({
          items: orderItems,
          customerMobile: selectedCustomer?.mobileNumber || manualCustomerMobile || undefined
        });
      } else {
        result = await createOrder(orderData);
      }

      if (result.success) {
        alert("Order placed successfully!");
        handleClose();
      } else {
        alert(`Failed to place order: ${result.error}`);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create {businessUnit === "bar" ? "Bar" : businessUnit === "cafe" ? "Café" : ""} Order
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="cart">Cart ({Object.values(cart).reduce((sum, item) => sum + item.qty, 0)})</TabsTrigger>
            <TabsTrigger value="customer">Customer</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="mt-4">
            <OrderMenuSection
              query={query}
              setQuery={setQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              filteredMenuItems={filteredMenuItems}
              isLoading={isLoading}
              error={error}
              barMenuMode={barMenuMode}
              setBarMenuMode={setBarMenuMode}
              businessUnit={businessUnit}
              onAddItem={addItem}
            />
          </TabsContent>

          <TabsContent value="cart" className="mt-4">
            <OrderCartSection
              cart={cart}
              subtotal={subtotal}
              discountPercent={discountPercent}
              setDiscountPercent={setDiscountPercent}
              totals={totals}
              gstEnabled={totals.gstAmount > 0}
              gstPercentage={totals.gstAmount > 0 ? (totals.gstAmount / (subtotal - totals.discountAmount)) * 100 : 0}
              onIncQty={incQty}
              onDecQty={decQty}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
            />
          </TabsContent>

          <TabsContent value="customer" className="mt-4">
            <OrderCustomerSection
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              manualCustomerName={manualCustomerName}
              setManualCustomerName={setManualCustomerName}
              manualCustomerMobile={manualCustomerMobile}
              setManualCustomerMobile={setManualCustomerMobile}
              isSubmitting={isSubmitting}
              onPlaceOrder={handlePlaceOrder}
              businessUnit={businessUnit}
              totals={totals}
              cart={cart}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

