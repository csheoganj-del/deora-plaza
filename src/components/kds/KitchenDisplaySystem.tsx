"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  ChefHat,
  Users,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  preparationTime?: number;
  startTime?: string;
}

interface Order {
  id: string;
  tableNumber?: string;
  customerName?: string;
  businessUnit: string;
  items: OrderItem[];
  orderTime: string;
  estimatedTime: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  totalPrepTime?: number;
}

export function KitchenDisplaySystem() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Mock data - replace with actual API call
        const mockOrders: Order[] = [
          {
            id: '1',
            tableNumber: 'T1',
            customerName: 'John Doe',
            businessUnit: 'restaurant',
            items: [
              {
                id: '1-1',
                name: 'Grilled Chicken',
                quantity: 2,
                notes: 'No onions',
                status: 'preparing',
                preparationTime: 15,
                startTime: '2024-01-15T10:30:00',
              },
              {
                id: '1-2',
                name: 'Caesar Salad',
                quantity: 1,
                status: 'pending',
              },
            ],
            orderTime: '2024-01-15T10:25:00',
            estimatedTime: 20,
            status: 'preparing',
            priority: 'medium',
          },
          {
            id: '2',
            tableNumber: 'T2',
            customerName: 'Jane Smith',
            businessUnit: 'cafe',
            items: [
              {
                id: '2-1',
                name: 'Coffee Latte',
                quantity: 2,
                status: 'ready',
                preparationTime: 5,
                startTime: '2024-01-15T10:20:00',
              },
              {
                id: '2-2',
                name: 'Sandwich',
                quantity: 1,
                notes: 'Extra cheese',
                status: 'preparing',
                preparationTime: 8,
                startTime: '2024-01-15T10:28:00',
              },
            ],
            orderTime: '2024-01-15T10:18:00',
            estimatedTime: 10,
            status: 'preparing',
            priority: 'low',
          },
          {
            id: '3',
            tableNumber: 'T3',
            customerName: 'Mike Johnson',
            businessUnit: 'bar',
            items: [
              {
                id: '3-1',
                name: 'Cocktail Special',
                quantity: 3,
                status: 'pending',
              },
              {
                id: '3-2',
                name: 'Beer',
                quantity: 2,
                status: 'pending',
              },
            ],
            orderTime: '2024-01-15T10:35:00',
            estimatedTime: 5,
            status: 'pending',
            priority: 'high',
          },
        ];
        setOrders(mockOrders);
      } catch (error) {
        console.error("Failed to fetch KDS data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: Order['status'] | OrderItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-[#F1F5F9] text-[#111827]';
      case 'preparing':
        return 'bg-[#EDEBFF]/30 text-[#6D5DFB]';
      case 'ready':
        return 'bg-[#BBF7D0] text-green-800';
      case 'served':
        return 'bg-[#EDEBFF] text-purple-800';
      case 'cancelled':
        return 'bg-[#FEE2E2] text-red-800';
      default:
        return 'bg-[#F1F5F9] text-[#111827]';
    }
  };

  const getPriorityColor = (priority: Order['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-[#FEE2E2]0';
      case 'medium':
        return 'bg-[#F59E0B]/100';
      case 'low':
        return 'bg-[#DCFCE7]0';
      default:
        return 'bg-[#F8FAFC]';
    }
  };

  const getStatusIcon = (status: Order['status'] | OrderItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-[#9CA3AF]" />;
      case 'preparing':
        return <Play className="h-4 w-4 text-[#6D5DFB]" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-[#DCFCE7]0" />;
      case 'served':
        return <CheckCircle className="h-4 w-4 text-[#EDEBFF]0" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-[#FEE2E2]0" />;
      default:
        return null;
    }
  };

  const calculateElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / 1000 / 60); // minutes
  };

  const calculateOrderAge = (orderTime: string) => {
    const order = new Date(orderTime);
    const now = new Date();
    return Math.floor((now.getTime() - order.getTime()) / 1000 / 60); // minutes
  };

  const filteredOrders = orders.filter(order => 
    selectedBusinessUnit === 'all' || order.businessUnit === selectedBusinessUnit
  );

  const handleItemStatusChange = (orderId: string, itemId: string, newStatus: OrderItem['status']) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(item => {
          if (item.id === itemId) {
            const updatedItem = { ...item, status: newStatus };
            if (newStatus === 'preparing' && !item.startTime) {
              updatedItem.startTime = new Date().toISOString();
            }
            if (newStatus === 'ready' && item.startTime) {
              updatedItem.preparationTime = calculateElapsedTime(item.startTime);
            }
            return updatedItem;
          }
          return item;
        });
        
        // Update order status based on items
        const allItemsReady = updatedItems.every(item => item.status === 'ready' || item.status === 'served');
        const hasPreparingItems = updatedItems.some(item => item.status === 'preparing');
        
        let newOrderStatus: Order['status'] = order.status;
        if (allItemsReady) newOrderStatus = 'ready';
        else if (hasPreparingItems) newOrderStatus = 'preparing';
        
        return { ...order, items: updatedItems, status: newOrderStatus };
      }
      return order;
    }));
  };

  const handleOrderStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const updatedOrder = { ...order, status: newStatus };
        if (newStatus === 'served') {
          const totalPrepTime = calculateOrderAge(order.orderTime);
          updatedOrder.totalPrepTime = totalPrepTime;
        }
        return updatedOrder;
      }
      return order;
    }));
  };

  const businessUnits = ['cafe', 'restaurant', 'bar', 'hotel', 'marriage_garden'];

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    preparingOrders: orders.filter(o => o.status === 'preparing').length,
    readyOrders: orders.filter(o => o.status === 'ready').length,
    averagePrepTime: orders
      .filter(o => o.totalPrepTime)
      .reduce((sum, o) => sum + (o.totalPrepTime || 0), 0) / 
      orders.filter(o => o.totalPrepTime).length || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Kitchen Display System</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div className="premium-card" key={i}>
              <div className="p-8 border-b border-[#E5E7EB]">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="p-8">
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div className="premium-card" key={i}>
              <div className="p-8 border-b border-[#E5E7EB]">
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="p-8">
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Kitchen Display System</h2>
        <div className="text-sm text-muted-foreground">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Active Orders</h2>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Pending</h2>
            <Clock className="h-4 w-4 text-[#9CA3AF]" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#6B7280]">{stats.pendingOrders}</div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Preparing</h2>
            <Play className="h-4 w-4 text-[#6D5DFB]" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#6D5DFB]">{stats.preparingOrders}</div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Ready</h2>
            <CheckCircle className="h-4 w-4 text-[#DCFCE7]0" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#22C55E]">{stats.readyOrders}</div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827] text-lg">Average Prep Time</h2>
          </div>
          <div className="p-8">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-[#6D5DFB]" />
              <span className="text-2xl font-bold">{stats.averagePrepTime.toFixed(1)} min</span>
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827] text-lg">Orders per Hour</h2>
          </div>
          <div className="p-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#DCFCE7]0" />
              <span className="text-2xl font-bold">12.5</span>
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827] text-lg">Efficiency Rate</h2>
          </div>
          <div className="p-8">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">87%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Business Unit Filter */}
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827]">Filter by Business Unit</h2>
        </div>
        <div className="p-8">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedBusinessUnit === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedBusinessUnit('all')}
            >
              All Units
            </Button>
            {businessUnits.map(unit => (
              <Button
                key={unit}
                variant={selectedBusinessUnit === unit ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedBusinessUnit(unit)}
              >
                {unit.charAt(0).toUpperCase() + unit.slice(1).replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <div className="premium-card relative">
            {/* Priority Indicator */}
            <div className={`absolute top-0 left-0 w-1 h-full ${getPriorityColor(order.priority)}`} />
            
            <div className="p-8 border-b border-[#E5E7EB]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Order #{order.id}</h3>
                    <Badge variant="default" className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(order.priority)}>
                      {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {order.tableNumber && <p>Table: {order.tableNumber}</p>}
                    {order.customerName && <p>Customer: {order.customerName}</p>}
                    <p>Unit: {order.businessUnit.charAt(0).toUpperCase() + order.businessUnit.slice(1).replace('_', ' ')}</p>
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Age: {calculateOrderAge(order.orderTime)} min
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusIcon(order.status)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.orderTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        {item.notes && (
                          <p className="text-xs text-orange-600 mt-1">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <Badge variant="default" className={getStatusColor(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    {item.startTime && item.status === 'preparing' && (
                      <div className="text-xs text-[#6D5DFB]">
                        Preparing for {calculateElapsedTime(item.startTime)} min
                      </div>
                    )}
                    
                    {item.preparationTime && (
                      <div className="text-xs text-[#22C55E]">
                        Prep time: {item.preparationTime} min
                      </div>
                    )}

                    {/* Item Status Actions */}
                    <div className="flex gap-2 mt-2">
                      {item.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleItemStatusChange(order.id, item.id, 'preparing')}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {item.status === 'preparing' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleItemStatusChange(order.id, item.id, 'ready')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </Button>
                      )}
                      {item.status === 'ready' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleItemStatusChange(order.id, item.id, 'served')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Serve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Level Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t">
                {order.status === 'ready' && (
                  <Button
                    size="sm"
                    onClick={() => handleOrderStatusChange(order.id, 'served')}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Mark Served
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOrderStatusChange(order.id, 'cancelled')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No orders found</p>
        </div>
      )}
    </div>
  );
}

