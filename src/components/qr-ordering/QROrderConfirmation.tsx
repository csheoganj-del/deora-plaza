"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRGeneratedOrder } from "@/lib/qr-code";

export function QROrderConfirmation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<QRGeneratedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderId = searchParams.get('orderId');
        if (!orderId) {
          setError('Order ID not found');
          return;
        }

        // In a real app, this would fetch the order from your API
        // For now, we'll create a mock order
        const mockOrder: QRGeneratedOrder = {
          sessionId: orderId,
          tableId: 'table_1',
          tableNumber: '1',
          businessUnit: 'restaurant',
          items: [
            {
              id: 'item_1',
              menuItemId: '1',
              name: 'Coffee',
              price: 3.99,
              quantity: 2
            },
            {
              id: 'item_2',
              menuItemId: '2',
              name: 'Sandwich',
              price: 8.99,
              quantity: 1
            }
          ],
          totalAmount: 16.97,
          customerInfo: {
            name: 'John Doe',
            phone: '+1234567890'
          },
          specialInstructions: 'Extra sugar in coffee',
          paymentStatus: 'pending',
          orderStatus: 'pending',
          createdAt: new Date().toISOString()
        };

        setOrder(mockOrder);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [searchParams]);

  const handleNewOrder = () => {
    router.push('/');
  };

  const handleViewStatus = () => {
    // In a real app, this would navigate to order status page
    console.log('View order status');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
          <p className="text-[#6B7280]">Loading order details...</p>
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
          <h2 className="text-xl font-semibold text-[#111827] mb-2">Error</h2>
          <p className="text-[#6B7280] mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#6D5DFB] text-white rounded hover:bg-[#6D5DFB]/90"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#BBF7D0] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Order Confirmed!</h1>
          <p className="text-[#6B7280]">Your order has been received and is being prepared</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Order Details</h2>
              <p className="text-sm text-[#6B7280]">Table {order.tableNumber} • {order.businessUnit}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#9CA3AF]">Order #{order.sessionId.slice(-8)}</p>
              <p className="text-sm text-[#9CA3AF]">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Order Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#111827]">Order Status</span>
              <span className="px-2 py-1 text-xs bg-[#F59E0B]/10 text-[#F59E0B] rounded-full">
                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
              </span>
            </div>
            <div className="w-full bg-[#E5E7EB] rounded-full h-2">
              <div className="bg-[#6D5DFB] h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-medium text-[#111827] mb-3">Order Items</h3>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium text-[#111827]">{item.name}</p>
                    <p className="text-sm text-[#6B7280]">${item.price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <p className="font-medium text-[#111827]">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="mb-6">
              <h3 className="font-medium text-[#111827] mb-2">Special Instructions</h3>
              <p className="text-[#6B7280] bg-[#F8FAFC] p-3 rounded">{order.specialInstructions}</p>
            </div>
          )}

          {/* Customer Info */}
          {order.customerInfo && (
            <div className="mb-6">
              <h3 className="font-medium text-[#111827] mb-2">Customer Information</h3>
              <div className="bg-[#F8FAFC] p-3 rounded">
                {order.customerInfo.name && <p className="text-[#6B7280]">{order.customerInfo.name}</p>}
                {order.customerInfo.phone && <p className="text-[#6B7280]">{order.customerInfo.phone}</p>}
                {order.customerInfo.email && <p className="text-[#6B7280]">{order.customerInfo.email}</p>}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-[#111827]">Total Amount</span>
              <span className="text-lg font-semibold text-[#111827]">${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-[#6B7280]">Payment Status</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                order.paymentStatus === 'paid' 
                  ? 'bg-[#BBF7D0] text-[#16A34A]' 
                  : 'bg-[#F59E0B]/10 text-[#F59E0B]'
              }`}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleViewStatus}
            className="flex-1 px-4 py-3 bg-[#6B7280] text-white rounded hover:bg-[#111827] transition-colors"
          >
            Track Order Status
          </button>
          <button
            onClick={handleNewOrder}
            className="flex-1 px-4 py-3 bg-[#6D5DFB] text-white rounded hover:bg-[#6D5DFB]/90 transition-colors"
          >
            Place New Order
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#6B7280] mb-2">Need help with your order?</p>
          <button className="text-[#6D5DFB] hover:text-[#6D5DFB]/90 text-sm font-medium">
            Contact Staff
          </button>
        </div>
      </div>
    </div>
  );
}

