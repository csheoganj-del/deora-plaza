'use client';

import { useState, useEffect } from 'react';
import { PremiumLiquidGlass, PremiumContainer, PremiumStatsCard } from '@/components/ui/glass/premium-liquid-glass';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
            Inventory Management
          </h1>
          <p className="text-white/50 mt-1">Track stock levels and manage supplies across all units</p>
        </div>
        <div className="flex gap-3">
          <Button
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-lg shadow-[#22C55E]/20 border-0"
            onClick={() => toast.info('Import functionality coming soon')}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Alerts Section (Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PremiumStatsCard
          title="Low Stock Alerts"
          value={alerts.length.toString()}
          icon={AlertTriangle}
          trend={alerts.length > 0 ? "Action Required" : "Good"}
          trendUp={alerts.length === 0}
          className={alerts.length > 0 ? "border-orange-500/30 bg-orange-500/10" : ""}
        />
        <PremiumStatsCard
          title="Total Items"
          value={inventory.length.toString()}
          icon={Package}
        />
        <PremiumStatsCard
          title="Categories"
          value={categories.length.toString()}
          icon={Filter}
        />
      </div>

      <PremiumLiquidGlass title="Inventory Items">
        <div className="flex flex-col gap-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                placeholder="Search by name or category..."
                className="w-full pl-10 h-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 px-3"
              >
                <option value="all" className="bg-[#1f1f23]">All Categories</option>
                {categories.map(c => <option key={c} value={c} className="bg-[#1f1f23]">{c}</option>)}
              </select>

              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="h-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 px-3"
              >
                <option value="all" className="bg-[#1f1f23]">All Units</option>
                {businessUnits.map(u => <option key={u} value={u} className="bg-[#1f1f23]">{u}</option>)}
              </select>
            </div>
          </div>

          {/* Actions/Debug */}
          {inventory.length > 0 && (
            <div className="flex gap-2 justify-end">
              <Button
                onClick={clearSampleData}
                variant="destructive"
                size="sm"
                className="h-8 text-xs"
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
                className="h-8 text-xs border-white/10 text-white/60 hover:text-white hover:bg-white/5"
              >
                Debug DB
              </Button>
            </div>
          )}

          {/* Grid */}
          {filteredInventory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredInventory.map(item => {
                const status = getStockStatus(item);
                const isLow = status === 'low';

                return (
                  <div key={item.id} className={`group relative p-5 rounded-xl border transition-all hover:bg-white/5 ${isLow ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white group-hover:text-primary transition-colors">{item.name}</h3>
                        <p className="text-xs text-white/40">{item.category} • {item.businessUnit}</p>
                      </div>
                      <Badge variant={isLow ? 'destructive' : 'outline'} className={isLow ? '' : 'text-white border-white/20'}>
                        {status === 'low' ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/40">Current Stock:</span>
                        <span className="font-bold text-xl text-white">{item.currentStock} <span className="text-xs font-normal text-white/40">{item.unit}</span></span>
                      </div>

                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isLow ? 'bg-orange-500' : 'bg-[#22C55E]'}`}
                          style={{ width: `${Math.min(100, (item.currentStock / item.maxStock) * 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-white/40 pt-1">
                        <span>Min: {item.minStock}</span>
                        <span>Max: {item.maxStock}</span>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <button
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                            onClick={() => updateStock(item.id, -1)}
                            disabled={item.currentStock <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-bold text-white">{item.currentStock}</span>
                          <button
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                            onClick={() => updateStock(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="text-xs font-medium text-white/60">₹{item.costPerUnit}/unit</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-white/40">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="mb-4">No inventory items found</p>
              <Button onClick={() => toast.info('Add inventory items through your admin panel or import from CSV')} variant="secondary">
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          )}
        </div>
      </PremiumLiquidGlass>
    </div>
  );
}