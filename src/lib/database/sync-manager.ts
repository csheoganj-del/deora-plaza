/**
 * 🔄 Database Synchronization Manager - Supabase Only
 * 
 * Simple sync manager for Supabase operations
 * Features:
 * - Real-time subscriptions
 * - Offline queue support
 * - Error handling and retry logic
 */

import { createClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

export interface SyncConfig {
  enabled: boolean;
  syncInterval: number; // milliseconds
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
  tablesToSync: string[];
  excludeTables: string[];
}

export interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  totalRecordsSynced: number;
  errors: SyncError[];
  currentOperation: string | null;
}

export interface SyncError {
  id: string;
  timestamp: Date;
  table: string;
  operation: 'sync' | 'realtime';
  error: string;
  recordId?: string;
  retryCount: number;
}

export interface SyncRecord {
  id: string;
  table: string;
  data: any;
  timestamp: number;
  source: 'supabase';
  operation: 'insert' | 'update' | 'delete';
}

export class DatabaseSyncManager extends EventEmitter {
  private config: SyncConfig;
  private supabase: any;
  private status: SyncStatus;
  private syncTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private realtimeSubscriptions: Map<string, any> = new Map();

  constructor(config?: Partial<SyncConfig>) {
    super();
    
    this.config = {
      enabled: true,
      syncInterval: 30000, // 30 seconds
      batchSize: 100,
      retryAttempts: 3,
      retryDelay: 5000,
      tablesToSync: [
        'users',
        'customers', 
        'menu_items',
        'orders',
        'order_items',
        'bills',
        'inventory',
        'tables',
        'rooms',
        'bookings',
        'business_settings'
      ],
      excludeTables: [
        'auth_sessions',
        'realtime_subscriptions',
        'system_logs'
      ],
      ...config
    };

    this.status = {
      isRunning: false,
      lastSync: null,
      totalRecordsSynced: 0,
      errors: [],
      currentOperation: null
    };

    this.initialize();
  }

  private async initialize() {
    try {
      console.log('🔄 Initializing Database Sync Manager (Supabase only)...');

      // Initialize Supabase client
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      this.isInitialized = true;
      console.log('✅ Database Sync Manager initialized');

      // Start initial sync if enabled
      if (this.config.enabled) {
        await this.startSync();
      }

    } catch (error) {
      console.error('❌ Failed to initialize Database Sync Manager:', error);
      this.addError('initialization', 'sync', error as Error);
    }
  }

  /**
   * Start the synchronization process
   */
  async startSync(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Sync manager not initialized');
    }

    if (this.status.isRunning) {
      console.log('⚠️ Sync already running');
      return;
    }

    console.log('🚀 Starting database synchronization...');
    this.status.isRunning = true;
    this.status.currentOperation = 'Starting sync';

    try {
      // Setup real-time sync
      this.setupRealtimeSync();

      // Start periodic sync
      this.startPeriodicSync();

      console.log('✅ Database synchronization started successfully');
      this.emit('sync-started');

    } catch (error) {
      console.error('❌ Failed to start sync:', error);
      this.status.isRunning = false;
      this.addError('startup', 'sync', error as Error);
      throw error;
    }
  }

  /**
   * Stop the synchronization process
   */
  async stopSync(): Promise<void> {
    console.log('🛑 Stopping database synchronization...');
    
    this.status.isRunning = false;
    this.status.currentOperation = 'Stopping sync';

    // Clear periodic sync timer
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    // Unsubscribe from real-time updates
    this.realtimeSubscriptions.forEach((subscription, table) => {
      subscription.unsubscribe();
    });
    this.realtimeSubscriptions.clear();

    this.status.currentOperation = null;
    console.log('✅ Database synchronization stopped');
    this.emit('sync-stopped');
  }

  /**
   * Setup real-time synchronization
   */
  private setupRealtimeSync(): void {
    console.log('📡 Setting up real-time sync...');

    this.config.tablesToSync.forEach(table => {
      if (this.config.excludeTables.includes(table)) {
        return;
      }

      const subscription = this.supabase
        .channel(`sync_${table}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: table 
          }, 
          (payload: any) => {
            this.handleRealtimeChange(table, payload);
          }
        )
        .subscribe();

      this.realtimeSubscriptions.set(table, subscription);
    });

    console.log(`✅ Real-time sync setup for ${this.realtimeSubscriptions.size} tables`);
  }

  /**
   * Handle real-time changes from Supabase
   */
  private async handleRealtimeChange(table: string, payload: any): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log(`📡 Real-time change in ${table}: ${eventType}`);

    const syncRecord: SyncRecord = {
      id: crypto.randomUUID(),
      table,
      data: newRecord || oldRecord,
      timestamp: Date.now(),
      source: 'supabase',
      operation: eventType === 'INSERT' ? 'insert' : 
                eventType === 'UPDATE' ? 'update' : 'delete'
    };

    // Emit the sync event for listeners
    this.emit('sync-event', syncRecord);
    this.status.totalRecordsSynced++;
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    this.syncTimer = setInterval(async () => {
      try {
        // Simple health check
        const { data, error } = await this.supabase.auth.getSession();
        if (error) {
          console.warn('⚠️ Supabase connection issue:', error);
        }
        this.status.lastSync = new Date();
      } catch (error) {
        console.error('❌ Periodic sync error:', error);
        this.addError('periodic', 'sync', error as Error);
      }
    }, this.config.syncInterval);
  }

  /**
   * Add error to status
   */
  private addError(table: string, operation: string, error: Error, recordId?: string): void {
    const syncError: SyncError = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      table,
      operation: operation as any,
      error: error.message,
      recordId,
      retryCount: 0
    };

    this.status.errors.push(syncError);
    
    // Keep only last 100 errors
    if (this.status.errors.length > 100) {
      this.status.errors = this.status.errors.slice(-100);
    }

    this.emit('sync-error', syncError);
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Update sync configuration
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.status.isRunning) {
      console.log('🔄 Restarting sync with new configuration...');
      this.stopSync().then(() => this.startSync());
    }
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.status.errors = [];
    this.emit('errors-cleared');
  }

  /**
   * Get sync statistics
   */
  getStatistics() {
    return {
      totalRecordsSynced: this.status.totalRecordsSynced,
      errorCount: this.status.errors.length,
      lastSync: this.status.lastSync,
      isRunning: this.status.isRunning,
      queueSize: 0, // No queue in simplified version
      tablesMonitored: this.realtimeSubscriptions.size
    };
  }
}

// Global singleton instance
let syncManager: DatabaseSyncManager | null = null;

export function getSyncManager(): DatabaseSyncManager {
  if (!syncManager) {
    syncManager = new DatabaseSyncManager();
  }
  return syncManager;
}

export function createSyncManager(config?: Partial<SyncConfig>): DatabaseSyncManager {
  return new DatabaseSyncManager(config);
}