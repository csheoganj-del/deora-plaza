"use client";

import { useState, useEffect } from "react";
import { BusinessUnitType } from "@/lib/business-units";


interface HotelMetrics {
  dailyRevenue: number;
  occupiedRooms: number;
  totalRooms: number;
  occupancyRate: number;
  checkInsToday: number;
  checkOutsToday: number;
  averageRoomRate: number;
  staffOnDuty: number;
  maintenanceRequests: number;
  reservations: number;
  upcomingCheckIns: Array<{ time: string; guest: string; room: string }>;
}

export function HotelDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HotelMetrics>({
    dailyRevenue: 0,
    occupiedRooms: 0,
    totalRooms: 0,
    occupancyRate: 0,
    checkInsToday: 0,
    checkOutsToday: 0,
    averageRoomRate: 0,
    staffOnDuty: 0,
    maintenanceRequests: 0,
    reservations: 0,
    upcomingCheckIns: []
  });

  useEffect(() => {
    loadHotelMetrics();
  }, []);

  const loadHotelMetrics = () => {
    setLoading(true);
    
    // TODO: Fetch real hotel metrics from database
    const emptyMetrics: HotelMetrics = {
      dailyRevenue: 0,
      occupiedRooms: 0,
      totalRooms: 0,
      occupancyRate: 0,
      checkInsToday: 0,
      checkOutsToday: 0,
      averageRoomRate: 0,
      staffOnDuty: 0,
      maintenanceRequests: 0,
      reservations: 0,
      upcomingCheckIns: []
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

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return 'text-[#22C55E] bg-[#BBF7D0]';
    if (rate >= 60) return 'text-[#F59E0B] bg-[#F59E0B]/10';
    return 'text-[#EF4444] bg-[#FEE2E2]';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
        <p className="text-center text-[#6B7280]">Loading hotel data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Hotel Dashboard</h1>
          <p className="text-[#6B7280]">Real-time hotel operations and performance</p>
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
              <p className="text-sm font-medium text-[#6B7280]">Occupancy Rate</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.occupancyRate}%</p>
              <p className="text-xs text-[#9CA3AF]">{metrics.occupiedRooms}/{metrics.totalRooms} rooms</p>
            </div>
            <div className="p-3 bg-[#BBF7D0] rounded-lg">
              <svg className="w-6 h-6 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Daily Revenue</p>
              <p className="text-2xl font-bold text-[#111827]">{formatCurrency(metrics.dailyRevenue)}</p>
              <p className="text-xs text-[#22C55E]">↑ 5% from yesterday</p>
            </div>
            <div className="p-3 bg-[#EDEBFF]/30 rounded-lg">
              <svg className="w-6 h-6 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Avg Room Rate</p>
              <p className="text-2xl font-bold text-[#111827]">{formatCurrency(metrics.averageRoomRate)}</p>
              <p className="text-xs text-[#9CA3AF]">Per night</p>
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
              <p className="text-sm font-medium text-[#6B7280]">Check-ins/Outs</p>
              <p className="text-2xl font-bold text-[#111827]">{metrics.checkInsToday}/{metrics.checkOutsToday}</p>
              <p className="text-xs text-[#9CA3AF]">Today</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Check-ins */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Upcoming Check-ins</h3>
            <p className="text-sm text-[#6B7280]">Today's arrivals</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {metrics.upcomingCheckIns.map((checkIn, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#EDEBFF]/30 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{checkIn.guest}</p>
                      <p className="text-xs text-[#9CA3AF]">Room {checkIn.room}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#111827]">{checkIn.time}</p>
                    <p className="text-xs text-[#9CA3AF]">Check-in</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operations Status */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Operations Status</h3>
            <p className="text-sm text-[#6B7280]">Current hotel operations</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#111827]">Staff on Duty</p>
                  <p className="text-xs text-[#9CA3AF]">Front desk, housekeeping, maintenance</p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#111827]">{metrics.staffOnDuty}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#111827]">Reservations</p>
                  <p className="text-xs text-[#9CA3AF]">Upcoming bookings</p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#111827]">{metrics.reservations}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#111827]">Maintenance</p>
                  <p className="text-xs text-[#9CA3AF]">Pending requests</p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#111827]">{metrics.maintenanceRequests}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#111827]">Housekeeping</p>
                  <p className="text-xs text-[#9CA3AF]">Rooms to clean</p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#111827]">{metrics.checkOutsToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="premium-card">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-[#111827]">Quick Actions</h3>
          <p className="text-sm text-[#6B7280]">Common hotel operations</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-[#6D5DFB] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">Check-in Guest</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-[#22C55E] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">Check-out Guest</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-orange-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">New Reservation</p>
            </button>
            
            <button className="p-4 border rounded-lg hover:bg-[#F8FAFC] text-center">
              <svg className="w-8 h-8 text-[#C084FC] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              <p className="text-sm font-medium text-[#111827]">Maintenance</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

