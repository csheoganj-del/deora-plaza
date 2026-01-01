"use client";

import { useState, useEffect } from "react";
;
import { crossUnitStaffingManager, StaffMember, Shift, StaffAssignment, TimeOffRequest, BusinessUnitType as StaffingBusinessUnitType } from "@/lib/cross-unit-staffing";


export function StaffingDashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<keyof StaffingBusinessUnitType | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    totalShiftsToday: 0,
    scheduledShiftsToday: 0,
    inProgressShifts: 0,
    completedShiftsToday: 0,
    coverageRate: 0,
    pendingTimeOffRequests: 0,
    staffOnLeave: 0
  });
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [pendingTimeOffRequests, setPendingTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [staffOnLeave, setStaffOnLeave] = useState<StaffMember[]>([]);
  const [optimalStaffing, setOptimalStaffing] = useState<{
    role: string;
    required: number;
    available: number;
    gap: number;
  }[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedBusinessUnit, selectedDate]);

  const loadDashboardData = () => {
    setLoading(true);
    
    // Get stats
    const staffingStats = crossUnitStaffingManager.getStaffingStats(selectedDate);
    setStats(staffingStats);
    
    // Get today's shifts
    const shifts = crossUnitStaffingManager.getShifts({ 
      date: selectedDate,
      businessUnit: selectedBusinessUnit === 'all' ? undefined : selectedBusinessUnit as keyof StaffingBusinessUnitType
    });
    setTodayShifts(shifts);
    
    // Get pending time off requests
    const timeOffRequests = crossUnitStaffingManager.getTimeOffRequests({ 
      status: 'pending',
      businessUnit: selectedBusinessUnit === 'all' ? undefined : selectedBusinessUnit as keyof StaffingBusinessUnitType
    });
    setPendingTimeOffRequests(timeOffRequests.slice(0, 5));
    
    // Get staff on leave
    const staffOnLeaveList = crossUnitStaffingManager.getStaffAvailability(selectedDate)
      .filter(staff => {
        const requests = crossUnitStaffingManager.getTimeOffRequests({ 
          staffId: staff.id, 
          status: 'approved' 
        });
        return requests.some(req => 
          new Date(req.startDate) <= new Date(selectedDate) && 
          new Date(req.endDate) >= new Date(selectedDate)
        );
      });
    setStaffOnLeave(staffOnLeaveList.slice(0, 5));
    
    // Get optimal staffing
    if (selectedBusinessUnit !== 'all') {
      const optimal = crossUnitStaffingManager.getOptimalStaffing(selectedDate, selectedBusinessUnit as keyof StaffingBusinessUnitType);
      setOptimalStaffing(optimal);
    } else {
      setOptimalStaffing([]);
    }
    
    setLoading(false);
  };

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-[#22C55E] bg-[#BBF7D0]';
      case 'in_progress': return 'text-[#6D5DFB] bg-[#EDEBFF]/30';
      case 'scheduled': return 'text-[#F59E0B] bg-[#F59E0B]/10';
      case 'cancelled': return 'text-[#EF4444] bg-[#FEE2E2]';
      default: return 'text-[#6B7280] bg-[#F1F5F9]';
    }
  };

  const getRoleLabel = (role: string) => {
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getBusinessUnitLabel = (bu: string) => {
    return bu.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
        <p className="text-center text-[#6B7280]">Loading staffing data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Cross-Unit Staffing Dashboard</h1>
          <p className="text-[#6B7280]">Staff management across all business units</p>
        </div>
        
        <div className="flex space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
          />
          
          <select
            value={selectedBusinessUnit}
            onChange={(e) => setSelectedBusinessUnit(e.target.value as keyof StaffingBusinessUnitType | 'all')}
            className="px-4 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
          >
            <option value="all">All Business Units</option>
            <option value={'CAFE' as keyof StaffingBusinessUnitType}>Cafe</option>
            <option value={'RESTAURANT' as keyof StaffingBusinessUnitType}>Restaurant</option>
            <option value={'BAR' as keyof StaffingBusinessUnitType}>Bar</option>
            <option value={'HOTEL' as keyof StaffingBusinessUnitType}>Hotel</option>
            <option value={'MARRIAGE_GARDEN' as keyof StaffingBusinessUnitType}>Marriage Garden</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Total Staff</p>
              <p className="text-2xl font-bold text-[#111827]">{stats.totalStaff}</p>
              <p className="text-xs text-[#9CA3AF]">{stats.activeStaff} active</p>
            </div>
            <div className="p-3 bg-[#EDEBFF]/30 rounded-lg">
              <svg className="w-6 h-6 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Today's Shifts</p>
              <p className="text-2xl font-bold text-[#111827]">{stats.totalShiftsToday}</p>
              <p className="text-xs text-[#9CA3AF]">{stats.inProgressShifts} in progress</p>
            </div>
            <div className="p-3 bg-[#BBF7D0] rounded-lg">
              <svg className="w-6 h-6 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Coverage Rate</p>
              <p className="text-2xl font-bold text-[#6D5DFB]">{stats.coverageRate.toFixed(1)}%</p>
              <p className="text-xs text-[#9CA3AF]">Staffing coverage</p>
            </div>
            <div className="p-3 bg-[#EDEBFF]/30 rounded-lg">
              <svg className="w-6 h-6 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Staff on Leave</p>
              <p className="text-2xl font-bold text-orange-600">{stats.staffOnLeave}</p>
              <p className="text-xs text-[#9CA3AF]">{stats.pendingTimeOffRequests} pending requests</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Shifts */}
      <div className="premium-card">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-[#111827]">Today's Shifts</h3>
          <p className="text-sm text-[#6B7280]">Scheduled shifts for {selectedDate}</p>
        </div>
        <div className="overflow-x-auto">
          {todayShifts.length === 0 ? (
            <div className="p-6 text-center text-[#9CA3AF]">
              No shifts scheduled for this date
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Business Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {todayShifts.map((shift) => {
                  const assignedStaff = shift.assignedStaff.map(staffId => 
                    crossUnitStaffingManager.getStaffById(staffId)
                  ).filter(Boolean) as StaffMember[];
                  
                  return (
                    <tr key={shift.id}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-[#111827]">
                            {shift.startTime} - {shift.endTime}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">
                            {shift.requiredStaff - assignedStaff.length} positions open
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#111827]">
                          {getBusinessUnitLabel(shift.businessUnit)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#111827]">
                          {getRoleLabel(shift.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {assignedStaff.map((staff) => (
                            <p key={staff.id} className="text-sm text-[#111827]">
                              {staff.firstName} {staff.lastName}
                            </p>
                          ))}
                          {assignedStaff.length === 0 && (
                            <p className="text-sm text-[#9CA3AF]">No staff assigned</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getShiftStatusColor(shift.status)}`}>
                          {shift.status.replace('_', ' ').toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          {shift.status === 'scheduled' && (
                            <button className="text-[#6D5DFB] hover:text-[#6D5DFB]/90 text-sm">
                              Start Shift
                            </button>
                          )}
                          {shift.status === 'in_progress' && (
                            <button className="text-[#22C55E] hover:text-[#16A34A] text-sm">
                              Complete Shift
                            </button>
                          )}
                          <button className="text-[#6B7280] hover:text-[#111827] text-sm">
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Time Off Requests */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Pending Time Off Requests</h3>
            <p className="text-sm text-[#6B7280]">Staff leave requests awaiting approval</p>
          </div>
          <div className="p-4 space-y-3">
            {pendingTimeOffRequests.length === 0 ? (
              <div className="text-center text-[#9CA3AF] py-4">
                No pending requests
              </div>
            ) : (
              pendingTimeOffRequests.map((request) => {
                const staff = crossUnitStaffingManager.getStaffById(request.staffId);
                return (
                  <div key={request.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="text-sm font-medium text-[#111827]">
                        {staff?.firstName} {staff?.lastName}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {request.type} • {request.startDate} to {request.endDate}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        {request.reason}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-[#22C55E] hover:text-[#16A34A] text-sm">
                        Approve
                      </button>
                      <button className="text-[#EF4444] hover:text-[#DC2626] text-sm">
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Staff on Leave */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Staff on Leave</h3>
            <p className="text-sm text-[#6B7280]">Currently away from work</p>
          </div>
          <div className="p-4 space-y-3">
            {staffOnLeave.length === 0 ? (
              <div className="text-center text-[#9CA3AF] py-4">
                No staff on leave today
              </div>
            ) : (
              staffOnLeave.map((staff) => {
                const timeOffRequest = crossUnitStaffingManager.getTimeOffRequests({ 
                  staffId: staff.id, 
                  status: 'approved' 
                }).find(req => 
                  new Date(req.startDate) <= new Date(selectedDate) && 
                  new Date(req.endDate) >= new Date(selectedDate)
                );
                
                return (
                  <div key={staff.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="text-sm font-medium text-[#111827]">
                        {staff.firstName} {staff.lastName}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {staff.role} • {staff.primaryBusinessUnit}
                      </p>
                      {timeOffRequest && (
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          {timeOffRequest.type} until {timeOffRequest.endDate}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-[#9CA3AF]">
                      {timeOffRequest?.reason}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Optimal Staffing */}
      {selectedBusinessUnit !== 'all' && optimalStaffing.length > 0 && (
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Staffing Analysis</h3>
            <p className="text-sm text-[#6B7280]">Optimal staffing requirements for {getBusinessUnitLabel(selectedBusinessUnit)}</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {optimalStaffing.map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#111827]">
                      {getRoleLabel(item.role)}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-[#9CA3AF]">
                        Required: <span className="font-medium text-[#111827]">{item.required}</span>
                      </span>
                      <span className="text-xs text-[#9CA3AF]">
                        Available: <span className="font-medium text-[#111827]">{item.available}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-[#E5E7EB] rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.gap === 0 ? 'bg-[#DCFCE7]0' : 
                          item.gap <= 2 ? 'bg-[#F59E0B]/100' : 'bg-[#FEE2E2]0'
                        }`}
                        style={{ width: `${Math.min(100, (item.available / item.required) * 100)}%` }}
                      ></div>
                    </div>
                    {item.gap > 0 && (
                      <span className="text-xs text-[#EF4444] font-medium">
                        -{item.gap}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

