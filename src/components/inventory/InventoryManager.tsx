'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Package, Plus, Minus, Search, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  costPerUnit: number;
  supplier?: string;
  lastUpdated: string;
  businessUnit: string;
}

interface StockAlert {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  category: string;
  businessUnit: string;
}

export default function InventoryManager() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');

  useEffect(() => {
    fetchInventory();
    // Set up real-time subscription
    const supabase = createClient();
    const subscription = supabase
      .channel('inventory_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory' },
        () => fetchInventory()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchInventory = async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const inventoryData = data || [];
      setInventory(inventoryData);

      // Calculate alerts
      const lowStockItems = inventoryData.filter(item => 
        item.currentStock <= item.minStock
      );
      setAlerts(lowStockItems);

    } catch (error) {
      console.error('Error fetching inventory:', error);
      // Start with empty inventory
      setInventory([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSampleData = async () => {
    try {
      const supabase = createClient();
      
      // Get all records first to see what we're dealing with
      const { data: allRecords, error: fetchError } = await supabase
        .from('inventory')
        .select('*');
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching records:', fetchError);
        toast.error('Failed to fetch inventory data');
        return;
      }
      
      if (!allRecords || allRecords.length === 0) {
        toast.info('No inventory data to clear');
        return;
      }
      
      console.log('Found records to delete:', allRecords);
      
      // Try to delete all records using a simple delete query
      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // This should match all real UUIDs
        
      if (deleteError) {
        console.error('Bulk delete failed:', deleteError);
        
        // Fallback: Delete each record individually
        console.log('Trying individual deletes...');
        let deleteCount = 0;
        
        for (const record of allRecords) {
          const { error: individualError } = await supabase
            .from('inventory')
            .delete()
            .eq('id', record.id);
            
          if (!individualError) {
            deleteCount++;
          } else {
            console.error(`Failed to delete record ${record.id}:`, individualError);
          }
        }
        
        if (deleteCount > 0) {
          toast.success(`Deleted ${deleteCount} of ${allRecords.length} items`);
        } else {
          toast.error('Failed to delete any items');
        }
      } else {
        toast.success(`Successfully cleared all ${allRecords.length} inventory items`);
      }
      
      // Force refresh the data
      await fetchInventory();
      
    } catch (error) {
      console.error('Error in clearSampleData:', error);
      toast.error('Failed to clear inventory data');
    }
  };

  const createSampleInventory = async () => {
    // Don't create sample data in production
    // Users should add their own inventory items
    console.log('Inventory table is empty - users can add their own items');
  };

  const createSampleInventoryData = () => {
    // Start with empty inventory - no sample data in production
    setInventory([]);
    setAlerts([]);
    toast.info('No inventory items found. Add items to get started.');
  };

  const updateStock = async (itemId: string, change: number) => {
    try {
      const supabase = createClient();
      const item = inventory.find(i => i.id === itemId);
      if (!item) return;

      const newStock = Math.max(0, item.currentStock + change);
      
      const { error } = await supabase
        .from('inventory')
        .update({ 
          currentStock: newStock,
          lastUpdated: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setInventory(prev => prev.map(i => 
        i.id === itemId 
          ? { ...i, currentStock: newStock, lastUpdated: new Date().toISOString() }
          : i
      ));

      toast.success(`Stock updated for ${item.name}`);
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.minStock) return 'low';
    if (item.currentStock >= item.maxStock) return 'high';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'destructive';
      case 'high': return 'secondary';
      default: return 'default';
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesUnit = selectedUnit === 'all' || item.businessUnit === selectedUnit;
    
    return matchesSearch && matchesCategory && matchesUnit;
  });

  const categories = [...new Set(inventory.map(item => item.category))];
  const businessUnits = [...new Set(inventory.map(item => item.businessUnit))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-sm text-gray-600">{alert.category} • {alert.businessUnit}</p>
                  </div>
                  <Badge variant="destructive">
                    {alert.currentStock}/{alert.minStock}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>Track and manage stock levels across all business units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="unit">Business Unit</Label>
              <select
                id="unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Units</option>
                {businessUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            {inventory.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Actions</Label>
                <div className="flex gap-2">
                  <Button 
                    onClick={clearSampleData}
                    variant="destructive"
                    size="sm"
                  >
                    Clear All Data
                  </Button>
                  <Button 
                    onClick={async () => {
                      const supabase = createClient();
                      const { data } = await supabase.from('inventory').select('*');
                      console.log('Current inventory data:', data);
                      toast.info(`Found ${data?.length || 0} items in database`);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Debug DB
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.map(item => {
              const status = getStockStatus(item);
              return (
                <Card key={item.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription>{item.category} • {item.businessUnit}</CardDescription>
                      </div>
                      <Badge variant={getStatusColor(status)}>
                        {status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Current Stock:</span>
                        <span className="font-semibold">{item.currentStock} {item.unit}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Min/Max:</span>
                        <span className="text-sm">{item.minStock}/{item.maxStock} {item.unit}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cost per unit:</span>
                        <span className="text-sm">₹{item.costPerUnit}</span>
                      </div>

                      {item.supplier && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Supplier:</span>
                          <span className="text-sm">{item.supplier}</span>
                        </div>
                      )}

                      {/* Stock Controls */}
                      <div className="flex items-center justify-center gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStock(item.id, -1)}
                          disabled={item.currentStock <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="mx-2 font-medium">{item.currentStock}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStock(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No inventory items found</p>
              <Button onClick={() => toast.info('Add inventory items through your admin panel or import from CSV')}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}