// Role-Based Access Control (RBAC) System for DEORA
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  STAFF = 'staff',
  WAITER = 'waiter',
  CASHIER = 'cashier',
  KITCHEN = 'kitchen',
  HOUSEKEEPING = 'housekeeping',
  RECEPTIONIST = 'receptionist',
  EVENT_COORDINATOR = 'event_coordinator',
  VIEWER = 'viewer'
}

export enum Permission {
  // Dashboard permissions
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_REPORTS = 'export_reports',
  
  // Business Unit permissions
  MANAGE_BUSINESS_UNITS = 'manage_business_units',
  VIEW_BUSINESS_UNITS = 'view_business_units',
  EDIT_BUSINESS_UNIT_SETTINGS = 'edit_business_unit_settings',
  
  // Order permissions
  CREATE_ORDERS = 'create_orders',
  VIEW_ORDERS = 'view_orders',
  EDIT_ORDERS = 'edit_orders',
  DELETE_ORDERS = 'delete_orders',
  MANAGE_ORDERS = 'manage_orders',
  
  // Inventory permissions
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_INVENTORY = 'manage_inventory',
  UPDATE_STOCK = 'update_stock',
  DELETE_INVENTORY = 'delete_inventory',
  
  // Customer permissions
  VIEW_CUSTOMERS = 'view_customers',
  MANAGE_CUSTOMERS = 'manage_customers',
  EDIT_CUSTOMERS = 'edit_customers',
  DELETE_CUSTOMERS = 'delete_customers',
  VIEW_CUSTOMER_HISTORY = 'view_customer_history',
  
  // Staff permissions
  VIEW_STAFF = 'view_staff',
  MANAGE_STAFF = 'manage_staff',
  EDIT_STAFF = 'edit_staff',
  DELETE_STAFF = 'delete_staff',
  MANAGE_SHIFTS = 'manage_shifts',
  VIEW_SCHEDULES = 'view_schedules',
  
  // Kitchen permissions
  VIEW_KDS = 'view_kds',
  MANAGE_KDS = 'manage_kds',
  UPDATE_ORDER_STATUS = 'update_order_status',
  
  // Booking permissions
  CREATE_BOOKINGS = 'create_bookings',
  VIEW_BOOKINGS = 'view_bookings',
  EDIT_BOOKINGS = 'edit_bookings',
  DELETE_BOOKINGS = 'delete_bookings',
  MANAGE_ROOMS = 'manage_rooms',
  
  // Event permissions
  CREATE_EVENTS = 'create_events',
  VIEW_EVENTS = 'view_events',
  EDIT_EVENTS = 'edit_events',
  DELETE_EVENTS = 'delete_events',
  MANAGE_EVENTS = 'manage_events',
  
  // Feedback permissions
  VIEW_FEEDBACK = 'view_feedback',
  MANAGE_FEEDBACK = 'manage_feedback',
  RESPOND_FEEDBACK = 'respond_feedback',
  
