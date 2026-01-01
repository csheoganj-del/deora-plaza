"use client"

import { useState, useEffect, useCallback } from 'react'
import { getEffectivePermissions, hasPermission, getAvailableModules } from '@/actions/permissions'
import type { Permission, ModuleName, ActionType, PermissionCheck } from '@/types/permissions'

/**
 * Hook for managing user permissions
 */
export function usePermissions(userId?: string): PermissionCheck & {
  permissions: Permission[]
  loading: boolean
  refreshPermissions: () => Promise<void>
} {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  const loadPermissions = useCallback(async () => {
    if (!userId) {
      setPermissions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const userPermissions = await getEffectivePermissions(userId)
      setPermissions(userPermissions)
    } catch (error) {
      console.error('Error loading permissions:', error)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  // FIX: Only depend on userId to avoid infinite render loop
  useEffect(() => {
    loadPermissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const checkHasPermission = useCallback((module: ModuleName, action: ActionType = 'view'): boolean => {
    const modulePermission = permissions.find(p => p.module === module)

    if (!modulePermission || !modulePermission.enabled) {
      return false
    }

    return modulePermission.actions.includes(action)
  }, [permissions])

  const checkHasAnyPermission = useCallback((modules: ModuleName[]): boolean => {
    return modules.some(module => {
      const modulePermission = permissions.find(p => p.module === module)
      return modulePermission && modulePermission.enabled && modulePermission.actions.length > 0
    })
  }, [permissions])

  const checkHasAllPermissions = useCallback((modules: ModuleName[]): boolean => {
    return modules.every(module => {
      const modulePermission = permissions.find(p => p.module === module)
      return modulePermission && modulePermission.enabled && modulePermission.actions.length > 0
    })
  }, [permissions])

  const getAvailableModulesList = useCallback((): ModuleName[] => {
    return permissions
      .filter(p => p.enabled && p.actions.length > 0)
      .map(p => p.module)
  }, [permissions])

  const getModuleActionsList = useCallback((module: ModuleName): ActionType[] => {
    const modulePermission = permissions.find(p => p.module === module)
    return modulePermission?.enabled ? modulePermission.actions : []
  }, [permissions])

  return {
    permissions,
    loading,
    refreshPermissions: loadPermissions,
    hasPermission: checkHasPermission,
    hasAnyPermission: checkHasAnyPermission,
    hasAllPermissions: checkHasAllPermissions,
    getAvailableModules: getAvailableModulesList,
    getModuleActions: getModuleActionsList
  }
}

/**
 * Hook for permission-based access checking
 */
export function usePermissionGuard(userId?: string) {
  const { hasPermission, loading } = usePermissions(userId);

  return {
    hasPermission,
    loading,
    checkAccess: (module: ModuleName, action: ActionType = 'view') => {
      if (loading) return { loading: true, hasAccess: false };
      return { loading: false, hasAccess: hasPermission(module, action) };
    }
  };
}

/**
 * Hook for filtering navigation items based on permissions
 */
export function useNavigationFilter(userId?: string) {
  const { getAvailableModules, loading } = usePermissions(userId)

  const filterNavigationItems = useCallback((items: Array<{ module: ModuleName;[key: string]: any }>) => {
    if (loading) return []

    const availableModules = getAvailableModules()
    return items.filter(item => availableModules.includes(item.module))
  }, [getAvailableModules, loading])

  return {
    filterNavigationItems,
    loading
  }
}