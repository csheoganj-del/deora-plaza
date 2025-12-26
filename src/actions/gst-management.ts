"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { createDocument, queryDocuments, updateDocument } from "@/lib/supabase/database";
import { requireFinancialAccess } from "@/lib/auth-helpers";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/**
 * Comprehensive GST Management System for DEORA Plaza
 * Handles GST calculations, reporting, and compliance
 */

export interface GSTConfig {
  id?: string;
  businessUnit: string;
  gstNumber?: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  totalGstRate: number;
  exemptItems: string[];
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GSTReport {
  period: string;
  businessUnit?: string;
  totalSales: number;
  taxableSales: number;
  exemptSales: number;
  cgstCollected: number;
  sgstCollected: number;
  igstCollected: number;
  totalGstCollected: number;
  gstLiability: number;
  transactions: GSTTransaction[];
}

export interface GSTTransaction {
  id: string;
  billNumber: string;
  date: string;
  businessUnit: string;
  customerName?: string;
  customerGstin?: string;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  grandTotal: number;
  isExempt: boolean;
  exemptReason?: string;
}

// Get GST configuration for a business unit
export async function getGSTConfig(businessUnit: string): Promise<GSTConfig | null> {
  try {
    await requireFinancialAccess();

    const { data, error } = await supabaseServer
      .from('gst_config')
      .select('*')
      .eq('businessUnit', businessUnit)
      .eq('isActive', true)
      .order('effectiveFrom', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching GST config:', error);
    return null;
  }
}

// Update GST configuration
export async function updateGSTConfig(config: Omit<GSTConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireFinancialAccess();

    // Validate GST rates
    if (config.cgstRate + config.sgstRate !== config.totalGstRate) {
      return { success: false, error: 'CGST + SGST must equal total GST rate' };
    }

    // Deactivate existing config
    const { error: deactivateError } = await supabaseServer
      .from('gst_config')
      .update({ 
        isActive: false,
        effectiveTo: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('businessUnit', config.businessUnit)
      .eq('isActive', true);

    if (deactivateError) {
      throw deactivateError;
    }

    // Create new config
    const newConfig: GSTConfig = {
      ...config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await createDocument('gst_config', newConfig);
    if (!result.success) {
      throw new Error(`Failed to create GST config: ${result.error}`);
    }

    await createAuditLog(
      'UPDATE_USER',
      {
        businessUnit: config.businessUnit,
        totalGstRate: config.totalGstRate,
        cgstRate: config.cgstRate,
        sgstRate: config.sgstRate,
        configId: result.data?.id
      },
      true
    );

    revalidatePath('/dashboard/gst');

    return { success: true };
  } catch (error) {
    console.error('Error updating GST config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Calculate GST for an order
export async function calculateGST(
  businessUnit: string,
  subtotal: number,
  exemptItems: string[] = []
): Promise<{
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  taxableAmount: number;
  exemptAmount: number;
}> {
  try {
    const config = await getGSTConfig(businessUnit);
    
    if (!config) {
      // Default GST rates if no config found
      const defaultRate = 18;
      const cgstRate = 9;
      const sgstRate = 9;
      
      const taxableAmount = subtotal;
      const exemptAmount = 0;
      
      const cgstAmount = (taxableAmount * cgstRate) / 100;
      const sgstAmount = (taxableAmount * sgstRate) / 100;
      const totalGstAmount = cgstAmount + sgstAmount;

      return {
        cgstAmount: Math.round(cgstAmount * 100) / 100,
        sgstAmount: Math.round(sgstAmount * 100) / 100,
        igstAmount: 0,
        totalGstAmount: Math.round(totalGstAmount * 100) / 100,
        taxableAmount,
        exemptAmount
      };
    }

    // Calculate exempt amount (simplified - in real scenario, you'd check individual items)
    const exemptAmount = 0; // This would be calculated based on exempt items
    const taxableAmount = subtotal - exemptAmount;

    const cgstAmount = (taxableAmount * config.cgstRate) / 100;
    const sgstAmount = (taxableAmount * config.sgstRate) / 100;
    const igstAmount = (taxableAmount * config.igstRate) / 100;
    const totalGstAmount = cgstAmount + sgstAmount + igstAmount;

    return {
      cgstAmount: Math.round(cgstAmount * 100) / 100,
      sgstAmount: Math.round(sgstAmount * 100) / 100,
      igstAmount: Math.round(igstAmount * 100) / 100,
      totalGstAmount: Math.round(totalGstAmount * 100) / 100,
      taxableAmount,
      exemptAmount
    };
  } catch (error) {
    console.error('Error calculating GST:', error);
    return {
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalGstAmount: 0,
      taxableAmount: subtotal,
      exemptAmount: 0
    };
  }
}

// Generate GST report for a period
export async function generateGSTReport(
  startDate: string,
  endDate: string,
  businessUnit?: string
): Promise<{ success: boolean; report?: GSTReport; error?: string }> {
  try {
    await requireFinancialAccess();

    let query = supabaseServer
      .from('bills')
      .select('*')
      .gte('createdAt', startDate)
      .lte('createdAt', endDate)
      .eq('paymentStatus', 'paid');

    if (businessUnit) {
      query = query.eq('businessUnit', businessUnit);
    }

    const { data: bills, error } = await query;

    if (error) {
      throw error;
    }

    if (!bills || bills.length === 0) {
      return {
        success: false,
        error: 'No bills found for the specified period'
      };
    }

    // Process bills to create GST transactions
    const transactions: GSTTransaction[] = bills.map(bill => ({
      id: bill.id,
      billNumber: bill.billNumber,
      date: bill.createdAt,
      businessUnit: bill.businessUnit,
      customerName: bill.customerName,
      customerGstin: bill.customerGstin,
      subtotal: bill.subtotal || 0,
      cgstAmount: bill.cgstAmount || 0,
      sgstAmount: bill.sgstAmount || 0,
      igstAmount: bill.igstAmount || 0,
      totalGstAmount: bill.gstAmount || 0,
      grandTotal: bill.grandTotal || 0,
      isExempt: bill.isGstExempt || false,
      exemptReason: bill.exemptReason
    }));

    // Calculate totals
    const totalSales = transactions.reduce((sum, t) => sum + t.grandTotal, 0);
    const taxableSales = transactions
      .filter(t => !t.isExempt)
      .reduce((sum, t) => sum + t.subtotal, 0);
    const exemptSales = transactions
      .filter(t => t.isExempt)
      .reduce((sum, t) => sum + t.subtotal, 0);
    
    const cgstCollected = transactions.reduce((sum, t) => sum + t.cgstAmount, 0);
    const sgstCollected = transactions.reduce((sum, t) => sum + t.sgstAmount, 0);
    const igstCollected = transactions.reduce((sum, t) => sum + t.igstAmount, 0);
    const totalGstCollected = cgstCollected + sgstCollected + igstCollected;

    const report: GSTReport = {
      period: `${startDate} to ${endDate}`,
      businessUnit,
      totalSales,
      taxableSales,
      exemptSales,
      cgstCollected,
      sgstCollected,
      igstCollected,
      totalGstCollected,
      gstLiability: totalGstCollected, // Simplified - would include input tax credit in real scenario
      transactions
    };

    // Store report in database
    const reportData = {
      period: report.period,
      businessUnit: businessUnit || 'all',
      startDate,
      endDate,
      totalSales,
      taxableSales,
      exemptSales,
      cgstCollected,
      sgstCollected,
      igstCollected,
      totalGstCollected,
      gstLiability: totalGstCollected,
      transactionCount: transactions.length,
      generatedAt: new Date().toISOString(),
      generatedBy: (await requireFinancialAccess()).user.id
    };

    await createDocument('gst_reports', reportData);

    await createAuditLog(
      'GENERATE_SETTLEMENT',
      {
        period: report.period,
        businessUnit: businessUnit || 'all',
        totalGstCollected,
        transactionCount: transactions.length
      },
      true
    );

    return { success: true, report };
  } catch (error) {
    console.error('Error generating GST report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get GST summary for dashboard
export async function getGSTSummary(businessUnit?: string): Promise<{
  todayGst: number;
  monthGst: number;
  yearGst: number;
  pendingReturns: number;
  complianceStatus: 'compliant' | 'warning' | 'overdue';
}> {
  try {
    await requireFinancialAccess();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Get today's GST
    let todayQuery = supabaseServer
      .from('bills')
      .select('gstAmount')
      .gte('createdAt', today.toISOString())
      .eq('paymentStatus', 'paid');

    if (businessUnit) {
      todayQuery = todayQuery.eq('businessUnit', businessUnit);
    }

    const { data: todayBills } = await todayQuery;
    const todayGst = (todayBills || []).reduce((sum, bill) => sum + (bill.gstAmount || 0), 0);

    // Get month's GST
    let monthQuery = supabaseServer
      .from('bills')
      .select('gstAmount')
      .gte('createdAt', monthStart.toISOString())
      .eq('paymentStatus', 'paid');

    if (businessUnit) {
      monthQuery = monthQuery.eq('businessUnit', businessUnit);
    }

    const { data: monthBills } = await monthQuery;
    const monthGst = (monthBills || []).reduce((sum, bill) => sum + (bill.gstAmount || 0), 0);

    // Get year's GST
    let yearQuery = supabaseServer
      .from('bills')
      .select('gstAmount')
      .gte('createdAt', yearStart.toISOString())
      .eq('paymentStatus', 'paid');

    if (businessUnit) {
      yearQuery = yearQuery.eq('businessUnit', businessUnit);
    }

    const { data: yearBills } = await yearQuery;
    const yearGst = (yearBills || []).reduce((sum, bill) => sum + (bill.gstAmount || 0), 0);

    // Check pending returns (simplified)
    const { data: pendingReports } = await supabaseServer
      .from('gst_reports')
      .select('id')
      .eq('status', 'pending');

    const pendingReturns = pendingReports?.length || 0;

    // Determine compliance status (simplified)
    const complianceStatus: 'compliant' | 'warning' | 'overdue' = 
      pendingReturns === 0 ? 'compliant' : 
      pendingReturns <= 2 ? 'warning' : 'overdue';

    return {
      todayGst,
      monthGst,
      yearGst,
      pendingReturns,
      complianceStatus
    };
  } catch (error) {
    console.error('Error fetching GST summary:', error);
    return {
      todayGst: 0,
      monthGst: 0,
      yearGst: 0,
      pendingReturns: 0,
      complianceStatus: 'compliant'
    };
  }
}

// Export GST data for filing
export async function exportGSTData(
  startDate: string,
  endDate: string,
  format: 'json' | 'csv' | 'excel' = 'json',
  businessUnit?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    await requireFinancialAccess();

    const reportResult = await generateGSTReport(startDate, endDate, businessUnit);
    
    if (!reportResult.success || !reportResult.report) {
      return { success: false, error: reportResult.error };
    }

    const report = reportResult.report;

    switch (format) {
      case 'json':
        return { success: true, data: report };
      
      case 'csv':
        const csvHeaders = [
          'Bill Number', 'Date', 'Business Unit', 'Customer Name', 'Customer GSTIN',
          'Subtotal', 'CGST Amount', 'SGST Amount', 'IGST Amount', 'Total GST', 'Grand Total'
        ];
        
        const csvRows = report.transactions.map(t => [
          t.billNumber, t.date, t.businessUnit, t.customerName || '',
          t.customerGstin || '', t.subtotal, t.cgstAmount, t.sgstAmount,
          t.igstAmount, t.totalGstAmount, t.grandTotal
        ]);

        const csvData = [csvHeaders, ...csvRows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');

        return { success: true, data: csvData };
      
      default:
        return { success: false, error: 'Unsupported format' };
    }
  } catch (error) {
    console.error('Error exporting GST data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Validate GST number
export function validateGSTIN(gstin: string): { isValid: boolean; error?: string } {
  if (!gstin) {
    return { isValid: false, error: 'GSTIN is required' };
  }

  // GSTIN format: 15 characters (2 state code + 10 PAN + 1 entity code + 1 Z + 1 checksum)
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstinRegex.test(gstin)) {
    return { isValid: false, error: 'Invalid GSTIN format' };
  }

  return { isValid: true };
}

// Get all GST configurations
export async function getAllGSTConfigs(): Promise<GSTConfig[]> {
  try {
    await requireFinancialAccess();

    const { data, error } = await supabaseServer
      .from('gst_config')
      .select('*')
      .eq('isActive', true)
      .order('businessUnit');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching GST configs:', error);
    return [];
  }
}

