"use client";

import { useState, useEffect } from "react";
import { BusinessUnitType } from "@/lib/business-units";
;

interface RestaurantMetrics {
  dailyRevenue: number;
  ordersToday: number;
  activeTables: number;
  totalTables: number;
  averagePrepTime: number;
  popularDishes: Array<{ name: string; count: number; revenue: number }>;
  staffOnDuty: number;
  reservations: number;
  waitTime: number;
  kitchenStatus: 'active' | 'busy' | 'overwhelmed';
}

export function RestaurantDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<RestaurantMetrics>({
    dailyRevenue: 0,
    ordersToday: 0,
    activeTables: 0,
    totalTables: 0,
    averagePrepTime: 0,
    popularDishes: [],
    staffOnDuty: 0,
    reservations: 0,
    waitTime: 0,
    kitchenStatus: 'active'
  });

  useEffect(() => {
    loadRestaurantMetrics();
  }, []);

  const loadRestaurantMetrics = () => {
    setLoading(true);
    
    // Mock data for restaurant metrics
    const mockMetrics: RestaurantMetrics = {
      dailyRevenue: 8750.50,
      ordersToday: 156,
      activeTables: 18,
      totalTables: 24,
      averagePrepTime: 18.5,
      popularDishes: [
        { name: "Grilled Salmon", count: 23, revenue: 690.00 },
        { name: "Ribeye Steak", count: 19, revenue: 760.00 },
        { name: "Pasta Carbonara", count: 17, revenue: 255.00 },
        { name: "Caesar Salad", count: 15, revenue: 150.00 },
        { name: "Fish & Chips", count: 14, revenue: 210.00 }
      ],
      staffOnDuty: 8,
      reservations: 12,
      waitTime: 25,
      kitchenStatus: 'busy'
    };

    setMetrics(mockMetrics);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getKitchenStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-[#22C55E] bg-[#BBF7D0]';
      case 'busy': return 'text-[#F59E0B] bg-[#F59E0B]/10';
      case 'overwhelmed': return 'text-[#EF4444] bg-[#FEE2E2]';
      default: return 'text-[#6B7280] bg-[#F1F5F9]';
    }
  };

  const getTableOccupancyRate = () => {
    return ((metrics.activeTables / metrics.totalTables) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
        <p className="text-center text-[#6B7280]">Loading restaurant data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Restaurant Dashboard</h1>
          <p className="text-[#6B7280]">Real-time restaurant operations and performance</p>
        </div>
        
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-[#6D5DFB] text-white rounded-md hover:bg-[#5B4EE5]">
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
              <p className="text-xs text-[#22C55E]">↑ 8% from yesterday</p>
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
              <p className="text-sm font-medium text-[#6B7280]">Table Occupancy</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.activeTables}/{metrics.totalTables}</p>
              <p className="text-xs text-[#9CA3AF]">{getTableOccupancyRate()}% occupied</p>
            </div>
            <div className="p-3 bg-[#6D5DFB]/10 rounded-lg">
              <svg className="w-6 h-6 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Avg Prep Time</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.averagePrepTime} min</p>
              <p className="text-xs text-[#F59E0B]">↑ 2 min from target</p>
            </div>
            <div className="p-3 bg-[#F59E0B]/10 rounded-lg">
              <svg className="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Kitchen Status</p>
              <p className="text-lg font-bold text-[#111827] capitalize">{metrics.kitchenStatus}</p>
              <p className="text-xs text-[#9CA3AF]">{metrics.waitTime} min wait</p>
            </div>
            <div className="p-3 bg-[#F59E0B]/10 rounded-lg">
              <svg className="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3.126 0A2.704 2.704 0 0112 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3.126 0 2.704 2.704 0 01-3.126 0A2.704 2.704 0 013 15.546V9a6 6 0 0112 0v6.546z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Dishes */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Popular Dishes</h3>
            <p className="text-sm text-[#6B7280]">Top selling dishes today</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {metrics.popularDishes.map((dish, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#6D5DFB]/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-[#6D5DFB]">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{dish.name}</p>
                      <p className="text-xs text-[#9CA3AF]">{dish.count} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#111827]">{formatCurrency(dish.revenue)}</p>
                    <p className="text-xs text-[#9CA3AF]">{formatCurrency(dish.revenue / dish.count)} avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Staff & Reservations */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Operations</h3>
            <p className="text-sm text-[#6B7280]">Staff and reservation status</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#111827]">Staff on Duty</p>
                  <p className="text-xs text-[#9CA3AF]">Kitchen & floor staff</p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#111827]">{metrics.staffOnDuty}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#111827]">Reservations</p>
                  <p className="text-xs text-[#9CA3AF]">Today's bookings</p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#111827]">{metrics.reservations}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#111827]">Average Wait</p>
                  <p className="text-xs text-[#9CA3AF]">For walk-in customers</p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#111827]">{metrics.waitTime} min</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#111827]">Orders Today</p>
                  <p className="text-xs text-[#9CA3AF]">Total processed</p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#111827]">{metrics.ordersToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="premium-card">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-[#111827]">Quick Actions</h3>
          <p className="text-sm text-[#6B7280]">Common restaurant operations</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">Reservations</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-[#C084FC] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3.126 0A2.704 2.704 0 0112 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3.126 0 2.704 2.704 0 01-3.126 0A2.704 2.704 0 013 15.546V9a6 6 0 0112 0v6.546z" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">Kitchen</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

