'use client';

import { useState, useEffect } from 'react';
import { PremiumLiquidGlass, PremiumContainer } from '@/components/ui/glass/premium-liquid-glass';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle, Timer, Users, Utensils, Monitor } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { getKitchenOrders, updateOrderStatus as updateOrderStatusAction } from '@/actions/kitchen';
import { updateOrderItems } from '@/actions/orders';

interface KitchenOrder {
  id: string;
  orderNumber: string;
  customerName?: string;
  tableNumber?: string;
  businessUnit: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalAmount: number;
  createdAt: string;
  estimatedTime: number; // minutes
  actualTime?: number;
  items: Array<{
    id: string; // generated if missing
    name: string;
    quantity: number;
    specialInstructions?: string;
    category: string;
    prepTime: number; // minutes
    status: 'pending' | 'preparing' | 'ready';
    price?: number;
    menuItemId?: string;
  }>;
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Set up real-time subscriptions
    const supabase = createClient();
    const subscription = supabase
      .channel('kitchen_orders')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => loadOrders()
      )
      .subscribe();

    return () => {
      clearInterval(timeInterval);
      subscription.unsubscribe();
    };
  }, []);

  const loadOrders = async () => {
    try {
      const ordersData = await getKitchenOrders(selectedUnit === 'all' ? undefined : selectedUnit);

      const formattedOrders: KitchenOrder[] = (ordersData || []).map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber || `ORD-${order.id.slice(-6)}`,
        customerName: order.customerName,
        tableNumber: order.tableNumber,
        businessUnit: order.businessUnit,
        status: order.status,
        priority: order.priority || 'medium',
        totalAmount: order.totalAmount || 0,
        createdAt: order.createdAt,
        estimatedTime: order.estimatedTime || 15,
        actualTime: order.actualTime,
        items: (order.items || []).map((item: any, index: number) => ({
          id: item.id || `item-${index}-${Date.now()}`, // Fallback ID
          name: item.name || 'Unknown Item',
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          category: item.category || 'General',
          prepTime: item.prepTime || 10,
          status: item.status || 'pending',
          price: item.price,
          menuItemId: item.menuItemId
        }))
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
      // Don't clear orders on error to prevent flash, just log
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: KitchenOrder['status']) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? {
            ...order,
            status: newStatus,
            actualTime: newStatus === 'ready' ? getElapsedMinutes(order.createdAt) : order.actualTime
          }
          : order
      ));

      const result = await updateOrderStatusAction(orderId, newStatus);

      if (!result.success) {
        throw new Error('Failed to update status on server');
      }

      toast.success(`Order ${orders.find(o => o.id === orderId)?.orderNumber} marked as ${newStatus}`);

      // Play notification sound (browser API)
      if ('speechSynthesis' in window && newStatus === 'ready') {
        const utterance = new SpeechSynthesisUtterance(`Order ${orders.find(o => o.id === orderId)?.orderNumber} is ready`);
        utterance.rate = 1.2;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      loadOrders(); // Revert
    }
  };

  const updateItemStatus = async (orderId: string, itemId: string, newStatus: 'pending' | 'preparing' | 'ready') => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedItems = order.items.map(item =>
        item.id === itemId ? { ...item, status: newStatus } : item
      );

      // Optimistic update
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, items: updatedItems } : o
      ));

      // Save to server
      const result = await updateOrderItems(orderId, updatedItems, order.totalAmount);

      if (!result.success) {
        throw new Error('Failed to update item status');
      }

      toast.success(`Item status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Failed to update item status');
      loadOrders(); // Revert
    }
  };

  const getElapsedMinutes = (createdAt: string): number => {
    return Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / 60000);
  };

  const getTimeRemaining = (order: KitchenOrder): number => {
    const elapsed = getElapsedMinutes(order.createdAt);
    return Math.max(0, order.estimatedTime - elapsed);
  };

  const getPriorityColor = (priority: KitchenOrder['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
      case 'high': return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-[#22C55E]';
    }
  };

  const getStatusColor = (status: KitchenOrder['status']) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'preparing': return 'secondary';
      case 'ready': return 'default';
      default: return 'outline';
    }
  };

  const getItemStatusColor = (status: 'pending' | 'preparing' | 'ready') => {
    switch (status) {
      case 'pending': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'preparing': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'ready': return 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30';
    }
  };

  const isOverdue = (order: KitchenOrder): boolean => {
    return getElapsedMinutes(order.createdAt) > order.estimatedTime;
  };

  // Re-filter if unit changes locally, but mostly handled by loadOrders (though loadOrders is called on filter change? well useEffect only on mount).
  // Actually we need to re-fetch when selectedUnit changes.
  useEffect(() => {
    loadOrders();
  }, [selectedUnit]);

  // Client-side filtering as backup or if needed for served items
  const filteredOrders = orders.filter(order =>
    (selectedUnit === 'all' || order.businessUnit === selectedUnit) &&
    order.status !== 'served'
  );

  // Sort orders by priority and time
  const sortedOrders = filteredOrders.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary">
              <Monitor className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
              Kitchen Display
            </h1>
          </div>
          <p className="text-white/50 mt-1 pl-[3.5rem]">Real-time order management with timers</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xl font-mono text-white/80 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            {currentTime.toLocaleTimeString()}
          </div>

          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="all" className="bg-[#1f1f23]">All Units</option>
            <option value="restaurant" className="bg-[#1f1f23]">Restaurant</option>
            <option value="cafe" className="bg-[#1f1f23]">Cafe</option>
            <option value="bar" className="bg-[#1f1f23]">Bar</option>
            <option value="hotel" className="bg-[#1f1f23]">Hotel</option>
            <option value="garden" className="bg-[#1f1f23]">Garden</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedOrders.map(order => {
          const elapsed = getElapsedMinutes(order.createdAt);
          const remaining = getTimeRemaining(order);
          const overdue = isOverdue(order);

          return (
            <div
              key={order.id}
              className={`relative overflow-hidden group rounded-xl border backdrop-blur-md transition-all ${overdue
                ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
                : order.priority === 'urgent'
                  ? 'bg-red-500/5 border-red-500/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
                } ${order.priority === 'urgent' ? 'ring-1 ring-red-500/50' : ''}`}
            >
              {/* Priority Indicator */}
              <div className={`absolute top-0 left-0 w-full h-1 ${getPriorityColor(order.priority)}`}></div>

              <div className="p-5 border-b border-white/5 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {order.orderNumber}
                    {overdue && <AlertTriangle className="h-4 w-4 text-red-400" />}
                  </h3>
                  <p className="text-sm text-white/50">
                    {order.businessUnit === 'hotel'
                      ? `Room ${order.roomNumber}`
                      : order.tableNumber
                        ? `Table ${order.tableNumber}`
                        : 'Takeaway'}
                  </p>
                </div>

                <div className="text-right">
                  <Badge variant={
                    order.status === 'pending' ? 'destructive' :
                      order.status === 'preparing' ? 'secondary' :
                        'default'
                  } className="mb-1">
                    {order.status.toUpperCase()}
                  </Badge>
                  <div className={`text-sm font-mono font-bold ${overdue ? 'text-red-400' : 'text-white/60'}`}>
                    {overdue ? `+${elapsed - order.estimatedTime}m` : `${remaining}m left`}
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Timer Display */}
                <div className={`flex items-center justify-center p-3 rounded-lg border border-white/5 ${overdue ? 'bg-red-500/20 text-red-200' : remaining <= 2 ? 'bg-yellow-500/20 text-yellow-200' : 'bg-[#22C55E]/20 text-[#22C55E]'
                  }`}>
                  <Timer className="h-5 w-5 mr-2" />
                  <span className="text-lg font-bold">
                    {elapsed}m / {order.estimatedTime}m
                  </span>
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-white/70 text-sm uppercase tracking-wider">
                    <Utensils className="h-4 w-4" />
                    Items ({order.items.length})
                  </h4>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {order.items.map((item, idx) => (
                      <div key={item.id || item.menuItemId || `item-${idx}`} className="border border-white/5 bg-black/20 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-white">{item.quantity}x {item.name}</span>
                            <span className="text-xs text-white/40 ml-2">({item.category})</span>
                          </div>
                          <Badge className={getItemStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>

                        {item.specialInstructions && (
                          <div className="text-sm text-orange-300 bg-orange-500/10 p-2 rounded border border-orange-500/20">
                            <strong>Note:</strong> {item.specialInstructions}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {item.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateItemStatus(order.id, item.id, 'preparing')}
                              className="text-xs h-7 w-full bg-white/10 hover:bg-white/20 text-white border-0"
                            >
                              Start
                            </Button>
                          )}
                          {item.status === 'preparing' && (
                            <Button
                              size="sm"
                              onClick={() => updateItemStatus(order.id, item.id, 'ready')}
                              className="text-xs h-7 w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-0"
                            >
                              Mark Ready
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  {order.status === 'pending' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      Start Order
                    </Button>
                  )}

                  {order.status === 'preparing' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                      disabled={order.items.some(item => item.status !== 'ready')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Ready
                    </Button>
                  )}

                  {order.status === 'ready' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'served')}
                      variant="outline"
                      className="flex-1 border-white/20 text-white hover:bg-white/5"
                    >
                      Mark Served
                    </Button>
                  )}
                </div>

                {/* Order Info */}
                <div className="text-xs text-white/30 flex items-center justify-between pt-2">
                  <span>Ordered: {new Date(order.createdAt).toLocaleTimeString()}</span>
                  <span>₹{order.totalAmount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-white/30">
          <div className="bg-white/5 p-6 rounded-full mb-6">
            <Utensils className="h-16 w-16 opacity-30" />
          </div>
          <h3 className="text-xl font-medium text-white/60 mb-2">No Active Orders</h3>
          <p className="text-white/30">All orders are completed or no new orders have arrived.</p>
        </div>
      )}
    </div>
  );
}