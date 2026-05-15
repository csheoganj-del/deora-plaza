"use client";

import { useState, useEffect } from "react";
;
import { unifiedInventoryManager, InventoryItem, StockAlert, InventoryTransfer } from "@/lib/unified-inventory";
import { BusinessUnitType } from "@/lib/business-units";


export function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<BusinessUnitType | 'all'>('all');
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    expiringItems: 0,
    totalValue: 0,
    pendingTransfers: 0
  });
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<StockAlert[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<InventoryTransfer[]>([]);
  const [valuation, setValuation] = useState({
    totalValue: 0,
    categoryBreakdown: {} as Record<string, number>,
    businessUnitBreakdown: {} as Record<string, number>
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedBusinessUnit]);

  const loadDashboardData = () => {
    setLoading(true);
    
    // Get basic stats
    const items = unifiedInventoryManager.getItems({ 
      businessUnit: selectedBusinessUnit === 'all' ? undefined : (selectedBusinessUnit as string).toUpperCase() as any,
      activeOnly: true 
    });
    
    const lowStock = unifiedInventoryManager.getLowStockItems(
      selectedBusinessUnit === 'all' ? undefined : (selectedBusinessUnit as string).toUpperCase() as any
    );
    
    const outOfStock = items.filter(item => item.currentStock === 0);
    const expiring = unifiedInventoryManager.getExpiringItems(7, 
      selectedBusinessUnit === 'all' ? undefined : (selectedBusinessUnit as string).toUpperCase() as any
    );
    
    const alerts = unifiedInventoryManager.getAlerts({
      businessUnit: selectedBusinessUnit === 'all' ? undefined : (selectedBusinessUnit as string).toUpperCase() as any,
      unreadOnly: true
    });
    
    const transfers = unifiedInventoryManager.getTransfers({
      status: 'pending'
    });
    
    const inventoryValuation = unifiedInventoryManager.getInventoryValuation(
      selectedBusinessUnit === 'all' ? undefined : (selectedBusinessUnit as string).toUpperCase() as any
    );

    setStats({
      totalItems: items.length,
      lowStockItems: lowStock.length,
      outOfStockItems: outOfStock.length,
      expiringItems: expiring.length,
      totalValue: inventoryValuation.totalValue,
      pendingTransfers: transfers.filter(t => 
        selectedBusinessUnit === 'all' || 
        t.fromBusinessUnit === ((selectedBusinessUnit as string).toUpperCase() as any) || 
        t.toBusinessUnit === ((selectedBusinessUnit as string).toUpperCase() as any)
      ).length
    });
    
    setLowStockItems(lowStock.slice(0, 5));
    setRecentAlerts(alerts.slice(0, 5));
    setPendingTransfers(transfers.slice(0, 5));
    setValuation(inventoryValuation);
    
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-[#EF4444] bg-[#FEE2E2]';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-[#F59E0B] bg-[#F59E0B]/10';
      case 'low': return 'text-[#6D5DFB] bg-[#EDEBFF]/30';
      default: return 'text-[#6B7280] bg-[#F1F5F9]';
    }
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'text-[#EF4444]';
    if (item.currentStock <= item.minStock) return 'text-orange-600';
    if (item.currentStock <= item.reorderPoint) return 'text-[#F59E0B]';
    return 'text-[#22C55E]';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
        <p className="text-center text-[#6B7280]">Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Inventory Dashboard</h1>
          <p className="text-[#6B7280]">Unified inventory management across all business units</p>
        </div>
        
        <select
          value={selectedBusinessUnit}
          onChange={(e) => setSelectedBusinessUnit(e.target.value as BusinessUnitType | 'all')}
          className="px-4 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
        >
          <option value="all">All Business Units</option>
          <option value={BusinessUnitType.CAFE}>Cafe</option>
          <option value={BusinessUnitType.RESTAURANT}>Restaurant</option>
          <option value={BusinessUnitType.BAR}>Bar</option>
          <option value={BusinessUnitType.HOTEL}>Hotel</option>
          <option value={BusinessUnitType.MARRIAGE_GARDEN}>Marriage Garden</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Total Items</p>
              <p className="text-2xl font-bold text-[#111827]">{stats.totalItems}</p>
            </div>
            <div className="p-3 bg-[#EDEBFF]/30 rounded-lg">
              <svg className="w-6 h-6 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Out of Stock</p>
              <p className="text-2xl font-bold text-[#EF4444]">{stats.outOfStockItems}</p>
            </div>
            <div className="p-3 bg-[#FEE2E2] rounded-lg">
              <svg className="w-6 h-6 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Total Value</p>
              <p className="text-2xl font-bold text-[#22C55E]">${stats.totalValue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-[#BBF7D0] rounded-lg">
              <svg className="w-6 h-6 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Items */}
      <div className="premium-card">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-[#111827]">Low Stock Items</h3>
          <p className="text-sm text-[#6B7280]">Items that need to be reordered</p>
        </div>
        <div className="overflow-x-auto">
          {lowStockItems.length === 0 ? (
            <div className="p-6 text-center text-[#9CA3AF]">
              No low stock items found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Current Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Min Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Business Units</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[#111827]">{item.name}</p>
                        <p className="text-sm text-[#9CA3AF]">{item.sku}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${getStockStatusColor(item)}`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#111827]">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.businessUnits.map((bu, index) => (
                          <span key={index} className="text-xs bg-[#F1F5F9] px-2 py-1 rounded">
                            {bu}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-[#6D5DFB] hover:text-[#6D5DFB]/90 text-sm font-medium">
                        Reorder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Recent Alerts</h3>
            <p className="text-sm text-[#6B7280]">Latest inventory notifications</p>
          </div>
          <div className="p-4 space-y-3">
            {recentAlerts.length === 0 ? (
              <div className="text-center text-[#9CA3AF] py-4">
                No recent alerts
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity).split(' ')[1]}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#111827]">{alert.message}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {new Date(alert.createdAt).toLocaleString()} • {alert.businessUnit}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Transfers */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Pending Transfers</h3>
            <p className="text-sm text-[#6B7280]">Inter-business unit transfers</p>
          </div>
          <div className="p-4 space-y-3">
            {pendingTransfers.length === 0 ? (
              <div className="text-center text-[#9CA3AF] py-4">
                No pending transfers
              </div>
            ) : (
              pendingTransfers.map((transfer) => {
                const item = unifiedInventoryManager.getItemById(transfer.itemId);
                return (
                  <div key={transfer.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#111827]">
                        {item?.name || 'Unknown Item'}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {transfer.fromBusinessUnit} → {transfer.toBusinessUnit} • {transfer.quantity} {item?.unit}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-[#22C55E] hover:text-[#16A34A] text-sm">
                        Approve
                      </button>
                      <button className="text-[#EF4444] hover:text-[#DC2626] text-sm">
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Inventory Valuation */}
      <div className="premium-card">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-[#111827]">Inventory Valuation</h3>
          <p className="text-sm text-[#6B7280]">Total inventory value by category and business unit</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div>
              <h4 className="font-medium text-[#111827] mb-3">By Category</h4>
              <div className="space-y-2">
                {Object.entries(valuation.categoryBreakdown).map(([category, value]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-[#6B7280] capitalize">{category}</span>
                    <span className="text-sm font-medium text-[#111827]">${value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Unit Breakdown */}
            <div>
              <h4 className="font-medium text-[#111827] mb-3">By Business Unit</h4>
              <div className="space-y-2">
                {Object.entries(valuation.businessUnitBreakdown).map(([bu, value]) => (
                  <div key={bu} className="flex justify-between items-center">
                    <span className="text-sm text-[#6B7280]">{bu}</span>
                    <span className="text-sm font-medium text-[#111827]">${value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

