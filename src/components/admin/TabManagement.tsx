"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  LayoutDashboard, UtensilsCrossed, Armchair, FileText, Users, Hotel, 
  Flower2, Wine, BarChart3, Tag, MapPin, Package, Monitor, Smartphone, 
  Edit3, Zap, Trophy, Calendar, FileSpreadsheet, Handshake 
} from 'lucide-react';
import { getBusinessSettings, updateBusinessSettings } from '@/actions/businessSettings';
import { toast } from 'sonner';

interface TabConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  category: 'core' | 'operations' | 'management' | 'reports' | 'admin';
  description: string;
  settingsKey: keyof BusinessSettings;
  dependencies?: string[];
  roles: string[];
}

interface BusinessSettings {
  // Module toggles
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

const TAB_CONFIGURATIONS: TabConfig[] = [
  // Core Operations
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    category: 'core',
    description: 'Main dashboard overview and key metrics',
    settingsKey: 'enableAnalyticsModule',
    roles: ['super_admin', 'owner', 'manager']
  },
  {
    id: 'orders',
    name: 'Orders',
    icon: UtensilsCrossed,
    category: 'operations',
    description: 'Order management and tracking',
    settingsKey: 'enableOrderManagementModule',
    roles: ['cafe_manager', 'waiter', 'kitchen', 'super_admin', 'owner']
  },
  {
    id: 'billing',
    name: 'Billing',
    icon: FileText,
    category: 'operations',
    description: 'Invoice generation and payment processing',
    settingsKey: 'enableBillingModule',
    roles: ['cafe_manager', 'super_admin', 'owner']
  },
  {
    id: 'customers',
    name: 'Customers',
    icon: Users,
    category: 'operations',
    description: 'Customer profiles and management',
    settingsKey: 'enableCustomerModule',
    roles: ['cafe_manager', 'super_admin', 'owner']
  },
  {
    id: 'menu',
    name: 'Menu',
    icon: UtensilsCrossed,
    category: 'operations',
    description: 'Menu items and pricing management',
    settingsKey: 'enableMenuModule',
    roles: ['cafe_manager', 'bar_manager', 'super_admin', 'owner']
  },
  {
    id: 'tables',
    name: 'Tables',
    icon: Armchair,
    category: 'operations',
    description: 'Table management and reservations',
    settingsKey: 'enableTablesModule',
    roles: ['cafe_manager', 'waiter', 'super_admin', 'owner']
  },

  // Business Units
  {
    id: 'bar',
    name: 'Bar',
    icon: Wine,
    category: 'operations',
    description: 'Bar operations and beverage management',
    settingsKey: 'enableBarModule',
    roles: ['bar_manager', 'super_admin', 'owner']
  },
  {
    id: 'hotel',
    name: 'Hotel',
    icon: Hotel,
    category: 'operations',
    description: 'Hotel bookings and room management',
    settingsKey: 'enableHotelModule',
    roles: ['hotel_manager', 'hotel_reception', 'super_admin', 'owner']
  },
  {
    id: 'garden',
    name: 'Garden',
    icon: Flower2,
    category: 'operations',
    description: 'Garden venue and event management',
    settingsKey: 'enableGardenModule',
    roles: ['garden_manager', 'super_admin', 'owner']
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: UtensilsCrossed,
    category: 'operations',
    description: 'Kitchen operations and order preparation',
    settingsKey: 'enableKitchenModule',
    roles: ['kitchen', 'cafe_manager', 'super_admin']
  },

  // Management & Analytics
  {
    id: 'inventory',
    name: 'Inventory',
    icon: Package,
    category: 'management',
    description: 'Stock management and tracking',
    settingsKey: 'enableInventoryModule',
    roles: ['super_admin', 'owner', 'manager', 'cafe_manager']
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    category: 'management',
    description: 'Business analytics and insights',
    settingsKey: 'enableAnalyticsModule',
    roles: ['super_admin', 'owner', 'manager', 'cafe_manager']
  },
  {
    id: 'realtime',
    name: 'Real-Time',
    icon: BarChart3,
    category: 'management',
    description: 'Real-time monitoring and alerts',
    settingsKey: 'enableRealtimeModule',
    roles: ['super_admin', 'owner', 'manager', 'cafe_manager']
  },
  {
    id: 'statistics',
    name: 'Statistics',
    icon: BarChart3,
    category: 'reports',
    description: 'Detailed statistical reports',
    settingsKey: 'enableStatisticsModule',
    roles: ['cafe_manager', 'bar_manager', 'hotel_manager', 'manager', 'super_admin', 'owner']
  },

  // Staff & Operations
  {
    id: 'kitchen-display',
    name: 'Kitchen Display',
    icon: Monitor,
    category: 'operations',
    description: 'Kitchen display system for orders',
    settingsKey: 'enableKitchenDisplayModule',
    roles: ['kitchen', 'cafe_manager', 'super_admin', 'owner']
  },
  {
    id: 'waiter-interface',
    name: 'Waiter Interface',
    icon: Smartphone,
    category: 'operations',
    description: 'Mobile interface for waiters',
    settingsKey: 'enableWaiterInterfaceModule',
    roles: ['waiter', 'cafe_manager', 'super_admin', 'owner']
  },
  {
    id: 'order-management',
    name: 'Order Management',
    icon: Edit3,
    category: 'management',
    description: 'Advanced order management tools',
    settingsKey: 'enableOrderManagementModule',
    roles: ['cafe_manager', 'super_admin', 'owner']
  },

