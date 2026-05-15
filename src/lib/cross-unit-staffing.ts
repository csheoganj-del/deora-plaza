// Cross-Unit Staff Scheduling System
export interface BusinessUnitType {
  CAFE: 'cafe';
  RESTAURANT: 'restaurant';
  BAR: 'bar';
  HOTEL: 'hotel';
  MARRIAGE_GARDEN: 'marriage_garden';
}

export interface StaffRole {
  WAITER: 'waiter';
  BARTENDER: 'bartender';
  CHEF: 'chef';
  COOK: 'cook';
  MANAGER: 'manager';
  RECEPTIONIST: 'receptionist';
  HOUSEKEEPING: 'housekeeping';
  MAINTENANCE: 'maintenance';
  SECURITY: 'security';
  EVENT_COORDINATOR: 'event_coordinator';
  SERVER: 'server';
  HOST: 'host';
  DISHWASHER: 'dishwasher';
  CLEANER: 'cleaner';
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: keyof StaffRole;
  primaryBusinessUnit: keyof BusinessUnitType;
  secondaryBusinessUnits: (keyof BusinessUnitType)[];
  skills: string[];
  certifications: string[];
  hourlyRate: number;
  maxHoursPerWeek: number;
  preferredShifts: ('morning' | 'afternoon' | 'evening' | 'night')[];
  availability: {
    monday: { available: boolean; startTime: string; endTime: string };
    tuesday: { available: boolean; startTime: string; endTime: string };
    wednesday: { available: boolean; startTime: string; endTime: string };
    thursday: { available: boolean; startTime: string; endTime: string };
    friday: { available: boolean; startTime: string; endTime: string };
    saturday: { available: boolean; startTime: string; endTime: string };
    sunday: { available: boolean; startTime: string; endTime: string };
  };
  isActive: boolean;
  hireDate: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  businessUnit: keyof BusinessUnitType;
  date: string;
  startTime: string;
  endTime: string;
  role: keyof StaffRole;
  requiredStaff: number;
  assignedStaff: string[]; // Staff member IDs
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  shiftId: string;
  businessUnit: keyof BusinessUnitType;
  role: keyof StaffRole;
  status: 'assigned' | 'confirmed' | 'completed' | 'absent' | 'late' | 'early_leave' | 'in_progress' | 'cancelled';
  clockInTime?: string;
  clockOutTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  breakTime?: number; // in minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeOffRequest {
  id: string;
  staffId: string;
  type: 'vacation' | 'sick' | 'personal' | 'emergency';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffPerformance {
  id: string;
  staffId: string;
  period: string; // YYYY-MM format
  businessUnit: keyof BusinessUnitType;
  metrics: {
    attendanceRate: number; // percentage
    punctualityRate: number; // percentage
    customerSatisfaction: number; // 1-5 rating
    productivityScore: number; // 1-5 rating
    teamCollaboration: number; // 1-5 rating
    complianceScore: number; // 1-5 rating
  };
  totalHours: number;
  overtimeHours: number;
  completedShifts: number;
  missedShifts: number;
  lateShifts: number;
  customerComplaints: number;
  commendations: number;
  notes?: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface StaffingRequirement {
  id: string;
  businessUnit: keyof BusinessUnitType;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night';
  role: keyof StaffRole;
  minimumStaff: number;
  optimalStaff: number;
  maximumStaff: number;
  peakHours: {
    start: string;
    end: string;
    requiredStaff: number;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffingStats {
  totalStaff: number;
  activeStaff: number;
  staffByBusinessUnit: Record<string, number>;
  staffByRole: Record<string, number>;
  totalShiftsToday: number;
  scheduledShiftsToday: number;
  inProgressShifts: number;
  completedShiftsToday: number;
  coverageRate: number;
  overtimeHours: number;
  pendingTimeOffRequests: number;
  staffOnLeave: number;
}

export class CrossUnitStaffingManager {
  private static instance: CrossUnitStaffingManager;
  private staff: StaffMember[] = [];
  private shifts: Shift[] = [];
  private assignments: StaffAssignment[] = [];
  private timeOffRequests: TimeOffRequest[] = [];
  private performance: StaffPerformance[] = [];
  private requirements: StaffingRequirement[] = [];

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): CrossUnitStaffingManager {
    if (!CrossUnitStaffingManager.instance) {
      CrossUnitStaffingManager.instance = new CrossUnitStaffingManager();
    }
    return CrossUnitStaffingManager.instance;
  }

  private initializeMockData() {
    // Mock staff members
    this.staff = [
      {
        id: 'staff_1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '+1234567890',
        role: 'WAITER',
        primaryBusinessUnit: 'RESTAURANT',
        secondaryBusinessUnits: ['CAFE', 'BAR'],
        skills: ['Customer Service', 'POS Operation', 'Wine Knowledge'],
        certifications: ['Food Handler Certificate', 'Alcohol Service'],
        hourlyRate: 15.00,
        maxHoursPerWeek: 40,
        preferredShifts: ['morning', 'afternoon'],
        availability: {
          monday: { available: true, startTime: '08:00', endTime: '22:00' },
          tuesday: { available: true, startTime: '08:00', endTime: '22:00' },
          wednesday: { available: true, startTime: '08:00', endTime: '22:00' },
          thursday: { available: true, startTime: '08:00', endTime: '22:00' },
          friday: { available: true, startTime: '08:00', endTime: '23:00' },
          saturday: { available: true, startTime: '10:00', endTime: '23:00' },
          sunday: { available: false, startTime: '', endTime: '' }
        },
        isActive: true,
        hireDate: '2023-01-15',
        emergencyContact: {
          name: 'Jane Smith',
          phone: '+1234567891',
          relationship: 'Spouse'
        },
        createdAt: '2023-01-15T00:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'staff_2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1234567892',
        role: 'BARTENDER',
        primaryBusinessUnit: 'BAR',
        secondaryBusinessUnits: ['RESTAURANT', 'HOTEL'],
        skills: ['Mixology', 'Customer Service', 'Inventory Management'],
        certifications: ['Bartending License', 'Food Handler Certificate'],
        hourlyRate: 18.00,
        maxHoursPerWeek: 35,
        preferredShifts: ['evening', 'night'],
        availability: {
          monday: { available: true, startTime: '16:00', endTime: '02:00' },
          tuesday: { available: true, startTime: '16:00', endTime: '02:00' },
          wednesday: { available: true, startTime: '16:00', endTime: '02:00' },
          thursday: { available: true, startTime: '16:00', endTime: '02:00' },
          friday: { available: true, startTime: '16:00', endTime: '03:00' },
          saturday: { available: true, startTime: '16:00', endTime: '03:00' },
          sunday: { available: false, startTime: '', endTime: '' }
        },
        isActive: true,
        hireDate: '2023-03-20',
        emergencyContact: {
          name: 'Mike Johnson',
          phone: '+1234567893',
          relationship: 'Brother'
        },
        createdAt: '2023-03-20T00:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'staff_3',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@email.com',
        phone: '+1234567894',
        role: 'HOUSEKEEPING',
        primaryBusinessUnit: 'HOTEL',
        secondaryBusinessUnits: ['MARRIAGE_GARDEN'],
        skills: ['Room Cleaning', 'Laundry Service', 'Attention to Detail'],
        certifications: ['Hospitality Cleaning Certificate'],
        hourlyRate: 14.00,
        maxHoursPerWeek: 40,
        preferredShifts: ['morning', 'afternoon'],
        availability: {
          monday: { available: true, startTime: '07:00', endTime: '15:00' },
          tuesday: { available: true, startTime: '07:00', endTime: '15:00' },
          wednesday: { available: true, startTime: '07:00', endTime: '15:00' },
          thursday: { available: true, startTime: '07:00', endTime: '15:00' },
          friday: { available: true, startTime: '07:00', endTime: '15:00' },
          saturday: { available: true, startTime: '08:00', endTime: '16:00' },
          sunday: { available: false, startTime: '', endTime: '' }
        },
        isActive: true,
        hireDate: '2022-11-10',
        emergencyContact: {
          name: 'Carlos Garcia',
          phone: '+1234567895',
          relationship: 'Husband'
        },
        createdAt: '2022-11-10T00:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];

    // Mock staffing requirements
    this.requirements = [
      {
        id: 'req_1',
        businessUnit: 'RESTAURANT',
        dayOfWeek: 1, // Monday
        shiftType: 'morning',
        role: 'WAITER',
        minimumStaff: 2,
        optimalStaff: 3,
        maximumStaff: 4,
        peakHours: [
          { start: '12:00', end: '14:00', requiredStaff: 4 }
        ],
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'req_2',
        businessUnit: 'BAR',
        dayOfWeek: 5, // Friday
        shiftType: 'evening',
        role: 'BARTENDER',
        minimumStaff: 1,
        optimalStaff: 2,
        maximumStaff: 3,
        peakHours: [
          { start: '20:00', end: '23:00', requiredStaff: 3 }
        ],
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];

    // Generate some sample shifts for today
    const today = new Date().toISOString().split('T')[0];
    this.shifts = [
      {
        id: 'shift_1',
        businessUnit: 'RESTAURANT',
        date: today,
        startTime: '08:00',
        endTime: '16:00',
        role: 'WAITER',
        requiredStaff: 2,
        assignedStaff: ['staff_1'],
        status: 'in_progress',
        priority: 'medium',
        createdBy: 'manager_1',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'shift_2',
        businessUnit: 'BAR',
        date: today,
        startTime: '18:00',
        endTime: '02:00',
        role: 'BARTENDER',
        requiredStaff: 1,
        assignedStaff: ['staff_2'],
        status: 'scheduled',
        priority: 'high',
        createdBy: 'manager_1',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Generate assignments
    this.assignments = [
      {
        id: 'assignment_1',
        staffId: 'staff_1',
        shiftId: 'shift_1',
        businessUnit: 'RESTAURANT',
        role: 'WAITER',
        status: 'in_progress',
        clockInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Generate time off requests
    this.timeOffRequests = [
      {
        id: 'timeoff_1',
        staffId: 'staff_3',
        type: 'vacation',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: 'Family vacation',
        status: 'pending',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  // Staff Management
  public getStaff(filter?: {
    businessUnit?: keyof BusinessUnitType;
    role?: keyof StaffRole;
    activeOnly?: boolean;
    available?: string; // date string
  }): StaffMember[] {
    let filteredStaff = this.staff;

    if (filter?.businessUnit) {
      filteredStaff = filteredStaff.filter(member => 
        member.primaryBusinessUnit === filter.businessUnit ||
        member.secondaryBusinessUnits.includes(filter.businessUnit!)
      );
    }
    if (filter?.role) {
      filteredStaff = filteredStaff.filter(member => member.role === filter.role);
    }
    if (filter?.activeOnly) {
      filteredStaff = filteredStaff.filter(member => member.isActive);
    }
    if (filter?.available) {
      const targetDate = new Date(filter.available);
      const dayOfWeek = targetDate.getDay();
      filteredStaff = filteredStaff.filter(member => {
        const dayAvailability = member.availability[
          ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek] as keyof typeof member.availability
        ];
        return dayAvailability.available;
      });
    }

    return filteredStaff;
  }

  public getStaffById(id: string): StaffMember | null {
    return this.staff.find(member => member.id === id) || null;
  }

  public createStaff(staffData: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): StaffMember {
    const staff: StaffMember = {
      ...staffData,
      id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.staff.push(staff);
    return staff;
  }

  public updateStaff(id: string, updates: Partial<StaffMember>): boolean {
    const staff = this.getStaffById(id);
    if (staff) {
      Object.assign(staff, updates);
      staff.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // Shift Management
  public createShift(shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Shift {
    const shift: Shift = {
      ...shiftData,
      id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.shifts.push(shift);
    return shift;
  }

  public getShifts(filter?: {
    businessUnit?: keyof BusinessUnitType;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    role?: keyof StaffRole;
    status?: string;
  }): Shift[] {
    let filteredShifts = this.shifts;

    if (filter?.businessUnit) {
      filteredShifts = filteredShifts.filter(shift => shift.businessUnit === filter.businessUnit);
    }
    if (filter?.date) {
      filteredShifts = filteredShifts.filter(shift => shift.date === filter.date);
    }
    if (filter?.dateFrom) {
      filteredShifts = filteredShifts.filter(shift => shift.date >= filter.dateFrom!);
    }
    if (filter?.dateTo) {
      filteredShifts = filteredShifts.filter(shift => shift.date <= filter.dateTo!);
    }
    if (filter?.role) {
      filteredShifts = filteredShifts.filter(shift => shift.role === filter.role);
    }
    if (filter?.status) {
      filteredShifts = filteredShifts.filter(shift => shift.status === filter.status);
    }

    return filteredShifts.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  public assignStaffToShift(shiftId: string, staffId: string): boolean {
    const shift = this.shifts.find(s => s.id === shiftId);
    const staff = this.getStaffById(staffId);

    if (!shift || !staff) return false;
    if (shift.assignedStaff.length >= shift.requiredStaff) return false;
    if (shift.assignedStaff.includes(staffId)) return false;

    // Check if staff is available
    if (!this.isStaffAvailable(staffId, shift.date, shift.startTime, shift.endTime)) {
      return false;
    }

    shift.assignedStaff.push(staffId);
    shift.updatedAt = new Date().toISOString();

    // Create assignment
    const assignment: StaffAssignment = {
      id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      staffId,
      shiftId,
      businessUnit: shift.businessUnit,
      role: shift.role,
      status: 'assigned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.assignments.push(assignment);
    return true;
  }

  public removeStaffFromShift(shiftId: string, staffId: string): boolean {
    const shift = this.shifts.find(s => s.id === shiftId);
    if (!shift) return false;

    const index = shift.assignedStaff.indexOf(staffId);
    if (index === -1) return false;

    shift.assignedStaff.splice(index, 1);
    shift.updatedAt = new Date().toISOString();

    // Update assignment
    const assignment = this.assignments.find(a => a.shiftId === shiftId && a.staffId === staffId);
    if (assignment) {
      assignment.status = 'cancelled';
      assignment.updatedAt = new Date().toISOString();
    }

    return true;
  }

  private isStaffAvailable(staffId: string, date: string, startTime: string, endTime: string): boolean {
    const staff = this.getStaffById(staffId);
    if (!staff) return false;

    // Check weekly availability
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    const dayAvailability = staff.availability[
      ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek] as keyof typeof staff.availability
    ];

    if (!dayAvailability.available) return false;

    // Check time availability
    const shiftStart = this.timeToMinutes(startTime);
    const shiftEnd = this.timeToMinutes(endTime);
    const availableStart = this.timeToMinutes(dayAvailability.startTime);
    const availableEnd = this.timeToMinutes(dayAvailability.endTime);

    if (shiftStart < availableStart || shiftEnd > availableEnd) return false;

    // Check for conflicts with existing shifts
    const conflictingShifts = this.getShifts({ date }).filter(shift => 
      shift.assignedStaff.includes(staffId) &&
      this.timeRangesOverlap(startTime, endTime, shift.startTime, shift.endTime)
    );

    return conflictingShifts.length === 0;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);

    return s1 < e2 && s2 < e1;
  }

  // Time Off Management
  public createTimeOffRequest(requestData: Omit<TimeOffRequest, 'id' | 'createdAt' | 'updatedAt'>): TimeOffRequest {
    const request: TimeOffRequest = {
      ...requestData,
      id: `timeoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.timeOffRequests.push(request);
    return request;
  }

  public getTimeOffRequests(filter?: {
    staffId?: string;
    status?: string;
    businessUnit?: keyof BusinessUnitType;
  }): TimeOffRequest[] {
    let filteredRequests = this.timeOffRequests;

    if (filter?.staffId) {
      filteredRequests = filteredRequests.filter(request => request.staffId === filter.staffId);
    }
    if (filter?.status) {
      filteredRequests = filteredRequests.filter(request => request.status === filter.status);
    }
    if (filter?.businessUnit) {
      const staffIds = this.getStaff({ businessUnit: filter.businessUnit }).map(s => s.id);
      filteredRequests = filteredRequests.filter(request => staffIds.includes(request.staffId));
    }

    return filteredRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public approveTimeOffRequest(requestId: string, approvedBy: string): boolean {
    const request = this.timeOffRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return false;

    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.approvedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();

    return true;
  }

  public rejectTimeOffRequest(requestId: string, rejectionReason: string, approvedBy: string): boolean {
    const request = this.timeOffRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return false;

    request.status = 'rejected';
    request.approvedBy = approvedBy;
    request.rejectionReason = rejectionReason;
    request.updatedAt = new Date().toISOString();

    return true;
  }

  // Staff Assignment Management
  public getAssignments(filter?: {
    staffId?: string;
    shiftId?: string;
    businessUnit?: keyof BusinessUnitType;
    date?: string;
    status?: string;
  }): StaffAssignment[] {
    let filteredAssignments = this.assignments;

    if (filter?.staffId) {
      filteredAssignments = filteredAssignments.filter(assignment => assignment.staffId === filter.staffId);
    }
    if (filter?.shiftId) {
      filteredAssignments = filteredAssignments.filter(assignment => assignment.shiftId === filter.shiftId);
    }
    if (filter?.businessUnit) {
      filteredAssignments = filteredAssignments.filter(assignment => assignment.businessUnit === filter.businessUnit);
    }
    if (filter?.date) {
      const shiftIds = this.getShifts({ date: filter.date }).map(s => s.id);
      filteredAssignments = filteredAssignments.filter(assignment => shiftIds.includes(assignment.shiftId));
    }
    if (filter?.status) {
      filteredAssignments = filteredAssignments.filter(assignment => assignment.status === filter.status);
    }

    return filteredAssignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public clockIn(staffId: string, shiftId: string): boolean {
    const assignment = this.assignments.find(a => a.staffId === staffId && a.shiftId === shiftId);
    if (!assignment || assignment.status !== 'assigned') return false;

    assignment.status = 'in_progress';
    assignment.clockInTime = new Date().toISOString();
    assignment.actualStartTime = new Date().toISOString();
    assignment.updatedAt = new Date().toISOString();

    // Update shift status if this is the first person
    const shift = this.shifts.find(s => s.id === shiftId);
    if (shift && shift.status === 'scheduled') {
      shift.status = 'in_progress';
      shift.updatedAt = new Date().toISOString();
    }

    return true;
  }

  public clockOut(staffId: string, shiftId: string): boolean {
    const assignment = this.assignments.find(a => a.staffId === staffId && a.shiftId === shiftId);
    if (!assignment || assignment.status !== 'in_progress') return false;

    assignment.status = 'completed';
    assignment.clockOutTime = new Date().toISOString();
    assignment.actualEndTime = new Date().toISOString();
    assignment.updatedAt = new Date().toISOString();

    // Check if all staff have completed the shift
    const shift = this.shifts.find(s => s.id === shiftId);
    if (shift) {
      const allCompleted = this.assignments
        .filter(a => a.shiftId === shiftId)
        .every(a => a.status === 'completed');

      if (allCompleted) {
        shift.status = 'completed';
        shift.updatedAt = new Date().toISOString();
      }
    }

    return true;
  }

  // Staffing Requirements Management
  public getStaffingRequirements(filter?: {
    businessUnit?: keyof BusinessUnitType;
    dayOfWeek?: number;
    shiftType?: string;
    role?: keyof StaffRole;
  }): StaffingRequirement[] {
    let filteredRequirements = this.requirements;

    if (filter?.businessUnit) {
      filteredRequirements = filteredRequirements.filter(req => req.businessUnit === filter.businessUnit);
    }
    if (filter?.dayOfWeek !== undefined) {
      filteredRequirements = filteredRequirements.filter(req => req.dayOfWeek === filter.dayOfWeek);
    }
    if (filter?.shiftType) {
      filteredRequirements = filteredRequirements.filter(req => req.shiftType === filter.shiftType);
    }
    if (filter?.role) {
      filteredRequirements = filteredRequirements.filter(req => req.role === filter.role);
    }

    return filteredRequirements;
  }

  public createStaffingRequirement(requirementData: Omit<StaffingRequirement, 'id' | 'createdAt' | 'updatedAt'>): StaffingRequirement {
    const requirement: StaffingRequirement = {
      ...requirementData,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.requirements.push(requirement);
    return requirement;
  }

  // Analytics and Reporting
  public getStaffingStats(date?: string): StaffingStats {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const todayShifts = this.getShifts({ date: targetDate });
    
    const totalStaff = this.staff.length;
    const activeStaff = this.staff.filter(s => s.isActive).length;
    
    const staffByBusinessUnit: Record<string, number> = {};
    const staffByRole: Record<string, number> = {};

    this.staff.forEach(member => {
      // Primary business unit
      staffByBusinessUnit[member.primaryBusinessUnit] = (staffByBusinessUnit[member.primaryBusinessUnit] || 0) + 1;
      
      // Role
      staffByRole[member.role] = (staffByRole[member.role] || 0) + 1;
      
      // Secondary business units
      member.secondaryBusinessUnits.forEach(bu => {
        staffByBusinessUnit[bu] = (staffByBusinessUnit[bu] || 0) + 1;
      });
    });

    const scheduledShiftsToday = todayShifts.filter(s => s.status === 'scheduled').length;
    const inProgressShifts = todayShifts.filter(s => s.status === 'in_progress').length;
    const completedShiftsToday = todayShifts.filter(s => s.status === 'completed').length;

    const totalRequiredStaff = todayShifts.reduce((sum, shift) => sum + shift.requiredStaff, 0);
    const totalAssignedStaff = todayShifts.reduce((sum, shift) => sum + shift.assignedStaff.length, 0);
    const coverageRate = totalRequiredStaff > 0 ? (totalAssignedStaff / totalRequiredStaff) * 100 : 0;

    const pendingTimeOffRequests = this.timeOffRequests.filter(r => r.status === 'pending').length;
    const staffOnLeave = this.timeOffRequests
      .filter(r => r.status === 'approved' && new Date(r.startDate) <= new Date(targetDate) && new Date(r.endDate) >= new Date(targetDate))
      .length;

    return {
      totalStaff,
      activeStaff,
      staffByBusinessUnit,
      staffByRole,
      totalShiftsToday: todayShifts.length,
      scheduledShiftsToday,
      inProgressShifts,
      completedShiftsToday,
      coverageRate,
      overtimeHours: 0, // Would need to calculate from actual vs scheduled hours
      pendingTimeOffRequests,
      staffOnLeave
    };
  }

  public getStaffAvailability(date: string, businessUnit?: keyof BusinessUnitType): StaffMember[] {
    return this.getStaff({ 
      businessUnit, 
      activeOnly: true, 
      available: date 
    }).filter(staff => {
      // Check if not on time off
      const timeOffConflicts = this.timeOffRequests
        .filter(r => r.status === 'approved')
        .filter(r => staff.id === r.staffId)
        .filter(r => new Date(r.startDate) <= new Date(date) && new Date(r.endDate) >= new Date(date));

      return timeOffConflicts.length === 0;
    });
  }

  public getOptimalStaffing(date: string, businessUnit: keyof BusinessUnitType): {
    role: keyof StaffRole;
    required: number;
    available: number;
    gap: number;
  }[] {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    
    const requirements = this.getStaffingRequirements({ businessUnit, dayOfWeek });
    const availableStaff = this.getStaffAvailability(date, businessUnit);

    return requirements.map(req => {
      const availableForRole = availableStaff.filter(staff => 
        staff.role === req.role || staff.secondaryBusinessUnits.includes(businessUnit)
      ).length;

      return {
        role: req.role,
        required: req.optimalStaff,
        available: availableForRole,
        gap: Math.max(0, req.optimalStaff - availableForRole)
      };
    });
  }
}

// Export singleton instance
export const crossUnitStaffingManager = CrossUnitStaffingManager.getInstance();

