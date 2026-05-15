"use server"

import { createDocument, updateDocument, queryDocuments } from "@/lib/supabase/database"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import type { SalaryRecord, AdvanceRequest } from "@/types/business-management"

/**
 * Generate salary for employee for a specific month
 */
export async function generateSalary(employeeId: string, month: string) {
  try {
    // Check if salary already generated for this month
    const existing = await queryDocuments('salary_records', [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'month', operator: '==', value: month }
    ])

    if (existing.length > 0) {
      return { success: false, error: 'Salary already generated for this month' }
    }

    // Get employee details
    const employees = await queryDocuments('employees', [
      { field: 'id', operator: '==', value: employeeId }
    ])

    if (employees.length === 0) {
      return { success: false, error: 'Employee not found' }
    }

    const employee = employees[0]
    const baseSalary = employee.salary || 0

    // Get attendance records for the month
    const startDate = `${month}-01`
    const endDate = `${month}-31`
    
    const attendance = await queryDocuments('attendance', [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'date', operator: '>=', value: startDate },
      { field: 'date', operator: '<=', value: endDate }
    ])

    // Calculate overtime pay (assuming ₹100 per hour)
    const totalOvertimeHours = attendance.reduce((sum: number, record: any) => 
      sum + (record.overtimeHours || 0), 0
    )
    const overtimePay = totalOvertimeHours * 100

    // Get advance deductions for this month
    const advances = await queryDocuments('advance_requests', [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'status', operator: '==', value: 'paid' }
    ])

    const advanceDeducted = advances
      .filter((adv: any) => adv.paidDate && adv.paidDate.startsWith(month))
      .reduce((sum: number, adv: any) => sum + adv.amount, 0)

    const bonuses = 0 // Can be added later
    const deductions = 0 // Can be added later
    const netSalary = baseSalary + overtimePay + bonuses - deductions - advanceDeducted

    const salaryData: Omit<SalaryRecord, 'id'> = {
      employeeId,
      month,
      baseSalary,
      overtimePay,
      bonuses,
      deductions,
      advanceDeducted,
      netSalary,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    const result = await createDocument('salary_records', salaryData)

    if (result.success) {
      await createAuditLog(
        'SALARY_GENERATED',
        { employeeId, month, netSalary },
        true,
        `Salary generated for employee ${employeeId} for ${month}: ₹${netSalary}`
      )

      revalidatePath('/dashboard/salary')
      return { success: true, salaryId: result.data?.id, netSalary }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error generating salary:', error)
    return { success: false, error: 'Failed to generate salary' }
  }
}

/**
 * Pay salary
 */
