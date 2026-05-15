"use server"

import { createDocument, updateDocument, queryDocuments } from "@/lib/supabase/database"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import type { AttendanceRecord } from "@/types/business-management"

/**
 * Clock in employee
 */
export async function clockIn(employeeId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // Check if already clocked in today
    const existing = await queryDocuments('attendance', [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'date', operator: '==', value: today }
    ])

    if (existing.length > 0 && existing[0].clockIn) {
      return { success: false, error: 'Already clocked in today' }
    }

    const attendanceData: Omit<AttendanceRecord, 'id'> = {
      employeeId,
      date: today,
      clockIn: now,
      status: 'present',
      createdAt: now
    }

    const result = await createDocument('attendance', attendanceData)

    if (result.success) {
      await createAuditLog(
        'CLOCK_IN',
        { employeeId, date: today, time: now },
        true,
        `Employee ${employeeId} clocked in`
      )

      revalidatePath('/dashboard/attendance')
      return { success: true, clockInTime: now }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error clocking in:', error)
    return { success: false, error: 'Failed to clock in' }
  }
}

/**
 * Clock out employee
 */
export async function clockOut(employeeId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // Find today's attendance record
    const attendance = await queryDocuments('attendance', [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'date', operator: '==', value: today }
    ])

    if (attendance.length === 0 || !attendance[0].clockIn) {
      return { success: false, error: 'No clock-in record found for today' }
    }

    if (attendance[0].clockOut) {
      return { success: false, error: 'Already clocked out today' }
    }

    const record = attendance[0]
    const clockInTime = new Date(record.clockIn)
    const clockOutTime = new Date(now)
    const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)

    // Calculate overtime (over 8 hours)
    const overtimeHours = Math.max(0, totalHours - 8)

    const result = await updateDocument('attendance', record.id, {
      clockOut: now,
      totalHours: Math.round(totalHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100
    })

    if (result.success) {
      await createAuditLog(
        'CLOCK_OUT',
        { employeeId, date: today, time: now, totalHours },
        true,
        `Employee ${employeeId} clocked out - ${totalHours.toFixed(2)} hours`
      )

      revalidatePath('/dashboard/attendance')
      return { success: true, clockOutTime: now, totalHours }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error clocking out:', error)
    return { success: false, error: 'Failed to clock out' }
  }
}

/**
 * Start break
 */
export async function startBreak(employeeId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    const attendance = await queryDocuments('attendance', [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'date', operator: '==', value: today }
    ])

    if (attendance.length === 0 || !attendance[0].clockIn) {
      return { success: false, error: 'Must clock in first' }
    }

    if (attendance[0].breakStart && !attendance[0].breakEnd) {
      return { success: false, error: 'Already on break' }
    }

    const result = await updateDocument('attendance', attendance[0].id, {
      breakStart: now
    })

    if (result.success) {
      revalidatePath('/dashboard/attendance')
      return { success: true, breakStartTime: now }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error starting break:', error)
    return { success: false, error: 'Failed to start break' }
  }
}

/**
 * End break
 */
export async function endBreak(employeeId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    const attendance = await queryDocuments('attendance', [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'date', operator: '==', value: today }
    ])

    if (attendance.length === 0 || !attendance[0].breakStart) {
      return { success: false, error: 'No active break found' }
    }

    if (attendance[0].breakEnd) {
      return { success: false, error: 'Break already ended' }
    }

    const result = await updateDocument('attendance', attendance[0].id, {
      breakEnd: now
    })

    if (result.success) {
      revalidatePath('/dashboard/attendance')
      return { success: true, breakEndTime: now }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error ending break:', error)
    return { success: false, error: 'Failed to end break' }
  }
}

/**
 * Get attendance records
 */
export async function getAttendanceRecords(
  employeeId?: string,
  startDate?: string,
  endDate?: string
) {
  try {
    const filters = []

    if (employeeId) {
      filters.push({ field: 'employeeId', operator: '==', value: employeeId })
    }

    if (startDate) {
      filters.push({ field: 'date', operator: '>=', value: startDate })
    }

    if (endDate) {
      filters.push({ field: 'date', operator: '<=', value: endDate })
    }

    const records = await queryDocuments('attendance', filters, 'date', 'desc')
    return records as AttendanceRecord[]
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return []
  }
}

/**
 * Get today's attendance
 */
export async function getTodayAttendance() {
  try {
    const today = new Date().toISOString().split('T')[0]
    return await getAttendanceRecords(undefined, today, today)
  } catch (error) {
    console.error('Error fetching today attendance:', error)
    return []
  }
}

/**
 * Mark employee absent
 */
export async function markAbsent(employeeId: string, date: string, notes?: string) {
  try {
    // Check if record already exists
    const existing = await queryDocuments('attendance', [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'date', operator: '==', value: date }
    ])

    if (existing.length > 0) {
      return { success: false, error: 'Attendance record already exists for this date' }
    }

    const attendanceData: Omit<AttendanceRecord, 'id'> = {
      employeeId,
      date,
      status: 'absent',
      notes,
      createdAt: new Date().toISOString()
    }

    const result = await createDocument('attendance', attendanceData)

    if (result.success) {
      await createAuditLog(
        'MARKED_ABSENT',
        { employeeId, date, notes },
        true,
        `Employee ${employeeId} marked absent for ${date}`
      )

      revalidatePath('/dashboard/attendance')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error marking absent:', error)
    return { success: false, error: 'Failed to mark absent' }
  }
}

/**
 * Get attendance summary
 */
export async function getAttendanceSummary(date?: string) {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0]
    
    const records = await getAttendanceRecords(undefined, targetDate, targetDate)
    
    const totalPresent = records.filter(r => r.status === 'present').length
    const totalAbsent = records.filter(r => r.status === 'absent').length
    const totalLate = records.filter(r => r.status === 'late').length
    
    const presentRecords = records.filter(r => r.totalHours)
    const averageHours = presentRecords.length > 0 
      ? presentRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0) / presentRecords.length
      : 0

    return {
      date: targetDate,
      totalPresent,
      totalAbsent,
      totalLate,
      averageHours: Math.round(averageHours * 100) / 100
    }
  } catch (error) {
    console.error('Error getting attendance summary:', error)
    return {
      date: date || new Date().toISOString().split('T')[0],
      totalPresent: 0,
      totalAbsent: 0,
      totalLate: 0,
      averageHours: 0
    }
  }
}

/**
 * Get employee current status
 */
export async function getEmployeeStatus(employeeId: string) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const attendance = await queryDocuments('attendance', [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'date', operator: '==', value: today }
    ])

    if (attendance.length === 0) {
      return { status: 'not_clocked_in' }
    }

    const record = attendance[0]
    
    if (record.clockOut) {
      return { status: 'clocked_out', record }
    }
    
    if (record.breakStart && !record.breakEnd) {
      return { status: 'on_break', record }
    }
    
    if (record.clockIn) {
      return { status: 'working', record }
    }

    return { status: 'unknown', record }
  } catch (error) {
    console.error('Error getting employee status:', error)
    return { status: 'error' }
  }
}