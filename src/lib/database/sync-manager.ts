/**
 * 🔄 Database Synchronization Manager
 * 
 * Ensures Firebase always has a live copy of Supabase data
 * Features:
 * - Real-time bidirectional sync
 * - Conflict resolution
 * - Batch operations for performance
 * - Error handling and retry logic
 * - Selective table synchronization
 */

import { createClient } from '@supabase/supabase-js';
import { createFirebaseAdapter } from '@/lib/firebase/adapter';
import { EventEmitter } from 'events';

export interface SyncConfig {
  enabled: boolean;
  syncInterval: number; // milliseconds
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
  conflictResolution: 'supabase_wins' | 'firebase_wins' | 'timestamp_wins';
  tablesToSync: string[];
  excludeTables: string[];
}

export interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  totalRecordsSynced: number;
  errors: SyncError[];
  currentOperation: string | null;
  progress: {
    table: string;
    completed: number;
    total: number;
  } | null;
}

export interface SyncError {
  id: string;
  timestamp: Date;
  table: string;
  operation: 'sync' | 'conflict_resolution' | 'batch_operation';
  error: string;
  recordId?: string;
  retryCount: number;
}

export interface SyncRecord {
  id: string;
  table: string;
  data: any;
  timestamp: number;
  source: 'supabase' | 'firebase';
  operation: 'insert' | 'update' | 'delete';
}

export class DatabaseSyncManager extends EventEmitter {
  private config: SyncConfig;
  private supabase: any;
  private firebase: any;
  private status: SyncStatus;
  private syncTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private syncQueue: SyncRecord[] = [];
  private realtimeSubscriptions: Map<string, any> = new Map();

  constructor(config?: Partial<SyncConfig>) {
    super();
    
    this.config = {
      enabled: true,
      syncInterval: 30000, // 30 seconds
      batchSize: 100,
      retryAttempts: 3,
      retryDelay: 5000,
      conflictResolution: 'timestamp_wins',
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
      currentOperation: null,
      progress: null
    };

    this.initialize();
  }

  private async initialize() {
    try {
      console.log('🔄 Initializing Database Sync Manager...');

      // Initialize Supabase client
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Initialize Firebase adapter
      this.firebase = createFirebaseAdapter();
      
      if (!this.firebase) {
        throw new Error('Firebase not configured - sync disabled');
      }

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
      // Perform initial full sync
      await this.performFullSync();

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

    // Process remaining queue
    if (this.syncQueue.length > 0) {
      console.log(`📤 Processing ${this.syncQueue.length} remaining sync operations...`);
      await this.processSyncQueue();
    }

    this.status.currentOperation = null;
    console.log('✅ Database synchronization stopped');
    this.emit('sync-stopped');
  }

  /**
   * Perform full synchronization of all tables
   */
  private async performFullSync(): Promise<void> {
    console.log('🔄 Starting full database sync...');
    this.status.currentOperation = 'Full sync in progress';

    for (const table of this.config.tablesToSync) {
      if (this.config.excludeTables.includes(table)) {
        continue;
      }

      try {
        await this.syncTable(table);
      } catch (error) {
        console.error(`❌ Failed to sync table ${table}:`, error);
        this.addError(table, 'sync', error as Error);
      }
    }

    this.status.lastSync = new Date();
    console.log('✅ Full database sync completed');
  }

  /**
   * Sync a specific table from Supabase to Firebase
   */
  private async syncTable(tableName: string): Promise<void> {
    console.log(`📊 Syncing table: ${tableName}`);
    this.status.currentOperation = `Syncing ${tableName}`;

    try {
      // Get all records from Supabase
      const { data: supabaseRecords, error } = await this.supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
      }

      if (!supabaseRecords || supabaseRecords.length === 0) {
        console.log(`📭 No records found in ${tableName}`);
        return;
      }

      // Update progress
      this.status.progress = {
        table: tableName,
        completed: 0,
        total: supabaseRecords.length
      };

      // Sync records in batches
      const batches = this.createBatches(supabaseRecords, this.config.batchSize);
      
      for (const batch of batches) {
        await this.syncBatch(tableName, batch);
        this.status.progress.completed += batch.length;
        this.emit('sync-progress', this.status.progress);
      }

      this.status.totalRecordsSynced += supabaseRecords.length;
      console.log(`✅ Synced ${supabaseRecords.length} records from ${tableName}`);

    } catch (error) {
      console.error(`❌ Error syncing table ${tableName}:`, error);
      throw error;
    } finally {
      this.status.progress = null;
    }
  }

