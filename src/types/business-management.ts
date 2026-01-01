// Core types for business management system

export interface Employee {
  id: string;
  employeeId: string; // EMP-001, EMP-002, etc.
  name: string;
  mobile: string;
  email?: string;
  department: 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'garden' | 'kitchen' | 'admin';
  position: string;
  salary: number;
  joinDate: string;
  status: 'active' | 'inactive';
  address?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // ISO timestamp
  clockOut?: string; // ISO timestamp
  breakStart?: string;
  breakEnd?: string;
  totalHours?: number;
  overtimeHours?: number;
  status: 'present' | 'absent' | 'half-day' | 'late';
  notes?: string;
  createdAt: string;
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  overtimePay: number;
  bonuses: number;
  deductions: number;
  advanceDeducted: number;
  netSalary: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidDate?: string;
  createdAt: string;
}

export interface AdvanceRequest {
  id: string;
  employeeId: string;
  amount: number;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  approvedDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: 'food_supplies' | 'utilities' | 'rent' | 'maintenance' | 'marketing' | 'staff' | 'other';
  description: string;
  amount: number;
  date: string;
  businessUnit: 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'garden' | 'general';
  receipt?: string; // file path
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'food' | 'beverage' | 'supplies' | 'cleaning' | 'other';
  unit: 'kg' | 'liter' | 'piece' | 'packet' | 'bottle';
  currentStock: number;
  minStock: number; // reorder point
  maxStock: number;
  unitCost: number;
  supplier?: string;
  lastRestocked?: string;
  businessUnit: 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'garden' | 'all';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

// Dashboard summary types
export interface StaffSummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onBreak: number;
}

export interface AttendanceSummary {
  date: string;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  averageHours: number;
}

export interface SalarySummary {
  month: string;
  totalPayroll: number;
  pendingPayments: number;
  advancesPaid: number;
  totalDeductions: number;
}

export interface ExpenseSummary {
  month: string;
  totalExpenses: number;
  byCategory: Record<string, number>;
  pendingApprovals: number;
}

export interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}