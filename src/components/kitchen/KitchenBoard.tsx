"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { PremiumLiquidGlass, PremiumContainer } from "@/components/ui/glass/premium-liquid-glass";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Utensils,
  Trash2,
  X,
  AlertTriangle,
  Bell,
  ShoppingCart
} from "lucide-react";
import {
  getKitchenOrders,
  updateOrderStatus,
  deleteOrder,
  updateOrderItemStatus,
  clearKitchenHistory,
} from "@/actions/kitchen";
import { getBusinessSettings } from "@/actions/businessSettings";
import { cn, playBeep, showToast, playAggressiveAlert, speakKitchenAlert } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useNotificationSystem } from "@/hooks/useNotificationSystem";

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
  const { syncFromDatabase } = useNotificationSystem();
  const queryClient = useQueryClient();

  // Use React Query for orders - instant updates via Realtime!
  const { data: orders = [], isLoading: loading } = useQuery<Order[]>({
    queryKey: ["orders", "kitchen"],
    queryFn: () => getKitchenOrders(),
    refetchInterval: false, // No polling! Realtime handles it
  });

  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single');
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [passwordProtectionEnabled, setPasswordProtectionEnabled] = useState(true);
  const [lastCheckCount, setLastCheckCount] = useState(0);
  const lastCheckCountRef = useRef(0);

  const [hasPendingOrders, setHasPendingOrders] = useState(false);
  const [timerResetKey, setTimerResetKey] = useState(0);

  const [isInitialized, setIsInitialized] = useState(false);
  const isInitializedRef = useRef(false);

  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioEnabledRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    isInitializedRef.current = isInitialized;
  }, [isInitialized]);

  useEffect(() => {
    lastCheckCountRef.current = lastCheckCount;
  }, [lastCheckCount]);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  // Wake Lock for Background Execution
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('[Kitchen] Wake Lock active');
        }
      } catch (err) {
        console.warn('[Kitchen] Wake Lock failed:', err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
        document.title = "Kitchen Display System"; // Reset title
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock)
        wakeLock.release().then(() => console.log('[Kitchen] Wake Lock released'));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Initialize audio on first user interaction
  const enableAudio = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Play a silent utterance to unlock the audio
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      setAudioEnabled(true);
      console.log('🔊 Audio enabled for kitchen alerts');
    }
  };

  // Auto-enable audio on component mount (for better UX)
  useEffect(() => {
    const autoEnableAudio = () => {
      if (!audioEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
        console.log('[Kitchen] Auto-enabling audio on mount...');
        enableAudio();
      }
    };

    // Try to enable audio immediately
    autoEnableAudio();

    // Also enable on any user interaction
    const handleUserInteraction = () => {
      if (!audioEnabled) {
        console.log('[Kitchen] Enabling audio on user interaction...');
        autoEnableAudio();
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audioEnabled]);


  // Track order count for new order detection
  useEffect(() => {
    if (!orders) return;

    const pendingOrders = orders.filter(o => o.status === 'pending');
    setHasPendingOrders(pendingOrders.length > 0);

    // On first load, just sync state and don't play alerts
    if (!isInitializedRef.current) {
      setLastCheckCount(orders.length);
      setIsInitialized(true);
      return;
    }

    // Check for truly NEW orders (count increased)
    const prevCount = lastCheckCountRef.current;

    console.log('🔍 [ORDER COUNT CHECK] orders.length:', orders.length, 'lastCheckCount (ref):', prevCount, 'Will trigger alert?', orders.length > prevCount);

    if (orders.length > prevCount) {
      console.log('🆕 [NEW ORDER DETECTED] Order count increased from', prevCount, 'to', orders.length);
      const latestOrder = orders[orders.length - 1];

      // Determine location for toast description
      const location = latestOrder.type === 'takeaway'
        ? "takeaway"
        : latestOrder.table?.tableNumber
          ? `table number ${latestOrder.table.tableNumber}`
          : latestOrder.roomNumber
            ? `room number ${latestOrder.roomNumber}`
            : "counter";

      const ttsMessage = `${location} ke liye naya order aaya hai, kripya ise taiyar karein`;
      speakKitchenAlert(ttsMessage);
      showToast(`🔊 Kitchen Alert: ${ttsMessage}`, "info");

      // Flash title
      const originalTitle = document.title;
      let blinkApi: NodeJS.Timeout;
      let isAlertTitle = false;
      const blinkTitle = () => {
        document.title = isAlertTitle ? "🔔 NEW ORDER!" : "Kitchen Display System";
        isAlertTitle = !isAlertTitle;
      };
      blinkApi = setInterval(blinkTitle, 1000);
      setTimeout(() => {
        clearInterval(blinkApi);
        document.title = originalTitle;
      }, 10000);

      syncFromDatabase();
      setTimerResetKey(prev => prev + 1);

      toast.info("🚨 New Kitchen Order Received!", {
        description: `Order #${latestOrder.orderNumber} for ${location === 'takeaway' ? 'Takeaway' : latestOrder.table?.tableNumber ? `Table ${latestOrder.table.tableNumber}` : latestOrder.roomNumber ? `Room ${latestOrder.roomNumber}` : 'Counter'}`,
      });

      setLastCheckCount(orders.length);
    } else if (orders.length < prevCount) {
      setLastCheckCount(orders.length);
    }
  }, [orders, syncFromDatabase]);

  // Sound Alert Loop - Sounds if any order is still 'pending'
  useEffect(() => {
    let alertInterval: NodeJS.Timeout;
    let initialTimeout: NodeJS.Timeout;

    if (hasPendingOrders) {
      // Add initial delay to prevent overlapping with new order announcement
      // When timerResetKey changes (new order), wait 20 seconds before starting reminders
      const initialDelay = 20000; // 20 seconds gives time for the new order message to play

      initialTimeout = setTimeout(() => {
        // Voice reminder every 7 seconds until 'pending' orders are gone
        alertInterval = setInterval(() => {
          console.log("[Kitchen] Persistent Voice Alert: Pending orders still exist...");
          // Find the first pending order to announce
          const pendingOrders = orders.filter(o => o.status === 'pending');
          if (pendingOrders.length > 0) {
            const firstPending = pendingOrders[0];

            console.log('[Kitchen TTS DEBUG - Reminder] First pending order:', {
              type: firstPending.type,
              table: firstPending.table,
              tableNumber: firstPending.table?.tableNumber,
              roomNumber: firstPending.roomNumber
            });

            const location = firstPending.type === 'takeaway'
              ? "takeaway"
              : firstPending.table?.tableNumber
                ? `table number ${firstPending.table.tableNumber}`
                : firstPending.roomNumber
                  ? `room number ${firstPending.roomNumber}`
                  : "counter";

            console.log('[Kitchen TTS DEBUG - Reminder] Determined location:', location);
            console.log('[Kitchen TTS DEBUG - Reminder] Full message:', `${location} ke liye order baaki hai, kripya ise taiyar karein`);

            speakKitchenAlert(`${location} ke liye order baaki hai, kripya ise taiyar karein`); // "Order pending for [location], please prepare it" in Hindi
          } else {
            speakKitchenAlert("Kripya naya order taiyar karein"); // Fallback
          }
        }, 7000); // Slightly longer interval for voice clarity
      }, initialDelay);
    }

    return () => {
      if (initialTimeout) clearTimeout(initialTimeout);
      if (alertInterval) clearInterval(alertInterval);
    };
  }, [hasPendingOrders, timerResetKey]);

  // Fetch business settings on mount
  useEffect(() => {
    getBusinessSettings().then(settings => {
      if (settings) {
        setPasswordProtectionEnabled(settings.enablePasswordProtection ?? true);
      }
    });
  }, []);

  // Mutation for item status updates with optimistic UI
  const itemStatusMutation = useMutation({
    mutationFn: ({ orderId, menuItemId, status }: { orderId: string; menuItemId: string; status: string }) =>
      updateOrderItemStatus(orderId, menuItemId, status, { actor: 'kitchen' }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders", "kitchen"] });
      toast.success(`Item marked as ${variables.status}`);
      if (variables.status === 'preparing') playBeep(700, 150);
      if (variables.status === 'prepared') playBeep(1200, 180);
    },
  });

  const handleItemStatusUpdate = (orderId: string, menuItemId: string, status: string) => {
    itemStatusMutation.mutate({ orderId, menuItemId, status });
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to CLEAR ALL HISTORY? This cannot be undone.")) return;

    try {
      const result = await clearKitchenHistory();
      if (result.success) {
        toast.success("History cleared successfully");
        queryClient.invalidateQueries({ queryKey: ["orders", "kitchen"] });
      } else {
        toast.error("Failed to clear history");
      }
    } catch (error) {
      console.error("Error clearing history:", error);
      toast.error("Error clearing history");
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus);
    queryClient.invalidateQueries({ queryKey: ["orders", "kitchen"] });
    if (newStatus === "preparing") {
      playBeep(700, 150);
      toast.info("Order marked as Preparing");
    } else if (newStatus === "ready") {
      playBeep(1200, 180);
      toast.success("Order marked as Ready");
    } else {
      playBeep(880, 120);
      toast.info(`Order updated: ${newStatus}`);
    }
  };

  const handleSingleDelete = async (orderId: string) => {
    if (!passwordProtectionEnabled) {
      if (confirm("Are you sure you want to delete this order?")) {
        setDeletingOrderId(orderId);
        const result = await deleteOrder(orderId);
        if (result.success) {
          toast.success("Order deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["orders", "kitchen"] });
          setSelectedOrders(prev => prev.filter(id => id !== orderId));
        } else {
          toast.error("Failed to delete order");
        }
        setDeletingOrderId(null);
      }
      return;
    }
    setOrderToDelete(orderId);
    setPasswordAction('single');
    setIsPasswordDialogOpen(true);
  };

  const handleSingleDeleteWithDebug = async (orderId: string) => {
    console.log('[KitchenBoard] Attempting to delete order:', orderId);
    try {
      await handleSingleDelete(orderId);
    } catch (e) {
      console.error('[KitchenBoard] Delete failed:', e);
      toast.error("Failed to initiate delete");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;

    if (!passwordProtectionEnabled) {
      if (confirm(`Are you sure you want to delete ${selectedOrders.length} orders?`)) {
        const deletePromises = selectedOrders.map(id => deleteOrder(id));
        const results = await Promise.all(deletePromises);
        const successCount = results.filter(r => r.success).length;
        if (successCount > 0) {
          toast.success(`${successCount} order(s) deleted successfully`);
          fetchOrders();
          setSelectedOrders([]);
        }
        if (results.some(r => !r.success)) {
          toast.error(`${results.filter(r => !r.success).length} order(s) failed to delete`);
        }
      }
      return;
    }

    setPasswordAction('bulk');
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordSuccess = async (password: string) => {
    if (passwordAction === 'single' && orderToDelete) {
      setDeletingOrderId(orderToDelete);
      try {
        const result = await deleteOrder(orderToDelete);
        if (result.success) {
          toast.success("Order deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["orders", "kitchen"] });
          setSelectedOrders(prev => prev.filter(id => id !== orderToDelete));
        } else {
          toast.error("Failed to delete order");
        }
      } catch (error) {
        console.error("Error deleting order:", error);
        toast.error("Failed to delete order");
      } finally {
        setDeletingOrderId(null);
      }
    } else if (passwordAction === 'bulk') {
      const deletePromises = selectedOrders.map(id => deleteOrder(id));
      const results = await Promise.all(deletePromises);

      const successCount = results.filter(r => r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} order(s) deleted successfully`);
        queryClient.invalidateQueries({ queryKey: ["orders", "kitchen"] });
        setSelectedOrders([]);
      }

      if (results.some(r => !r.success)) {
        const errorCount = results.filter(r => !r.success).length;
        toast.error(`${errorCount} order(s) failed to delete`);
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

  // Memoize filtered orders for performance
  const liveOrders = useMemo(() => orders.filter(o => ["pending", "preparing"].includes(o.status)), [orders]);
  const historyOrders = useMemo(() => orders.filter(o => ["ready", "served", "completed", "cancelled"].includes(o.status)), [orders]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <PremiumLiquidGlass title="Kitchen Feed">
        <div className="flex h-96 flex-col items-center justify-center text-white/30">
          <div className="p-6 rounded-full bg-white/5 mb-4">
            <ChefHat className="h-16 w-16 opacity-50" />
          </div>
          <p className="text-xl font-medium">No active orders</p>
          <p className="text-sm opacity-60 mb-6">
            New orders will appear here automatically
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => speakKitchenAlert("Kripya naya order taiyar karein")}
              className="border-white/10 text-white/40 hover:text-white"
            >
              <Bell className="w-4 h-4 mr-2" /> Test Reminder Voice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => speakKitchenAlert("table number paanch ke liye naya order aaya hai, kripya ise taiyar karein")}
              className="border-white/10 text-white/40 hover:text-white"
            >
              <Utensils className="w-4 h-4 mr-2" /> Hindi Table Voice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => speakKitchenAlert("takeaway ke liye naya order aaya hai, kripya ise taiyar karein")}
              className="border-white/10 text-white/40 hover:text-white"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Hindi Takeaway Voice
            </Button>
          </div>
        </div>
      </PremiumLiquidGlass>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
              Kitchen Feed
            </h1>
          </div>
          <p className="text-white/50 mt-1 pl-[2.75rem]">Live Preparation Details</p>
        </div>

        <div className="flex items-center gap-3">
          {!audioEnabled && (
            <Button
              onClick={enableAudio}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg animate-pulse"
            >
              🔊 Enable Audio Alerts
            </Button>
          )}
          {audioEnabled && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
              <span className="text-green-400 text-sm font-medium">✓ Audio Enabled</span>
            </div>
          )}

          {/* Delete All Button */}
          {orders.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSelectedOrders(orders.map(order => order.id));
                handleBulkDelete();
              }}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </Button>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedOrders.length > 0 && (
          <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-xl border border-white/10 gap-4">
            <div className="text-sm text-white/60">
              {selectedOrders.length} selected
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="bg-[#EF4444] hover:bg-[#DC2626] h-8 text-xs"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="live">Live Orders ({liveOrders.length})</TabsTrigger>
          <TabsTrigger value="history">History ({historyOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-20">
            {liveOrders.map((order) => (
              <div key={order.id} className="relative group">
                <div className="absolute top-4 left-4 z-10">
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={() => toggleOrderSelection(order.id)}
                    className="border-white/20 data-[state=checked]:bg-[#EF4444] data-[state=checked]:border-[#EF4444]"
                  />
                </div>

                <div className={cn(
                  "h-full rounded-2xl overflow-hidden border backdrop-blur-md transition-all duration-300 hover:shadow-lg flex flex-col",
                  order.status === "ready"
                    ? "bg-green-500/10 border-green-500/30 hover:border-green-500/50 animate-kds-blink"
                    : order.status === "preparing"
                      ? "bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50 animate-kds-blink"
                      : order.status === "pending"
                        ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40 animate-kds-urgent"
                        : "bg-white/5 border-white/10 hover:border-white/20 animate-kds-blink"
                )}
                >
                  <div className="p-6 border-b border-white/5 flex flex-col gap-3">
                    <div className="flex justify-between items-start pl-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-white/5 text-white/80 border-white/10 whitespace-nowrap"
                          >
                            {order.type === "dine-in" ? "Dine-in" : "Takeaway"}
                          </Badge>
                          <span className="text-xs text-white/40 font-mono">
                            #{order.orderNumber}
                          </span>
                        </div>
                        {/* Show Table/Room/Takeaway info prominently */}
                        <div className="text-sm font-bold text-amber-400">
                          {order.type === 'takeaway' ? (
                            <span>🛍️ TAKEAWAY</span>
                          ) : order.table?.tableNumber ? (
                            <span>🍽️ Table {order.table.tableNumber}</span>
                          ) : order.roomNumber ? (
                            <span>🏨 Room {order.roomNumber}</span>
                          ) : (
                            <span>📍 Counter</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-white/40 hover:text-red-400 hover:bg-red-400/10 z-20 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleDeleteWithDebug(order.id);
                          }}
                          disabled={deletingOrderId === order.id}
                          title="Delete Order"
                        >
                          {deletingOrderId === order.id ? (
                            <X className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white truncate max-w-[180px]">
                        {(() => {
                          switch (order.businessUnit) {
                            case "hotel":
                              return `Room ${order.roomNumber || 'N/A'}`;
                            case "cafe":
                              return order.table?.tableNumber ? `Cafe T${order.table.tableNumber}` : `Cafe #${order.orderNumber}`;
                            case "restaurant":
                              return order.table?.tableNumber ? `Rest T${order.table.tableNumber}` : `Rest #${order.orderNumber}`;
                            case "bar":
                              return order.table?.tableNumber ? `Bar T${order.table.tableNumber}` : `Bar #${order.orderNumber}`;
                            default:
                              return "Counter";
                          }
                        })()}
                      </h2>
                      <div className={cn(
                        "flex items-center gap-1 text-xs px-2 py-1 rounded-full border",
                        order.status === "preparing"
                          ? "bg-orange-500/20 text-orange-300 border-orange-500/30 animate-pulse"
                          : "bg-white/5 text-white/40 border-white/10"
                      )}>
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(order.createdAt))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="space-y-3 flex-1 mb-4">
                      {(() => {
                        try {
                          const allItems = Array.isArray(order.items)
                            ? order.items
                            : (typeof order.items === 'string' ? JSON.parse(order.items) : []);

                          const kitchenItems = allItems.filter((item: any) => {
                            if (item.status) {
                              return ["pending", "preparing", "prepared", "served"].includes(item.status);
                            }
                            return true;
                          });

                          if (kitchenItems.length === 0 && allItems.length > 0) {
                            return <p className="text-xs text-white/30 italic">All items prepared</p>
                          }

                          return kitchenItems.map((item: any, idx: number) => {
                            const mId = item.menuItemId || item.id;
                            return (
                              <div
                                key={mId || `item-${idx}`}
                                className="flex flex-col border-b border-white/5 pb-2 mb-2 last:border-0 last:pb-0"
                              >
                                <div className="flex justify-between items-start text-sm">
                                  <span className="font-medium text-white/80 flex gap-2">
                                    <span className="font-bold text-[#F59E0B]">
                                      {item.quantity}x
                                    </span>
                                    {item.name}
                                  </span>
                                  <div className="flex gap-1 shrink-0">
                                    {(!item.status || item.status === 'pending') && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-[10px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
                                        onClick={() => handleItemStatusUpdate(order.id, mId, 'preparing')}
                                      >
                                        MAKE
                                      </Button>
                                    )}
                                    {item.status === 'preparing' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-[10px] bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20"
                                        onClick={() => handleItemStatusUpdate(order.id, mId, 'prepared')}
                                      >
                                        PREPARE
                                      </Button>
                                    )}
                                    {item.status === 'prepared' && (
                                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 scale-75 origin-right">READY</Badge>
                                    )}
                                    {item.status === 'served' && (
                                      <Badge className="bg-white/10 text-white/40 border-white/10 scale-75 origin-right">SERVED</Badge>
                                    )}
                                  </div>
                                </div>
                                {item.specialInstructions && (
                                  <p className="text-xs text-orange-300/90 italic mt-1 bg-orange-500/10 p-1 rounded border border-orange-500/20">
                                    Note: {item.specialInstructions}
                                  </p>
                                )}
                              </div>
                            );
                          });
                        } catch (error) {
                          console.error("Error parsing order items:", error);
                          return null;
                        }
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      {order.status === 'pending' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white"
                        >
                          Start All
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          className="col-span-2 bg-[#F59E0B] hover:bg-[#D97706] text-white"
                        >
                          Mark All Prepared
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {liveOrders.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-white/30">
                <div className="bg-white/5 p-6 rounded-full mb-6">
                  <ChefHat className="h-16 w-16 opacity-30" />
                </div>
                <h3 className="text-xl font-medium text-white/60 mb-2">No Active Orders</h3>
                <p className="text-white/30">New orders will appear here automatically</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="flex justify-end mb-4 px-4 sm:px-0">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearHistory}
              disabled={historyOrders.length === 0 || loading}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-20">
            {/* Simplified History View */}
            {historyOrders.map((order) => (
              <div key={order.id} className="h-full rounded-2xl overflow-hidden border border-white/5 bg-white/5 backdrop-blur-md opacity-75 hover:opacity-100 transition-all">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <Badge variant="outline" className={cn("text-[10px] font-bold", order.status === 'served' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-white/10 text-white/40 border-white/10")}>
                      {order.status.toUpperCase()}
                    </Badge>
                    <p className="font-mono text-xs text-white/30 mt-1">#{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <Clock className="w-3 h-3 text-white/20 inline mr-1" />
                    <span className="text-xs text-white/30">{formatDistanceToNow(new Date(order.createdAt))} ago</span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-white mb-2">Guest</h4>
                  <p className="text-xs text-white/50">{
                    order.type === 'dine-in'
                      ? (order.table?.tableNumber ? `Table ${order.table.tableNumber}` : `Room ${order.roomNumber || 'N/A'}`)
                      : 'Takeaway'
                  }</p>
                </div>
              </div>
            ))}
            {historyOrders.length === 0 && (
              <div className="col-span-full text-center py-20 text-white/20">No history yet</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onConfirm={handlePasswordSuccess}
        title={passwordAction === 'bulk' ? "Delete Selected Orders" : "Delete Order"}
        description={passwordAction === 'bulk' ? `Are you sure you want to delete ${selectedOrders.length} orders?` : "Are you sure you want to delete this order?"}
      />
    </div>
  );
}