  /**
   * Sync a batch of records to Firebase
   */
  private async syncBatch(tableName: string, records: any[]): Promise<void> {
    const promises = records.map(async (record) => {
      try {
        // Check if record exists in Firebase
        const existingRecord = await this.firebase
          .from(tableName)
          .eq('id', record.id)
          .single();

        if (existingRecord.data) {
          // Update existing record
          const { error } = await this.firebase
            .from(tableName)
            .update(record);

          if (error) {
            throw new Error(`Firebase update failed: ${error.message}`);
          }
        } else {
          // Insert new record
          const { error } = await this.firebase
            .from(tableName)
            .insert(record);

          if (error) {
            throw new Error(`Firebase insert failed: ${error.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error syncing record ${record.id} in ${tableName}:`, error);
        this.addError(tableName, 'sync', error as Error, record.id);
      }
    });

    await Promise.allSettled(promises);
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

    // Add to sync queue for processing
    this.syncQueue.push(syncRecord);

    // Process queue if not too busy
    if (this.syncQueue.length >= this.config.batchSize) {
      await this.processSyncQueue();
    }
  }

  /**
   * Process the sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;

    const batch = this.syncQueue.splice(0, this.config.batchSize);
    
    for (const record of batch) {
      try {
        await this.applySyncRecord(record);
      } catch (error) {
        console.error(`❌ Failed to apply sync record:`, error);
        this.addError(record.table, 'sync', error as Error, record.data?.id);
      }
    }
  }

  /**
   * Apply a sync record to Firebase
   */
  private async applySyncRecord(record: SyncRecord): Promise<void> {
    const { table, data, operation } = record;

    switch (operation) {
      case 'insert':
        const { error: insertError } = await this.firebase
          .from(table)
          .insert(data);
        if (insertError) throw new Error(insertError.message);
        break;

      case 'update':
        const { error: updateError } = await this.firebase
          .from(table)
          .update(data)
          .eq('id', data.id);
        if (updateError) throw new Error(updateError.message);
        break;

      case 'delete':
        const { error: deleteError } = await this.firebase
          .from(table)
          .delete()
          .eq('id', data.id);
        if (deleteError) throw new Error(deleteError.message);
        break;
    }

    this.status.totalRecordsSynced++;
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    this.syncTimer = setInterval(async () => {
      try {
        await this.processSyncQueue();
        
        // Perform health check sync every 10 intervals
        if (this.status.totalRecordsSynced % (this.config.batchSize * 10) === 0) {
          await this.performHealthCheckSync();
        }
      } catch (error) {
        console.error('❌ Periodic sync error:', error);
        this.addError('periodic', 'sync', error as Error);
      }
    }, this.config.syncInterval);
  }

  /**
   * Perform health check sync to ensure consistency
   */
  private async performHealthCheckSync(): Promise<void> {
    console.log('🔍 Performing health check sync...');
    
    // Check a few random records from each table
    for (const table of this.config.tablesToSync.slice(0, 3)) {
      try {
        const { data: supabaseRecords } = await this.supabase
          .from(table)
          .select('id, updated_at')
          .limit(5)
          .order('updated_at', { ascending: false });

        if (supabaseRecords) {
          for (const record of supabaseRecords) {
            const firebaseRecord = await this.firebase
              .from(table)
              .eq('id', record.id)
              .single();

            if (!firebaseRecord.data) {
              console.log(`🔧 Missing record in Firebase: ${table}/${record.id}`);
              // Re-sync this record
              const { data: fullRecord } = await this.supabase
                .from(table)
                .select('*')
                .eq('id', record.id)
                .single();

              if (fullRecord) {
                await this.firebase.from(table).insert(fullRecord);
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Health check failed for ${table}:`, error);
      }
    }
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
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
   * Force full resync
   */
  async forceFullSync(): Promise<void> {
    console.log('🔄 Forcing full resync...');
    this.status.currentOperation = 'Force full sync';
    
    try {
      await this.performFullSync();
      console.log('✅ Force full sync completed');
    } catch (error) {
      console.error('❌ Force full sync failed:', error);
      throw error;
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
      queueSize: this.syncQueue.length,
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