  // Advanced Features
  {
    id: 'automation',
    name: 'Automation',
    icon: Zap,
    category: 'management',
    description: 'Automated workflows and processes',
    settingsKey: 'enableAutomationModule',
    roles: ['super_admin', 'owner', 'manager', 'cafe_manager']
  },
  {
    id: 'staff-performance',
    name: 'Staff Performance',
    icon: Trophy,
    category: 'management',
    description: 'Staff performance tracking and analytics',
    settingsKey: 'enableStaffPerformanceModule',
    roles: ['super_admin', 'owner', 'manager', 'cafe_manager']
  },
  {
    id: 'daily-reports',
    name: 'Daily Reports',
    icon: Calendar,
    category: 'reports',
    description: 'Daily operational reports',
    settingsKey: 'enableDailyReportsModule',
    roles: ['super_admin', 'owner', 'manager', 'cafe_manager']
  },

  // Admin & Reports
  {
    id: 'locations',
    name: 'Locations',
    icon: MapPin,
    category: 'admin',
    description: 'Multi-location management',
    settingsKey: 'enableLocationsModule',
    roles: ['super_admin', 'owner']
  },
  {
    id: 'gst-report',
    name: 'GST Report',
    icon: FileSpreadsheet,
    category: 'reports',
    description: 'GST compliance and reporting',
    settingsKey: 'enableGSTReportModule',
    roles: ['super_admin', 'owner']
  },
  {
    id: 'settlements',
    name: 'Dept. Settlements',
    icon: Handshake,
    category: 'reports',
    description: 'Department-wise settlement reports',
    settingsKey: 'enableSettlementsModule',
    roles: ['super_admin', 'owner']
  },
  {
    id: 'discounts',
    name: 'Discounts',
    icon: Tag,
    category: 'management',
    description: 'Discount management and promotions',
    settingsKey: 'enableDiscountsModule',
    roles: ['super_admin', 'owner', 'manager']
  },
  {
    id: 'users',
    name: 'User Management',
    icon: Users,
    category: 'admin',
    description: 'User accounts and role management',
    settingsKey: 'enableUserManagementModule',
    roles: ['super_admin', 'owner', 'manager']
  }
];

export default function TabManagement() {
  const [settings, setSettings] = useState<BusinessSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const businessSettings = await getBusinessSettings();
      if (businessSettings) {
        setSettings(businessSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load tab settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = async (settingsKey: keyof BusinessSettings, enabled: boolean) => {
    try {
      setSaving(true);
      
      const updatedSettings = {
        ...settings,
        [settingsKey]: enabled
      };

      const result = await updateBusinessSettings(updatedSettings);
      
      if (result.success) {
        setSettings(updatedSettings);
        toast.success(`${enabled ? 'Enabled' : 'Disabled'} module successfully`);
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkToggle = async (category: string, enabled: boolean) => {
    try {
      setSaving(true);
      
      const categoryTabs = TAB_CONFIGURATIONS.filter(tab => tab.category === category);
      const updatedSettings = { ...settings };
      
      categoryTabs.forEach(tab => {
        updatedSettings[tab.settingsKey] = enabled;
      });

      const result = await updateBusinessSettings(updatedSettings);
      
      if (result.success) {
        setSettings(updatedSettings);
        toast.success(`${enabled ? 'Enabled' : 'Disabled'} all ${category} modules`);
      } else {
        toast.error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const getEnabledCount = (category: string) => {
    const categoryTabs = TAB_CONFIGURATIONS.filter(tab => tab.category === category);
    return categoryTabs.filter(tab => settings[tab.settingsKey] !== false).length;
  };

  const getTotalCount = (category: string) => {
    return TAB_CONFIGURATIONS.filter(tab => tab.category === category).length;
  };

  const categories = [
    { id: 'core', name: 'Core Features', description: 'Essential system features' },
    { id: 'operations', name: 'Operations', description: 'Day-to-day operational modules' },
    { id: 'management', name: 'Management', description: 'Management and analytics tools' },
    { id: 'reports', name: 'Reports', description: 'Reporting and compliance modules' },
    { id: 'admin', name: 'Administration', description: 'System administration features' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tab Management</h2>
        <p className="text-muted-foreground">
          Control which tabs and features are visible to users based on their roles.
        </p>
      </div>

      {categories.map(category => {
        const categoryTabs = TAB_CONFIGURATIONS.filter(tab => tab.category === category.id);
        const enabledCount = getEnabledCount(category.id);
        const totalCount = getTotalCount(category.id);
        
        return (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {category.name}
                    <Badge variant="secondary">
                      {enabledCount}/{totalCount} enabled
                    </Badge>
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkToggle(category.id, true)}
                    disabled={saving}
                  >
                    Enable All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkToggle(category.id, false)}
                    disabled={saving}
                  >
                    Disable All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryTabs.map(tab => {
                  const Icon = tab.icon;
                  const isEnabled = settings[tab.settingsKey] !== false;
                  
                  return (
                    <div key={tab.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <Label className="font-medium">{tab.name}</Label>
                            <Badge variant="outline" className="text-xs">
                              {tab.roles.join(', ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{tab.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggleChange(tab.settingsKey, checked)}
                        disabled={saving}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Overview of enabled modules across all categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map(category => {
              const enabledCount = getEnabledCount(category.id);
              const totalCount = getTotalCount(category.id);
              const percentage = Math.round((enabledCount / totalCount) * 100);
              
              return (
                <div key={category.id} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{enabledCount}/{totalCount}</div>
                  <div className="text-sm text-muted-foreground">{category.name}</div>
                  <div className="text-xs text-muted-foreground">{percentage}% enabled</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}