  // Security permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_PERMISSIONS = 'manage_permissions',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  
  // System permissions
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_SYSTEM_STATUS = 'view_system_status',
  MANAGE_BACKUP = 'manage_backup',
  MANAGE_OFFLINE = 'manage_offline'
}

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  level: number; // Higher number = higher priority
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  businessUnit?: string;
  permissions?: Permission[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AccessControl {
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

// Role definitions with permissions
export const ROLE_DEFINITIONS: Record<UserRole, Omit<Role, 'id'>> = {
  [UserRole.SUPER_ADMIN]: {
    name: UserRole.SUPER_ADMIN,
    displayName: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: Object.values(Permission),
    level: 100
  },
  
  [UserRole.ADMIN]: {
    name: UserRole.ADMIN,
    displayName: 'Administrator',
    description: 'Administrative access to most system features',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_ANALYTICS,
      Permission.EXPORT_REPORTS,
      Permission.MANAGE_BUSINESS_UNITS,
      Permission.VIEW_BUSINESS_UNITS,
      Permission.EDIT_BUSINESS_UNIT_SETTINGS,
      Permission.CREATE_ORDERS,
      Permission.VIEW_ORDERS,
      Permission.EDIT_ORDERS,
      Permission.MANAGE_ORDERS,
      Permission.VIEW_INVENTORY,
      Permission.MANAGE_INVENTORY,
      Permission.UPDATE_STOCK,
      Permission.VIEW_CUSTOMERS,
      Permission.MANAGE_CUSTOMERS,
      Permission.EDIT_CUSTOMERS,
      Permission.VIEW_CUSTOMER_HISTORY,
      Permission.VIEW_STAFF,
      Permission.MANAGE_STAFF,
      Permission.EDIT_STAFF,
      Permission.MANAGE_SHIFTS,
      Permission.VIEW_SCHEDULES,
      Permission.VIEW_KDS,
      Permission.CREATE_BOOKINGS,
      Permission.VIEW_BOOKINGS,
      Permission.EDIT_BOOKINGS,
      Permission.MANAGE_ROOMS,
      Permission.CREATE_EVENTS,
      Permission.VIEW_EVENTS,
      Permission.EDIT_EVENTS,
      Permission.MANAGE_EVENTS,
      Permission.VIEW_FEEDBACK,
      Permission.MANAGE_FEEDBACK,
      Permission.RESPOND_FEEDBACK,
      Permission.MANAGE_USERS,
      Permission.MANAGE_ROLES,
      Permission.VIEW_AUDIT_LOGS,
      Permission.MANAGE_SETTINGS,
      Permission.VIEW_SYSTEM_STATUS,
      Permission.MANAGE_BACKUP,
      Permission.MANAGE_OFFLINE
    ],
    level: 90
  },
  
  [UserRole.MANAGER]: {
    name: UserRole.MANAGER,
    displayName: 'Manager',
    description: 'Business unit management with operational controls',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_ANALYTICS,
      Permission.EXPORT_REPORTS,
      Permission.VIEW_BUSINESS_UNITS,
      Permission.EDIT_BUSINESS_UNIT_SETTINGS,
      Permission.CREATE_ORDERS,
      Permission.VIEW_ORDERS,
      Permission.EDIT_ORDERS,
      Permission.MANAGE_ORDERS,
      Permission.VIEW_INVENTORY,
      Permission.MANAGE_INVENTORY,
      Permission.UPDATE_STOCK,
      Permission.VIEW_CUSTOMERS,
      Permission.MANAGE_CUSTOMERS,
      Permission.EDIT_CUSTOMERS,
      Permission.VIEW_CUSTOMER_HISTORY,
      Permission.VIEW_STAFF,
      Permission.MANAGE_STAFF,
      Permission.EDIT_STAFF,
      Permission.MANAGE_SHIFTS,
      Permission.VIEW_SCHEDULES,
      Permission.VIEW_KDS,
      Permission.CREATE_BOOKINGS,
      Permission.VIEW_BOOKINGS,
      Permission.EDIT_BOOKINGS,
      Permission.MANAGE_ROOMS,
      Permission.CREATE_EVENTS,
      Permission.VIEW_EVENTS,
      Permission.EDIT_EVENTS,
      Permission.MANAGE_EVENTS,
      Permission.VIEW_FEEDBACK,
      Permission.MANAGE_FEEDBACK,
      Permission.RESPOND_FEEDBACK,
      Permission.VIEW_AUDIT_LOGS,
      Permission.MANAGE_SETTINGS
    ],
    level: 80
  },
  
  [UserRole.SUPERVISOR]: {
    name: UserRole.SUPERVISOR,
    displayName: 'Supervisor',
    description: 'Team supervision and operational oversight',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_ANALYTICS,
      Permission.VIEW_ORDERS,
      Permission.EDIT_ORDERS,
      Permission.VIEW_INVENTORY,
      Permission.UPDATE_STOCK,
      Permission.VIEW_CUSTOMERS,
      Permission.VIEW_CUSTOMER_HISTORY,
      Permission.VIEW_STAFF,
      Permission.EDIT_STAFF,
      Permission.VIEW_SCHEDULES,
      Permission.VIEW_KDS,
      Permission.UPDATE_ORDER_STATUS,
      Permission.VIEW_BOOKINGS,
      Permission.EDIT_BOOKINGS,
      Permission.VIEW_EVENTS,
      Permission.VIEW_FEEDBACK,
      Permission.RESPOND_FEEDBACK
    ],
    level: 60
  },
  
  [UserRole.STAFF]: {
    name: UserRole.STAFF,
    displayName: 'Staff',
    description: 'General staff access to basic operations',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_ORDERS,
      Permission.VIEW_INVENTORY,
      Permission.VIEW_CUSTOMERS,
      Permission.VIEW_SCHEDULES,
      Permission.VIEW_KDS,
      Permission.UPDATE_ORDER_STATUS,
      Permission.VIEW_BOOKINGS
    ],
    level: 40
  },
  
  [UserRole.WAITER]: {
    name: UserRole.WAITER,
    displayName: 'Waiter',
    description: 'Restaurant service staff',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.CREATE_ORDERS,
      Permission.VIEW_ORDERS,
      Permission.EDIT_ORDERS,
      Permission.VIEW_CUSTOMERS,
      Permission.VIEW_CUSTOMER_HISTORY,
      Permission.VIEW_KDS,
      Permission.UPDATE_ORDER_STATUS,
      Permission.VIEW_BOOKINGS,
      Permission.EDIT_BOOKINGS
    ],
    level: 35
  },
  
  [UserRole.CASHIER]: {
    name: UserRole.CASHIER,
    displayName: 'Cashier',
    description: 'Payment and order processing',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.CREATE_ORDERS,
      Permission.VIEW_ORDERS,
      Permission.EDIT_ORDERS,
      Permission.VIEW_CUSTOMERS,
      Permission.VIEW_CUSTOMER_HISTORY,
      Permission.VIEW_INVENTORY,
      Permission.UPDATE_STOCK
    ],
    level: 35
  },
  
  [UserRole.KITCHEN]: {
    name: UserRole.KITCHEN,
    displayName: 'Kitchen Staff',
    description: 'Kitchen operations and order management',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_KDS,
      Permission.MANAGE_KDS,
      Permission.UPDATE_ORDER_STATUS,
      Permission.VIEW_INVENTORY,
      Permission.UPDATE_STOCK
    ],
    level: 30
  },
  
  [UserRole.HOUSEKEEPING]: {
    name: UserRole.HOUSEKEEPING,
    displayName: 'Housekeeping',
    description: 'Hotel room management',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_BOOKINGS,
      Permission.MANAGE_ROOMS,
      Permission.VIEW_SCHEDULES
    ],
    level: 30
  },
  
  [UserRole.RECEPTIONIST]: {
    name: UserRole.RECEPTIONIST,
    displayName: 'Receptionist',
    description: 'Front desk and customer service',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.CREATE_BOOKINGS,
      Permission.VIEW_BOOKINGS,
      Permission.EDIT_BOOKINGS,
      Permission.VIEW_CUSTOMERS,
      Permission.MANAGE_CUSTOMERS,
      Permission.EDIT_CUSTOMERS,
      Permission.VIEW_CUSTOMER_HISTORY,
      Permission.MANAGE_ROOMS
    ],
    level: 35
  },
  
  [UserRole.EVENT_COORDINATOR]: {
    name: UserRole.EVENT_COORDINATOR,
    displayName: 'Event Coordinator',
    description: 'Event planning and management',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.CREATE_EVENTS,
      Permission.VIEW_EVENTS,
      Permission.EDIT_EVENTS,
      Permission.MANAGE_EVENTS,
      Permission.CREATE_BOOKINGS,
      Permission.VIEW_BOOKINGS,
      Permission.EDIT_BOOKINGS,
      Permission.VIEW_CUSTOMERS,
      Permission.MANAGE_CUSTOMERS,
      Permission.EDIT_CUSTOMERS,
      Permission.VIEW_CUSTOMER_HISTORY
    ],
    level: 50
  },
  
  [UserRole.VIEWER]: {
    name: UserRole.VIEWER,
    displayName: 'Viewer',
    description: 'Read-only access to basic information',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_ORDERS,
      Permission.VIEW_INVENTORY,
      Permission.VIEW_CUSTOMERS,
      Permission.VIEW_BOOKINGS,
      Permission.VIEW_EVENTS,
      Permission.VIEW_FEEDBACK
    ],
    level: 10
  }
};

