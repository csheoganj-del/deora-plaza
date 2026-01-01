"use server"

import { createDocument, updateDocument, deleteDocument, queryDocuments } from "@/lib/supabase/database"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import type { Employee } from "@/types/business-management"

/**
 * Create new employee
 */
export async function createEmployee(data: Omit<Employee, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) {
  try {
    // Generate employee ID
    const employees = await queryDocuments('employees', [], 'createdAt', 'desc', 1)
    const lastEmpId = employees[0]?.employeeId || 'EMP-000'
    const nextNumber = parseInt(lastEmpId.split('-')[1]) + 1
    const employeeId = `EMP-${nextNumber.toString().padStart(3, '0')}`

    const employeeData: Omit<Employee, 'id'> = {
      ...data,
      employeeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await createDocument('employees', employeeData)

    if (result.success) {
      await createAuditLog(
        'EMPLOYEE_CREATED',
        { employeeId, name: data.name, department: data.department },
        true,
        `Employee ${data.name} created with ID ${employeeId}`
      )

      revalidatePath('/dashboard/staff')
      return { success: true, employeeId, id: result.data?.id }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error creating employee:', error)
    return { success: false, error: 'Failed to create employee' }
  }
}

/**
 * Update employee
 */
export async function updateEmployee(id: string, data: Partial<Employee>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    }

    const result = await updateDocument('employees', id, updateData)

    if (result.success) {
      await createAuditLog(
        'EMPLOYEE_UPDATED',
        { employeeId: id, updates: Object.keys(data) },
        true,
        `Employee ${id} updated`
      )

      revalidatePath('/dashboard/staff')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error updating employee:', error)
    return { success: false, error: 'Failed to update employee' }
  }
}

/**
 * Delete employee (set inactive)
 */
export async function deleteEmployee(id: string) {
  try {
    const result = await updateDocument('employees', id, {
      status: 'inactive',
      updatedAt: new Date().toISOString()
    })

    if (result.success) {
      await createAuditLog(
        'EMPLOYEE_DELETED',
        { employeeId: id },
        true,
        `Employee ${id} set to inactive`
      )

      revalidatePath('/dashboard/staff')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error deleting employee:', error)
    return { success: false, error: 'Failed to delete employee' }
  }
}

/**
 * Get all employees
 */
export async function getEmployees(department?: string, status: 'active' | 'inactive' | 'all' = 'active') {
  try {
    const filters = []

    if (department) {
      filters.push({ field: 'department', operator: '==', value: department })
    }

    if (status !== 'all') {
      filters.push({ field: 'status', operator: '==', value: status })
    }

    const employees = await queryDocuments('employees', filters, 'name', 'asc')
    return employees as Employee[]
  } catch (error) {
    console.error('Error fetching employees:', error)
    return []
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const employees = await queryDocuments('employees', [
      { field: 'id', operator: '==', value: id }
    ])
    return employees[0] as Employee || null
  } catch (error) {
    console.error('Error fetching employee:', error)
    return null
  }
}

/**
 * Get staff summary for dashboard
 */
export async function getStaffSummary() {
  try {
    const employees = await getEmployees()
    const today = new Date().toISOString().split('T')[0]

    // Get today's attendance
    const attendance = await queryDocuments('attendance', [
      { field: 'date', operator: '==', value: today }
    ])

    const totalEmployees = employees.length
    const presentToday = attendance.filter((a: any) => a.status === 'present').length
    const absentToday = totalEmployees - presentToday
    const onBreak = attendance.filter((a: any) => a.breakStart && !a.breakEnd).length

    return {
      totalEmployees,
      presentToday,
      absentToday,
      onBreak
    }
  } catch (error) {
    console.error('Error getting staff summary:', error)
    return {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      onBreak: 0
    }
  }
}

/**
 * Search employees
 */
export async function searchEmployees(query: string) {
  try {
    const employees = await getEmployees()
    
    const filtered = employees.filter(emp => 
      emp.name.toLowerCase().includes(query.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(query.toLowerCase()) ||
      emp.mobile.includes(query) ||
      emp.department.toLowerCase().includes(query.toLowerCase())
    )

    return filtered
  } catch (error) {
    console.error('Error searching employees:', error)
    return []
  }
}