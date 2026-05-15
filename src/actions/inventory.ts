"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { createDocument, queryDocuments, updateDocument } from "@/lib/supabase/database";
import { requireAuth, requireFinancialAccess } from "@/lib/auth-helpers";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { InventoryItem, StockMovement } from "@/types/business-management";

/**
 * Comprehensive Inventory Management System for DEORA Plaza
 * Handles stock tracking, low stock alerts, and inventory optimization
 */

export interface LowStockAlert {
  id?: string;
  itemId: string;
  itemName: string;
  businessUnit: string;
  currentStock: number;
  minStock: number;
  severity: 'low' | 'critical' | 'out_of_stock';
  alertDate: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface InventoryReport {
  businessUnit?: string;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categories: {
    [category: string]: {
      itemCount: number;
      totalValue: number;
      lowStockCount: number;
    };
  };
  topMovingItems: {
    itemName: string;
    totalMovement: number;
    currentStock: number;
  }[];
  slowMovingItems: {
    itemName: string;
    daysSinceLastMovement: number;
    currentStock: number;
  }[];
}

/**
 * Create new inventory item
 */
export async function createInventoryItem(data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const session = await requireAuth();

    // Validate SKU uniqueness if provided
    if (data.sku) {
      const { data: existingItem } = await supabaseServer
        .from('inventory_items')
        .select('id')
        .eq('sku', data.sku)
        .eq('businessUnit', data.businessUnit);

      if (existingItem && existingItem.length > 0) {
        return { success: false, error: 'SKU already exists for this business unit' };
      }
    }

    const itemData: Omit<InventoryItem, 'id'> = {
      ...data,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await createDocument('inventory_items', itemData)

    if (result.success) {
      // Create initial stock movement record
      if (data.currentStock > 0) {
        const movementData: Omit<StockMovement, 'id'> = {
          itemId: result.data?.id!,
          type: 'in',
          quantity: data.currentStock,
          reason: 'Initial stock',
          date: new Date().toISOString(),
          createdBy: session.user.id,
          createdAt: new Date().toISOString()
        }

        await createDocument('stock_movements', movementData)
      }

      await createAuditLog(
        'INVENTORY_ITEM_CREATED',
        { 
          itemId: result.data?.id,
          name: data.name,
          category: data.category,
          businessUnit: data.businessUnit,
          initialStock: data.currentStock
        },
        true,
        `Inventory item ${data.name} created`
      )

      revalidatePath('/dashboard/inventory')
      return { success: true, itemId: result.data?.id, item: { ...itemData, id: result.data?.id } }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return { success: false, error: 'Failed to create inventory item' }
  }
}

/**
 * Update inventory item
 */
export async function updateInventoryItem(id: string, data: Partial<InventoryItem>) {
  try {
    await requireAuth();

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    }

    const result = await updateDocument('inventory_items', id, updateData)

    if (result.success) {
      await createAuditLog(
        'INVENTORY_ITEM_UPDATED',
        { itemId: id, updates: Object.keys(data) },
        true,
        `Inventory item ${id} updated`
      )

      revalidatePath('/dashboard/inventory')
      return { success: true }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return { success: false, error: 'Failed to update inventory item' }
  }
}

/**
 * Update stock levels
 */
export async function updateStock(
  itemId: string,
  quantity: number,
  type: 'in' | 'out' | 'adjustment' | 'waste' | 'transfer',
  reason: string,
  reference?: string,
  cost?: number
): Promise<{ success: boolean; newStock?: number; error?: string }> {
  try {
    const session = await requireAuth();

    // Get current item
    const { data: item, error: itemError } = await supabaseServer
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return { success: false, error: 'Inventory item not found' };
    }

    const previousStock = item.currentStock;
    let newStock: number;

    switch (type) {
      case 'in':
        newStock = previousStock + quantity;
        break;
      case 'out':
        newStock = previousStock - quantity;
        break;
      case 'adjustment':
        newStock = quantity; // Direct adjustment to specific quantity
        break;
      case 'waste':
        newStock = previousStock - quantity;
        break;
      case 'transfer':
        newStock = previousStock - quantity;
        break;
      default:
        return { success: false, error: 'Invalid movement type' };
    }

    if (newStock < 0) {
      return { success: false, error: 'Insufficient stock' };
    }

    // Update inventory
    const updateResult = await updateDocument('inventory_items', itemId, {
      currentStock: newStock,
      lastRestocked: type === 'in' ? new Date().toISOString() : item.lastRestocked,
      updatedAt: new Date().toISOString()
    });

    if (!updateResult.success) {
      throw new Error(`Failed to update stock: ${updateResult.error}`);
    }

    // Create movement record
    const movementData: Omit<StockMovement, 'id'> = {
      itemId,
      type,
      quantity: Math.abs(quantity),
      reason,
      date: new Date().toISOString(),
      createdBy: session.user.id,
      createdAt: new Date().toISOString()
    }

    const result = await createDocument('stock_movements', movementData)

    if (result.success) {
      // Check for low stock alerts
      await checkLowStockAlert(itemId, item.name, item.businessUnit, newStock, item.minStock);

      await createAuditLog(
        type === 'in' ? 'STOCK_ADDED' : type === 'out' ? 'STOCK_REMOVED' : 'STOCK_ADJUSTED',
        { itemId, quantity, newStock, reason, type },
        true,
        `${type === 'in' ? 'Added' : type === 'out' ? 'Removed' : 'Adjusted'} ${quantity} ${item.unit} of ${item.name}. New stock: ${newStock}`
      )

      revalidatePath('/dashboard/inventory')
      return { success: true, newStock }
    }

    return { success: false, error: result.error }
  } catch (error) {
    console.error('Error updating stock:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Add stock (stock in) - Legacy function for backward compatibility
 */
export async function addStock(
  itemId: string, 
  quantity: number, 
  reason: string, 
  createdBy: string
) {
  return updateStock(itemId, quantity, 'in', reason);
}

/**
 * Remove stock (stock out) - Legacy function for backward compatibility
 */
export async function removeStock(
  itemId: string, 
  quantity: number, 
  reason: string, 
  createdBy: string
) {
  return updateStock(itemId, quantity, 'out', reason);
}

/**
 * Adjust stock (for corrections) - Legacy function for backward compatibility
 */
export async function adjustStock(
  itemId: string, 
  newQuantity: number, 
  reason: string, 
  createdBy: string
) {
  return updateStock(itemId, newQuantity, 'adjustment', reason);
}

// Check and create low stock alerts
async function checkLowStockAlert(itemId: string, itemName: string, businessUnit: string, currentStock: number, minStock: number): Promise<void> {
  try {
    let severity: 'low' | 'critical' | 'out_of_stock';
    
    if (currentStock === 0) {
      severity = 'out_of_stock';
    } else if (currentStock <= minStock * 0.5) {
      severity = 'critical';
    } else if (currentStock <= minStock) {
      severity = 'low';
    } else {
      // Stock is above minimum, resolve any existing alerts
      await supabaseServer
        .from('low_stock_alerts')
        .update({
          isResolved: true,
          resolvedAt: new Date().toISOString()
        })
        .eq('itemId', itemId)
        .eq('isResolved', false);
      return;
    }

    // Check if alert already exists
    const { data: existingAlert } = await supabaseServer
      .from('low_stock_alerts')
      .select('id')
      .eq('itemId', itemId)
      .eq('isResolved', false);

    if (!existingAlert || existingAlert.length === 0) {
      // Create new alert
      const alert: LowStockAlert = {
        itemId,
        itemName,
        businessUnit,
        currentStock,
        minStock,
        severity,
        alertDate: new Date().toISOString(),
        isResolved: false
      };

      await createDocument('low_stock_alerts', alert);
    } else {
      // Update existing alert severity
      await updateDocument('low_stock_alerts', existingAlert[0].id, {
        currentStock,
        severity,
        alertDate: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error checking low stock alert:', error);
  }
}

/**
 * Get inventory items
 */
export async function getInventoryItems(
  businessUnit?: string,
  category?: string,
  status: 'active' | 'inactive' | 'all' = 'active',
  filters?: {
    lowStock?: boolean;
    outOfStock?: boolean;
    search?: string;
  }
) {
  try {
    await requireAuth();

    let query = supabaseServer.from('inventory_items').select('*');

    if (businessUnit && businessUnit !== 'all') {
      query = query.eq('businessUnit', businessUnit);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('name');

    if (error) {
      throw error;
    }

    let items = (data || []) as InventoryItem[];

    // Apply stock filters
    if (filters?.lowStock) {
      items = items.filter(item => item.currentStock <= item.minStock && item.currentStock > 0);
    }
    if (filters?.outOfStock) {
      items = items.filter(item => item.currentStock === 0);
    }

    return items;
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return []
  }
}

/**
 * Get low stock items
 */
export async function getLowStockItems() {
  try {
    const items = await getInventoryItems()
    return items.filter(item => item.currentStock <= item.minStock)
  } catch (error) {
    console.error('Error fetching low stock items:', error)
    return []
  }
}

/**
 * Get out of stock items
 */
export async function getOutOfStockItems() {
  try {
    const items = await getInventoryItems()
    return items.filter(item => item.currentStock === 0)
  } catch (error) {
    console.error('Error fetching out of stock items:', error)
    return []
  }
}

/**
 * Get stock movements
 */
export async function getStockMovements(itemId?: string, startDate?: string, endDate?: string, businessUnit?: string, limit: number = 50) {
  try {
    await requireAuth();

    let query = supabaseServer.from('stock_movements').select('*');

    if (itemId) {
      query = query.eq('itemId', itemId);
    }

    if (businessUnit) {
      query = query.eq('businessUnit', businessUnit);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []) as StockMovement[];
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return []
  }
}

// Get low stock alerts
export async function getLowStockAlerts(businessUnit?: string): Promise<LowStockAlert[]> {
  try {
    await requireAuth();

    let query = supabaseServer
      .from('low_stock_alerts')
      .select('*')
      .eq('isResolved', false);

    if (businessUnit) {
      query = query.eq('businessUnit', businessUnit);
    }

    const { data, error } = await query.order('severity').order('alertDate', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    return [];
  }
}

// Resolve low stock alert
export async function resolveLowStockAlert(alertId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();

    const result = await updateDocument('low_stock_alerts', alertId, {
      isResolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedBy: session.user.id
    });

    if (!result.success) {
      throw new Error(`Failed to resolve alert: ${result.error}`);
    }

    revalidatePath('/dashboard/inventory');

    return { success: true };
  } catch (error) {
    console.error('Error resolving low stock alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get inventory summary
 */
export async function getInventorySummary() {
  try {
    const items = await getInventoryItems()
    
    const totalItems = items.length
    const lowStockItems = items.filter(item => item.currentStock <= item.minStock).length
    const outOfStockItems = items.filter(item => item.currentStock === 0).length
    const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0)

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue: Math.round(totalValue)
    }
  } catch (error) {
    console.error('Error getting inventory summary:', error)
    return {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalValue: 0
    }
  }
}

// Generate inventory report
export async function generateInventoryReport(businessUnit?: string): Promise<InventoryReport> {
  try {
    await requireAuth();

    // Get all inventory items
    const items = await getInventoryItems(businessUnit);
    
    // Get stock movements for analysis
    const movements = await getStockMovements(undefined, undefined, undefined, businessUnit, 1000);

    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.currentStock * (item.unitCost || 0)), 0);
    const lowStockItems = items.filter(item => item.currentStock <= item.minStock && item.currentStock > 0).length;
    const outOfStockItems = items.filter(item => item.currentStock === 0).length;

    // Category breakdown
    const categories: { [category: string]: { itemCount: number; totalValue: number; lowStockCount: number } } = {};
    
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = { itemCount: 0, totalValue: 0, lowStockCount: 0 };
      }
      categories[item.category].itemCount++;
      categories[item.category].totalValue += item.currentStock * (item.unitCost || 0);
      if (item.currentStock <= item.minStock) {
        categories[item.category].lowStockCount++;
      }
    });

    // Top moving items (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMovements = movements.filter(m => new Date(m.date) >= thirtyDaysAgo);
    const itemMovements: { [itemId: string]: { itemName: string; totalMovement: number; currentStock: number } } = {};

    recentMovements.forEach(movement => {
      if (!itemMovements[movement.itemId]) {
        const item = items.find(i => i.id === movement.itemId);
        itemMovements[movement.itemId] = {
          itemName: item?.name || 'Unknown Item',
          totalMovement: 0,
          currentStock: item?.currentStock || 0
        };
      }
      if (movement.type === 'out') {
        itemMovements[movement.itemId].totalMovement += movement.quantity;
      }
    });

    const topMovingItems = Object.values(itemMovements)
      .sort((a, b) => b.totalMovement - a.totalMovement)
      .slice(0, 10);

    // Slow moving items (no movement in last 30 days)
    const slowMovingItems = items
      .filter(item => {
        const hasRecentMovement = recentMovements.some(m => m.itemId === item.id);
        return !hasRecentMovement && item.currentStock > 0;
      })
      .map(item => {
        const lastMovement = movements.find(m => m.itemId === item.id);
        const daysSinceLastMovement = lastMovement 
          ? Math.floor((Date.now() - new Date(lastMovement.date).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        return {
          itemName: item.name,
          daysSinceLastMovement,
          currentStock: item.currentStock
        };
      })
      .sort((a, b) => b.daysSinceLastMovement - a.daysSinceLastMovement)
      .slice(0, 10);

    return {
      businessUnit,
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      categories,
      topMovingItems,
      slowMovingItems
    };
  } catch (error) {
    console.error('Error generating inventory report:', error);
    return {
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      categories: {},
      topMovingItems: [],
      slowMovingItems: []
    };
  }
}

// Bulk update stock (for receiving shipments)
export async function bulkUpdateStock(updates: {
  itemId: string;
  quantity: number;
  cost?: number;
}[], reason: string, reference?: string): Promise<{ success: boolean; updated: number; errors: string[] }> {
  try {
    const session = await requireAuth();
    let updated = 0;
    const errors: string[] = [];

    for (const update of updates) {
      const result = await updateStock(
        update.itemId,
        update.quantity,
        'in',
        reason,
        reference,
        update.cost
      );

      if (result.success) {
        updated++;
      } else {
        errors.push(`${update.itemId}: ${result.error}`);
      }
    }

    await createAuditLog(
      'UPDATE_ORDER',
      {
        totalItems: updates.length,
        successfulUpdates: updated,
        errors: errors.length,
        reason,
        reference
      },
      true
    );

    revalidatePath('/dashboard/inventory');

    return { success: true, updated, errors };
  } catch (error) {
    console.error('Error in bulk stock update:', error);
    return {
      success: false,
      updated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// Get inventory categories
export async function getInventoryCategories(businessUnit?: string): Promise<string[]> {
  try {
    await requireAuth();

    let query = supabaseServer
      .from('inventory_items')
      .select('category')
      .eq('status', 'active');

    if (businessUnit) {
      query = query.eq('businessUnit', businessUnit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const categories = [...new Set((data || []).map(item => item.category))];
    return categories.sort();
  } catch (error) {
    console.error('Error fetching inventory categories:', error);
    return [];
  }
}

/**
 * Create low stock notification - Legacy function for backward compatibility
 */
async function createLowStockNotification(item: InventoryItem) {
  try {
    await createDocument('notifications', {
      type: 'low_stock',
      itemId: item.id,
      businessUnit: item.businessUnit,
      message: `${item.name} is running low (${item.currentStock} ${item.unit} remaining)`,
      title: 'Low Stock Alert',
      recipient: 'manager',
      metadata: {
        itemName: item.name,
        currentStock: item.currentStock,
        minStock: item.minStock,
        unit: item.unit
      },
      isRead: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })
  } catch (error) {
    console.warn('Failed to create low stock notification:', error)
  }
}

/**
 * Search inventory items
 */
export async function searchInventoryItems(query: string) {
  try {
    const items = await getInventoryItems()
    
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(query.toLowerCase())
    )

    return filtered
  } catch (error) {
    console.error('Error searching inventory items:', error)
    return []
  }
}

/**
 * Get inventory analytics
 */
export async function getInventoryAnalytics(startDate: string, endDate: string) {
  try {
    const movements = await getStockMovements(undefined, startDate, endDate)
    
    const stockIn = movements
      .filter(m => m.type === 'in')
      .reduce((sum, m) => sum + m.quantity, 0)
    
    const stockOut = movements
      .filter(m => m.type === 'out')
      .reduce((sum, m) => sum + m.quantity, 0)
    
    const adjustments = movements
      .filter(m => m.type === 'adjustment')
      .reduce((sum, m) => sum + m.quantity, 0)
    
    // Group by category
    const items = await getInventoryItems()
    const byCategory: Record<string, { items: number; value: number }> = {}
    
    items.forEach(item => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = { items: 0, value: 0 }
      }
      byCategory[item.category].items++
      byCategory[item.category].value += item.currentStock * (item.unitCost || 0)
    })
    
    return {
      stockIn,
      stockOut,
      adjustments,
      netMovement: stockIn - stockOut,
      byCategory,
      totalMovements: movements.length
    }
  } catch (error) {
    console.error('Error getting inventory analytics:', error)
    return {
      stockIn: 0,
      stockOut: 0,
      adjustments: 0,
      netMovement: 0,
      byCategory: {},
      totalMovements: 0
    }
  }
}