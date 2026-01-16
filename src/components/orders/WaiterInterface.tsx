'use client';

import { useState, useEffect } from 'react';
import { PremiumLiquidGlass, PremiumContainer, PremiumStatsCard } from '@/components/ui/glass/premium-liquid-glass';
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
  Trash2,
  Utensils,
  Smartphone
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { getMenuItems } from '@/actions/menu';


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
      const menuData = await getMenuItems(businessUnit);

      const formattedItems: MenuItem[] = (menuData || [])
        .filter(item => item.isAvailable)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
          description: item.description,
          prepTime: item.prepTime || 10,
          available: item.isAvailable,
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
      case 'available': return 'bg-[#22C55E]/10 border-[#22C55E]/30 hover:border-[#22C55E]/50 text-[#22C55E]';
      case 'occupied': return 'bg-red-500/10 border-red-500/30 hover:border-red-500/50 text-red-400';
      case 'reserved': return 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50 text-yellow-500';
      case 'cleaning': return 'bg-white/5 border-white/10 hover:border-white/20 text-white/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary">
              <Smartphone className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
              Waiter Interface
            </h1>
          </div>
          <p className="text-white/50 mt-1 pl-[3.5rem]">Take orders and manage tables</p>
        </div>

        <select
          value={businessUnit}
          onChange={(e) => setBusinessUnit(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="restaurant" className="bg-[#1f1f23]">Restaurant</option>
          <option value="cafe" className="bg-[#1f1f23]">Cafe</option>
          <option value="bar" className="bg-[#1f1f23]">Bar</option>
          <option value="hotel" className="bg-[#1f1f23]">Hotel</option>
          <option value="garden" className="bg-[#1f1f23]">Garden</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-14rem)]">
        {/* Menu Items (Left 2 Columns) */}
        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
          <PremiumLiquidGlass title="Menu Items" className="h-full flex flex-col">
            {/* Search and Filter */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  placeholder="Search items..."
                  className="w-full pl-10 h-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="all" className="bg-[#1f1f23]">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category} className="bg-[#1f1f23]">{category}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMenuItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => addToOrder(item)}
                    className="group relative p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white group-hover:text-primary transition-colors">{item.name}</h4>
                        <span className="font-bold text-white">₹{item.price}</span>
                      </div>
                      <p className="text-xs text-white/40 line-clamp-2 mb-3">{item.description}</p>

                      <div className="flex items-center gap-2 text-[10px] text-white/30">
                        <Clock className="h-3 w-3" />
                        <span>{item.prepTime} min</span>
                        <Badge variant="outline" className="text-[10px] bg-white/5 text-white/40 border-white/10 ml-auto">
                          {item.category}
                        </Badge>
                      </div>
                    </div>

                    <button className="w-full mt-3 py-1.5 rounded-lg bg-white/5 hover:bg-primary text-white/40 hover:text-white transition-all text-xs font-medium flex items-center justify-center gap-2">
                      <Plus className="h-3 w-3" /> Add to Order
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </PremiumLiquidGlass>
        </div>

        {/* Order Summary & Table Selection (Right Column) */}
        <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar">
          {/* Table Selection */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Select Table
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => table.status === 'available' && setSelectedTable(table.id)}
                  disabled={table.status !== 'available'}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all flex flex-col items-center justify-center aspect-square ${selectedTable === table.id
                    ? 'border-primary bg-primary/20 text-white shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                    : getTableStatusColor(table.status)
                    } ${table.status !== 'available' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                >
                  <span className="text-lg font-bold">{table.tableNumber}</span>
                  <span className="text-[9px] opacity-70">{table.capacity}P</span>
                </button>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Customer Info</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="customerName" className="text-xs text-white/60">Name *</Label>
                <Input
                  id="customerName"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="h-8 bg-black/20 border-white/10 text-xs text-white"
                  placeholder="Guest Name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customerPhone" className="text-xs text-white/60">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerInfo.phone || ''}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-8 bg-black/20 border-white/10 text-xs text-white"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Current Order */}
          <PremiumLiquidGlass title={`Order (${currentOrder.length})`} className="flex-1 flex flex-col">
            {currentOrder.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs">Cart Empty</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4 max-h-[300px]">
                  {currentOrder.map(item => (
                    <div key={item.menuItemId} className="bg-black/20 rounded-lg p-3 border border-white/5 relative group">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          <p className="text-xs text-white/40">₹{item.price} x {item.quantity}</p>
                        </div>
                        <button
                          onClick={() => removeFromOrder(item.menuItemId)}
                          className="text-white/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => updateQuantity(item.menuItemId, -1)} className="h-6 w-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">-</button>
                        <span className="text-sm font-medium text-white w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.menuItemId, 1)} className="h-6 w-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">+</button>
                        <span className="ml-auto font-bold text-white text-sm">₹{item.price * item.quantity}</span>
                      </div>

                      <input
                        placeholder="Notes..."
                        value={item.specialInstructions || ''}
                        onChange={(e) => updateSpecialInstructions(item.menuItemId, e.target.value)}
                        className="w-full bg-transparent border-b border-white/10 text-xs text-white/60 focus:text-white focus:border-white/40 focus:outline-none pb-1"
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-3 mt-auto">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/60 text-sm">Total</span>
                    <span className="text-xl font-bold text-white">₹{calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4 text-xs text-white/40">
                    <span>Est. Time</span>
                    <span>{calculateEstimatedTime()} mins</span>
                  </div>

                  <Button
                    onClick={submitOrder}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    disabled={!selectedTable || !customerInfo.name.trim()}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Order
                  </Button>
                </div>
              </div>
            )}
          </PremiumLiquidGlass>
        </div>
      </div>
    </div>
  );
}