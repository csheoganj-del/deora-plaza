"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { rbacManager, Permission, UserRole } from "@/lib/rbac";
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
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  fallback = null,
  businessUnit,
}: PermissionGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const userId = user.id;
  let hasAccess = false;

  // Convert auth role to RBAC role if needed
  const convertToRBACRole = (authRole: AuthUserRole): UserRole => {
    const roleMapping: Record<AuthUserRole, UserRole> = {
      'super_admin': UserRole.SUPER_ADMIN,
      'owner': UserRole.ADMIN,
      'manager': UserRole.MANAGER,
      'cafe_manager': UserRole.MANAGER,
      'bar_manager': UserRole.MANAGER,
      'hotel_manager': UserRole.MANAGER,
      'garden_manager': UserRole.MANAGER,
      'waiter': UserRole.WAITER,
      'kitchen': UserRole.KITCHEN,
      'bartender': UserRole.STAFF,
      'reception': UserRole.RECEPTIONIST,
      'hotel_reception': UserRole.RECEPTIONIST
    };
    return roleMapping[authRole] || UserRole.STAFF;
  };

  // Check role-based access
  if (role) {
    const rbacRole = role in UserRole ? role as UserRole : convertToRBACRole(role as AuthUserRole);
    hasAccess = rbacManager.hasRole(userId, rbacRole);
  } else if (roles.length > 0) {
    const rbacRoles = roles.map(r => r in UserRole ? r as UserRole : convertToRBACRole(r as AuthUserRole));
    hasAccess = rbacManager.hasAnyRole(userId, rbacRoles);
  }

  // Check permission-based access
  if (!hasAccess && permission) {
    hasAccess = rbacManager.hasPermission(userId, permission);
  } else if (!hasAccess && permissions.length > 0) {
    hasAccess = requireAll 
      ? rbacManager.hasAllPermissions(userId, permissions)
      : rbacManager.hasAnyPermission(userId, permissions);
  }

  // Check business unit access if specified
  if (hasAccess && businessUnit) {
    hasAccess = rbacManager.canAccessBusinessUnit(userId, businessUnit);
  }

  // Log permission check for audit
  if (!hasAccess) {
    rbacManager.logPermissionCheck(
      userId,
      permission || permissions[0] || Permission.VIEW_DASHBOARD,
      false,
      `PermissionGuard: ${role || roles.join(',') || permission || permissions.join(',')}`
    );
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
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

// Hook for permission checking
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

  // Convert auth role to RBAC role
  const convertToRBACRole = (authRole: AuthUserRole): UserRole => {
    const roleMapping: Record<AuthUserRole, UserRole> = {
      'super_admin': UserRole.SUPER_ADMIN,
      'owner': UserRole.ADMIN,
      'manager': UserRole.MANAGER,
      'cafe_manager': UserRole.MANAGER,
      'bar_manager': UserRole.MANAGER,
      'hotel_manager': UserRole.MANAGER,
      'garden_manager': UserRole.MANAGER,
      'waiter': UserRole.WAITER,
      'kitchen': UserRole.KITCHEN,
      'bartender': UserRole.STAFF,
      'reception': UserRole.RECEPTIONIST,
      'hotel_reception': UserRole.RECEPTIONIST
    };
    return roleMapping[authRole] || UserRole.STAFF;
  };

  const rbacRole = convertToRBACRole(user.role);
  const accessControl = rbacManager.createAccessControl(user.id);

  return {
    can: accessControl.can,
    canAny: accessControl.canAny,
    canAll: accessControl.canAll,
    hasRole: (role: UserRole | AuthUserRole) => {
      const checkRole = role in UserRole ? role as UserRole : convertToRBACRole(role as AuthUserRole);
      return accessControl.hasRole(checkRole);
    },
    hasAnyRole: (roles: (UserRole | AuthUserRole)[]) => {
      const checkRoles = roles.map(r => r in UserRole ? r as UserRole : convertToRBACRole(r as AuthUserRole));
      return accessControl.hasAnyRole(checkRoles);
    },
    getRole: () => rbacRole,
    getPermissions: () => rbacManager.getPermissionsForRole(rbacRole),
  };
}

