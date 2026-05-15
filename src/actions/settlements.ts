"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { createDocument, queryDocuments, updateDocument } from "@/lib/supabase/database";
import { requireFinancialAccess } from "@/lib/auth-helpers";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/**
 * Complete Settlement System for DEORA Plaza
 * Handles daily, weekly, monthly, and inter-departmental settlements
 */

export interface SettlementSummary {
  businessUnit: string;
  date: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  paymentMethods: {
    cash: number;
    card: number;
    upi: number;
    other: number;
  };
  gstCollected: number;
  discountsGiven: number;
  netRevenue: number;
}

export interface DepartmentSettlement {
  id?: string;
  date: string;
  type: 'daily' | 'weekly' | 'monthly' | 'inter_departmental';
  status: 'pending' | 'completed' | 'verified';
  departments: {
    cafe: SettlementSummary;
    bar: SettlementSummary;
    hotel: SettlementSummary;
    garden: SettlementSummary;
  };
  totalRevenue: number;
  totalGst: number;
  totalDiscounts: number;
  netRevenue: number;
  createdBy: string;
  verifiedBy?: string;
  createdAt: string;
  verifiedAt?: string;
  notes?: string;
}

// Generate daily settlement report
export async function generateDailySettlement(date?: Date): Promise<{ success: boolean; settlement?: DepartmentSettlement; error?: string }> {
  try {
    const session = await requireFinancialAccess();
    const settlementDate = date || new Date();
    const dateString = settlementDate.toISOString().split('T')[0];

    // Check if settlement already exists for this date
    const existingSettlement = await queryDocuments('settlements', [
      { field: 'date', operator: '==', value: dateString },
      { field: 'type', operator: '==', value: 'daily' }
    ]);

    if (existingSettlement.length > 0) {
      return { success: false, error: 'Daily settlement already exists for this date' };
    }

    // Get start and end of day
    const startOfDay = new Date(settlementDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(settlementDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all bills for the day
    const { data: bills, error: billsError } = await supabaseServer
      .from('bills')
      .select('*')
      .gte('createdAt', startOfDay.toISOString())
      .lte('createdAt', endOfDay.toISOString())
      .eq('paymentStatus', 'paid');

    if (billsError) {
      throw new Error(`Failed to fetch bills: ${billsError.message}`);
    }

    // Calculate settlement for each department
    const departments = {
      cafe: await calculateDepartmentSettlement(bills || [], 'cafe', dateString),
      bar: await calculateDepartmentSettlement(bills || [], 'bar', dateString),
      hotel: await calculateDepartmentSettlement(bills || [], 'hotel', dateString),
      garden: await calculateDepartmentSettlement(bills || [], 'garden', dateString)
    };

    // Calculate totals
    const totalRevenue = Object.values(departments).reduce((sum, dept) => sum + dept.totalRevenue, 0);
    const totalGst = Object.values(departments).reduce((sum, dept) => sum + dept.gstCollected, 0);
    const totalDiscounts = Object.values(departments).reduce((sum, dept) => sum + dept.discountsGiven, 0);
    const netRevenue = totalRevenue - totalDiscounts;

    // Create settlement record
    const settlement: DepartmentSettlement = {
      date: dateString,
      type: 'daily',
      status: 'completed',
      departments,
      totalRevenue,
      totalGst,
      totalDiscounts,
      netRevenue,
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
      notes: `Daily settlement for ${dateString}`
    };

    const result = await createDocument('settlements', settlement);
    if (!result.success) {
      throw new Error(`Failed to create settlement: ${result.error}`);
    }

    // Mark all bills as settled
    if (bills && bills.length > 0) {
      const billIds = bills.map(bill => bill.id);
      await Promise.all(
        billIds.map(billId =>
          updateDocument('bills', billId, {
            isSettled: true,
            settlementId: result.data?.id,
            settledAt: new Date().toISOString()
          })
        )
      );
    }

    // Audit log
    await createAuditLog(
      'GENERATE_SETTLEMENT',
      {
        settlementId: result.data?.id,
        date: dateString,
        type: 'daily',
        totalRevenue,
        billCount: bills?.length || 0
      },
      true
    );

    revalidatePath('/dashboard/settlements');

    return {
      success: true,
      settlement: { ...settlement, id: result.data?.id }
    };
  } catch (error) {
    console.error('Error generating daily settlement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Calculate settlement for a specific department
async function calculateDepartmentSettlement(bills: any[], businessUnit: string, date: string): Promise<SettlementSummary> {
  const departmentBills = bills.filter(bill => bill.businessUnit === businessUnit);

  const totalRevenue = departmentBills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
  const totalOrders = departmentBills.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate payment method breakdown
  const paymentMethods = {
    cash: 0,
    card: 0,
    upi: 0,
    other: 0
  };

  departmentBills.forEach(bill => {
    const amount = bill.grandTotal || 0;
    switch (bill.paymentMethod?.toLowerCase()) {
      case 'cash':
        paymentMethods.cash += amount;
        break;
      case 'card':
      case 'credit_card':
      case 'debit_card':
        paymentMethods.card += amount;
        break;
      case 'upi':
      case 'digital':
        paymentMethods.upi += amount;
        break;
      default:
        paymentMethods.other += amount;
    }
  });

  const gstCollected = departmentBills.reduce((sum, bill) => sum + (bill.gstAmount || 0), 0);
  const discountsGiven = departmentBills.reduce((sum, bill) => sum + (bill.discountAmount || 0), 0);
  const netRevenue = totalRevenue - discountsGiven;

  return {
    businessUnit,
    date,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    paymentMethods,
    gstCollected,
    discountsGiven,
    netRevenue
  };
}

// Generate weekly settlement
export async function generateWeeklySettlement(weekStartDate: Date): Promise<{ success: boolean; settlement?: DepartmentSettlement; error?: string }> {
  try {
    const session = await requireFinancialAccess();
    
    // Calculate week end date
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    
    const startDateString = weekStartDate.toISOString().split('T')[0];
    const endDateString = weekEndDate.toISOString().split('T')[0];

    // Get all daily settlements for the week
    const { data: dailySettlements, error } = await supabaseServer
      .from('settlements')
      .select('*')
      .eq('type', 'daily')
      .gte('date', startDateString)
      .lte('date', endDateString);

    if (error) {
      throw new Error(`Failed to fetch daily settlements: ${error.message}`);
    }

    if (!dailySettlements || dailySettlements.length === 0) {
      return { success: false, error: 'No daily settlements found for this week' };
    }

    // Aggregate weekly data
    const weeklyDepartments = {
      cafe: aggregateDepartmentData(dailySettlements, 'cafe', `${startDateString} to ${endDateString}`),
      bar: aggregateDepartmentData(dailySettlements, 'bar', `${startDateString} to ${endDateString}`),
      hotel: aggregateDepartmentData(dailySettlements, 'hotel', `${startDateString} to ${endDateString}`),
      garden: aggregateDepartmentData(dailySettlements, 'garden', `${startDateString} to ${endDateString}`)
    };

    const totalRevenue = Object.values(weeklyDepartments).reduce((sum, dept) => sum + dept.totalRevenue, 0);
    const totalGst = Object.values(weeklyDepartments).reduce((sum, dept) => sum + dept.gstCollected, 0);
    const totalDiscounts = Object.values(weeklyDepartments).reduce((sum, dept) => sum + dept.discountsGiven, 0);
    const netRevenue = totalRevenue - totalDiscounts;

    const weeklySettlement: DepartmentSettlement = {
      date: `${startDateString}_to_${endDateString}`,
      type: 'weekly',
      status: 'completed',
      departments: weeklyDepartments,
      totalRevenue,
      totalGst,
      totalDiscounts,
      netRevenue,
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
      notes: `Weekly settlement from ${startDateString} to ${endDateString}`
    };

    const result = await createDocument('settlements', weeklySettlement);
    if (!result.success) {
      throw new Error(`Failed to create weekly settlement: ${result.error}`);
    }

    await createAuditLog(
      'GENERATE_SETTLEMENT',
      {
        settlementId: result.data?.id,
        type: 'weekly',
        period: `${startDateString} to ${endDateString}`,
        totalRevenue,
        dailySettlementsCount: dailySettlements.length
      },
      true
    );

    revalidatePath('/dashboard/settlements');

    return {
      success: true,
      settlement: { ...weeklySettlement, id: result.data?.id }
    };
  } catch (error) {
    console.error('Error generating weekly settlement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Generate monthly settlement
export async function generateMonthlySettlement(year: number, month: number): Promise<{ success: boolean; settlement?: DepartmentSettlement; error?: string }> {
  try {
    const session = await requireFinancialAccess();
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    // Get all daily settlements for the month
    const { data: dailySettlements, error } = await supabaseServer
      .from('settlements')
      .select('*')
      .eq('type', 'daily')
      .gte('date', startDateString)
      .lte('date', endDateString);

    if (error) {
      throw new Error(`Failed to fetch daily settlements: ${error.message}`);
    }

    if (!dailySettlements || dailySettlements.length === 0) {
      return { success: false, error: 'No daily settlements found for this month' };
    }

    // Aggregate monthly data
    const monthlyDepartments = {
      cafe: aggregateDepartmentData(dailySettlements, 'cafe', `${year}-${month.toString().padStart(2, '0')}`),
      bar: aggregateDepartmentData(dailySettlements, 'bar', `${year}-${month.toString().padStart(2, '0')}`),
      hotel: aggregateDepartmentData(dailySettlements, 'hotel', `${year}-${month.toString().padStart(2, '0')}`),
      garden: aggregateDepartmentData(dailySettlements, 'garden', `${year}-${month.toString().padStart(2, '0')}`)
    };

    const totalRevenue = Object.values(monthlyDepartments).reduce((sum, dept) => sum + dept.totalRevenue, 0);
    const totalGst = Object.values(monthlyDepartments).reduce((sum, dept) => sum + dept.gstCollected, 0);
    const totalDiscounts = Object.values(monthlyDepartments).reduce((sum, dept) => sum + dept.discountsGiven, 0);
    const netRevenue = totalRevenue - totalDiscounts;

    const monthlySettlement: DepartmentSettlement = {
      date: `${year}-${month.toString().padStart(2, '0')}`,
      type: 'monthly',
      status: 'completed',
      departments: monthlyDepartments,
      totalRevenue,
      totalGst,
      totalDiscounts,
      netRevenue,
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
      notes: `Monthly settlement for ${year}-${month.toString().padStart(2, '0')}`
    };

    const result = await createDocument('settlements', monthlySettlement);
    if (!result.success) {
      throw new Error(`Failed to create monthly settlement: ${result.error}`);
    }

    await createAuditLog(
      'GENERATE_SETTLEMENT',
      {
        settlementId: result.data?.id,
        type: 'monthly',
        period: `${year}-${month}`,
        totalRevenue,
        dailySettlementsCount: dailySettlements.length
      },
      true
    );

    revalidatePath('/dashboard/settlements');

    return {
      success: true,
      settlement: { ...monthlySettlement, id: result.data?.id }
    };
  } catch (error) {
    console.error('Error generating monthly settlement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to aggregate department data from multiple settlements
function aggregateDepartmentData(settlements: any[], businessUnit: string, date: string): SettlementSummary {
  const departmentData = settlements
    .map(s => s.departments?.[businessUnit])
    .filter(Boolean);

  if (departmentData.length === 0) {
    return {
      businessUnit,
      date,
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      paymentMethods: { cash: 0, card: 0, upi: 0, other: 0 },
      gstCollected: 0,
      discountsGiven: 0,
      netRevenue: 0
    };
  }

  const totalRevenue = departmentData.reduce((sum, dept) => sum + (dept.totalRevenue || 0), 0);
  const totalOrders = departmentData.reduce((sum, dept) => sum + (dept.totalOrders || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const paymentMethods = {
    cash: departmentData.reduce((sum, dept) => sum + (dept.paymentMethods?.cash || 0), 0),
    card: departmentData.reduce((sum, dept) => sum + (dept.paymentMethods?.card || 0), 0),
    upi: departmentData.reduce((sum, dept) => sum + (dept.paymentMethods?.upi || 0), 0),
    other: departmentData.reduce((sum, dept) => sum + (dept.paymentMethods?.other || 0), 0)
  };

  const gstCollected = departmentData.reduce((sum, dept) => sum + (dept.gstCollected || 0), 0);
  const discountsGiven = departmentData.reduce((sum, dept) => sum + (dept.discountsGiven || 0), 0);
  const netRevenue = totalRevenue - discountsGiven;

  return {
    businessUnit,
    date,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    paymentMethods,
    gstCollected,
    discountsGiven,
    netRevenue
  };
}

// Get settlements with filtering
export async function getSettlements(filters?: {
  type?: 'daily' | 'weekly' | 'monthly' | 'inter_departmental';
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'completed' | 'verified';
  limit?: number;
}): Promise<DepartmentSettlement[]> {
  try {
    await requireFinancialAccess();

    let query = supabaseServer.from('settlements').select('*');

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    query = query.order('createdAt', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return [];
  }
}

// Verify a settlement (for approval workflow)
export async function verifySettlement(settlementId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireFinancialAccess();

    // Only super_admin can verify settlements
    if (session.user.role !== 'super_admin') {
      return { success: false, error: 'Only super admin can verify settlements' };
    }

    const result = await updateDocument('settlements', settlementId, {
      status: 'verified',
      verifiedBy: session.user.id,
      verifiedAt: new Date().toISOString()
    });

    if (!result.success) {
      throw new Error(`Failed to verify settlement: ${result.error}`);
    }

    await createAuditLog(
      'GENERATE_SETTLEMENT',
      {
        settlementId,
        action: 'verified',
        verifiedBy: session.user.id
      },
      true
    );

    revalidatePath('/dashboard/settlements');

    return { success: true };
  } catch (error) {
    console.error('Error verifying settlement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get settlement statistics
export async function getSettlementStats(period: 'week' | 'month' | 'year' = 'month'): Promise<{
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  departmentBreakdown: Record<string, number>;
  growthPercentage: number;
}> {
  try {
    await requireFinancialAccess();

    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    // Get current period settlements
    const { data: currentSettlements } = await supabaseServer
      .from('settlements')
      .select('*')
      .eq('type', 'daily')
      .gte('date', startDate.toISOString().split('T')[0]);

    // Get previous period settlements for growth calculation
    const { data: previousSettlements } = await supabaseServer
      .from('settlements')
      .select('*')
      .eq('type', 'daily')
      .gte('date', previousStartDate.toISOString().split('T')[0])
      .lt('date', startDate.toISOString().split('T')[0]);

    const currentRevenue = (currentSettlements || []).reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
    const previousRevenue = (previousSettlements || []).reduce((sum, s) => sum + (s.totalRevenue || 0), 0);

    const totalOrders = (currentSettlements || []).reduce((sum, s) => {
      return sum + Object.values(s.departments || {}).reduce((deptSum: number, dept: any) => {
        return deptSum + (dept.totalOrders || 0);
      }, 0);
    }, 0);

    const averageOrderValue = totalOrders > 0 ? currentRevenue / totalOrders : 0;

    const departmentBreakdown = {
      cafe: 0,
      bar: 0,
      hotel: 0,
      garden: 0
    };

    (currentSettlements || []).forEach(settlement => {
      Object.entries(settlement.departments || {}).forEach(([dept, data]: [string, any]) => {
        if (departmentBreakdown.hasOwnProperty(dept)) {
          departmentBreakdown[dept as keyof typeof departmentBreakdown] += data.totalRevenue || 0;
        }
      });
    });

    const growthPercentage = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    return {
      totalRevenue: currentRevenue,
      totalOrders,
      averageOrderValue,
      departmentBreakdown,
      growthPercentage
    };
  } catch (error) {
    console.error('Error fetching settlement stats:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      departmentBreakdown: { cafe: 0, bar: 0, hotel: 0, garden: 0 },
      growthPercentage: 0
    };
  }
}

// Get inter-departmental orders for settlement
export async function getInterDepartmentalOrders(filters?: {
  startDate?: string;
  endDate?: string;
  fromDepartment?: string;
  toDepartment?: string;
  status?: 'pending' | 'settled';
}): Promise<any[]> {
  try {
    await requireFinancialAccess();

    // First try with order_items relationship
    let query = supabaseServer
      .from('orders')
      .select(`
        *,
        order_items(*),
        customers(*)
      `)
      .neq('from_department', 'to_department'); // Inter-departmental only

    if (filters?.startDate) {
      query = query.gte('createdAt', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('createdAt', filters.endDate);
    }
    if (filters?.fromDepartment) {
      query = query.eq('from_department', filters.fromDepartment);
    }
    if (filters?.toDepartment) {
      query = query.eq('to_department', filters.toDepartment);
    }
    if (filters?.status) {
      query = query.eq('settlementStatus', filters.status);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) {
      // If relationship error, fall back to basic query
      if (error.message?.includes('relationship') || error.message?.includes('order_items')) {
        console.warn('order_items relationship not found, using basic query');
        
        const fallbackQuery = supabaseServer
          .from('orders')
          .select('*')
          .neq('from_department', 'to_department');
          
        if (filters?.startDate) {
          fallbackQuery.gte('createdAt', filters.startDate);
        }
        if (filters?.endDate) {
          fallbackQuery.lte('createdAt', filters.endDate);
        }
        if (filters?.fromDepartment) {
          fallbackQuery.eq('from_department', filters.fromDepartment);
        }
        if (filters?.toDepartment) {
          fallbackQuery.eq('to_department', filters.toDepartment);
        }
        if (filters?.status) {
          fallbackQuery.eq('settlementStatus', filters.status);
        }
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery.order('createdAt', { ascending: false });
        
        if (fallbackError) {
          throw fallbackError;
        }
        
        return fallbackData || [];
      }
      
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching inter-departmental orders:', error);
    return [];
  }
}

// Create inter-departmental settlement
export async function createInterDepartmentalSettlement(orderIds: string[], notes?: string): Promise<{ success: boolean; settlement?: any; error?: string }> {
  try {
    const session = await requireFinancialAccess();

    // Get the orders to be settled
    let orders;
    const { data: ordersData, error: ordersError } = await supabaseServer
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .in('id', orderIds)
      .eq('settlementStatus', 'pending');

    if (ordersError) {
      // If relationship error, fall back to basic query
      if (ordersError.message?.includes('relationship') || ordersError.message?.includes('order_items')) {
        console.warn('order_items relationship not found, using basic query for settlement');
        
        const { data: fallbackOrders, error: fallbackError } = await supabaseServer
          .from('orders')
          .select('*')
          .in('id', orderIds)
          .eq('settlementStatus', 'pending');
          
        if (fallbackError) {
          throw new Error(`Failed to fetch orders: ${fallbackError.message}`);
        }
        
        orders = fallbackOrders;
      } else {
        throw new Error(`Failed to fetch orders: ${ordersError.message}`);
      }
    } else {
      orders = ordersData;
    }

    if (!orders || orders.length === 0) {
      return { success: false, error: 'No pending orders found for settlement' };
    }

    // Calculate settlement amounts by department pairs
    const departmentPairs: Record<string, {
      fromDepartment: string;
      toDepartment: string;
      totalAmount: number;
      orderCount: number;
      orders: any[];
    }> = {};

    orders.forEach(order => {
      const key = `${order.fromDepartment}_to_${order.toDepartment}`;
      if (!departmentPairs[key]) {
        departmentPairs[key] = {
          fromDepartment: order.fromDepartment,
          toDepartment: order.toDepartment,
          totalAmount: 0,
          orderCount: 0,
          orders: []
        };
      }
      departmentPairs[key].totalAmount += order.totalAmount || 0;
      departmentPairs[key].orderCount += 1;
      departmentPairs[key].orders.push(order);
    });

    // Create settlement record
    const settlement = {
      type: 'inter_departmental',
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      departmentPairs,
      totalAmount: Object.values(departmentPairs).reduce((sum, pair) => sum + pair.totalAmount, 0),
      totalOrders: orders.length,
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
      notes: notes || 'Inter-departmental settlement'
    };

    const result = await createDocument('settlements', settlement);
    if (!result.success) {
      throw new Error(`Failed to create settlement: ${result.error}`);
    }

    // Mark orders as settled
    await Promise.all(
      orderIds.map(orderId =>
        updateDocument('orders', orderId, {
          settlementStatus: 'settled',
          settlementId: result.data?.id,
          settledAt: new Date().toISOString()
        })
      )
    );

    await createAuditLog(
      'GENERATE_SETTLEMENT',
      {
        settlementId: result.data?.id,
        type: 'inter_departmental',
        orderCount: orders.length,
        totalAmount: settlement.totalAmount
      },
      true
    );

    revalidatePath('/dashboard/settlements');
    revalidatePath('/dashboard/department-settlements');

    return {
      success: true,
      settlement: { ...settlement, id: result.data?.id }
    };
  } catch (error) {
    console.error('Error creating inter-departmental settlement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

