"use server"

import { createDocument, updateDocument, queryDocuments, deleteDocument } from "@/lib/supabase/database"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import type { UserRole, Permission, UserPermissions, ModuleName, ActionType } from "@/types/permissions"
import { DEFAULT_ROLES, MODULE_CONFIGS } from "@/types/permissions"

/**
 * Create a new role
 */
export async function createRole(data: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const roleData: Omit<UserRole, 'id'> = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await createDocument('user_roles', roleData)

    if (result.success) {
      await createAuditLog(
        'ROLE_CREATED',
        { roleId: result.data?.id, roleName: data.name },
        true,
        `Role ${data.name} created`
      )

      revalidatePath('/dashboard/admin/permissions')
      return { success: true, roleId: result.data?.id }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error creating role:', error)
    return { success: false, error: 'Failed to create role' }
  }
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(roleId: string, permissions: Permission[]) {
  try {
    const result = await updateDocument('user_roles', roleId, {
      permissions,
      updatedAt: new Date().toISOString()
    })

    if (result.success) {
      await createAuditLog(
        'ROLE_PERMISSIONS_UPDATED',
        { roleId, permissionCount: permissions.length },
        true,
        `Role permissions updated for ${roleId}`
      )

      revalidatePath('/dashboard/admin/permissions')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error updating role permissions:', error)
    return { success: false, error: 'Failed to update role permissions' }
  }
}

/**
 * Assign role to user
 */
export async function assignUserRole(userId: string, roleId: string, customPermissions?: Permission[]) {
  try {
    // Check if user already has permissions assigned
    const existing = await queryDocuments('user_permissions', [
      { field: 'user_id', operator: '==', value: userId }
    ])

    const permissionData: Omit<UserPermissions, 'id'> = {
      user_id: userId,
      role_id: roleId,
      custom_permissions: customPermissions
    }

    let result
    if (existing.length > 0) {
      result = await updateDocument('user_permissions', existing[0].id, permissionData)
    } else {
      result = await createDocument('user_permissions', permissionData)
    }

    if (result.success) {
      await createAuditLog(
        'USER_ROLE_ASSIGNED',
        { userId, roleId },
        true,
        `Role ${roleId} assigned to user ${userId}`
      )

      revalidatePath('/dashboard/admin/permissions')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error assigning user role:', error)
    return { success: false, error: 'Failed to assign user role' }
  }
}

/**
 * Get all roles
 */
export async function getRoles() {
  try {
    const roles = await queryDocuments('user_roles', [], 'name', 'asc')
    return roles as UserRole[]
  } catch (error) {
    console.error('Error fetching roles:', error)
    
    // If table doesn't exist, return empty array gracefully
    if (error?.message?.includes('user_roles')) {
      console.warn('user_roles table not found - returning empty roles array')
      return []
    }
    
    return []
  }
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  try {
    const permissions = await queryDocuments('user_permissions', [
      { field: 'user_id', operator: '==', value: userId }
    ])

    return permissions[0] as UserPermissions || null
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    
    // If table doesn't exist, return null gracefully
    if (error?.message?.includes('user_permissions')) {
      console.warn('user_permissions table not found - returning null permissions')
      return null
    }
    
    return null
  }
}

/**
 * Get effective permissions for user (role + custom permissions)
 */
export async function getEffectivePermissions(userId: string): Promise<Permission[]> {
  try {
    const userPermissions = await getUserPermissions(userId)
    
    if (!userPermissions) {
      return []
    }

    // Get role permissions
    const roles = await queryDocuments('user_roles', [
      { field: 'id', operator: '==', value: userPermissions.role_id }
    ])

    if (roles.length === 0) {
      return userPermissions.custom_permissions || []
    }

    const role = roles[0] as UserRole
    let effectivePermissions = [...role.permissions]

    // Apply custom permissions (override role permissions)
    if (userPermissions.custom_permissions) {
      userPermissions.custom_permissions.forEach(customPerm => {
        const existingIndex = effectivePermissions.findIndex(p => p.module === customPerm.module)
        if (existingIndex >= 0) {
          effectivePermissions[existingIndex] = customPerm
        } else {
          effectivePermissions.push(customPerm)
        }
      })
    }

    // Apply overrides
    if (userPermissions.overrides) {
      userPermissions.overrides.forEach(override => {
        const existingIndex = effectivePermissions.findIndex(p => p.module === override.module)
        if (existingIndex >= 0) {
          effectivePermissions[existingIndex] = {
            module: override.module,
            actions: override.actions,
            enabled: override.enabled
          }
        } else {
          effectivePermissions.push({
            module: override.module,
            actions: override.actions,
            enabled: override.enabled
          })
        }
      })
    }

    return effectivePermissions
  } catch (error) {
    console.error('Error getting effective permissions:', error)
    return []
  }
}

/**
 * Check if user has permission
 */
export async function hasPermission(
  userId: string, 
  module: ModuleName, 
  action: ActionType = 'view'
): Promise<boolean> {
  try {
    const permissions = await getEffectivePermissions(userId)
    
    const modulePermission = permissions.find(p => p.module === module)
    
    if (!modulePermission || !modulePermission.enabled) {
      return false
    }

    return modulePermission.actions.includes(action)
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Get available modules for user
 */
export async function getAvailableModules(userId: string): Promise<ModuleName[]> {
  try {
    const permissions = await getEffectivePermissions(userId)
    
    return permissions
      .filter(p => p.enabled && p.actions.length > 0)
      .map(p => p.module)
  } catch (error) {
    console.error('Error getting available modules:', error)
    return []
  }
}

/**
 * Initialize default roles
 */
export async function initializeDefaultRoles() {
  try {
    const existingRoles = await getRoles()
    
    if (existingRoles.length > 0) {
      return { success: true, message: 'Roles already initialized' }
    }

    // Create default roles with permissions
    const rolePromises = DEFAULT_ROLES.map(async (roleData) => {
      let permissions: Permission[] = []

      switch (roleData.name) {
        case 'Super Admin':
          // Full access to all modules
          permissions = MODULE_CONFIGS.map(module => ({
            module: module.name,
            actions: [...module.defaultActions, 'delete', 'approve', 'export'],
            enabled: true
          }))
          break

        case 'Manager':
          // Access to core operations and management
          permissions = MODULE_CONFIGS
            .filter(m => ['core', 'business', 'management'].includes(m.category))
            .map(module => ({
              module: module.name,
              actions: module.defaultActions,
              enabled: true
            }))
          break

        case 'Staff':
          // Basic access to core modules
          permissions = MODULE_CONFIGS
            .filter(m => ['dashboard', 'orders', 'customers', 'attendance'].includes(m.name))
            .map(module => ({
              module: module.name,
              actions: ['view'],
              enabled: true
            }))
          break

        case 'Accountant':
          // Financial modules access
          permissions = MODULE_CONFIGS
            .filter(m => ['dashboard', 'billing', 'expenses', 'salary', 'analytics', 'reports'].includes(m.name))
            .map(module => ({
              module: module.name,
              actions: module.defaultActions,
              enabled: true
            }))
          break

        case 'Inventory Manager':
          // Inventory and supply chain
          permissions = MODULE_CONFIGS
            .filter(m => ['dashboard', 'inventory', 'menu', 'expenses', 'reports'].includes(m.name))
            .map(module => ({
              module: module.name,
              actions: module.defaultActions,
              enabled: true
            }))
          break

        case 'HR Manager':
          // Human resources modules
          permissions = MODULE_CONFIGS
            .filter(m => ['dashboard', 'staff', 'attendance', 'salary', 'reports'].includes(m.name))
            .map(module => ({
              module: module.name,
              actions: module.defaultActions,
              enabled: true
            }))
          break
      }

      return createRole({
        ...roleData,
        permissions
      })
    })

    const results = await Promise.all(rolePromises)
    const successCount = results.filter(r => r.success).length

    await createAuditLog(
      'DEFAULT_ROLES_INITIALIZED',
      { rolesCreated: successCount },
      true,
      `${successCount} default roles initialized`
    )

    return { success: true, rolesCreated: successCount }
  } catch (error) {
    console.error('Error initializing default roles:', error)
    return { success: false, error: 'Failed to initialize default roles' }
  }
}

/**
 * Clone role with new name
 */
export async function cloneRole(sourceRoleId: string, newRoleName: string) {
  try {
    const roles = await queryDocuments('user_roles', [
      { field: 'id', operator: '==', value: sourceRoleId }
    ])

    if (roles.length === 0) {
      return { success: false, error: 'Source role not found' }
    }

    const sourceRole = roles[0] as UserRole

    const newRoleData = {
      name: newRoleName,
      description: `Cloned from ${sourceRole.name}`,
      permissions: sourceRole.permissions,
      isActive: true
    }

    return await createRole(newRoleData)
  } catch (error) {
    console.error('Error cloning role:', error)
    return { success: false, error: 'Failed to clone role' }
  }
}

/**
 * Delete role
 */
export async function deleteRole(roleId: string) {
  try {
    // Check if role is assigned to any users
    const userPermissions = await queryDocuments('user_permissions', [
      { field: 'role_id', operator: '==', value: roleId }
    ])

    if (userPermissions.length > 0) {
      return { success: false, error: 'Cannot delete role that is assigned to users' }
    }

    const result = await deleteDocument('user_roles', roleId)

    if (result.success) {
      await createAuditLog(
        'ROLE_DELETED',
        { roleId },
        true,
        `Role ${roleId} deleted`
      )

      revalidatePath('/dashboard/admin/permissions')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error deleting role:', error)
    return { success: false, error: 'Failed to delete role' }
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(roleId: string) {
  try {
    const userPermissions = await queryDocuments('user_permissions', [
      { field: 'role_id', operator: '==', value: roleId }
    ])

    const userIds = userPermissions.map((up: any) => up.user_id)
    
    if (userIds.length === 0) {
      return []
    }

    // Get user details
    const users = await queryDocuments('users', [
      { field: 'id', operator: 'in', value: userIds }
    ])

    return users
  } catch (error) {
    console.error('Error getting users by role:', error)
    return []
  }
}