"use client"

import React from 'react';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import type { ModuleName } from '@/types/permissions';

interface ModuleSettings {
  enableBarModule?: boolean;
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

interface ModuleGuardProps {
  moduleKey: keyof ModuleSettings;
  permissionModule?: ModuleName;
  requiredRoles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/**
 * Component guard that renders children only if module access is granted
 */
export function ModuleGuard({ 
  moduleKey,
  permissionModule,
  requiredRoles,
  children, 
  fallback = null,
  loadingFallback = <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
}: ModuleGuardProps) {
  const { hasModuleAccess, loading } = useModuleAccess();

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (!hasModuleAccess(moduleKey, permissionModule, requiredRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default ModuleGuard;