export async function paySalary(salaryId: string) {
  try {
    const now = new Date().toISOString()

    const result = await updateDocument('salary_records', salaryId, {
      status: 'paid',
      paidDate: now
    })

    if (result.success) {
      await createAuditLog(
        'SALARY_PAID',
        { salaryId, paidDate: now },
        true,
        `Salary ${salaryId} marked as paid`
      )

      revalidatePath('/dashboard/salary')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error paying salary:', error)
    return { success: false, error: 'Failed to pay salary' }
  }
}

/**
 * Request advance salary
 */
export async function requestAdvance(employeeId: string, amount: number, reason: string) {
  try {
    const advanceData: Omit<AdvanceRequest, 'id'> = {
      employeeId,
      amount,
      reason,
      requestDate: new Date().toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    const result = await createDocument('advance_requests', advanceData)

    if (result.success) {
      await createAuditLog(
        'ADVANCE_REQUESTED',
        { employeeId, amount, reason },
        true,
        `Advance request of ₹${amount} submitted by employee ${employeeId}`
      )

      revalidatePath('/dashboard/salary')
      return { success: true, requestId: result.data?.id }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error requesting advance:', error)
    return { success: false, error: 'Failed to request advance' }
  }
}

/**
 * Approve/Reject advance request
 */
export async function processAdvanceRequest(
  requestId: string, 
  action: 'approved' | 'rejected', 
  approvedBy: string,
  notes?: string
) {
  try {
    const now = new Date().toISOString()

    const updateData: any = {
      status: action,
      approvedBy,
      approvedDate: now,
      notes
    }

    const result = await updateDocument('advance_requests', requestId, updateData)

    if (result.success) {
      await createAuditLog(
        'ADVANCE_PROCESSED',
        { requestId, action, approvedBy },
        true,
        `Advance request ${requestId} ${action} by ${approvedBy}`
      )

      revalidatePath('/dashboard/salary')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error processing advance request:', error)
    return { success: false, error: 'Failed to process advance request' }
  }
}

/**
 * Pay approved advance
 */
export async function payAdvance(requestId: string) {
  try {
    const now = new Date().toISOString()

    // Get the advance request
    const requests = await queryDocuments('advance_requests', [
      { field: 'id', operator: '==', value: requestId }
    ])

    if (requests.length === 0) {
      return { success: false, error: 'Advance request not found' }
    }

    const request = requests[0]

    if (request.status !== 'approved') {
      return { success: false, error: 'Advance request is not approved' }
    }

    const result = await updateDocument('advance_requests', requestId, {
      status: 'paid',
      paidDate: now
    })

    if (result.success) {
      await createAuditLog(
        'ADVANCE_PAID',
        { requestId, amount: request.amount, employeeId: request.employeeId },
        true,
        `Advance of ₹${request.amount} paid to employee ${request.employeeId}`
      )

      revalidatePath('/dashboard/salary')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error paying advance:', error)
    return { success: false, error: 'Failed to pay advance' }
  }
}

/**
 * Get salary records
 */
export async function getSalaryRecords(employeeId?: string, month?: string) {
  try {
    const filters = []

    if (employeeId) {
      filters.push({ field: 'employeeId', operator: '==', value: employeeId })
    }

    if (month) {
      filters.push({ field: 'month', operator: '==', value: month })
    }

    const records = await queryDocuments('salary_records', filters, 'month', 'desc')
    return records as SalaryRecord[]
  } catch (error) {
    console.error('Error fetching salary records:', error)
    return []
  }
}

/**
 * Get advance requests
 */
export async function getAdvanceRequests(employeeId?: string, status?: string) {
  try {
    const filters = []

    if (employeeId) {
      filters.push({ field: 'employeeId', operator: '==', value: employeeId })
    }

    if (status) {
      filters.push({ field: 'status', operator: '==', value: status })
    }

    const requests = await queryDocuments('advance_requests', filters, 'requestDate', 'desc')
    return requests as AdvanceRequest[]
  } catch (error) {
    console.error('Error fetching advance requests:', error)
    return []
  }
}

/**
 * Get salary summary
 */
export async function getSalarySummary(month?: string) {
  try {
    const targetMonth = month || new Date().toISOString().slice(0, 7) // YYYY-MM
    
    const records = await getSalaryRecords(undefined, targetMonth)
    
    const totalPayroll = records.reduce((sum, record) => sum + record.netSalary, 0)
    const pendingPayments = records
      .filter(record => record.status === 'pending')
      .reduce((sum, record) => sum + record.netSalary, 0)
    
    const advances = await getAdvanceRequests()
    const advancesPaid = advances
      .filter(adv => adv.status === 'paid' && adv.paidDate?.startsWith(targetMonth))
      .reduce((sum, adv) => sum + adv.amount, 0)
    
    const totalDeductions = records.reduce((sum, record) => 
      sum + record.deductions + record.advanceDeducted, 0)

    return {
      month: targetMonth,
      totalPayroll,
      pendingPayments,
      advancesPaid,
      totalDeductions
    }
  } catch (error) {
    console.error('Error getting salary summary:', error)
    return {
      month: month || new Date().toISOString().slice(0, 7),
      totalPayroll: 0,
      pendingPayments: 0,
      advancesPaid: 0,
      totalDeductions: 0
    }
  }
}

/**
 * Generate salary for all employees for a month
 */
export async function generateAllSalaries(month: string) {
  try {
    // Get all active employees
    const employees = await queryDocuments('employees', [
      { field: 'status', operator: '==', value: 'active' }
    ])

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const employee of employees) {
      const result = await generateSalary(employee.id, month)
      results.push({ employeeId: employee.id, ...result })
      
      if (result.success) {
        successCount++
      } else {
        errorCount++
      }
    }

    await createAuditLog(
      'BULK_SALARY_GENERATION',
      { month, successCount, errorCount },
      true,
      `Bulk salary generation for ${month}: ${successCount} success, ${errorCount} errors`
    )

    revalidatePath('/dashboard/salary')
    return { success: true, results, successCount, errorCount }
  } catch (error) {
    console.error('Error generating all salaries:', error)
    return { success: false, error: 'Failed to generate salaries' }
  }
}