import { supabaseServer } from "@/lib/supabase/server"

/**
 * SECURITY: Role-based access control helpers
 * Use these functions to verify user permissions in server actions
 */

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'cafe_manager' | 'bar_manager' | 'hotel_manager' | 'garden_manager' | 'waiter' | 'kitchen' | 'bartender' | 'reception' | 'hotel_reception'
export type BusinessUnit = 'all' | 'cafe' | 'bar' | 'hotel' | 'garden'

export interface AuthSession {
    user: {
        id: string
        username: string
        role: UserRole
        businessUnit: BusinessUnit
    }
}

/**
 * Get current authenticated user session
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthSession> {
    try {
        // Import custom auth helper
        const { getCurrentCustomUser } = await import("@/actions/custom-auth");

        // Get user from JWT token
        const user = await getCurrentCustomUser();

        if (!user) {
            throw new Error('Unauthorized: Please log in');
        }

        return {
            user: {
                id: user.userId as string,
                username: user.username as string || user.phoneNumber as string || '',
                role: user.role as UserRole,
                businessUnit: user.businessUnit as BusinessUnit
            }
        }
    } catch (error) {
        console.error("Auth error:", error);
        throw new Error('Unauthorized: Please log in');
    }
}

/**
 * Verify user has one of the required roles
 * Throws error if user doesn't have permission
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSession> {
    const session = await requireAuth()

    if (!allowedRoles.includes(session.user.role as UserRole)) {
        throw new Error(`Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}`)
    }

    return session
}

/**
 * Verify user has access to specified business unit
 * Super admins and owners have access to all units
 */
export async function requireBusinessUnit(requiredUnit: BusinessUnit): Promise<AuthSession> {
    const session = await requireAuth()

    // Super admin and owner can access everything
    if (session.user.role === 'super_admin' || session.user.role === 'owner') {
        return session
    }

    // Check if user's business unit matches or is 'all'
    if (session.user.businessUnit !== 'all' && session.user.businessUnit !== requiredUnit) {
        throw new Error(`Forbidden: You don't have access to ${requiredUnit}`)
    }

    return session
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
    try {
        const session = await requireAuth()
        return session.user.role === 'super_admin'
    } catch {
        return false
    }
}

/**
 * Check if user is owner or admin
 */
export async function isOwnerOrAdmin(): Promise<boolean> {
    try {
        const session = await requireAuth()
        return session.user.role === 'super_admin' || session.user.role === 'owner'
    } catch {
        return false
    }
}

/**
 * Verify user can perform financial operations
 * Only super_admin, owner, and managers can access financial data
 */
export async function requireFinancialAccess(): Promise<AuthSession> {
    return requireRole(['super_admin', 'owner', 'manager', 'cafe_manager', 'bar_manager', 'hotel_manager', 'garden_manager'])
}

/**
 * Verify user can delete data
 * Only super_admin can delete
 */
export async function requireDeletePermission(): Promise<AuthSession> {
    return requireRole(['super_admin'])
}

/**
 * Verify user can manage staff
 * Only super_admin can manage users
 */
export async function requireStaffManagement(): Promise<AuthSession> {
    return requireRole(['super_admin'])
}

/**
 * Get user's accessible business units
 */
export async function getAccessibleBusinessUnits(): Promise<BusinessUnit[]> {
    const session = await requireAuth()

    if (session.user.role === 'super_admin' || session.user.role === 'owner' || session.user.businessUnit === 'all') {
        return ['cafe', 'bar', 'hotel', 'garden']
    }

    return [session.user.businessUnit as BusinessUnit]
}

