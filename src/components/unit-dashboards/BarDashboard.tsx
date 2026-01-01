"use client";

import { useState, useEffect } from "react";
import { BusinessUnitType } from "@/lib/business-units";


interface BarMetrics {
  dailyRevenue: number;
  ordersToday: number;
  activeCustomers: number;
  popularDrinks: Array<{ name: string; count: number; revenue: number }>;
  staffOnDuty: number;
  inventoryAlerts: number;
  averageOrderValue: number;
  peakHours: Array<{ hour: string; orders: number }>;
  tabCount: number;
  openTabs: number;
}

export function BarDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<BarMetrics>({
    dailyRevenue: 0,
    ordersToday: 0,
    activeCustomers: 0,
    popularDrinks: [],
    staffOnDuty: 0,
    inventoryAlerts: 0,
    averageOrderValue: 0,
    peakHours: [],
    tabCount: 0,
    openTabs: 0
  });

  useEffect(() => {
    loadBarMetrics();
  }, []);

  const loadBarMetrics = () => {
    setLoading(true);
    
    // TODO: Fetch real bar metrics from database
    const emptyMetrics: BarMetrics = {
      dailyRevenue: 0,
      ordersToday: 0,
      activeCustomers: 0,
      popularDrinks: [],
      staffOnDuty: 0,
      inventoryAlerts: 0,
      averageOrderValue: 0,
      peakHours: [],
      tabCount: 0,
      openTabs: 0
    };

    setMetrics(emptyMetrics);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
        <p className="text-center text-[#6B7280]">Loading bar data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Bar Dashboard</h1>
          <p className="text-[#6B7280]">Real-time bar operations and performance</p>
        </div>
        
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-[#6D5DFB] text-white rounded-md hover:bg-[#6D5DFB]/90">
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
              <p className="text-xs text-[#22C55E]">↑ 15% from yesterday</p>
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
              <p className="text-sm font-medium text-[#6B7280]">Open Tabs</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.openTabs}</p>
              <p className="text-xs text-[#9CA3AF]">Total: {metrics.tabCount}</p>
            </div>
            <div className="p-3 bg-[#EDEBFF] rounded-lg">
              <svg className="w-6 h-6 text-[#C084FC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Staff on Duty</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.staffOnDuty}</p>
              <p className="text-xs text-orange-600">{metrics.inventoryAlerts} alerts</p>
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
        {/* Popular Drinks */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Popular Drinks</h3>
            <p className="text-sm text-[#6B7280]">Top selling drinks today</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {metrics.popularDrinks.map((drink, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#EDEBFF]/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-[#6D5DFB]">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{drink.name}</p>
                      <p className="text-xs text-[#9CA3AF]">{drink.count} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#111827]">{formatCurrency(drink.revenue)}</p>
                    <p className="text-xs text-[#9CA3AF]">{formatCurrency(drink.revenue / drink.count)} avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Peak Hours</h3>
            <p className="text-sm text-[#6B7280]">Order volume throughout the evening</p>
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
          <p className="text-sm text-[#6B7280]">Common bar operations</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">Open Tab</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}

