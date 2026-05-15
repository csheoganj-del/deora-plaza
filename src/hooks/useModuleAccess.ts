"use client"

import { useState, useCallback } from 'react'
import { useServerAuth } from '@/hooks/useServerAuth'
import type { ModuleName } from '@/types/permissions'

interface ModuleSettings {
  enableBarModule?: boolean;
  enableCafeModule?: boolean;
  enableHotelModule?: boolean;
  enableGardenModule?: boolean;
  enableInventoryModule?: boolean;
  enableAnalyticsModule?: boolean;
  enableKitchenModule?: boolean;
  enableBillingModule?: boolean;
  enableCustomerModule?: boolean;
  enableMenuModule?: boolean;
  enableUserManagementModule?: boolean;
  enableOrderManagementModule?: boolean;
  enableTablesModule?: boolean;
  enableStatisticsModule?: boolean;
  enableLocationsModule?: boolean;
  enableGSTReportModule?: boolean;
  enableSettlementsModule?: boolean;
  enableDiscountsModule?: boolean;
  enableRealtimeModule?: boolean;
  enableAutomationModule?: boolean;
  enableStaffPerformanceModule?: boolean;
  enableDailyReportsModule?: boolean;
  enableKitchenDisplayModule?: boolean;
  enableWaiterInterfaceModule?: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  moduleKey?: keyof ModuleSettings;
  module?: ModuleName;
}

/**
 * Stripped down Module Access Hook
 * Instantly resolves to true for cafe application
 */
export function useModuleAccess() {
  const { data: session } = useServerAuth();
  
  // All modules are considered enabled in the stripped down version
  const isModuleEnabled = useCallback((moduleKey: keyof ModuleSettings): boolean => {
    return true;
  }, []);

  // Instantly return true to bypass slow RBAC/DB checks
  const hasModuleAccess = useCallback((
    moduleKey: keyof ModuleSettings,
    permissionModule?: ModuleName,
    requiredRoles?: string[]
  ): boolean => {
    return true; 
  }, []);

  const filterNavigationItems = useCallback((items: NavigationItem[]): NavigationItem[] => {
    // Only filter based on basic roles to keep navigation clean, but without async delays
    return items.filter(item => {
      const userRole = session?.user?.role;
      const isSuperAdmin = userRole === "super_admin" || userRole === "owner";
      return isSuperAdmin || (userRole && item.roles.includes(userRole));
    });
  }, [session?.user?.role]);

  const getModuleStatus = useCallback(() => {
    return [];
  }, []);

  return {
    moduleSettings: {},
    loading: false, // Instantly resolved
    isModuleEnabled,
    hasModuleAccess,
    filterNavigationItems,
    getModuleStatus,
    refreshSettings: async () => {}
  };
}

export function useModuleGuard(
  moduleKey: keyof ModuleSettings,
  permissionModule?: ModuleName,
  requiredRoles?: string[]
) {
  return {
    loading: false,
    hasAccess: true,
    isModuleAccessible: () => true
  };
}