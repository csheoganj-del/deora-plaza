"use client";

import { useState, useEffect } from "react";
import { BusinessUnitType } from "@/lib/business-units";
import { getUnitMetrics } from "@/actions/unit-stats";
import { createClient } from "@/lib/supabase/client";
import { ensureBillForOrder } from "@/actions/billing";
import { getOrderById } from "@/actions/orders";
import ReprintBill from "@/components/billing/ReprintBill";
import { toast } from "sonner";

interface CafeMetrics {
  dailyRevenue: number;
  ordersToday: number;
  activeCustomers: number;
  popularItems: Array<{ name: string; count: number; revenue: number }>;
  staffOnDuty: number;
  inventoryAlerts: number;
  averageOrderValue: number;
  peakHours: Array<{ hour: string; orders: number }>;
}

export function CafeDashboard() {
  const [loading, setLoading] = useState(true);
  const [autoPrintBill, setAutoPrintBill] = useState<any>(null); // State for auto-print
  const [metrics, setMetrics] = useState<CafeMetrics>({
    dailyRevenue: 0,
    ordersToday: 0,
    activeCustomers: 0,
    popularItems: [],
    staffOnDuty: 0,
    inventoryAlerts: 0,
    averageOrderValue: 0,
    peakHours: []
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Realtime Subscription for Auto-Print
  useEffect(() => {
    const supabase = createClient();
    console.log("🖨️ Initializing Auto-Print Listener for Cafe...");
    toast.success("Auto-Print System Active", { duration: 2000 });

    const channel = supabase
      .channel('cafe-auto-print')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          // Removed filter to be safe, check status in JS
        },
        async (payload) => {
          const newOrder = payload.new as any;
          const oldOrder = payload.old as any;

          console.log("🔔 Order Update Detected:", newOrder.id, "Status:", newOrder.status);

          // 1. Check if status changed to 'served'
          // Use loose check for oldOrder.status (might be undefined)
          const wasServed = oldOrder.status === 'served';
          const isServed = newOrder.status === 'served';

          if (!wasServed && isServed) {
            console.log("🔍 Checking if order is Takeaway...", newOrder.id);

            // 2. Fetch FULL order details from server (Reliable)
            try {
              const fullOrder = await getOrderById(newOrder.id);

              if (!fullOrder) {
                console.error("❌ Could not fetch order details:", newOrder.id);
                return;
              }

              console.log("📋 Fetched Order Type:", fullOrder.type);

              // 3. Verify Type is Takeaway
              if (fullOrder.type && fullOrder.type.toLowerCase() === 'takeaway') {
                console.log("✅ Valid Takeaway Order! Ensuring Bill...");
                toast.info("New Takeaway Served! Preparing Bill...");

                // 4. Ensure Bill
                const result = await ensureBillForOrder(fullOrder.id);

                if (result.success && result.bill) {
                  console.log("📄 Bill Ready:", result.bill.billNumber);
                  setAutoPrintBill(result.bill);
                  toast.success(`Bill generated: ${result.bill.billNumber}`);
                  // Keep alive?
                } else {
                  console.error("❌ Failed to ensure bill:", result.error);
                  toast.error("Failed to generate bill for auto-print");
                }
              } else {
                console.log("ℹ️ Ignored: Not a takeaway order (Type: " + fullOrder.type + ")");
              }

            } catch (err) {
              console.error("❌ Error processing auto-print trigger:", err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    loadCafeMetrics();
  }, [selectedDate]);

  const loadCafeMetrics = async () => {
    setLoading(true);
    try {
      // Convert selectedDate range
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const data = await getUnitMetrics('cafe', startOfDay.toISOString(), endOfDay.toISOString());

      setMetrics({
        dailyRevenue: data.dailyRevenue,
        ordersToday: data.ordersToday,
        activeCustomers: data.activeTables, // Using active tables as proxy for now
        popularItems: data.popularItems,
        staffOnDuty: 0,
        inventoryAlerts: 0,
        averageOrderValue: data.averageOrderValue,
        peakHours: [] // Future implementation
      });
    } catch (error) {
      console.error("Failed to load cafe metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
        <p className="text-center text-[#6B7280]">Loading cafe data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Cafe Dashboard</h1>
          <p className="text-[#6B7280]">Real-time cafe operations and performance</p>
        </div>

        <div className="flex space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
          />
          <button
            onClick={loadCafeMetrics}
            className="px-4 py-2 bg-[#6D5DFB] text-white rounded-md hover:bg-[#6D5DFB]/90"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Daily Revenue</p>
              <p className="text-2xl font-bold text-[#111827]">{formatCurrency(metrics.dailyRevenue)}</p>
              <p className="text-xs text-[#22C55E]">↑ 12% from yesterday</p>
            </div>
            <div className="p-3 bg-[#BBF7D0] rounded-lg">
              <svg className="w-6 h-6 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Orders Today</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.ordersToday}</p>
              <p className="text-xs text-[#9CA3AF]">Avg: {formatCurrency(metrics.averageOrderValue)}</p>
            </div>
            <div className="p-3 bg-[#EDEBFF]/30 rounded-lg">
              <svg className="w-6 h-6 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Active Customers</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.activeCustomers}</p>
              <p className="text-xs text-[#9CA3AF]">Currently in cafe</p>
            </div>
            <div className="p-3 bg-[#EDEBFF] rounded-lg">
              <svg className="w-6 h-6 text-[#C084FC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Staff on Duty</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.staffOnDuty}</p>
              <p className="text-xs text-orange-600">3 alerts</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Popular Items</h3>
            <p className="text-sm text-[#6B7280]">Top selling items today</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {metrics.popularItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#EDEBFF]/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-[#6D5DFB]">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{item.name}</p>
                      <p className="text-xs text-[#9CA3AF]">{item.count} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#111827]">{formatCurrency(item.revenue)}</p>
                    <p className="text-xs text-[#9CA3AF]">₹{Math.round(item.revenue / item.count)} avg</p>
                  </div>
                </div>
              ))}
              {metrics.popularItems.length === 0 && (
                <p className="text-center text-sm text-[#9CA3AF] py-4">No sales data for this period</p>
              )}
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Peak Hours</h3>
            <p className="text-sm text-[#6B7280]">Order volume throughout the day</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {metrics.peakHours.map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-[#111827] w-16">{hour.hour}</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[#6D5DFB]"
                        style={{ width: `${(hour.orders / Math.max(...metrics.peakHours.map(h => h.orders))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-[#9CA3AF] w-8 text-right">{hour.orders}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="premium-card">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-[#111827]">Quick Actions</h3>
          <p className="text-sm text-[#6B7280]">Common cafe operations</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-[#6D5DFB] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">New Order</p>
            </button>

            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-[#22C55E] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">View Orders</p>
            </button>

            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-orange-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">Inventory</p>
            </button>

            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-[#C084FC] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">Staff</p>
            </button>
            {/* DEBUG BUTTON */}
            <button
              onClick={async () => {
                toast.info("Simulating Takeaway Served...");
                // Mock a complete bill structure
                setAutoPrintBill({
                  id: "mock-bill-id",
                  billNumber: "TEST-BILL-001",
                  orderId: "mock-order-id", // Required by ReprintBill
                  grandTotal: 500,
                  subtotal: 450,
                  gstAmount: 50,
                  businessUnit: 'cafe',
                  createdAt: new Date().toISOString(),
                  items: JSON.stringify([
                    { name: "Test Coffee", quantity: 2, price: 150, amount: 300 },
                    { name: "Sandwich", quantity: 1, price: 150, amount: 150 }
                  ])
                });
              }}
              className="p-4 border-2 border-dashed border-red-200 bg-red-50 rounded-lg hover:bg-red-100 text-center"
            >
              <p className="text-xs font-bold text-red-600 uppercase">Test Popup</p>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Print Dialog Overlay */}
      {autoPrintBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  New Takeaway Served!
                </h2>
                <p className="text-sm text-gray-500 mt-1">Order #{autoPrintBill.billNumber}</p>
              </div>
            </div>
            <div className="p-6">
              <ReprintBill
                bill={autoPrintBill}
                onClose={() => setAutoPrintBill(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
