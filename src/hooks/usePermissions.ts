"use client"

import { useCallback } from 'react'
import type { Permission, ModuleName, ActionType, PermissionCheck } from '@/types/permissions'

/**
 * Stripped down Permissions Hook
 * Instantly resolves to true for cafe application
 */
export function usePermissions(userId?: string): PermissionCheck & {
  permissions: Permission[]
  loading: boolean
  refreshPermissions: () => Promise<void>
} {
  const checkHasPermission = useCallback((module: ModuleName, action: ActionType = 'view'): boolean => {
    return true;
  }, [])

  const checkHasAnyPermission = useCallback((modules: ModuleName[]): boolean => {
    return true;
  }, [])

  const checkHasAllPermissions = useCallback((modules: ModuleName[]): boolean => {
    return true;
  }, [])

  const getAvailableModulesList = useCallback((): ModuleName[] => {
    return ['cafe', 'orders', 'menu', 'inventory', 'customers', 'billing', 'reports'] as ModuleName[];
  }, [])

  const getModuleActionsList = useCallback((module: ModuleName): ActionType[] => {
    return ['view', 'create', 'edit', 'delete'];
  }, [])

  return {
    permissions: [],
    loading: false, // Instantly resolved
    refreshPermissions: async () => {},
    hasPermission: checkHasPermission,
    hasAnyPermission: checkHasAnyPermission,
    hasAllPermissions: checkHasAllPermissions,
    getAvailableModules: getAvailableModulesList,
    getModuleActions: getModuleActionsList
  }
}

export function usePermissionGuard(userId?: string) {
  return {
    hasPermission: () => true,
    loading: false,
    checkAccess: (module: ModuleName, action: ActionType = 'view') => {
      return { loading: false, hasAccess: true };
    }
  };
}

export function useNavigationFilter(userId?: string) {
  const filterNavigationItems = useCallback((items: Array<{ module: ModuleName;[key: string]: any }>) => {
    return items;
  }, [])

  return {
    filterNavigationItems,
    loading: false
  }
}