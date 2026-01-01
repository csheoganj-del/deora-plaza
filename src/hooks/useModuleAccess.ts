"use client"

import { useState, useEffect, useCallback } from 'react'
import { getBusinessSettings } from '@/actions/businessSettings'
import { usePermissions } from '@/hooks/usePermissions'
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
 * Hook for checking module access based on both permissions and business settings
 */
export function useModuleAccess() {
  const [moduleSettings, setModuleSettings] = useState<ModuleSettings>({});
  const [loading, setLoading] = useState(true);
  const { data: session } = useServerAuth();
  const { hasPermission, hasAnyPermission } = usePermissions(session?.user?.userId);

  useEffect(() => {
    loadModuleSettings();
  }, []);

  const loadModuleSettings = async () => {
    try {
      const settings = await getBusinessSettings();
      if (settings) {
        setModuleSettings(settings);
      }
    } catch (error) {
      console.error('Error loading module settings:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if a module is enabled in business settings
   */
  const isModuleEnabled = useCallback((moduleKey: keyof ModuleSettings): boolean => {
    return moduleSettings[moduleKey] !== false; // Default to enabled if not set
  }, [moduleSettings]);

  /**
   * Check if user has access to a module (both permission and module enabled)
   */
  const hasModuleAccess = useCallback((
    moduleKey: keyof ModuleSettings,
    permissionModule?: ModuleName,
    requiredRoles?: string[]
  ): boolean => {
    // Check if module is enabled in business settings
    if (!isModuleEnabled(moduleKey)) {
      return false;
    }

    // Check role-based access
    const userRole = session?.user?.role;
    const isSuperAdmin = userRole === "super_admin" || userRole === "owner";

    if (isSuperAdmin) {
      return true; // Super admin has access to all enabled modules
    }

    // Check if user role is in required roles
    if (requiredRoles && userRole && !requiredRoles.includes(userRole)) {
      return false;
    }

    // Check permission-based access if permission module is specified
    if (permissionModule) {
      return hasPermission(permissionModule, 'view');
    }

    return true;
  }, [isModuleEnabled, session?.user?.role, hasPermission]);

  /**
   * Filter navigation items based on module access
   */
  const filterNavigationItems = useCallback((items: NavigationItem[]): NavigationItem[] => {
    if (loading) return [];

    return items.filter(item => {
      // If no module key specified, use role-based filtering only
      if (!item.moduleKey) {
        const userRole = session?.user?.role;
        const isSuperAdmin = userRole === "super_admin" || userRole === "owner";
        return isSuperAdmin || (userRole && item.roles.includes(userRole));
      }

      // Use module access check
      return hasModuleAccess(item.moduleKey, item.module, item.roles);
    });
  }, [loading, session?.user?.role, hasModuleAccess]);

  /**
   * Get module status for admin interface
   */
  const getModuleStatus = useCallback(() => {
    const modules = [
      { key: 'enableBarModule', name: 'Bar', category: 'operations' },
      { key: 'enableHotelModule', name: 'Hotel', category: 'operations' },
      { key: 'enableGardenModule', name: 'Garden', category: 'operations' },
      { key: 'enableInventoryModule', name: 'Inventory', category: 'management' },
      { key: 'enableAnalyticsModule', name: 'Analytics', category: 'management' },
      { key: 'enableKitchenModule', name: 'Kitchen', category: 'operations' },
      { key: 'enableBillingModule', name: 'Billing', category: 'operations' },
      { key: 'enableCustomerModule', name: 'Customers', category: 'operations' },
      { key: 'enableMenuModule', name: 'Menu', category: 'operations' },
      { key: 'enableUserManagementModule', name: 'User Management', category: 'admin' },
      { key: 'enableOrderManagementModule', name: 'Order Management', category: 'management' },
      { key: 'enableTablesModule', name: 'Tables', category: 'operations' },
      { key: 'enableStatisticsModule', name: 'Statistics', category: 'reports' },
      { key: 'enableLocationsModule', name: 'Locations', category: 'admin' },
      { key: 'enableGSTReportModule', name: 'GST Reports', category: 'reports' },
      { key: 'enableSettlementsModule', name: 'Settlements', category: 'reports' },
      { key: 'enableDiscountsModule', name: 'Discounts', category: 'management' },
      { key: 'enableRealtimeModule', name: 'Real-time', category: 'management' },
      { key: 'enableAutomationModule', name: 'Automation', category: 'management' },
      { key: 'enableStaffPerformanceModule', name: 'Staff Performance', category: 'management' },
      { key: 'enableDailyReportsModule', name: 'Daily Reports', category: 'reports' },
      { key: 'enableKitchenDisplayModule', name: 'Kitchen Display', category: 'operations' },
      { key: 'enableWaiterInterfaceModule', name: 'Waiter Interface', category: 'operations' }
    ] as const;

    return modules.map(module => ({
      ...module,
      enabled: isModuleEnabled(module.key as keyof ModuleSettings)
    }));
  }, [isModuleEnabled]);

  return {
    moduleSettings,
    loading,
    isModuleEnabled,
    hasModuleAccess,
    filterNavigationItems,
    getModuleStatus,
    refreshSettings: loadModuleSettings
  };
}

/**
 * Hook for checking if a specific module should be accessible
 */
export function useModuleGuard(
  moduleKey: keyof ModuleSettings,
  permissionModule?: ModuleName,
  requiredRoles?: string[]
) {
  const { hasModuleAccess, loading } = useModuleAccess();

  return {
    loading,
    hasAccess: hasModuleAccess(moduleKey, permissionModule, requiredRoles),
    isModuleAccessible: () => hasModuleAccess(moduleKey, permissionModule, requiredRoles)
  };
}