// Soft Delete Pattern Implementation for DEORA
// Provides safe deletion with recovery capabilities and audit trail

export interface SoftDeleteEntity {
  id: string;
  deletedAt?: Date;
  deletedBy?: string;
  deleteReason?: string;
  isDeleted: boolean;
}

export interface SoftDeleteOptions {
  reason?: string;
  deletedBy?: string;
  permanent?: boolean;
}

export class SoftDeleteManager {
  private static instance: SoftDeleteManager;

  private constructor() {}

  public static getInstance(): SoftDeleteManager {
    if (!SoftDeleteManager.instance) {
      SoftDeleteManager.instance = new SoftDeleteManager();
    }
    return SoftDeleteManager.instance;
  }

  // Soft delete an entity
  async softDelete(
    table: string,
    id: string,
    options: SoftDeleteOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = (await import('./supabase/client')).getSupabase();
      
      const updateData: Partial<SoftDeleteEntity> = {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: options.deletedBy,
        deleteReason: options.reason || 'Deleted by user'
      };

      const { error } = await (supabase.from(table) as any)
        .update(updateData)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log the deletion
      const { logger, LogCategory } = await import('./logging-system');
      logger.info(`Soft deleted ${table} record`, LogCategory.BUSINESS, {
        table,
        recordId: id,
        deletedBy: options.deletedBy,
        reason: options.reason
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Restore a soft-deleted entity
  async restore(
    table: string,
    id: string,
    restoredBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = (await import('./supabase/client')).getSupabase();
      
      const updateData: Partial<SoftDeleteEntity> = {
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined,
        deleteReason: undefined
      };

      const { error } = await (supabase.from(table) as any)
        .update(updateData)
        .eq('id', id)
        .eq('isDeleted', true);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log the restoration
      const { logger, LogCategory } = await import('./logging-system');
      logger.info(`Restored ${table} record`, LogCategory.BUSINESS, {
        table,
        recordId: id,
        restoredBy
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Permanent delete (hard delete)
  async permanentDelete(
    table: string,
    id: string,
    deletedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = (await import('./supabase/client')).getSupabase();
      
      // First check if it's already soft deleted
      const response = await (supabase.from(table) as any)
        .select('id, isDeleted')
        .eq('id', id)
        .single();
      const record = response.data as any;

      if (!record) {
        return { success: false, error: 'Record not found' };
      }

      if (!record.isDeleted) {
        return { success: false, error: 'Record must be soft deleted before permanent deletion' };
      }

      // Perform hard delete
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log the permanent deletion
      const { logger, LogCategory } = await import('./logging-system');
      logger.warn(`Permanently deleted ${table} record`, LogCategory.BUSINESS, {
        table,
        recordId: id,
        deletedBy
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Get soft-deleted records
  async getDeletedRecords(
    table: string,
    limit?: number
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const supabase = (await import('./supabase/client')).getSupabase();
      
      let query = supabase
        .from(table)
        .select('*')
        .eq('isDeleted', true)
        .order('deletedAt', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Query with soft delete filter (excludes deleted records by default)
  async queryWithSoftDelete(
    table: string,
    includeDeleted: boolean = false,
    query?: any
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const supabase = (await import('./supabase/client')).getSupabase();
      
      let dbQuery = supabase.from(table).select('*');

      if (!includeDeleted) {
        dbQuery = dbQuery.eq('isDeleted', false);
      }

      // Apply additional query if provided
      if (query) {
        if (query.filters) {
          query.filters.forEach((filter: any) => {
            dbQuery = dbQuery.filter(filter.column, filter.operator, filter.value);
          });
        }
        if (query.order) {
          dbQuery = dbQuery.order(query.order.column, { ascending: query.order.ascending });
        }
        if (query.limit) {
          dbQuery = dbQuery.limit(query.limit);
        }
      }

      const { data, error } = await dbQuery;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Batch soft delete
  async batchSoftDelete(
    table: string,
    ids: string[],
    options: SoftDeleteOptions = {}
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    const results = [];
    
    for (const id of ids) {
      const result = await this.softDelete(table, id, options);
      results.push({ id, ...result });
    }

    const failed = results.filter((r: any) => !r.success);
    
    if (failed.length > 0) {
      return { 
        success: false, 
        results, 
        error: `Failed to delete ${failed.length} records` 
      };
    }

    return { success: true, results };
  }

  // Clean up old soft-deleted records (maintenance task)
  async cleanupOldDeletedRecords(
    table: string,
    olderThanDays: number = 30,
    permanentDelete: boolean = false
  ): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const supabase = (await import('./supabase/client')).getSupabase();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      let query = supabase
        .from(table)
        .select('id')
        .eq('isDeleted', true)
        .lt('deletedAt', cutoffDate.toISOString());

      const { data: oldRecords, error: fetchError } = await query;

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      if (!oldRecords || oldRecords.length === 0) {
        return { success: true, deletedCount: 0 };
      }

      if (permanentDelete) {
        // Permanent delete old records
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .in('id', oldRecords.map((r: any) => r.id));

        if (deleteError) {
          return { success: false, error: deleteError.message };
        }
      } else {
        // Just log them for manual review
        const { logger, LogCategory } = await import('./logging-system');
        logger.info(`Found ${oldRecords.length} old soft-deleted records in ${table}`, LogCategory.SYSTEM, {
          table,
          count: oldRecords.length,
          olderThanDays
        });
      }

      return { success: true, deletedCount: oldRecords.length };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Get deletion statistics
  async getDeletionStats(
    table: string
  ): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      const supabase = (await import('./supabase/client')).getSupabase();
      
      // Get total records
      const { count: totalCount, error: totalError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        return { success: false, error: totalError.message };
      }

      // Get deleted records count
      const { count: deletedCount, error: deletedError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('isDeleted', true);

      if (deletedError) {
        return { success: false, error: deletedError.message };
      }

      // Get recent deletions
      const { data: recentDeletions, error: recentError } = await supabase
        .from(table)
        .select('id, deletedAt, deletedBy, deleteReason')
        .eq('isDeleted', true)
        .order('deletedAt', { ascending: false })
        .limit(10);

      if (recentError) {
        return { success: false, error: recentError.message };
      }

      const stats = {
        totalRecords: totalCount || 0,
        deletedRecords: deletedCount || 0,
        activeRecords: (totalCount || 0) - (deletedCount || 0),
        deletionRate: totalCount ? ((deletedCount || 0) / totalCount) * 100 : 0,
        recentDeletions: recentDeletions || []
      };

      return { success: true, stats };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

// Export singleton instance
export const softDeleteManager = SoftDeleteManager.getInstance();

// Higher-order function for database operations with soft delete support
export function withSoftDelete<T>(
  operation: (data: T) => Promise<any>,
  table: string,
  options: SoftDeleteOptions = {}
) {
  return async (data: T & { id?: string }) => {
    if (data.id && options.permanent) {
      // Permanent delete
      return await softDeleteManager.permanentDelete(table, data.id, options.deletedBy);
    } else if (data.id) {
      // Soft delete
      return await softDeleteManager.softDelete(table, data.id, options);
    } else {
      // Regular operation
      return await operation(data);
    }
  };
}

// Utility functions for common soft delete operations
export const softDeleteOrder = async (orderId: string, deletedBy: string, reason?: string) =>
  softDeleteManager.softDelete('orders', orderId, { deletedBy, reason });

export const softDeleteMenuItem = async (itemId: string, deletedBy: string, reason?: string) =>
  softDeleteManager.softDelete('menu_items', itemId, { deletedBy, reason });

export const softDeleteBill = async (billId: string, deletedBy: string, reason?: string) =>
  softDeleteManager.softDelete('bills', billId, { deletedBy, reason });

export const softDeleteCustomer = async (customerId: string, deletedBy: string, reason?: string) =>
  softDeleteManager.softDelete('customers', customerId, { deletedBy, reason });

export default softDeleteManager;

