"use server"

import { createDocument, updateDocument, queryDocuments } from "@/lib/supabase/database"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import type { Expense } from "@/types/business-management"

/**
 * Create new expense
 */
export async function createExpense(data: Omit<Expense, 'id' | 'createdAt' | 'status'>, createdBy: string) {
  try {
    const expenseData: Omit<Expense, 'id'> = {
      ...data,
      status: 'pending',
      createdBy,
      createdAt: new Date().toISOString()
    }

    const result = await createDocument('expenses', expenseData)

    if (result.success) {
      await createAuditLog(
        'EXPENSE_CREATED',
        { 
          expenseId: result.data?.id,
          category: data.category,
          amount: data.amount,
          businessUnit: data.businessUnit
        },
        true,
        `Expense of ₹${data.amount} created for ${data.category}`
      )

      revalidatePath('/dashboard/expenses')
      return { success: true, expenseId: result.data?.id }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error creating expense:', error)
    return { success: false, error: 'Failed to create expense' }
  }
}

/**
 * Update expense
 */
export async function updateExpense(id: string, data: Partial<Expense>) {
  try {
    const result = await updateDocument('expenses', id, data)

    if (result.success) {
      await createAuditLog(
        'EXPENSE_UPDATED',
        { expenseId: id, updates: Object.keys(data) },
        true,
        `Expense ${id} updated`
      )

      revalidatePath('/dashboard/expenses')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error updating expense:', error)
    return { success: false, error: 'Failed to update expense' }
  }
}

/**
 * Approve/Reject expense
 */
export async function processExpense(
  expenseId: string, 
  action: 'approved' | 'rejected', 
  approvedBy: string
) {
  try {
    const result = await updateDocument('expenses', expenseId, {
      status: action,
      approvedBy
    })

    if (result.success) {
      await createAuditLog(
        'EXPENSE_PROCESSED',
        { expenseId, action, approvedBy },
        true,
        `Expense ${expenseId} ${action} by ${approvedBy}`
      )

      revalidatePath('/dashboard/expenses')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error processing expense:', error)
    return { success: false, error: 'Failed to process expense' }
  }
}

/**
 * Get expenses
 */
export async function getExpenses(
  businessUnit?: string,
  category?: string,
  status?: string,
  startDate?: string,
  endDate?: string
) {
  try {
    const filters = []

    if (businessUnit && businessUnit !== 'all') {
      filters.push({ field: 'businessUnit', operator: '==', value: businessUnit })
    }

    if (category) {
      filters.push({ field: 'category', operator: '==', value: category })
    }

    if (status) {
      filters.push({ field: 'status', operator: '==', value: status })
    }

    if (startDate) {
      filters.push({ field: 'date', operator: '>=', value: startDate })
    }

    if (endDate) {
      filters.push({ field: 'date', operator: '<=', value: endDate })
    }

    const expenses = await queryDocuments('expenses', filters, 'date', 'desc')
    return expenses as Expense[]
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return []
  }
}

/**
 * Get expense summary
 */
export async function getExpenseSummary(month?: string) {
  try {
    const targetMonth = month || new Date().toISOString().slice(0, 7) // YYYY-MM
    const startDate = `${targetMonth}-01`
    const endDate = `${targetMonth}-31`
    
    const expenses = await getExpenses(undefined, undefined, undefined, startDate, endDate)
    
    const totalExpenses = expenses
      .filter(exp => exp.status === 'approved')
      .reduce((sum, exp) => sum + exp.amount, 0)
    
    const pendingApprovals = expenses.filter(exp => exp.status === 'pending').length
    
    // Group by category
    const byCategory: Record<string, number> = {}
    expenses
      .filter(exp => exp.status === 'approved')
      .forEach(exp => {
        byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount
      })

    return {
      month: targetMonth,
      totalExpenses,
      byCategory,
      pendingApprovals
    }
  } catch (error) {
    console.error('Error getting expense summary:', error)
    return {
      month: month || new Date().toISOString().slice(0, 7),
      totalExpenses: 0,
      byCategory: {},
      pendingApprovals: 0
    }
  }
}

/**
 * Get expense analytics
 */
export async function getExpenseAnalytics(startDate: string, endDate: string) {
  try {
    const expenses = await getExpenses(undefined, undefined, 'approved', startDate, endDate)
    
    // Group by business unit
    const byBusinessUnit: Record<string, number> = {}
    expenses.forEach(exp => {
      byBusinessUnit[exp.businessUnit] = (byBusinessUnit[exp.businessUnit] || 0) + exp.amount
    })
    
    // Group by category
    const byCategory: Record<string, number> = {}
    expenses.forEach(exp => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount
    })
    
    // Monthly trend
    const monthlyTrend: Record<string, number> = {}
    expenses.forEach(exp => {
      const month = exp.date.slice(0, 7) // YYYY-MM
      monthlyTrend[month] = (monthlyTrend[month] || 0) + exp.amount
    })
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0
    
    return {
      totalExpenses,
      averageExpense: Math.round(averageExpense),
      expenseCount: expenses.length,
      byBusinessUnit,
      byCategory,
      monthlyTrend
    }
  } catch (error) {
    console.error('Error getting expense analytics:', error)
    return {
      totalExpenses: 0,
      averageExpense: 0,
      expenseCount: 0,
      byBusinessUnit: {},
      byCategory: {},
      monthlyTrend: {}
    }
  }
}

/**
 * Get profitability analysis
 */
export async function getProfitabilityAnalysis(month: string) {
  try {
    const startDate = `${month}-01`
    const endDate = `${month}-31`
    
    // Get expenses for the month
    const expenses = await getExpenses(undefined, undefined, 'approved', startDate, endDate)
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    // Get revenue from orders (assuming we have this data)
    const orders = await queryDocuments('orders', [
      { field: 'createdAt', operator: '>=', value: startDate },
      { field: 'createdAt', operator: '<=', value: endDate },
      { field: 'status', operator: '==', value: 'completed' }
    ])
    
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
    
    // Get salary expenses
    const salaryRecords = await queryDocuments('salary_records', [
      { field: 'month', operator: '==', value: month },
      { field: 'status', operator: '==', value: 'paid' }
    ])
    
    const totalSalaryExpense = salaryRecords.reduce((sum: number, record: any) => sum + record.netSalary, 0)
    
    const totalCosts = totalExpenses + totalSalaryExpense
    const grossProfit = totalRevenue - totalCosts
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    
    // Break down by business unit
    const unitAnalysis: Record<string, any> = {}
    
    const businessUnits = ['restaurant', 'cafe', 'bar', 'hotel', 'garden']
    
    for (const unit of businessUnits) {
      const unitOrders = orders.filter((order: any) => order.businessUnit === unit)
      const unitRevenue = unitOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
      
      const unitExpenses = expenses
        .filter(exp => exp.businessUnit === unit)
        .reduce((sum, exp) => sum + exp.amount, 0)
      
      const unitProfit = unitRevenue - unitExpenses
      const unitMargin = unitRevenue > 0 ? (unitProfit / unitRevenue) * 100 : 0
      
      unitAnalysis[unit] = {
        revenue: unitRevenue,
        expenses: unitExpenses,
        profit: unitProfit,
        margin: Math.round(unitMargin * 100) / 100
      }
    }
    
    return {
      month,
      totalRevenue,
      totalExpenses,
      totalSalaryExpense,
      totalCosts,
      grossProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      unitAnalysis
    }
  } catch (error) {
    console.error('Error getting profitability analysis:', error)
    return {
      month,
      totalRevenue: 0,
      totalExpenses: 0,
      totalSalaryExpense: 0,
      totalCosts: 0,
      grossProfit: 0,
      profitMargin: 0,
      unitAnalysis: {}
    }
  }
}

/**
 * Delete expense
 */
export async function deleteExpense(id: string) {
  try {
    const result = await updateDocument('expenses', id, {
      status: 'cancelled'
    })

    if (result.success) {
      await createAuditLog(
        'EXPENSE_DELETED',
        { expenseId: id },
        true,
        `Expense ${id} deleted`
      )

      revalidatePath('/dashboard/expenses')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error deleting expense:', error)
    return { success: false, error: 'Failed to delete expense' }
  }
}