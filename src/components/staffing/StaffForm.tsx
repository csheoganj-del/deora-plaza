"use client";

import { useState, useEffect } from "react";
import { crossUnitStaffingManager, StaffMember, StaffRole, BusinessUnitType as StaffingBusinessUnitType } from "@/lib/cross-unit-staffing";

interface StaffFormProps {
  staff?: StaffMember;
  onSuccess?: (staff: StaffMember) => void;
  onCancel?: () => void;
}

export function StaffForm({ staff, onSuccess, onCancel }: StaffFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'WAITER' as keyof StaffRole,
    primaryBusinessUnit: 'CAFE' as keyof StaffingBusinessUnitType,
    secondaryBusinessUnits: [] as string[],
    skills: '',
    certifications: '',
    hourlyRate: 0,
    maxHoursPerWeek: 40,
    preferredShifts: [] as string[],
    availability: {
      monday: { available: true, startTime: '09:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
      thursday: { available: true, startTime: '09:00', endTime: '17:00' },
      friday: { available: true, startTime: '09:00', endTime: '17:00' },
      saturday: { available: false, startTime: '09:00', endTime: '17:00' },
      sunday: { available: false, startTime: '09:00', endTime: '17:00' }
    },
    isActive: true,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    notes: ''
  });

  const roles = [
    { value: 'WAITER', label: 'Waiter' },
    { value: 'BARTENDER', label: 'Bartender' },
    { value: 'CHEF', label: 'Chef' },
    { value: 'COOK', label: 'Cook' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'RECEPTIONIST', label: 'Receptionist' },
    { value: 'HOUSEKEEPING', label: 'Housekeeping' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'SECURITY', label: 'Security' },
    { value: 'EVENT_COORDINATOR', label: 'Event Coordinator' },
    { value: 'SERVER', label: 'Server' },
    { value: 'HOST', label: 'Host' },
    { value: 'DISHWASHER', label: 'Dishwasher' },
    { value: 'CLEANER', label: 'Cleaner' }
  ];

  const businessUnits = [
    { value: 'CAFE' as keyof StaffingBusinessUnitType, label: 'Cafe' },
    { value: 'RESTAURANT' as keyof StaffingBusinessUnitType, label: 'Restaurant' },
    { value: 'BAR' as keyof StaffingBusinessUnitType, label: 'Bar' },
    { value: 'HOTEL' as keyof StaffingBusinessUnitType, label: 'Hotel' },
    { value: 'MARRIAGE_GARDEN' as keyof StaffingBusinessUnitType, label: 'Marriage Garden' }
  ];

  const shiftTypes = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
    { value: 'night', label: 'Night' }
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    if (staff) {
      setFormData({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        primaryBusinessUnit: staff.primaryBusinessUnit as keyof StaffingBusinessUnitType,
        secondaryBusinessUnits: staff.secondaryBusinessUnits,
        skills: staff.skills.join(', '),
        certifications: staff.certifications.join(', '),
        hourlyRate: staff.hourlyRate,
        maxHoursPerWeek: staff.maxHoursPerWeek,
        preferredShifts: staff.preferredShifts,
        availability: staff.availability,
        isActive: staff.isActive,
        emergencyContact: staff.emergencyContact,
        notes: staff.notes || ''
      });
    }
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const staffData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        primaryBusinessUnit: formData.primaryBusinessUnit,
        secondaryBusinessUnits: formData.secondaryBusinessUnits as any[],
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        certifications: formData.certifications.split(',').map(cert => cert.trim()).filter(cert => cert),
        hourlyRate: formData.hourlyRate,
        maxHoursPerWeek: formData.maxHoursPerWeek,
        preferredShifts: formData.preferredShifts as any[],
        availability: formData.availability,
        isActive: formData.isActive,
        emergencyContact: formData.emergencyContact,
        notes: formData.notes || '',
        hireDate: staff?.hireDate || new Date().toISOString().split('T')[0]
      };

      let result: StaffMember;
      if (staff) {
        // Update existing staff
        const success = crossUnitStaffingManager.updateStaff(staff.id, staffData);
        if (!success) {
          throw new Error('Failed to update staff member');
        }
        result = crossUnitStaffingManager.getStaffById(staff.id)!;
      } else {
        // Create new staff
        result = crossUnitStaffingManager.createStaff(staffData);
      }

      onSuccess?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessUnitToggle = (businessUnit: string) => {
    setFormData(prev => ({
      ...prev,
      secondaryBusinessUnits: prev.secondaryBusinessUnits.includes(businessUnit)
        ? prev.secondaryBusinessUnits.filter(bu => bu !== businessUnit && bu !== prev.primaryBusinessUnit)
        : [...prev.secondaryBusinessUnits.filter(bu => bu !== prev.primaryBusinessUnit), businessUnit]
    }));
  };

  const handlePreferredShiftToggle = (shift: string) => {
    setFormData(prev => ({
      ...prev,
      preferredShifts: prev.preferredShifts.includes(shift)
        ? prev.preferredShifts.filter(s => s !== shift)
        : [...prev.preferredShifts, shift]
    }));
  };

  const handleAvailabilityChange = (day: string, field: 'available' | 'startTime' | 'endTime', value: any) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-[#111827] mb-6">
        {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-[#FEE2E2] border border-red-200 rounded-md">
          <p className="text-[#DC2626] text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as keyof StaffRole})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              required
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Primary Business Unit *
            </label>
            <select
              value={formData.primaryBusinessUnit}
              onChange={(e) => setFormData({...formData, primaryBusinessUnit: e.target.value as keyof StaffingBusinessUnitType})}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              required
            >
              {businessUnits.map(bu => (
                <option key={bu.value} value={bu.value}>{bu.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Skills and Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Skills
            </label>
            <textarea
              value={formData.skills}
              onChange={(e) => setFormData({...formData, skills: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              placeholder="Comma-separated skills"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Certifications
            </label>
            <textarea
              value={formData.certifications}
              onChange={(e) => setFormData({...formData, certifications: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
              placeholder="Comma-separated certifications"
            />
          </div>
        </div>

        {/* Employment Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-[#111827] mb-4">Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Hourly Rate ($/hour) *
              </label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({...formData, hourlyRate: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Max Hours Per Week *
              </label>
              <input
                type="number"
                value={formData.maxHoursPerWeek}
                onChange={(e) => setFormData({...formData, maxHoursPerWeek: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                min="0"
                max="60"
                required
              />
            </div>
          </div>
        </div>

        {/* Business Units */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-[#111827] mb-4">Business Units</h3>
          <div className="space-y-2">
            <p className="text-sm text-[#6B7280]">Select additional business units where this staff can work:</p>
            {businessUnits.map(bu => (
              <label key={bu.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.secondaryBusinessUnits.includes(bu.value) || bu.value === formData.primaryBusinessUnit}
                  onChange={() => handleBusinessUnitToggle(bu.value)}
                  disabled={bu.value === formData.primaryBusinessUnit}
                  className="mr-2"
                />
                <span className="text-sm text-[#111827]">
                  {bu.label}
                  {bu.value === formData.primaryBusinessUnit && ' (Primary)'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Preferred Shifts */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-[#111827] mb-4">Preferred Shifts</h3>
          <div className="space-y-2">
            {shiftTypes.map(shift => (
              <label key={shift.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.preferredShifts.includes(shift.value)}
                  onChange={() => handlePreferredShiftToggle(shift.value)}
                  className="mr-2"
                />
                <span className="text-sm text-[#111827]">{shift.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-[#111827] mb-4">Weekly Availability</h3>
          <div className="space-y-3">
            {daysOfWeek.map(day => {
              const dayAvailability = formData.availability[day.key as keyof typeof formData.availability];
              return (
                <div key={day.key} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="flex items-center w-24">
                    <input
                      type="checkbox"
                      checked={dayAvailability.available}
                      onChange={(e) => handleAvailabilityChange(day.key, 'available', e.target.checked)}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-[#111827]">{day.label}</label>
                  </div>
                  
                  {dayAvailability.available && (
                    <>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-[#6B7280]">From:</label>
                        <input
                          type="time"
                          value={dayAvailability.startTime}
                          onChange={(e) => handleAvailabilityChange(day.key, 'startTime', e.target.value)}
                          className="px-2 py-1 border border-[#9CA3AF] rounded text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-[#6B7280]">To:</label>
                        <input
                          type="time"
                          value={dayAvailability.endTime}
                          onChange={(e) => handleAvailabilityChange(day.key, 'endTime', e.target.value)}
                          className="px-2 py-1 border border-[#9CA3AF] rounded text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-[#111827] mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => setFormData({
                  ...formData,
                  emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                })}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                })}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Relationship *
              </label>
              <input
                type="text"
                value={formData.emergencyContact.relationship}
                onChange={(e) => setFormData({
                  ...formData,
                  emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                })}
                className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
                required
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t pt-6">
          <label className="block text-sm font-medium text-[#111827] mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
            placeholder="Additional notes about this staff member"
          />
        </div>

        {/* Status */}
        <div className="border-t pt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="mr-2"
            />
            <span className="text-sm text-[#111827]">Staff member is active</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-[#111827] bg-[#E5E7EB] rounded-md hover:bg-[#9CA3AF] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#6D5DFB] text-white rounded-md hover:bg-[#6D5DFB]/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (staff ? 'Update Staff' : 'Add Staff')}
          </button>
        </div>
      </form>
    </div>
  );
}

