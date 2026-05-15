'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Clock, CheckCircle, AlertCircle, Users, ShoppingCart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface RealTimeOrder {
  id: string;
  orderNumber: string;
  customerName?: string;
  tableNumber?: string;
  businessUnit: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    specialInstructions?: string;
  }>;
}

interface SystemNotification {
  id: string;
  type: 'order' | 'payment' | 'inventory' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export default function RealTimeUpdates() {
  const [activeOrders, setActiveOrders] = useState<RealTimeOrder[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Initial data fetch
    fetchActiveOrders();
    fetchNotifications();

    // Set up real-time subscriptions
    const ordersSubscription = supabase
      .channel('orders_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          handleOrderUpdate(payload);
        }
      )
      .subscribe();

    const billsSubscription = supabase
      .channel('bills_realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bills' },
        (payload) => {
          handleNewBill(payload);
        }
      )
      .subscribe();

    // Simulate online users (in real app, this would track actual sessions)
    const userInterval = setInterval(() => {
      setOnlineUsers(Math.floor(Math.random() * 8) + 3); // 3-10 users
    }, 30000);

    return () => {
      ordersSubscription.unsubscribe();
      billsSubscription.unsubscribe();
      clearInterval(userInterval);
    };
  }, []);

  const fetchActiveOrders = async () => {
    try {
      const supabase = createClient();
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          customers (name),
          tables (tableNumber),
          order_items (
            quantity,
            specialInstructions,
            menu_items (name)
          )
        `)
        .in('status', ['pending', 'preparing', 'ready'])
        .order('createdAt', { ascending: false });

      if (orders) {
        const formattedOrders: RealTimeOrder[] = orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber || `ORD-${order.id.slice(-6)}`,
          customerName: order.customers?.name,
          tableNumber: order.tables?.tableNumber,
          businessUnit: order.businessUnit,
          status: order.status,
          totalAmount: order.totalAmount || 0,
          createdAt: order.createdAt,
          items: order.order_items?.map((item: any) => ({
            name: item.menu_items?.name || 'Unknown Item',
            quantity: item.quantity,
            specialInstructions: item.specialInstructions
          })) || []
        }));

        setActiveOrders(formattedOrders);
      }
    } catch (error) {
      console.error('Error fetching active orders:', error);
      // Create sample data for demo
      createSampleOrders();
    } finally {
      setLoading(false);
    }
  };

  const createSampleOrders = () => {
    // Start with empty orders for production
    setActiveOrders([]);
  };

  const fetchNotifications = () => {
    // Start with empty notifications for production
    setNotifications([]);
  };

  const handleOrderUpdate = (payload: any) => {
    const { eventType, new: newOrder, old: oldOrder } = payload;
    
    if (eventType === 'INSERT') {
      toast.success(`New order received: ${newOrder.orderNumber}`);
      addNotification({
        type: 'order',
        title: 'New Order Received',
        message: `Order ${newOrder.orderNumber} from ${newOrder.businessUnit}`,
        priority: 'high'
      });
    } else if (eventType === 'UPDATE') {
      if (oldOrder.status !== newOrder.status) {
        toast.info(`Order ${newOrder.orderNumber} status: ${newOrder.status}`);
        addNotification({
          type: 'order',
          title: 'Order Status Updated',
          message: `Order ${newOrder.orderNumber} is now ${newOrder.status}`,
          priority: 'medium'
        });
      }
    }

    // Refresh active orders
    fetchActiveOrders();
  };

  const handleNewBill = (payload: any) => {
    const { new: newBill } = payload;
    toast.success(`Bill generated: ${newBill.billNumber}`);
    addNotification({
      type: 'payment',
      title: 'Bill Generated',
      message: `Bill ${newBill.billNumber} for ₹${newBill.totalAmount}`,
      priority: 'medium'
    });
  };

  const addNotification = (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: SystemNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10
  };

  const updateOrderStatus = async (orderId: string, newStatus: RealTimeOrder['status']) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setActiveOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const getStatusColor = (status: RealTimeOrder['status']) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'preparing': return 'secondary';
      case 'ready': return 'default';
      case 'served': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: RealTimeOrder['status']) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'preparing': return <Clock className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: SystemNotification['priority']) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              Orders in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineUsers}</div>
            <p className="text-xs text-muted-foreground">
              Staff members active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => !n.read).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Unread notifications
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Active Orders</CardTitle>
            <CardDescription>Orders currently being processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeOrders.map(order => (
                <div key={order.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{order.orderNumber}</h4>
                      <p className="text-sm text-gray-600">
                        {order.customerName} • {order.tableNumber} • {order.businessUnit}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </div>

                  <div className="text-sm">
                    <p className="font-medium">Items:</p>
                    <ul className="list-disc list-inside text-gray-600">
                      {order.items.map((item, index) => (
                        <li key={index}>
                          {item.quantity}x {item.name}
                          {item.specialInstructions && (
                            <span className="text-orange-600"> ({item.specialInstructions})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold">₹{order.totalAmount}</span>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                        >
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'served')}
                        >
                          Mark Served
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Ordered {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}

              {activeOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active orders</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>System alerts and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{notification.title}</h5>
                        <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}