export class RBACManager {
  private static instance: RBACManager;
  private userRoles: Map<string, UserRole> = new Map();
  private userPermissions: Map<string, Set<Permission>> = new Map();

  private constructor() {}

  public static getInstance(): RBACManager {
    if (!RBACManager.instance) {
      RBACManager.instance = new RBACManager();
    }
    return RBACManager.instance;
  }

  public assignRole(userId: string, role: UserRole): void {
    this.userRoles.set(userId, role);
    this.updateUserPermissions(userId);
  }

  public getUserRole(userId: string): UserRole | null {
    return this.userRoles.get(userId) || null;
  }

  public hasPermission(userId: string, permission: Permission): boolean {
    const permissions = this.userPermissions.get(userId);
    return permissions ? permissions.has(permission) : false;
  }

  public hasAnyPermission(userId: string, permissions: Permission[]): boolean {
    const userPermissions = this.userPermissions.get(userId);
    if (!userPermissions) return false;
    
    return permissions.some(permission => userPermissions.has(permission));
  }

  public hasAllPermissions(userId: string, permissions: Permission[]): boolean {
    const userPermissions = this.userPermissions.get(userId);
    if (!userPermissions) return false;
    
    return permissions.every(permission => userPermissions.has(permission));
  }

  public hasRole(userId: string, role: UserRole): boolean {
    return this.userRoles.get(userId) === role;
  }

