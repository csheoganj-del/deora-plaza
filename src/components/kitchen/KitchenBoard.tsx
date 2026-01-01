"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Utensils,
  Trash2,
  X,
} from "lucide-react";
import {
  getKitchenOrders,
  updateOrderStatus,
  deleteOrder,
} from "@/actions/kitchen";
import { cn, playBeep, showToast } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  specialInstructions?: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  tableId: string | null;
  table?: { tableNumber: string } | null;
  roomNumber?: string | null;
  businessUnit: string;
  status: string;
  createdAt: Date;
  type: string;
  items: OrderItem[];
};

export default function KitchenBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single');
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const fetchOrders = async () => {
    const data = await getKitchenOrders();
    // @ts-ignore - Date serialization issue from server action
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus);
    fetchOrders();
    if (newStatus === "preparing") {
      playBeep(700, 150);
      showToast("Order marked as Preparing", "info");
    } else if (newStatus === "ready") {
      playBeep(1200, 180);
      showToast("Order marked as Ready", "success");
    } else {
      playBeep(880, 120);
      showToast(`Order updated: ${newStatus}`, "info");
    }
  };

  const handleSingleDelete = (orderId: string) => {
    setOrderToDelete(orderId);
    setPasswordAction('single');
    setIsPasswordDialogOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedOrders.length === 0) return;
    setPasswordAction('bulk');
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordSuccess = async (password: string) => {
    if (passwordAction === 'single' && orderToDelete) {
      setDeletingOrderId(orderToDelete);
      try {
        const result = await deleteOrder(orderToDelete);
        if (result.success) {
          showToast("Order deleted successfully", "success");
          fetchOrders();
          // Remove from selected orders if it was selected
          setSelectedOrders(prev => prev.filter(id => id !== orderToDelete));
        } else {
          showToast("Failed to delete order", "error");
        }
      } catch (error) {
        console.error("Error deleting order:", error);
        showToast("Failed to delete order", "error");
      } finally {
        setDeletingOrderId(null);
      }
    } else if (passwordAction === 'bulk') {
      const deletePromises = selectedOrders.map(id => deleteOrder(id));
      const results = await Promise.all(deletePromises);
      
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        showToast(`${successCount} order(s) deleted successfully`, "success");
        fetchOrders();
        setSelectedOrders([]);
      }
      
      if (results.some(r => !r.success)) {
        const errorCount = results.filter(r => !r.success).length;
        showToast(`${errorCount} order(s) failed to delete`, "error");
      }
    }
    
    setIsPasswordDialogOpen(false);
    setOrderToDelete(null);
    setPasswordAction('single');
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-white">
        Loading orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-[#9CA3AF]">
        <div className="p-6 rounded-full glass-card/5 mb-4">
          <ChefHat className="h-16 w-16 opacity-50" />
        </div>
        <p className="text-xl font-medium">No active orders</p>
        <p className="text-sm opacity-60">
          New orders will appear here automatically
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedOrders.length > 0 && (
        <div className="flex justify-between items-center p-4 glass-card/5 rounded-lg border border-white/10">
          <div className="text-sm text-[#9CA3AF]">
            {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleBulkDelete}
            className="bg-[#EF4444] hover:bg-[#DC2626]"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 h-full overflow-y-auto pr-2">
        {orders.map((order) => (
          <div key={order.id} className="relative">
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={selectedOrders.includes(order.id)}
                onCheckedChange={() => toggleOrderSelection(order.id)}
                className="border-white/20 data-[state=checked]:bg-[#EF4444] data-[state=checked]:border-[#EF4444]"
              />
            </div>
            
            <div className={cn(
                "premium-card flex flex-col border-l-4 bg-black/40  text-white transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10",
                order.status === "ready"
                  ? "border-l-green-500 border-white/10"
                  : "border-l-[#F59E0B] border-white/10",
              )}
            >
              <div className="p-8 border-b border-[#E5E7EB] pb-3 glass-card/5 border-b border-white/5">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="glass-card/10 text-white border-white/20 whitespace-nowrap"
                      >
                        {order.type === "dine-in" ? "Dine-in" : "Takeaway"}
                      </Badge>
                      <span className="text-xs text-[#9CA3AF] font-mono">
                        #{order.orderNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          order.status === "ready" ? "success" : "secondary"
                        }
                        className={cn(
                          "flex items-center gap-1 whitespace-nowrap",
                          order.status === "preparing" &&
                            "bg-[#F59E0B]/100/20 text-[#F59E0B]300 border-[#FEF3C7]0/30 animate-pulse",
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(order.createdAt), {
                          addSuffix: true,
                        })}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-[#FEE2E2]0/10"
                        onClick={() => handleSingleDelete(order.id)}
                        disabled={deletingOrderId === order.id}
                      >
                        {deletingOrderId === order.id ? (
                          <X className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-[#111827] text-xl font-bold text-white truncate w-full">
                    {(() => {
                      switch (order.businessUnit) {
                        case "hotel":
                          return `Room ${order.roomNumber}`;
                        case "cafe":
                          return `Cafe Table ${order.table?.tableNumber}`;
                        case "restaurant":
                          return `Restaurant Table ${order.table?.tableNumber}`;
                        case "bar":
                          return "Bar Order";
                        default:
                          return "Counter Order";
                      }
                    })()}
                  </h2>
                </div>
              </div>
              <div className="p-8 flex-1 py-4">
                <div className="space-y-3">
                  {(() => {
                    try {
                      const items = Array.isArray(order.items) 
                        ? order.items 
                        : (typeof order.items === 'string' ? JSON.parse(order.items) : []);
                      
                      return items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex flex-col border-b border-white/5 pb-2 last:border-0 last:pb-0"
                        >
                          <div className="flex justify-between items-start text-sm">
                            <span className="font-medium text-[#E5E7EB] flex gap-2">
                              <span className="font-bold text-[#F59E0B]400">
                                {item.quantity}x
                              </span>
                              {item.name}
                            </span>
                          </div>
                          {item.specialInstructions && (
                            <p className="text-xs text-orange-300/90 italic mt-1 bg-orange-500/10 p-1 rounded border border-orange-500/20">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                      ));
                    } catch (error) {
                      console.error("Error parsing order items:", error);
                      return null;
                    }
                  })()}
                </div>
              </div>
            </div>
            
            <PasswordDialog
              isOpen={isPasswordDialogOpen}
              onClose={() => setIsPasswordDialogOpen(false)}
              onConfirm={handlePasswordSuccess}
              title={passwordAction === 'bulk' ? "Delete Selected Orders" : "Delete Order"}
              description={passwordAction === 'bulk' ? `Are you sure you want to delete ${selectedOrders.length} orders? This action cannot be undone.` : "Are you sure you want to delete this order? This action cannot be undone."}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

