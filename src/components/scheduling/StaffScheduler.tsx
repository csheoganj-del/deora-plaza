"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  businessUnit: string;
  status: 'active' | 'inactive';
}

interface Shift {
  id: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  businessUnit: string;
  role: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

export function StaffScheduler() {
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddShift, setShowAddShift] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [newShift, setNewShift] = useState({
    staffId: '',
    date: selectedDate,
    startTime: '',
    endTime: '',
    businessUnit: '',
    role: '',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch real staff and scheduling data from API
        const [staffResponse, shiftsResponse] = await Promise.all([
          fetch('/api/staff'),
          fetch('/api/shifts')
        ]);

        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          setStaff(staffData.staff || []);
        } else {
          setStaff([]);
        }

        if (shiftsResponse.ok) {
          const shiftsData = await shiftsResponse.json();
          setShifts(shiftsData.shifts || []);
        } else {
          setShifts([]);
        }
      } catch (error) {
        console.error("Failed to fetch scheduling data:", error);
        // Set empty state for production
        setStaff([]);
        setShifts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: Shift['status']) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="default" className="bg-[#EDEBFF]/30 text-[#6D5DFB]">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-[#BBF7D0] text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="default" className="bg-[#FEE2E2] text-red-800">Cancelled</Badge>;
      case 'no-show':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">No Show</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: Shift['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-[#6D5DFB]" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-[#DCFCE7]0" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-[#FEE2E2]0" />;
      case 'no-show':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const filteredShifts = shifts.filter(shift => {
    const matchesDate = shift.date === selectedDate;
    const matchesBusinessUnit = selectedBusinessUnit === 'all' || shift.businessUnit === selectedBusinessUnit;
    const matchesSearch = searchTerm === '' || 
      staff.find(s => s.id === shift.staffId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesBusinessUnit && matchesSearch;
  });

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? staffMember.name : 'Unknown';
  };

  const getStaffRole = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? staffMember.role : 'Unknown';
  };

  const handleAddShift = () => {
    const shift: Shift = {
      id: Date.now().toString(),
      ...newShift,
      status: 'scheduled',
    };
    setShifts([...shifts, shift]);
    setNewShift({
      staffId: '',
      date: selectedDate,
      startTime: '',
      endTime: '',
      businessUnit: '',
      role: '',
      notes: '',
    });
    setShowAddShift(false);
  };

  const handleUpdateShift = () => {
    if (!editingShift) return;
    
    setShifts(shifts.map(shift => 
      shift.id === editingShift.id ? editingShift : shift
    ));
    setEditingShift(null);
  };

  const handleDeleteShift = (id: string) => {
    setShifts(shifts.filter(shift => shift.id !== id));
  };

  const handleStatusChange = (shiftId: string, newStatus: Shift['status']) => {
    setShifts(shifts.map(shift => 
      shift.id === shiftId ? { ...shift, status: newStatus } : shift
    ));
  };

  const businessUnits = ['cafe', 'restaurant', 'bar', 'hotel', 'marriage_garden'];
  const roles = ['Manager', 'Waiter', 'Bartender', 'Chef', 'Housekeeping', 'Event Coordinator', 'Receptionist'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Staff Scheduling</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div className="premium-card" key={i}>
              <div className="p-8 border-b border-[#E5E7EB]">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="p-8">
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-8">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Staff Scheduling</h2>
        <Button onClick={() => setShowAddShift(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Shift
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Total Staff</h2>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">
              {staff.filter(s => s.status === 'active').length} active
            </p>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Today's Shifts</h2>
            <Calendar className="h-4 w-4 text-[#6D5DFB]" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#6D5DFB]">
              {filteredShifts.length}
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Completed</h2>
            <CheckCircle className="h-4 w-4 text-[#DCFCE7]0" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-[#22C55E]">
              {shifts.filter(s => s.status === 'completed').length}
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Issues</h2>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold text-orange-600">
              {shifts.filter(s => s.status === 'no-show').length + shifts.filter(s => s.status === 'cancelled').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827]">Filters</h2>
        </div>
        <div className="p-8">
          <div className="flex gap-4 flex-wrap">
            <div className="min-w-[150px]">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="businessUnit">Business Unit</Label>
              <select
                id="businessUnit"
                value={selectedBusinessUnit}
                onChange={(e) => setSelectedBusinessUnit(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">All Units</option>
                {businessUnits.map(unit => (
                  <option key={unit} value={unit}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search Staff</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827]">Shift Schedule</h2>
        </div>
        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Staff</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Business Unit</th>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Notes</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShifts.map((shift) => (
                  <tr key={shift.id} className="border-b">
                    <td className="p-2 font-medium">{getStaffName(shift.staffId)}</td>
                    <td className="p-2">{shift.role}</td>
                    <td className="p-2">
                      {shift.businessUnit.charAt(0).toUpperCase() + shift.businessUnit.slice(1).replace('_', ' ')}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(shift.status)}
                        {getStatusBadge(shift.status)}
                      </div>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {shift.notes || '-'}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingShift(shift)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteShift(shift.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        {shift.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(shift.id, 'completed')}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Shift Modal */}
      {showAddShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="premium-card w-full max-w-md">
            <div className="p-8 border-b border-[#E5E7EB]">
              <h2 className="text-3xl font-bold text-[#111827]">Add New Shift</h2>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <Label htmlFor="staff">Staff Member</Label>
                <select
                  id="staff"
                  value={newShift.staffId}
                  onChange={(e) => setNewShift({...newShift, staffId: e.target.value})}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Select Staff</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift({...newShift, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({...newShift, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({...newShift, endTime: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="businessUnit">Business Unit</Label>
                <select
                  id="businessUnit"
                  value={newShift.businessUnit}
                  onChange={(e) => setNewShift({...newShift, businessUnit: e.target.value})}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Select Unit</option>
                  {businessUnits.map(unit => (
                    <option key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={newShift.role}
                  onChange={(e) => setNewShift({...newShift, role: e.target.value})}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Optional notes..."
                  value={newShift.notes}
                  onChange={(e) => setNewShift({...newShift, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddShift(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddShift}>
                  Add Shift
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {editingShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="premium-card w-full max-w-md">
            <div className="p-8 border-b border-[#E5E7EB]">
              <h2 className="text-3xl font-bold text-[#111827]">Edit Shift</h2>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={editingShift.status}
                  onChange={(e) => setEditingShift({...editingShift, status: e.target.value as Shift['status']})}
                  className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-startTime">Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={editingShift.startTime}
                  onChange={(e) => setEditingShift({...editingShift, startTime: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={editingShift.endTime}
                  onChange={(e) => setEditingShift({...editingShift, endTime: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Input
                  id="edit-notes"
                  placeholder="Optional notes..."
                  value={editingShift.notes || ''}
                  onChange={(e) => setEditingShift({...editingShift, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingShift(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateShift}>
                  Update Shift
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

