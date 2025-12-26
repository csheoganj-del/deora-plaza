"use server"

import { createDocument } from "@/lib/supabase/database"
import { requireAuth } from "@/lib/auth-helpers"

/**
 * SECURITY: Audit logging for compliance and security monitoring
 * Logs all critical operations for forensic analysis
 */

export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'LOGIN_FAILED'
    | 'CREATE_BILL'
    | 'DELETE_BILL'
    | 'UPDATE_BILL'
    | 'CREATE_ORDER'
    | 'UPDATE_ORDER'
    | 'DELETE_ORDER'
    | 'CREATE_USER'
    | 'UPDATE_USER'
    | 'DELETE_USER'
    | 'CREATE_CUSTOMER'
    | 'UPDATE_CUSTOMER'
    | 'DELETE_CUSTOMER'
    | 'RESET_DATA'
    | 'GENERATE_SETTLEMENT'
    | 'PAYMENT_PROCESSED'
    | 'DISCOUNT_APPLIED'
    | 'ACCESS_DENIED'

export interface AuditLogEntry {
    action: AuditAction
    userId?: string
    username?: string
    role?: string
    businessUnit?: string
    details: Record<string, any>
    ipAddress?: string
    userAgent?: string
    success: boolean
    errorMessage?: string
    timestamp: string // Using ISO string instead of Date for Supabase
}

/**
 * Create an audit log entry
 * This is a zero-cost solution using Supabase
 */
export async function createAuditLog(
    action: AuditAction,
    details: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
) {
    try {
        // Get current user session (if available)
        let session
        try {
            session = await requireAuth()
        } catch {
            // User not authenticated - that's okay for some actions like LOGIN_FAILED
            session = null
        }

        const logEntry: AuditLogEntry = {
            action,
            userId: session?.user?.id,
            username: session?.user?.username,
            role: session?.user?.role,
            businessUnit: session?.user?.businessUnit,
            details,
            success,
            errorMessage,
            timestamp: new Date().toISOString(), // Using ISO string for Supabase
        }

        // Store in Supabase table 'audit_logs'
        await createDocument('audit_logs', logEntry)

        // For critical failures, also log to console
        if (!success) {
            console.error('[AUDIT]', action, 'failed:', errorMessage, details)
        }
    } catch (error) {
        // Audit logging should never break the application
        console.error('Failed to create audit log:', error)
    }
}

/**
 * Log authentication events
 */
export async function auditLogin(username: string, success: boolean, errorMessage?: string) {
    await createAuditLog(
        success ? 'LOGIN' : 'LOGIN_FAILED',
        { username },
        success,
        errorMessage
    )
}

/**
 * Log financial operations
 */
export async function auditBillOperation(
    operation: 'CREATE_BILL' | 'DELETE_BILL' | 'UPDATE_BILL',
    billId: string,
    billNumber?: string,
    amount?: number,
    success: boolean = true
) {
    await createAuditLog(
        operation,
        { billId, billNumber, amount },
        success
    )
}

/**
 * Log data deletion
 */
export async function auditDataDeletion(
    entityType: string,
    entityId: string,
    additionalDetails?: Record<string, any>
) {
    await createAuditLog(
        'DELETE_ORDER', // Generic deletion action
        { entityType, entityId, ...additionalDetails },
        true
    )
}

/**
 * Log user management actions
 */
export async function auditUserManagement(
    action: 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER',
    targetUsername: string,
    changes?: Record<string, any>
) {
    await createAuditLog(
        action,
        { targetUsername, changes },
        true
    )
}

/**
 * Log access denied attempts
 */
export async function auditAccessDenied(
    attemptedAction: string,
    reason: string
) {
    await createAuditLog(
        'ACCESS_DENIED',
        { attemptedAction, reason },
        false,
        reason
    )
}

/**
 * Log settlement generation
 */
export async function auditSettlement(
    settlementId: string,
    businessUnit: string,
    amount: number,
    period: string
) {
    await createAuditLog(
        'GENERATE_SETTLEMENT',
        { settlementId, businessUnit, amount, period },
        true
    )
}

/**
 * Log discount applications for fraud detection
 */
export async function auditDiscount(
    billId: string,
    customerId: string,
    discountPercent: number,
    discountAmount: number,
    reason: string
) {
    await createAuditLog(
        'DISCOUNT_APPLIED',
        { billId, customerId, discountPercent, discountAmount, reason },
        true
    )
}

/**
 * Log system reset (critical operation)
 */
export async function auditSystemReset(success: boolean, errorMessage?: string) {
    await createAuditLog(
        'RESET_DATA',
        { warning: 'All data deleted' },
        success,
        errorMessage
    )
}

