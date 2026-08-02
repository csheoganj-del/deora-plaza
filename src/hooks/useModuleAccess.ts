"use client";

import { useMemo } from "react";

// Module access keys that match what Sidebar uses
export type ModuleKey =
  | "enableTablesModule"
  | "enableAnalyticsModule"
  | "enableOrderManagementModule"
  | "enableBillingModule"
  | "enableStatisticsModule"
  | "enableGSTReportModule"
  | "enableSettlementsModule"
  | "enableCustomerModule"
  | "enableDiscountsModule"
  | "enableMenuModule"
  | "enableUserManagementModule";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  moduleKey?: ModuleKey;
}

interface UseModuleAccessReturn {
  hasModuleAccess: (moduleKey: ModuleKey) => boolean;
  filterNavigationItems: (items: NavigationItem[]) => NavigationItem[];
  loading: boolean;
}

/**
 * Hook that controls which modules/features are visible in the navigation.
 * All modules are enabled by default. Can be extended to fetch from DB settings.
 */
export function useModuleAccess(): UseModuleAccessReturn {
  const hasModuleAccess = useMemo(
    () =>
      (_moduleKey: ModuleKey): boolean => {
        // All modules enabled by default
        return true;
      },
    []
  );

  const filterNavigationItems = useMemo(
    () =>
      (items: NavigationItem[]): NavigationItem[] => {
        // Return all items — module filtering is all-enabled by default
        return items;
      },
    []
  );

  return {
    hasModuleAccess,
    filterNavigationItems,
    loading: false,
  };
}
