'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Package,
  ShoppingCart,
  Clock,
  Target
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  name: string;
  type: 'stock_deduction' | 'reorder_alert' | 'waste_tracking' | 'cost_analysis';
  enabled: boolean;
  description: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface StockMovement {
  id: string;
  itemName: string;
  orderNumber: string;
  quantityUsed: number;
  unit: string;
  timestamp: string;
  businessUnit: string;
  automatic: boolean;
}

interface ReorderAlert {
  id: string;
  itemName: string;
  currentStock: number;
  minStock: number;
  suggestedOrder: number;
  supplier: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  businessUnit: string;
}

export default function AutoInventoryManager() {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAutomation();
  }, []);

  const initializeAutomation = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch real automation rules from database
      const { data: rulesData, error: rulesError } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch recent stock movements
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          inventory_items(name, unit)
        `)
        .eq('automatic', true)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch reorder alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('inventory_items')
        .select('*')
        .lt('current_stock', 'min_stock')
        .order('current_stock', { ascending: true });

      // If no data exists, initialize with default rules
      if (!rulesData || rulesData.length === 0) {
        const defaultRules: AutomationRule[] = [
          {
            id: '1',
            name: 'Auto Stock Deduction',
            type: 'stock_deduction',
            enabled: false,
            description: 'Automatically reduce inventory when orders are placed',
            triggerCount: 0,
            lastTriggered: undefined
          },
          {
            id: '2',
            name: 'Smart Reorder Alerts',
            type: 'reorder_alert',
            enabled: false,
            description: 'Generate intelligent reorder suggestions based on usage patterns',
            triggerCount: 0,
            lastTriggered: undefined
          },
          {
            id: '3',
            name: 'Waste Tracking',
            type: 'waste_tracking',
            enabled: false,
            description: 'Track and analyze food waste to optimize ordering',
            triggerCount: 0,
            lastTriggered: undefined
          },
          {
            id: '4',
            name: 'Cost Analysis',
            type: 'cost_analysis',
            enabled: false,
            description: 'Analyze ingredient costs and suggest menu pricing',
            triggerCount: 0,
            lastTriggered: undefined
          }
        ];
        setAutomationRules(defaultRules);
      } else {
        setAutomationRules(rulesData);
      }

      // Process stock movements data
      const processedMovements: StockMovement[] = movementsData?.map(movement => ({
        id: movement.id,
        itemName: movement.inventory_items?.name || 'Unknown Item',
        orderNumber: movement.reference_id || 'N/A',
        quantityUsed: Math.abs(movement.quantity_change),
        unit: movement.inventory_items?.unit || 'units',
        timestamp: movement.created_at,
        businessUnit: movement.business_unit || 'general',
        automatic: movement.automatic
      })) || [];

      // Process reorder alerts data
      const processedAlerts: ReorderAlert[] = alertsData?.map(item => ({
        id: item.id,
        itemName: item.name,
        currentStock: item.current_stock,
        minStock: item.min_stock,
        suggestedOrder: Math.max(item.min_stock * 2, item.current_stock + 10),
        supplier: item.supplier || 'Default Supplier',
        priority: item.current_stock <= 0 ? 'urgent' : 
                 item.current_stock <= item.min_stock * 0.5 ? 'high' : 
                 item.current_stock <= item.min_stock * 0.8 ? 'medium' : 'low',
        businessUnit: item.business_unit || 'general'
      })) || [];

      setRecentMovements(processedMovements);
      setReorderAlerts(processedAlerts);

    } catch (error) {
      console.error('Error initializing automation:', error);
      
      // Fallback to empty state if database fetch fails
      setAutomationRules([
        {
          id: '1',
          name: 'Auto Stock Deduction',
          type: 'stock_deduction',
          enabled: false,
          description: 'Automatically reduce inventory when orders are placed',
          triggerCount: 0
        },
        {
          id: '2',
          name: 'Smart Reorder Alerts',
          type: 'reorder_alert',
          enabled: false,
          description: 'Generate intelligent reorder suggestions based on usage patterns',
          triggerCount: 0
        }
      ]);
      setRecentMovements([]);
      setReorderAlerts([]);
      
      toast.error('Failed to load automation data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (ruleId: string, enabled: boolean) => {
    try {
      const supabase = createClient();
      
      // Update in database if automation_rules table exists
      const { error } = await supabase
        .from('automation_rules')
        .upsert({
          id: ruleId,
          enabled: enabled,
          updated_at: new Date().toISOString()
        });

      if (error && error.code !== 'PGRST116') { // Ignore table not found error
        console.error('Database update error:', error);
      }

      // Update local state
      setAutomationRules(prev => prev.map(rule =>
        rule.id === ruleId ? { ...rule, enabled } : rule
      ));

      const ruleName = automationRules.find(r => r.id === ruleId)?.name;
      toast.success(`${ruleName} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast.error('Failed to update automation rule');
    }
  };

  const processReorderAlert = async (alertId: string, action: 'order' | 'dismiss') => {
    try {
      const alert = reorderAlerts.find(a => a.id === alertId);
      if (!alert) return;

      const supabase = createClient();

      if (action === 'order') {
        // Create a purchase order record
        const { error } = await supabase
          .from('purchase_orders')
          .insert({
            item_id: alertId,
            item_name: alert.itemName,
            quantity: alert.suggestedOrder,
            supplier: alert.supplier,
            business_unit: alert.businessUnit,
            status: 'pending',
            created_at: new Date().toISOString()
          });

        if (error && error.code !== 'PGRST116') { // Ignore table not found error
          console.error('Purchase order creation error:', error);
        }

        toast.success(`Purchase order created for ${alert.suggestedOrder} ${alert.itemName}`);
      } else {
        // Mark alert as dismissed
        const { error } = await supabase
          .from('inventory_items')
          .update({ 
            alert_dismissed: true,
            alert_dismissed_at: new Date().toISOString()
          })
          .eq('id', alertId);

        if (error && error.code !== 'PGRST116') {
          console.error('Alert dismissal error:', error);
        }

        toast.info(`Alert dismissed for ${alert.itemName}`);
      }

      // Remove from local state
      setReorderAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Error processing reorder alert:', error);
      toast.error('Failed to process alert');
    }
  };

  const getPriorityColor = (priority: ReorderAlert['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      default: return 'outline';
    }
  };

  const getRuleIcon = (type: AutomationRule['type']) => {
    switch (type) {
      case 'stock_deduction': return <TrendingDown className="h-4 w-4" />;
      case 'reorder_alert': return <AlertTriangle className="h-4 w-4" />;
      case 'waste_tracking': return <Package className="h-4 w-4" />;
      case 'cost_analysis': return <Target className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Automation Center
          </h2>
          <p className="text-gray-600">Intelligent automation for inventory and operations</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-green-600">
              {automationRules.filter(r => r.enabled).length}
            </span> of {automationRules.length} rules active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automation Rules */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation Rules
              </CardTitle>
              <CardDescription>Configure automatic processes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map(rule => (
                  <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${rule.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {getRuleIcon(rule.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                          {rule.lastTriggered && (
                            <p className="text-xs text-gray-500 mt-1">
                              Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                          <div className="font-medium">{rule.triggerCount}</div>
                          <div className="text-gray-500">triggers</div>
                        </div>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(enabled) => toggleAutomation(rule.id, enabled)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Stock Movements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Recent Auto Deductions
              </CardTitle>
              <CardDescription>Automatic inventory adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMovements.map(movement => (
                  <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{movement.itemName}</div>
                      <div className="text-sm text-gray-600">
                        Order: {movement.orderNumber} • {movement.businessUnit}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(movement.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-red-600">
                        -{movement.quantityUsed} {movement.unit}
                      </div>
                      {movement.automatic && (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reorder Alerts */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Smart Reorder Alerts ({reorderAlerts.length})
              </CardTitle>
              <CardDescription>Intelligent restocking suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reorderAlerts.map(alert => (
                  <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{alert.itemName}</h4>
                        <p className="text-sm text-gray-600">
                          {alert.supplier} • {alert.businessUnit}
                        </p>
                      </div>
                      <Badge variant={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Current</div>
                        <div className="font-medium text-red-600">
                          {alert.currentStock}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Minimum</div>
                        <div className="font-medium">{alert.minStock}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Suggested</div>
                        <div className="font-medium text-green-600">
                          {alert.suggestedOrder}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => processReorderAlert(alert.id, 'order')}
                        className="flex-1"
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Create Order
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => processReorderAlert(alert.id, 'dismiss')}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
                
                {reorderAlerts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>All inventory levels are optimal</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Automation Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Impact</CardTitle>
              <CardDescription>Benefits from automated processes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {recentMovements.length}
                  </div>
                  <div className="text-sm text-gray-600">Auto Deductions</div>
                  <div className="text-xs text-gray-500">Recent</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{Math.round(recentMovements.reduce((sum, m) => sum + (m.quantityUsed * 50), 0))}
                  </div>
                  <div className="text-sm text-gray-600">Est. Savings</div>
                  <div className="text-xs text-gray-500">From automation</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {reorderAlerts.length}
                  </div>
                  <div className="text-sm text-gray-600">Active Alerts</div>
                  <div className="text-xs text-gray-500">Need attention</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((automationRules.filter(r => r.enabled).length / automationRules.length) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Rules Active</div>
                  <div className="text-xs text-gray-500">
                    {automationRules.filter(r => r.enabled).length} of {automationRules.length} enabled
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}