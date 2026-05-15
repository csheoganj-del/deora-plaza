import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X, Printer, CreditCard, Banknote, QrCode,
  Trash2, Plus, Percent, Calculator, Search,
  ChefHat, Coffee, ShoppingBag, ArrowRight
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { createBill } from '@/actions/billing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from 'framer-motion';

interface BillGeneratorProps {
  order: any;
  onClose: () => void;
  onBillGenerated: () => void;
}

export function BillGenerator({ order, onClose, onBillGenerated }: BillGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Bill State
  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [items, setItems] = useState<any[]>(order.items || []);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [gstPercent, setGstPercent] = useState(5);
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { getMenuItems } = await import("@/actions/menu");
        const items = await getMenuItems();
        setMenuItems(items as any[]);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
      }
    };
    fetchMenu();
  }, []);

  // Fetch latest order data to ensure we have updated items
  useEffect(() => {
    const fetchLatestOrderData = async () => {
      try {
        const { getOrderById } = await import("@/actions/orders");
        const latestOrder = await getOrderById(order.id);
        if (latestOrder && latestOrder.items) {
          // Update items with latest data from database
          const parsedItems = Array.isArray(latestOrder.items)
            ? latestOrder.items
            : JSON.parse(latestOrder.items);
          setItems(parsedItems);
          console.log('✅ Fetched latest order items:', parsedItems.length, 'items');
        }
      } catch (error) {
        console.error("Failed to fetch latest order data:", error);
        // Fallback to order.items if fetch fails
        setItems(order.items || []);
      }
    };

    if (order.id) {
      fetchLatestOrderData();
    }
  }, [order.id]);

  // Calculations
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = (taxableAmount * gstPercent) / 100;
  const totalAmount = isComplimentary ? 0 : Math.round(taxableAmount + gstAmount);

  const handleAddItem = (menuItem: any) => {
    const existingItem = items.find((i: any) => i.name === menuItem.name);
    if (existingItem) {
      setItems(items.map((i: any) =>
        i.name === menuItem.name ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, { ...menuItem, quantity: 1, id: menuItem.id || Date.now() }]);
    }
  };

  const handleUpdateQuantity = (index: number, change: number) => {
    const newItems = [...items];
    newItems[index].quantity += change;
    if (newItems[index].quantity <= 0) {
      newItems.splice(index, 1);
    }
    setItems(newItems);
  };

  const handleGenerateBill = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Cannot generate bill with no items",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await createBill({
        orderId: order.id,
        businessUnit: order.businessUnit || 'restaurant',
        customerName,
        customerMobile: customerPhone,
        items,
        subtotal,
        discountPercent,
        discountAmount,
        gstPercent,
        gstAmount,
        grandTotal: totalAmount,
        paymentMethod,
      });

      // Update order status potentially handled by parent or server action via refresh
      // Here we just notify success

      toast({
        title: "Bill Generated",
        description: `Bill for Order #${order.orderNumber} created successfully.`
      });

      onBillGenerated();
    } catch (error) {
      console.error('Error generating bill:', error);
      toast({
        title: "Failed",
        description: "Could not generate bill. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-transparent text-white relative overflow-hidden">

      {/* 1. Header Section */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Generate Bill
          </h2>
          <p className="text-sm text-gray-400 mt-1">Order #{order.orderNumber} • {order.tableName || `Table ${order.tableNumber}`}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* 2. Left Panel: Item Selection & Customer Info */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-white/10 custom-scrollbar space-y-8">

          {/* Customer Details Card */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Customer Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-black/20 border-white/10 text-white focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl h-10"
                  placeholder="Guest Name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Phone</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-black/20 border-white/10 text-white focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl h-10"
                  placeholder="Phone Number"
                />
              </div>
            </div>
          </div>

          {/* Add Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ChefHat className="w-4 h-4" /> Add Items
              </h3>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/20 border-white/10 text-white pl-8 h-8 text-xs rounded-full focus:border-purple-500/50"
                  placeholder="Search menu..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {filteredMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                >
                  <div>
                    <div className="font-medium text-sm text-gray-200 group-hover:text-white">{item.name}</div>
                    <div className="text-xs text-gray-500">₹{item.price}</div>
                  </div>
                  <Plus className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Right Panel: Bill details & Payment */}
        <div className="w-1/2 flex flex-col bg-black/20">

          {/* Order Items List */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              Current Order
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs text-gray-400">₹{item.price} x {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-white">₹{item.price * item.quantity}</span>
                      <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1">
                        <button
                          onClick={() => handleUpdateQuantity(index, -1)}
                          className="p-1 hover:text-red-400 transition-colors text-gray-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="text-xs w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(index, 1)}
                          className="p-1 hover:text-green-400 transition-colors text-gray-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {items.length === 0 && (
                <div className="text-center py-10 text-gray-500 italic">
                  No items added yet.
                </div>
              )}
            </div>
          </div>

          {/* Footer: Calculations & Pay */}
          <div className="p-6 bg-black/40 backdrop-blur-md border-t border-white/10 space-y-6">

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <Label className="text-xs text-gray-500 uppercase tracking-widest">Payment Method</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'upi', label: 'UPI', icon: QrCode }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`
                      relative p-3 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200
                      ${paymentMethod === method.id
                        ? 'bg-blue-500/20 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                      }
                    `}
                  >
                    <method.icon className={`w-5 h-5 ${paymentMethod === method.id ? 'text-blue-400' : ''}`} />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations Grid */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-gray-400 flex items-center gap-2">
                  Discount
                  <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-gray-300">
                    {discountPercent}%
                  </span>
                </span>
                <span className="text-red-300">-₹{discountAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>GST ({gstPercent}%)</span>
                <span>₹{gstAmount.toFixed(0)}</span>
              </div>

              <div className="h-px bg-white/10 my-2"></div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Amount</p>
                  <div className="text-3xl font-bold text-white tracking-tight">
                    ₹{totalAmount.toLocaleString()}
                  </div>
                </div>

                <Button
                  onClick={handleGenerateBill}
                  disabled={loading || items.length === 0}
                  className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Generate Bill <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