  public hasAnyRole(userId: string, roles: UserRole[]): boolean {
    const userRole = this.userRoles.get(userId);
    return userRole ? roles.includes(userRole) : false;
  }

  public getRoleLevel(role: UserRole): number {
    return ROLE_DEFINITIONS[role]?.level || 0;
  }

  public canAccessHigherLevel(userId: string, targetRole: UserRole): boolean {
    const userRole = this.userRoles.get(userId);
    if (!userRole) return false;
    
    const userLevel = this.getRoleLevel(userRole);
    const targetLevel = this.getRoleLevel(targetRole);
    
    return userLevel > targetLevel;
  }

  public getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_DEFINITIONS[role]?.permissions || [];
  }

  public getAllRoles(): Role[] {
    return Object.entries(ROLE_DEFINITIONS).map(([key, role], index) => ({
      id: (index + 1).toString(),
      ...role
    }));
  }

  public createAccessControl(userId: string): AccessControl {
    return {
      can: (permission: Permission) => this.hasPermission(userId, permission),
      canAny: (permissions: Permission[]) => this.hasAnyPermission(userId, permissions),
      canAll: (permissions: Permission[]) => this.hasAllPermissions(userId, permissions),
      hasRole: (role: UserRole) => this.hasRole(userId, role),
      hasAnyRole: (roles: UserRole[]) => this.hasAnyRole(userId, roles)
    };
  }

  private updateUserPermissions(userId: string): void {
    const role = this.userRoles.get(userId);
    if (role) {
      const permissions = new Set(ROLE_DEFINITIONS[role]?.permissions || []);
      this.userPermissions.set(userId, permissions);
    }
  }

  // Business unit specific permissions
  public canAccessBusinessUnit(userId: string, businessUnit: string): boolean {
    const role = this.userRoles.get(userId);
    if (!role) return false;

    // Super admin and admin can access all units
    if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
      return true;
    }

    // For other roles, this would typically check user's assigned business unit
    // This is a simplified version - in production, you'd store user's business units
    return true;
  }

  // Permission hierarchy validation
  public validatePermissionHierarchy(userRole: UserRole, requiredPermission: Permission): boolean {
    const rolePermissions = this.getPermissionsForRole(userRole);
    return rolePermissions.includes(requiredPermission);
  }

  // Audit logging for permission checks
  public logPermissionCheck(userId: string, permission: Permission, granted: boolean, context?: string): void {
    const logEntry = {
      userId,
      permission,
      granted,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    };
    
    // In production, this would be sent to your audit log system
    console.log('RBAC Permission Check:', logEntry);
  }
}

// Export singleton instance
export const rbacManager = RBACManager.getInstance();

// Utility functions for common permission checks
export const canViewDashboard = (userId: string): boolean => {
  return rbacManager.hasPermission(userId, Permission.VIEW_DASHBOARD);
};

export const canManageOrders = (userId: string): boolean => {
  return rbacManager.hasPermission(userId, Permission.MANAGE_ORDERS);
};

export const canManageInventory = (userId: string): boolean => {
  return rbacManager.hasPermission(userId, Permission.MANAGE_INVENTORY);
};

export const canManageStaff = (userId: string): boolean => {
  return rbacManager.hasPermission(userId, Permission.MANAGE_STAFF);
};

export const canManageCustomers = (userId: string): boolean => {
  return rbacManager.hasPermission(userId, Permission.MANAGE_CUSTOMERS);
};

export const isAdmin = (userId: string): boolean => {
  return rbacManager.hasAnyRole(userId, [UserRole.SUPER_ADMIN, UserRole.ADMIN]);
};

export const isManager = (userId: string): boolean => {
  return rbacManager.hasAnyRole(userId, [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
};

export const isStaff = (userId: string): boolean => {
  return rbacManager.hasAnyRole(userId, [
    UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR,
    UserRole.STAFF, UserRole.WAITER, UserRole.CASHIER, UserRole.KITCHEN,
    UserRole.HOUSEKEEPING, UserRole.RECEPTIONIST, UserRole.EVENT_COORDINATOR
  ]);
};

