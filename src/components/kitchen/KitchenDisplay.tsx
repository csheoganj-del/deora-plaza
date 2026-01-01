'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle, Timer, Users, Utensils } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

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
    id: string;
    name: string;
    quantity: number;
    specialInstructions?: string;
    category: string;
    prepTime: number; // minutes
    status: 'pending' | 'preparing' | 'ready';
  }>;
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKitchenOrders();
    
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
        () => fetchKitchenOrders()
      )
      .subscribe();

    return () => {
      clearInterval(timeInterval);
      subscription.unsubscribe();
    };
  }, []);

  const fetchKitchenOrders = async () => {
    try {
      const supabase = createClient();
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (name),
          tables (tableNumber),
          order_items (
            id,
            quantity,
            specialInstructions,
            status,
            menu_items (name, category, prepTime)
          )
        `)
        .in('status', ['pending', 'preparing', 'ready'])
        .order('createdAt', { ascending: true });

      if (error) throw error;

      const formattedOrders: KitchenOrder[] = (ordersData || []).map(order => ({
        id: order.id,
        orderNumber: order.orderNumber || `ORD-${order.id.slice(-6)}`,
        customerName: order.customers?.name,
        tableNumber: order.tables?.tableNumber,
        businessUnit: order.businessUnit,
        status: order.status,
        priority: order.priority || 'medium',
        totalAmount: order.totalAmount || 0,
        createdAt: order.createdAt,
        estimatedTime: order.estimatedTime || 15,
        actualTime: order.actualTime,
        items: (order.order_items || []).map((item: any) => ({
          id: item.id,
          name: item.menu_items?.name || 'Unknown Item',
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          category: item.menu_items?.category || 'General',
          prepTime: item.menu_items?.prepTime || 10,
          status: item.status || 'pending'
        }))
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: KitchenOrder['status']) => {
    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: newStatus,
              actualTime: newStatus === 'ready' ? getElapsedMinutes(order.createdAt) : order.actualTime
            }
          : order
      ));

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
    }
  };

  const updateItemStatus = async (orderId: string, itemId: string, newStatus: 'pending' | 'preparing' | 'ready') => {
    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? {
              ...order,
              items: order.items.map(item =>
                item.id === itemId ? { ...item, status: newStatus } : item
              )
            }
          : order
      ));

      toast.success(`Item status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error('Failed to update item status');
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
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
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
      case 'pending': return 'bg-red-100 text-red-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
    }
  };

  const isOverdue = (order: KitchenOrder): boolean => {
    return getElapsedMinutes(order.createdAt) > order.estimatedTime;
  };

  const filteredOrders = orders.filter(order => 
    selectedUnit === 'all' || order.businessUnit === selectedUnit
  ).filter(order => order.status !== 'served');

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kitchen Display System</h2>
          <p className="text-gray-600">Real-time order management with timers</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-lg font-mono">
            {currentTime.toLocaleTimeString()}
          </div>
          
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Units</option>
            <option value="restaurant">Restaurant</option>
            <option value="cafe">Cafe</option>
            <option value="bar">Bar</option>
            <option value="hotel">Hotel</option>
            <option value="garden">Garden</option>
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
            <Card 
              key={order.id} 
              className={`relative ${overdue ? 'border-red-500 bg-red-50' : ''} ${
                order.priority === 'urgent' ? 'ring-2 ring-red-500' : ''
              }`}
            >
              {/* Priority Indicator */}
              <div className={`absolute top-0 left-0 w-full h-1 ${getPriorityColor(order.priority)}`}></div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {order.orderNumber}
                      {overdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </CardTitle>
                    <CardDescription>
                      {order.customerName} • {order.tableNumber} • {order.businessUnit}
                    </CardDescription>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={getStatusColor(order.status)} className="mb-1">
                      {order.status}
                    </Badge>
                    <div className={`text-sm font-mono ${overdue ? 'text-red-600' : 'text-gray-600'}`}>
                      {overdue ? `+${elapsed - order.estimatedTime}m` : `${remaining}m left`}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Timer Display */}
                <div className={`flex items-center justify-center p-3 rounded-lg ${
                  overdue ? 'bg-red-100' : remaining <= 2 ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <Timer className={`h-5 w-5 mr-2 ${
                    overdue ? 'text-red-600' : remaining <= 2 ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                  <span className={`text-lg font-bold ${
                    overdue ? 'text-red-600' : remaining <= 2 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {elapsed}m / {order.estimatedTime}m
                  </span>
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Items ({order.items.length})
                  </h4>
                  
                  {order.items.map(item => (
                    <div key={item.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{item.quantity}x {item.name}</span>
                          <span className="text-sm text-gray-500 ml-2">({item.category})</span>
                        </div>
                        <Badge className={getItemStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      
                      {item.specialInstructions && (
                        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                          <strong>Special:</strong> {item.specialInstructions}
                        </div>
                      )}
                      
                      <div className="flex gap-1">
                        {item.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateItemStatus(order.id, item.id, 'preparing')}
                            className="text-xs"
                          >
                            Start
                          </Button>
                        )}
                        {item.status === 'preparing' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateItemStatus(order.id, item.id, 'ready')}
                            className="text-xs"
                          >
                            Ready
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {order.status === 'pending' && (
                    <Button 
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1"
                    >
                      Start Order
                    </Button>
                  )}
                  
                  {order.status === 'preparing' && (
                    <Button 
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex-1"
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
                      className="flex-1"
                    >
                      Mark Served
                    </Button>
                  )}
                </div>

                {/* Order Info */}
                <div className="text-xs text-gray-500 flex items-center justify-between pt-2 border-t">
                  <span>Ordered: {new Date(order.createdAt).toLocaleTimeString()}</span>
                  <span>₹{order.totalAmount}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sortedOrders.length === 0 && (
        <div className="text-center py-12">
          <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Orders</h3>
          <p className="text-gray-500">All orders are completed or no new orders yet.</p>
        </div>
      )}
    </div>
  );
}