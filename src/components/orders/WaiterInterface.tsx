'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  Edit3,
  Trash2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  prepTime: number;
  available: boolean;
  businessUnit: string;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  category: string;
}

interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  businessUnit: string;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export default function WaiterInterface() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState<Customer>({ id: '', name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [businessUnit, setBusinessUnit] = useState('restaurant');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
    fetchTables();
  }, [businessUnit]);

  const fetchMenuItems = async () => {
    try {
      const supabase = createClient();
      const { data: menuData, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('businessUnit', businessUnit)
        .eq('available', true)
        .order('category', { ascending: true });

      if (error) throw error;

      const formattedItems: MenuItem[] = (menuData || []).map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description,
        prepTime: item.prepTime || 10,
        available: item.available,
        businessUnit: item.businessUnit
      }));

      setMenuItems(formattedItems);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const supabase = createClient();
      const { data: tablesData, error } = await supabase
        .from('tables')
        .select('*')
        .eq('businessUnit', businessUnit)
        .order('tableNumber', { ascending: true });

      if (error) throw error;

      const formattedTables: Table[] = (tablesData || []).map(table => ({
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: table.status || 'available',
        businessUnit: table.businessUnit
      }));

      setTables(formattedTables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setTables([]);
    }
  };

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = currentOrder.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      setCurrentOrder(prev => prev.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCurrentOrder(prev => [...prev, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        category: menuItem.category
      }]);
    }
    
    toast.success(`Added ${menuItem.name} to order`);
  };

  const updateQuantity = (menuItemId: string, change: number) => {
    setCurrentOrder(prev => prev.map(item => {
      if (item.menuItemId === menuItemId) {
        const newQuantity = Math.max(0, item.quantity + change);
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean) as OrderItem[]);
  };

  const updateSpecialInstructions = (menuItemId: string, instructions: string) => {
    setCurrentOrder(prev => prev.map(item =>
      item.menuItemId === menuItemId
        ? { ...item, specialInstructions: instructions }
        : item
    ));
  };

  const removeFromOrder = (menuItemId: string) => {
    setCurrentOrder(prev => prev.filter(item => item.menuItemId !== menuItemId));
    toast.success('Item removed from order');
  };

  const calculateTotal = () => {
    return currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateEstimatedTime = () => {
    const maxPrepTime = Math.max(...currentOrder.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return menuItem ? menuItem.prepTime : 0;
    }));
    return maxPrepTime + Math.floor(currentOrder.length / 3) * 2; // Add 2 mins per 3 items
  };

  const submitOrder = async () => {
    if (currentOrder.length === 0) {
      toast.error('Please add items to the order');
      return;
    }

    if (!selectedTable) {
      toast.error('Please select a table');
      return;
    }

    if (!customerInfo.name.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    try {
      const orderData = {
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        tableId: selectedTable,
        tableNumber: tables.find(t => t.id === selectedTable)?.tableNumber,
        businessUnit,
        items: currentOrder,
        totalAmount: calculateTotal(),
        estimatedTime: calculateEstimatedTime(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // In a real app, this would save to database
      console.log('Order submitted:', orderData);
      
      toast.success(`Order ${orderData.orderNumber} submitted successfully!`);
      
      // Reset form
      setCurrentOrder([]);
      setSelectedTable('');
      setCustomerInfo({ id: '', name: '' });
      
      // Update table status
      setTables(prev => prev.map(table =>
        table.id === selectedTable
          ? { ...table, status: 'occupied' as const }
          : table
      ));

    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Failed to submit order');
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.available;
  });

  const categories = [...new Set(menuItems.map(item => item.category))];

  const getTableStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cleaning': return 'bg-gray-100 text-gray-800 border-gray-200';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Waiter Interface</h2>
          <p className="text-gray-600">Take orders and manage tables efficiently</p>
        </div>
        
        <select
          value={businessUnit}
          onChange={(e) => setBusinessUnit(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="restaurant">Restaurant</option>
          <option value="cafe">Cafe</option>
          <option value="bar">Bar</option>
          <option value="hotel">Hotel</option>
          <option value="garden">Garden</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>Select items to add to the order</CardDescription>
              
              {/* Search and Filter */}
              <div className="flex gap-4 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenuItems.map(item => (
                  <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{item.prepTime} min</span>
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">₹{item.price}</div>
                          <Button
                            size="sm"
                            onClick={() => addToOrder(item)}
                            className="mt-2"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Table Selection */}
        <div className="space-y-4">
          {/* Table Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => table.status === 'available' && setSelectedTable(table.id)}
                    disabled={table.status !== 'available'}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectedTable === table.id
                        ? 'border-blue-500 bg-blue-50'
                        : getTableStatusColor(table.status)
                    } ${table.status !== 'available' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                  >
                    <div>{table.tableNumber}</div>
                    <div className="text-xs">
                      <Users className="h-3 w-3 inline mr-1" />
                      {table.capacity}
                    </div>
                    <div className="text-xs capitalize">{table.status}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="customerName">Name *</Label>
                <Input
                  id="customerName"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerInfo.phone || ''}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Current Order */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Current Order ({currentOrder.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentOrder.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items added yet</p>
              ) : (
                <div className="space-y-3">
                  {currentOrder.map(item => (
                    <div key={item.menuItemId} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium">{item.name}</h5>
                          <p className="text-sm text-gray-600">₹{item.price} each</p>
                        </div>
                        <button
                          onClick={() => removeFromOrder(item.menuItemId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-medium px-2">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="ml-auto font-medium">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                      
                      <div>
                        <Input
                          placeholder="Special instructions..."
                          value={item.specialInstructions || ''}
                          onChange={(e) => updateSpecialInstructions(item.menuItemId, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total Amount:</span>
                      <span className="text-lg">₹{calculateTotal()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Estimated Time:</span>
                      <span>{calculateEstimatedTime()} minutes</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={submitOrder}
                    className="w-full"
                    disabled={!selectedTable || !customerInfo.name.trim()}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}