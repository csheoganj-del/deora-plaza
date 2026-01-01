'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  Trash2, 
  Plus, 
  Minus, 
  Save, 
  X, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Search
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  tableNumber: string;
  businessUnit: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'cancelled';
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
}

export default function OrderModification() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [availableItems, setAvailableItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();
  }, []);

  const fetchOrders = async () => {
    try {
      const supabase = createClient();
      
      // First, try to get basic orders data
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'preparing', 'ready'])
        .order('createdAt', { ascending: false });

      if (error && (error as any)?.code !== 'PGRST116') {
        console.error('Database error:', error);
        throw error;
      }

      const formattedOrders: Order[] = (ordersData || []).map(order => ({
        id: order.id,
        orderNumber: order.orderNumber || order.order_number || `ORD-${order.id.slice(-6)}`,
        customerName: order.customerName || 'Walk-in Customer',
        tableNumber: order.tableNumber || order.table_number || 'N/A',
        businessUnit: order.businessUnit || order.business_unit || 'Restaurant',
        status: order.status || 'pending',
        totalAmount: order.totalAmount || order.total_amount || 0,
        createdAt: order.createdAt || order.created_at || new Date().toISOString(),
        items: [] // Start with empty items - will be populated separately if needed
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Provide more detailed error information
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
      setOrders([]);
      // Don't show error toast for empty tables - that's normal
      if (error && (error as any)?.code !== 'PGRST116') {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const supabase = createClient();
      const { data: menuData, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true });

      if (error && (error as any)?.code !== 'PGRST116') {
        throw error;
      }

      const formattedItems: MenuItem[] = (menuData || []).map(item => ({
        id: item.id,
        name: item.name || 'Unknown Item',
        price: item.price || 0,
        category: item.category || 'Other',
        available: item.available !== false
      }));

      setAvailableItems(formattedItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setAvailableItems([]);
      // Don't show error for empty menu - that's normal for new setups
    }
  };

  const startEditing = (order: Order) => {
    if (order.status === 'served' || order.status === 'cancelled') {
      toast.error('Cannot modify completed or cancelled orders');
      return;
    }
    
    setEditingOrder({ ...order });
    setSelectedOrder(order);
  };

  const cancelEditing = () => {
    setEditingOrder(null);
    setSelectedOrder(null);
  };

  const updateItemQuantity = (itemId: string, change: number) => {
    if (!editingOrder) return;

    setEditingOrder(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id === itemId) {
            const newQuantity = Math.max(0, item.quantity + change);
            return { ...item, quantity: newQuantity };
          }
          return item;
        }).filter(item => item.quantity > 0)
      };
    });
  };

  const updateItemInstructions = (itemId: string, instructions: string) => {
    if (!editingOrder) return;

    setEditingOrder(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId
            ? { ...item, specialInstructions: instructions }
            : item
        )
      };
    });
  };

  const removeItem = (itemId: string) => {
    if (!editingOrder) return;

    const item = editingOrder.items.find(i => i.id === itemId);
    if (item && item.status === 'preparing') {
      toast.error('Cannot remove items that are already being prepared');
      return;
    }

    setEditingOrder(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      };
    });

    toast.success('Item removed from order');
  };

  const addNewItem = (menuItem: MenuItem) => {
    if (!editingOrder) return;

    const newItem: OrderItem = {
      id: `new-${Date.now()}`,
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1,
      status: 'pending'
    };

    setEditingOrder(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        items: [...prev.items, newItem]
      };
    });

    toast.success(`Added ${menuItem.name} to order`);
  };

  const calculateTotal = (order: Order) => {
    return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const saveChanges = async () => {
    if (!editingOrder) return;

    try {
      const updatedOrder = {
        ...editingOrder,
        totalAmount: calculateTotal(editingOrder)
      };

      // In a real app, this would update the database
      setOrders(prev => prev.map(order =>
        order.id === editingOrder.id ? updatedOrder : order
      ));

      toast.success(`Order ${editingOrder.orderNumber} updated successfully`);
      setEditingOrder(null);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      if (order.status === 'preparing') {
        toast.error('Cannot cancel orders that are being prepared');
        return;
      }

      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, status: 'cancelled' as const }
          : o
      ));

      toast.success(`Order ${order.orderNumber} cancelled`);
      setEditingOrder(null);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'preparing': return 'secondary';
      case 'ready': return 'default';
      case 'served': return 'outline';
      case 'cancelled': return 'destructive';
    }
  };

  const getItemStatusColor = (status: OrderItem['status']) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
    }
  };

  const canModifyOrder = (order: Order) => {
    return order.status === 'pending' || order.status === 'preparing';
  };

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.tableNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Order Modification</h2>
          <p className="text-gray-600">Modify or cancel existing orders</p>
        </div>
        
        <div className="w-64">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
              <CardDescription>Select an order to modify</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{order.orderNumber}</h4>
                        <p className="text-sm text-gray-600">
                          {order.customerName} • {order.tableNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.businessUnit} • {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <div className="text-sm font-medium mt-1">
                          ₹{order.totalAmount}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {order.items.length} items
                      </span>
                      
                      <div className="flex gap-2">
                        {canModifyOrder(order) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(order);
                            }}
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelOrder(order.id);
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No orders found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details & Editing */}
        <div className="space-y-4">
          {editingOrder ? (
            /* Editing Mode */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Editing {editingOrder.orderNumber}</span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveChanges}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditing}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {editingOrder.customerName} • {editingOrder.tableNumber}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Current Items */}
                <div>
                  <h4 className="font-medium mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {editingOrder.items.map(item => (
                      <div key={item.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">{item.name}</h5>
                            <p className="text-sm text-gray-600">₹{item.price} each</p>
                            <Badge className={getItemStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </div>
                          
                          {item.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.id, -1)}
                            disabled={item.status !== 'pending'}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium px-2">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.id, 1)}
                            disabled={item.status !== 'pending'}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="ml-auto font-medium">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                        
                        <Input
                          placeholder="Special instructions..."
                          value={item.specialInstructions || ''}
                          onChange={(e) => updateItemInstructions(item.id, e.target.value)}
                          disabled={item.status !== 'pending'}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Items */}
                <div>
                  <h4 className="font-medium mb-3">Add Items</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {availableItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
                        onClick={() => addNewItem(item)}
                      >
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-600 ml-2">₹{item.price}</span>
                        </div>
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-medium text-lg">
                    <span>New Total:</span>
                    <span>₹{calculateTotal(editingOrder)}</span>
                  </div>
                  {calculateTotal(editingOrder) !== editingOrder.totalAmount && (
                    <div className="text-sm text-gray-600 text-right">
                      (Original: ₹{editingOrder.totalAmount})
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : selectedOrder ? (
            /* View Mode */
            <Card>
              <CardHeader>
                <CardTitle>{selectedOrder.orderNumber}</CardTitle>
                <CardDescription>
                  {selectedOrder.customerName} • {selectedOrder.tableNumber} • {selectedOrder.businessUnit}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                  <div className="text-sm text-gray-600">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{item.quantity}x {item.name}</span>
                          {item.specialInstructions && (
                            <p className="text-sm text-orange-600">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{item.price * item.quantity}</div>
                          <Badge className={getItemStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-medium text-lg">
                    <span>Total Amount:</span>
                    <span>₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>

                {canModifyOrder(selectedOrder) && (
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => startEditing(selectedOrder)} className="flex-1">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Modify Order
                    </Button>
                    {selectedOrder.status === 'pending' && (
                      <Button
                        variant="destructive"
                        onClick={() => cancelOrder(selectedOrder.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Edit3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an order to view or modify</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}