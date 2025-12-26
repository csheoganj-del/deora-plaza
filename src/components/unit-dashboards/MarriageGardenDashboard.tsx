"use client";

import { useState, useEffect } from "react";
import { BusinessUnitType } from "@/lib/business-units";


interface MarriageGardenMetrics {
  dailyRevenue: number;
  activeEvents: number;
  upcomingEvents: number;
  totalBookings: number;
  averageBookingValue: number;
  staffOnDuty: number;
  maintenanceRequests: number;
  popularPackages: Array<{ name: string; count: number; revenue: number }>;
  todayEvents: Array<{ name: string; time: string; guests: number; status: string }>;
}

export function MarriageGardenDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MarriageGardenMetrics>({
    dailyRevenue: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    totalBookings: 0,
    averageBookingValue: 0,
    staffOnDuty: 0,
    maintenanceRequests: 0,
    popularPackages: [],
    todayEvents: []
  });

  useEffect(() => {
    loadMarriageGardenMetrics();
  }, []);

  const loadMarriageGardenMetrics = () => {
    setLoading(true);
    
    // Mock data for marriage garden metrics
    const mockMetrics: MarriageGardenMetrics = {
      dailyRevenue: 15420.00,
      activeEvents: 2,
      upcomingEvents: 8,
      totalBookings: 45,
      averageBookingValue: 12500.00,
      staffOnDuty: 15,
      maintenanceRequests: 2,
      popularPackages: [
        { name: "Premium Wedding Package", count: 18, revenue: 450000.00 },
        { name: "Silver Anniversary Package", count: 12, revenue: 180000.00 },
        { name: "Corporate Event Package", count: 8, revenue: 120000.00 },
        { name: "Birthday Celebration", count: 5, revenue: 50000.00 },
        { name: "Basic Wedding Package", count: 2, revenue: 20000.00 }
      ],
      todayEvents: [
        { name: "Smith Wedding", time: "6:00 PM", guests: 150, status: "setup" },
        { name: "Johnson Reception", time: "8:00 PM", guests: 200, status: "confirmed" }
      ]
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

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'setup': return 'text-[#F59E0B] bg-[#F59E0B]/10';
      case 'confirmed': return 'text-[#22C55E] bg-[#BBF7D0]';
      case 'in-progress': return 'text-[#6D5DFB] bg-[#6D5DFB]/10';
      case 'completed': return 'text-[#6B7280] bg-[#F1F5F9]';
      default: return 'text-[#6B7280] bg-[#F1F5F9]';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
        <p className="text-center text-[#6B7280]">Loading marriage garden data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Marriage Garden Dashboard</h1>
          <p className="text-[#6B7280]">Real-time event management and performance</p>
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
              <p className="text-xs text-[#22C55E]">↑ 22% from last week</p>
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
              <p className="text-sm font-medium text-[#6B7280]">Active Events</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.activeEvents}</p>
              <p className="text-xs text-[#9CA3AF]">{metrics.upcomingEvents} upcoming</p>
            </div>
            <div className="p-3 bg-[#EDEBFF]/30 rounded-lg">
              <svg className="w-6 h-6 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Total Bookings</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.totalBookings}</p>
              <p className="text-xs text-[#9CA3AF]">This month</p>
            </div>
            <div className="p-3 bg-[#EDEBFF] rounded-lg">
              <svg className="w-6 h-6 text-[#C084FC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Staff on Duty</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.staffOnDuty}</p>
              <p className="text-xs text-orange-600">{metrics.maintenanceRequests} maintenance</p>
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
        {/* Today's Events */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Today's Events</h3>
            <p className="text-sm text-[#6B7280]">Current and upcoming events</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {metrics.todayEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#EDEBFF]/30 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{event.name}</p>
                      <p className="text-xs text-[#9CA3AF]">{event.guests} guests</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#111827]">{event.time}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getEventStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Packages */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Popular Packages</h3>
            <p className="text-sm text-[#6B7280]">Top selling packages this month</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {metrics.popularPackages.map((pkg, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#EDEBFF]/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-[#6D5DFB]">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{pkg.name}</p>
                      <p className="text-xs text-[#9CA3AF]">{pkg.count} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#111827]">{formatCurrency(pkg.revenue)}</p>
                    <p className="text-xs text-[#9CA3AF]">{formatCurrency(pkg.revenue / pkg.count)} avg</p>
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
          <p className="text-sm text-[#6B7280]">Common event operations</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-[#6D5DFB] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">New Booking</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-[#22C55E] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">View Events</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-orange-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">Guest Management</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-[#C084FC] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">Facility Setup</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

