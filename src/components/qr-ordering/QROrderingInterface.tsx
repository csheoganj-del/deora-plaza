"use client";

import { useState, useEffect } from "react";
import { QRCodeSession, QROrderItem, qrCodeManager, validateQRSession } from "@/lib/qr-code";
import { BusinessUnit } from "@/lib/business-units";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  customizations?: {
    id: string;
    name: string;
    type: 'single' | 'multiple';
    options: Array<{
      id: string;
      name: string;
      price: number;
    }>;
  }[];
}

interface QROrderingInterfaceProps {
  qrData: string;
  onOrderComplete?: (order: any) => void;
}

export function QROrderingInterface({ qrData, onOrderComplete }: QROrderingInterfaceProps) {
  const [session, setSession] = useState<QRCodeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<QROrderItem[]>([]);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Decode QR data
        const decodedData = qrCodeManager.decodeQRData(qrData);
        if (!decodedData) {
          setError('Invalid QR code');
          return;
        }

        // Validate QR data
        if (!qrCodeManager.validateQRData(decodedData)) {
          setError('QR code is expired or invalid');
          return;
        }

        // Create or get session
        const newSession = qrCodeManager.createSession(decodedData.tableId, decodedData.businessUnit);
        setSession(newSession);

        // Load menu items for the business unit
        await loadMenuItems(decodedData.businessUnit);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize ordering session');
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [qrData]);

  const loadMenuItems = async (businessUnit: string) => {
    try {
      setLoading(true);
      
      // Fetch menu items from API
      const { data: menuItems, error } = await supabaseClient
        .from('menu_items')
        .select('*')
        .eq('businessUnit', businessUnit)
        .eq('isAvailable', true);

      if (error) {
        console.error('Error loading menu items:', error);
        setMenuItems([]);
        return;
      }

      setMenuItems(menuItems || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    if (!session) return;

    const orderItem: QROrderItem = {
      id: `item_${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1
    };

    const updatedSession = qrCodeManager.addToCart(session, orderItem);
    setSession(updatedSession);
    setCart(updatedSession.cart);
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (!session) return;

    const updatedSession = qrCodeManager.updateCartItemQuantity(session, menuItemId, quantity);
    setSession(updatedSession);
    setCart(updatedSession.cart);
  };

  const removeFromCart = (menuItemId: string) => {
    if (!session) return;

    const updatedSession = qrCodeManager.removeFromCart(session, menuItemId);
    setSession(updatedSession);
    setCart(updatedSession.cart);
  };

  const calculateTotal = () => {
    return qrCodeManager.calculateCartTotal(cart);
  };

  const handleSubmitOrder = async () => {
    if (!session || cart.length === 0) return;

    try {
      setIsSubmitting(true);
      
      const order = qrCodeManager.convertSessionToOrder(
        session,
        customerInfo.name ? customerInfo : undefined,
        specialInstructions
      );

      // In real app, this would submit to API
      console.log('Submitting order:', order);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      onOrderComplete?.(order);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
          <p className="text-[#6B7280]">Setting up your ordering session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-[#EF4444] mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#111827] mb-2">Ordering Unavailable</h2>
          <p className="text-[#6B7280]">{error}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];
  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-[#111827]">
                Table {session.tableId} Ordering
              </h1>
              <p className="text-sm text-[#6B7280] capitalize">
                {session.businessUnit}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-[#9CA3AF]">
                Session expires: {new Date(session.expiresAt).toLocaleTimeString()}
              </div>
              <button
                onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                className="px-3 py-1 text-sm bg-[#6D5DFB] text-white rounded hover:bg-[#6D5DFB]/90"
              >
                {showCustomerInfo ? 'Hide' : 'Show'} Info
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu */}
          <div className="lg:col-span-2">
            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-[#6D5DFB] text-white'
                        : 'bg-white text-[#111827] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#111827]">{item.name}</h3>
                      <p className="text-sm text-[#6B7280]">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#111827]">${item.price.toFixed(2)}</p>
                      {!item.available && (
                        <span className="inline-block px-2 py-1 text-xs bg-[#FEE2E2] text-[#DC2626] rounded">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                  {item.available && (
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full mt-2 px-3 py-2 bg-[#6D5DFB] text-white rounded hover:bg-[#6D5DFB]/90 transition-colors text-sm"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-[#111827] mb-4">Your Order</h2>
              
              {/* Customer Info */}
              {showCustomerInfo && (
                <div className="mb-4 p-3 bg-[#F8FAFC] rounded">
                  <h3 className="text-sm font-medium text-[#111827] mb-2">Customer Information</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name (optional)"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Cart Items */}
              {cart.length === 0 ? (
                <p className="text-[#9CA3AF] text-center py-4">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b">
                        <div className="flex-1">
                          <p className="font-medium text-[#111827]">{item.name}</p>
                          <p className="text-sm text-[#6B7280]">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-[#E5E7EB] hover:bg-[#9CA3AF] flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-[#E5E7EB] hover:bg-[#9CA3AF] flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.menuItemId)}
                            className="ml-2 text-[#EF4444] hover:text-[#DC2626]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Special Instructions */}
                  <div className="mb-4">
                    <textarea
                      placeholder="Special instructions (optional)"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full px-3 py-2 border rounded text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#111827]">Total:</span>
                      <span className="font-semibold text-[#111827]">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full px-4 py-3 bg-[#6D5DFB] text-white rounded hover:bg-[#6D5DFB]/90 disabled:bg-[#9CA3AF] disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Place Order'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

