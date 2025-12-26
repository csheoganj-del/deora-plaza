"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { createDocument, queryDocuments, updateDocument } from "@/lib/supabase/database";
import { requireAuth, requireFinancialAccess } from "@/lib/auth-helpers";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/**
 * Comprehensive Inventory Management System for DEORA Plaza
 * Handles stock tracking, low stock alerts, and inventory optimization
 */

export interface InventoryItem {
  id?: string;
  name: string;
  category: string;
  businessUnit: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string; // kg, liters, pieces, etc.
  costPrice: number;
  sellingPrice: number;
  supplier?: string;
  supplierContact?: string;
  lastRestocked?: string;
  expiryDate?: string;
  location?: string; // storage location
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id?: string;
  itemId: string;
  itemName: string;
  businessUnit: string;
  type: 'in' | 'out' | 'adjustment' | 'waste' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string; // order ID, supplier invoice, etc.
  performedBy: string;
  performedAt: string;
  cost?: number;
  notes?: string;
}

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

// Create or update inventory item
export async function createInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; item?: InventoryItem; error?: string }> {
  try {
    const session = await requireAuth();

    // Validate SKU uniqueness
    const { data: existingItem } = await supabaseServer
      .from('inventory')
      .select('id')
      .eq('sku', item.sku)
      .eq('businessUnit', item.businessUnit);

    if (existingItem && existingItem.length > 0) {
      return { success: false, error: 'SKU already exists for this business unit' };
    }

    const newItem: InventoryItem = {
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await createDocument('inventory', newItem);
    if (!result.success) {
      throw new Error(`Failed to create inventory item: ${result.error}`);
    }

    // Create initial stock movement record
    await createStockMovement({
      itemId: result.data?.id!,
      itemName: item.name,
      businessUnit: item.businessUnit,
      type: 'in',
      quantity: item.currentStock,
      previousStock: 0,
      newStock: item.currentStock,
      reason: 'Initial stock',
      performedBy: session.user.id,
      performedAt: new Date().toISOString(),
      cost: item.costPrice * item.currentStock
    });

    await createAuditLog(
      'CREATE_ORDER',
      {
        itemId: result.data?.id,
        itemName: item.name,
        sku: item.sku,
        businessUnit: item.businessUnit,
        initialStock: item.currentStock
      },
      true
    );

    revalidatePath('/dashboard/inventory');

    return {
      success: true,
      item: { ...newItem, id: result.data?.id }
    };
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Update inventory item
export async function updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth();

    const result = await updateDocument('inventory', itemId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    if (!result.success) {
      throw new Error(`Failed to update inventory item: ${result.error}`);
    }

    await createAuditLog(
      'UPDATE_ORDER',
      {
        itemId,
        updates: Object.keys(updates)
      },
      true
    );

    revalidatePath('/dashboard/inventory');

    return { success: true };
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Create stock movement record
export async function createStockMovement(movement: Omit<StockMovement, 'id'>): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await createDocument('stock_movements', movement);
    if (!result.success) {
      throw new Error(`Failed to create stock movement: ${result.error}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating stock movement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Update stock levels
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
      .from('inventory')
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
    const updateResult = await updateDocument('inventory', itemId, {
      currentStock: newStock,
      lastRestocked: type === 'in' ? new Date().toISOString() : item.lastRestocked,
      updatedAt: new Date().toISOString()
    });

    if (!updateResult.success) {
      throw new Error(`Failed to update stock: ${updateResult.error}`);
    }

    // Create movement record
    await createStockMovement({
      itemId,
      itemName: item.name,
      businessUnit: item.businessUnit,
      type,
      quantity: Math.abs(quantity),
      previousStock,
      newStock,
      reason,
      reference,
      performedBy: session.user.id,
      performedAt: new Date().toISOString(),
      cost
    });

    // Check for low stock alerts
    await checkLowStockAlert(itemId, item.name, item.businessUnit, newStock, item.minStock);

    await createAuditLog(
      'UPDATE_ORDER',
      {
        itemId,
        itemName: item.name,
        type,
        quantity,
        previousStock,
        newStock,
        reason
      },
      true
    );

    revalidatePath('/dashboard/inventory');

    return { success: true, newStock };
  } catch (error) {
    console.error('Error updating stock:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
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

// Get inventory items with filtering
export async function getInventoryItems(filters?: {
  businessUnit?: string;
  category?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  search?: string;
}): Promise<InventoryItem[]> {
  try {
    await requireAuth();

    let query = supabaseServer.from('inventory').select('*').eq('isActive', true);

    if (filters?.businessUnit) {
      query = query.eq('businessUnit', filters.businessUnit);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('name');

    if (error) {
      throw error;
    }

    let items = data || [];

    // Apply stock filters
    if (filters?.lowStock) {
      items = items.filter(item => item.currentStock <= item.minStock && item.currentStock > 0);
    }
    if (filters?.outOfStock) {
      items = items.filter(item => item.currentStock === 0);
    }

    return items;
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return [];
  }
}

// Get stock movements for an item
export async function getStockMovements(itemId?: string, businessUnit?: string, limit: number = 50): Promise<StockMovement[]> {
  try {
    await requireAuth();

    let query = supabaseServer.from('stock_movements').select('*');

    if (itemId) {
      query = query.eq('itemId', itemId);
    }
    if (businessUnit) {
      query = query.eq('businessUnit', businessUnit);
    }

    const { data, error } = await query
      .order('performedAt', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return [];
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

// Generate inventory report
export async function generateInventoryReport(businessUnit?: string): Promise<InventoryReport> {
  try {
    await requireAuth();

    // Get all inventory items
    const items = await getInventoryItems({ businessUnit });
    
    // Get stock movements for analysis
    const movements = await getStockMovements(undefined, businessUnit, 1000);

    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0);
    const lowStockItems = items.filter(item => item.currentStock <= item.minStock && item.currentStock > 0).length;
    const outOfStockItems = items.filter(item => item.currentStock === 0).length;

    // Category breakdown
    const categories: { [category: string]: { itemCount: number; totalValue: number; lowStockCount: number } } = {};
    
    items.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = { itemCount: 0, totalValue: 0, lowStockCount: 0 };
      }
      categories[item.category].itemCount++;
      categories[item.category].totalValue += item.currentStock * item.costPrice;
      if (item.currentStock <= item.minStock) {
        categories[item.category].lowStockCount++;
      }
    });

    // Top moving items (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMovements = movements.filter(m => new Date(m.performedAt) >= thirtyDaysAgo);
    const itemMovements: { [itemId: string]: { itemName: string; totalMovement: number; currentStock: number } } = {};

    recentMovements.forEach(movement => {
      if (!itemMovements[movement.itemId]) {
        const item = items.find(i => i.id === movement.itemId);
        itemMovements[movement.itemId] = {
          itemName: movement.itemName,
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
          ? Math.floor((Date.now() - new Date(lastMovement.performedAt).getTime()) / (1000 * 60 * 60 * 24))
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
      .from('inventory')
      .select('category')
      .eq('isActive', true);

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

