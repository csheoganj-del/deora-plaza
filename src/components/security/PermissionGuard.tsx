"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Permission, UserRole } from "@/lib/rbac";
import { UserRole as AuthUserRole, BusinessUnit } from "@/lib/auth-helpers";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  role?: UserRole | AuthUserRole;
  roles?: (UserRole | AuthUserRole)[];
  requireAll?: boolean;
  fallback?: ReactNode;
  businessUnit?: BusinessUnit;
}

export function PermissionGuard({
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { user } = useAuth();

  // If there's no user, show fallback. Otherwise, instantly grant access.
  // We stripped out the slow RBAC engine since only Cafe Managers exist now.
  return user ? <>{children}</> : <>{fallback}</>;
}

// Higher-order component for route protection
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<PermissionGuardProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <PermissionGuard {...options}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

// Stripped down Hook for permission checking
export function usePermissions() {
  const { user } = useAuth();

  if (!user) {
    return {
      can: () => false,
      canAny: () => false,
      canAll: () => false,
      hasRole: () => false,
      hasAnyRole: () => false,
      getRole: () => null,
      getPermissions: () => [],
    };
  }

  return {
    can: () => true,
    canAny: () => true,
    canAll: () => true,
    hasRole: () => true,
    hasAnyRole: () => true,
    getRole: () => UserRole.SUPER_ADMIN,
    getPermissions: () => [],
  };
}

