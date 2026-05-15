"use client"

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { ModuleName, ActionType } from '@/types/permissions';

interface PermissionGuardProps {
  module: ModuleName;
  action?: ActionType;
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/**
 * Component guard that renders children only if user has the required permission
 */
export function PermissionGuard({ 
  module, 
  action = 'view', 
  userId, 
  children, 
  fallback = null,
  loadingFallback = <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
}: PermissionGuardProps) {
  const { hasPermission, loading } = usePermissions(userId);

  if (loading) {
    return <>{loadingFallback}</>;
  }

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGuard;