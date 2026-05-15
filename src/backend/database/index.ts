// Supabase-Only Database System for Backend Architecture

import { DatabaseConfig, DatabaseOperation, SyncStatus, DatabaseError } from '../core/types';
import { GlobalLogger } from '../logger';
import { supabaseServer } from '../../lib/supabase/server';
import { createDocument, getDocument, updateDocument, deleteDocument, queryDocuments } from '../../lib/supabase/database';

export interface DatabaseInterface {
  create(table: string, data: any): Promise<any>;
  read(table: string, id: string): Promise<any>;
  update(table: string, id: string, data: any): Promise<any>;
  delete(table: string, id: string): Promise<any>;
  query(table: string, filters?: any[], options?: any): Promise<any[]>;
  healthCheck(): Promise<boolean>;
  sync(): Promise<SyncStatus>;
}

class SupabaseDatabase implements DatabaseInterface {
  private name: string;
  private isHealthy = true;
  private logger: GlobalLogger;
  private lastSync: Date = new Date();

  constructor(name: string, logger: GlobalLogger) {
    this.name = name;
    this.logger = logger;
  }

  async create(table: string, data: any): Promise<any> {
    try {
      this.logger.logDatabaseEvent(`Creating record in ${table}`, this.name as any, {
        table, dataKeys: Object.keys(data)
      });

      const result = await createDocument(table, data);

      if (!result.success) {
        throw new DatabaseError(`Failed to create record: ${result.error}`);
      }

      this.logger.logDatabaseEvent(`Record created successfully in ${table}`, this.name as any, {
        table, id: result.data?.id
      });

      return {
        success: true,
        id: result.data?.id,
        data: result.data
      };
    } catch (error) {
      this.logger.error(`Database create failed on ${this.name}`, error as Error, {
        operation: 'database_create',
        metadata: { table }
      });
      throw new DatabaseError(`Create operation failed: ${(error as Error).message}`);
    }
  }

  async read(table: string, id: string): Promise<any> {
    try {
      this.logger.debug(`Reading record ${id} from ${table}`, {
        server: this.name,
        operation: 'database_read',
        metadata: { table, id }
      });

      const { data, error } = await supabaseServer
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Record not found
        }
        throw new DatabaseError(`Read operation failed: ${error.message}`);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      this.logger.error(`Database read failed on ${this.name}`, error as Error, {
        operation: 'database_read',
        metadata: { table, id }
      });
      throw new DatabaseError(`Read operation failed: ${(error as Error).message}`);
    }
  }

  async update(table: string, id: string, data: any): Promise<any> {
    try {
      this.logger.logDatabaseEvent(`Updating record ${id} in ${table}`, this.name as any, {
        table, id, dataKeys: Object.keys(data)
      });

      const result = await updateDocument(table, id, data);

      if (!result.success) {
        throw new DatabaseError(`Failed to update record: ${result.error}`);
      }

      this.logger.logDatabaseEvent(`Record updated successfully in ${table}`, this.name as any, {
        table, id
      });

      return {
        success: true,
        id: id,
        data: data
      };
    } catch (error) {
      this.logger.error(`Database update failed on ${this.name}`, error as Error, {
        operation: 'database_update',
        metadata: { table, id }
      });
      throw new DatabaseError(`Update operation failed: ${(error as Error).message}`);
    }
  }

  async delete(table: string, id: string): Promise<any> {
    try {
      this.logger.logDatabaseEvent(`Deleting record ${id} from ${table}`, this.name as any, {
        table, id
      });

      const { error } = await supabaseServer
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to delete record: ${error.message}`);
      }

      this.logger.logDatabaseEvent(`Record deleted successfully from ${table}`, this.name as any, {
        table, id
      });

      return {
        success: true,
        id: id
      };
    } catch (error) {
      this.logger.error(`Database delete failed on ${this.name}`, error as Error, {
        operation: 'database_delete',
        metadata: { table, id }
      });
      throw new DatabaseError(`Delete operation failed: ${(error as Error).message}`);
    }
  }

  async query(table: string, filters: any[] = [], options: any = {}): Promise<any[]> {
    try {
      this.logger.debug(`Querying table ${table}`, {
        server: this.name,
        operation: 'database_query',
        metadata: { table, filterCount: filters.length, options }
      });

      const results = await queryDocuments(table, filters, options.orderBy, options.orderDirection || 'desc');
      return results;
    } catch (error) {
      this.logger.error(`Database query failed on ${this.name}`, error as Error, {
        operation: 'database_query',
        metadata: { table, filters }
      });
      throw new DatabaseError(`Query operation failed: ${(error as Error).message}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Perform a simple query to check Supabase health
      const { error } = await supabaseServer
        .from('users')
        .select('id')
        .limit(1);
      
      this.isHealthy = !error;
      return this.isHealthy;
    } catch (error) {
      this.logger.error(`Database health check failed on ${this.name}`, error as Error);
      this.isHealthy = false;
      return false;
    }
  }

  async sync(): Promise<SyncStatus> {
    // For Supabase, sync is handled automatically via real-time subscriptions
    this.lastSync = new Date();
    return {
      lastSync: this.lastSync,
      isInSync: true,
      pendingOperations: 0,
      conflictCount: 0,
      syncErrors: []
    };
  }

  getName(): string {
    return this.name;
  }

  getIsHealthy(): boolean {
    return this.isHealthy;
  }

  getLastSync(): Date {
    return this.lastSync;
  }
}

