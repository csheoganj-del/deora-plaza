// Role-based access control types

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  module: ModuleName;
  actions: ActionType[];
  enabled: boolean;
}

export type ModuleName = 
  | 'dashboard'
  | 'orders'
  | 'billing'
  | 'customers'
  | 'menu'
  | 'inventory'
  | 'bookings'
  | 'staff'
  | 'attendance'
  | 'salary'
  | 'expenses'
  | 'analytics'
  | 'settings'
  | 'notifications'
  | 'reports';

export type ActionType = 
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export';

export interface UserPermissions {
  id?: string;
  user_id: string;
  role_id: string;
  custom_permissions?: Permission[];
  overrides?: {
    module: ModuleName;
    actions: ActionType[];
    enabled: boolean;
  }[];
  created_at?: string;
  updated_at?: string;
}

export interface ModuleConfig {
  name: ModuleName;
  displayName: string;
  description: string;
  icon: string;
  category: 'core' | 'business' | 'management' | 'reports';
  defaultActions: ActionType[];
  dependencies?: ModuleName[];
}

// Predefined roles
export const DEFAULT_ROLES: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: [],
    isActive: true
  },
  {
    name: 'Manager',
    description: 'Department manager with staff and operations access',
    permissions: [],
    isActive: true
  },
  {
    name: 'Staff',
    description: 'Basic staff member with limited access',
    permissions: [],
    isActive: true
  },
  {
    name: 'Accountant',
    description: 'Financial operations and reporting access',
    permissions: [],
    isActive: true
  },
  {
    name: 'Inventory Manager',
    description: 'Inventory and supply chain management',
    permissions: [],
    isActive: true
  },
  {
    name: 'HR Manager',
    description: 'Human resources and staff management',
    permissions: [],
    isActive: true
  }
];

// Module configurations
export const MODULE_CONFIGS: ModuleConfig[] = [
  {
    name: 'dashboard',
    displayName: 'Dashboard',
    description: 'Main dashboard overview',
    icon: '📊',
    category: 'core',
    defaultActions: ['view']
  },
  {
    name: 'orders',
    displayName: 'Orders',
    description: 'Order management and tracking',
    icon: '🛒',
    category: 'core',
    defaultActions: ['view', 'create', 'edit']
  },
  {
    name: 'billing',
    displayName: 'Billing',
    description: 'Invoice and payment management',
    icon: '💳',
    category: 'core',
    defaultActions: ['view', 'create', 'edit']
  },
  {
    name: 'customers',
    displayName: 'Customers',
    description: 'Customer management and profiles',
    icon: '👥',
    category: 'core',
    defaultActions: ['view', 'create', 'edit']
  },
  {
    name: 'menu',
    displayName: 'Menu',
    description: 'Menu items and pricing management',
    icon: '📋',
    category: 'core',
    defaultActions: ['view', 'create', 'edit', 'delete']
  },
  {
    name: 'inventory',
    displayName: 'Inventory',
    description: 'Stock management and tracking',
    icon: '📦',
    category: 'business',
    defaultActions: ['view', 'create', 'edit']
  },
  {
    name: 'bookings',
    displayName: 'Bookings',
    description: 'Hotel and garden reservations',
    icon: '🏨',
    category: 'business',
    defaultActions: ['view', 'create', 'edit']
  },
  {
    name: 'staff',
    displayName: 'Staff Management',
    description: 'Employee profiles and management',
    icon: '👤',
    category: 'management',
    defaultActions: ['view', 'create', 'edit']
  },
  {
    name: 'attendance',
    displayName: 'Attendance',
    description: 'Employee attendance tracking',
    icon: '⏰',
    category: 'management',
    defaultActions: ['view', 'create', 'edit']
  },
  {
    name: 'salary',
    displayName: 'Salary Management',
    description: 'Payroll and salary processing',
    icon: '💰',
    category: 'management',
    defaultActions: ['view', 'create', 'approve']
  },
  {
    name: 'expenses',
    displayName: 'Expenses',
    description: 'Business expense tracking',
    icon: '🧾',
    category: 'management',
    defaultActions: ['view', 'create', 'approve']
  },
  {
    name: 'analytics',
    displayName: 'Analytics',
    description: 'Business intelligence and reports',
    icon: '📈',
    category: 'reports',
    defaultActions: ['view', 'export']
  },
  {
    name: 'settings',
    displayName: 'Settings',
    description: 'System configuration and preferences',
    icon: '⚙️',
    category: 'core',
    defaultActions: ['view', 'edit']
  },
  {
    name: 'notifications',
    displayName: 'Notifications',
    description: 'System notifications and alerts',
    icon: '🔔',
    category: 'core',
    defaultActions: ['view']
  },
  {
    name: 'reports',
    displayName: 'Reports',
    description: 'Financial and operational reports',
    icon: '📄',
    category: 'reports',
    defaultActions: ['view', 'export']
  }
];

// Permission checking utilities
export interface PermissionCheck {
  hasPermission: (module: ModuleName, action?: ActionType) => boolean;
  hasAnyPermission: (modules: ModuleName[]) => boolean;
  hasAllPermissions: (modules: ModuleName[]) => boolean;
  getAvailableModules: () => ModuleName[];
  getModuleActions: (module: ModuleName) => ActionType[];
}