export class DatabaseManager {
  private primaryDb: DatabaseInterface;
  private secondaryDb: DatabaseInterface | null = null;
  private config: DatabaseConfig;
  private logger: GlobalLogger;
  private usePrimary = true;
  private syncQueue: DatabaseOperation[] = [];
  private syncInProgress = false;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(config: DatabaseConfig, logger: GlobalLogger) {
    this.config = config;
    this.logger = logger;

    // Initialize primary Supabase database
    this.primaryDb = new SupabaseDatabase('primary', logger);

    // Initialize secondary database if configured (for future expansion)
    if (config.secondary?.connectionString) {
      this.secondaryDb = new SupabaseDatabase('secondary', logger);
    }

    this.startHealthMonitoring();

    this.logger.info('Supabase-only database manager initialized', {
      operation: 'database_init',
      metadata: {
        hasSecondary: !!this.secondaryDb,
        autoFailover: config.auto_failover
      }
    });
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.checkDatabaseHealth();
    }, 30000); // Check every 30 seconds
  }

  private async checkDatabaseHealth(): Promise<void> {
    const primaryHealthy = await this.primaryDb.healthCheck();
    const secondaryHealthy = this.secondaryDb ? await this.secondaryDb.healthCheck() : false;

    const wasPrimary = this.usePrimary;

    // Update config health status
    this.config.primary.isHealthy = primaryHealthy;
    if (this.secondaryDb) {
      this.config.secondary.isHealthy = secondaryHealthy;
    }

    // Determine which database to use
    if (this.config.auto_failover) {
      if (primaryHealthy) {
        this.usePrimary = true;
      } else if (secondaryHealthy && this.secondaryDb) {
        this.usePrimary = false;
      }

      // Log failover events
      if (wasPrimary && !this.usePrimary) {
        this.logger.logFailoverEvent('Primary Database', 'Secondary Database', 'Primary health check failed', true);
      } else if (!wasPrimary && this.usePrimary && primaryHealthy) {
        this.logger.logFailoverEvent('Secondary Database', 'Primary Database', 'Primary database recovered', true);
      }
    }
  }

  private getActiveDatabase(): DatabaseInterface {
    if (this.usePrimary || !this.secondaryDb) {
      return this.primaryDb;
    }
    return this.secondaryDb;
  }

  private async executeWithFallback<T>(
    operation: (db: DatabaseInterface) => Promise<T>,
    operationName: string
  ): Promise<T> {
    const activeDb = this.getActiveDatabase();

    try {
      return await operation(activeDb);
    } catch (error) {
      this.logger.error(`Database operation failed on ${activeDb.getName()}`, error as Error, {
        operation: operationName
      });

      // Try fallback database if available
      if (this.config.auto_failover && this.secondaryDb) {
        const fallbackDb = this.usePrimary ? this.secondaryDb : this.primaryDb;

        try {
          this.logger.warn(`Attempting fallback to ${fallbackDb.getName()} database`);
          const result = await operation(fallbackDb);

          // Update active database
          this.usePrimary = fallbackDb === this.primaryDb;

          this.logger.logFailoverEvent(
            activeDb.getName(),
            fallbackDb.getName(),
            'Operation failed on primary database',
            true
          );

          return result;
        } catch (fallbackError) {
          this.logger.error(`Fallback database operation also failed`, fallbackError as Error, {
            operation: operationName
          });
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  // Public API methods
  async create(table: string, data: any): Promise<any> {
    return this.executeWithFallback(
      (db) => db.create(table, data),
      'create'
    );
  }

  async read(table: string, id: string): Promise<any> {
    return this.executeWithFallback(
      (db) => db.read(table, id),
      'read'
    );
  }

  async update(table: string, id: string, data: any): Promise<any> {
    return this.executeWithFallback(
      (db) => db.update(table, id, data),
      'update'
    );
  }

  async delete(table: string, id: string): Promise<any> {
    return this.executeWithFallback(
      (db) => db.delete(table, id),
      'delete'
    );
  }

  async query(table: string, filters: any[] = [], options: any = {}): Promise<any[]> {
    return this.executeWithFallback(
      (db) => db.query(table, filters, options),
      'query'
    );
  }

  // Health and status methods
  async healthCheck(): Promise<{
    primary: boolean;
    secondary: boolean;
    active: string;
    syncStatus: SyncStatus;
  }> {
    const primaryHealth = await this.primaryDb.healthCheck();
    const secondaryHealth = this.secondaryDb ? await this.secondaryDb.healthCheck() : false;
    const syncStatus = await this.primaryDb.sync();

    return {
      primary: primaryHealth,
      secondary: secondaryHealth,
      active: this.usePrimary ? 'primary' : 'secondary',
      syncStatus
    };
  }

  getStatus(): {
    activeDatabaseName: string;
    isPrimaryHealthy: boolean;
    isSecondaryHealthy: boolean;
    pendingSyncOperations: number;
    lastSync: Date;
  } {
    return {
      activeDatabaseName: this.usePrimary ? 'primary' : 'secondary',
      isPrimaryHealthy: this.config.primary.isHealthy,
      isSecondaryHealthy: this.config.secondary?.isHealthy || false,
      pendingSyncOperations: 0, // Supabase handles sync automatically
      lastSync: new Date()
    };
  }

  // Manual control methods
  async switchToPrimary(): Promise<boolean> {
    const isHealthy = await this.primaryDb.healthCheck();
    if (isHealthy) {
      this.usePrimary = true;
      this.logger.info('Manually switched to primary database');
      return true;
    }
    return false;
  }

  async switchToSecondary(): Promise<boolean> {
    if (!this.secondaryDb) {
      throw new DatabaseError('Secondary database not configured');
    }

    const isHealthy = await this.secondaryDb.healthCheck();
    if (isHealthy) {
      this.usePrimary = false;
      this.logger.info('Manually switched to secondary database');
      return true;
    }
    return false;
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up Supabase database manager');

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }
}

// Factory function
export function createDatabaseManager(config: DatabaseConfig, logger: GlobalLogger): DatabaseManager {
  return new DatabaseManager(config, logger);
}

export default DatabaseManager;

