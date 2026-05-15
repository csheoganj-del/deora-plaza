export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'order' | 'inventory' | 'customer' | 'staff' | 'reservation';
  entityId: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  sourceNode: string;
  targetNodes: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface SyncConflict {
  id: string;
  operationId: string;
  entityType: string;
  entityId: string;
  conflictType: 'version_mismatch' | 'data_conflict' | 'constraint_violation';
  localData: any;
  remoteData: any;
  timestamp: string;
  status: 'unresolved' | 'resolved' | 'ignored';
  resolution?: 'local_wins' | 'remote_wins' | 'manual_merge';
}

export interface SyncConfig {
  enableRealTimeSync: boolean;
  syncInterval: number;
  maxRetries: number;
  conflictResolution: 'auto' | 'manual';
  batchSize: number;
  enableCompression: boolean;
  enableEncryption: boolean;
}

class DataSynchronizationManager {
  private static instance: DataSynchronizationManager;
  private operations: Map<string, SyncOperation> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();
  private config: SyncConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  private lastSyncTime: string | null = null;

  private constructor() {
    this.config = {
      enableRealTimeSync: true,
      syncInterval: 30000, // 30 seconds
      maxRetries: 3,
      conflictResolution: 'auto',
      batchSize: 50,
      enableCompression: true,
      enableEncryption: true
    };
    this.initializeSync();
    this.setupEventListeners();
  }

  static getInstance(): DataSynchronizationManager {
    if (!DataSynchronizationManager.instance) {
      DataSynchronizationManager.instance = new DataSynchronizationManager();
    }
    return DataSynchronizationManager.instance;
  }

  private initializeSync() {
    this.loadStoredOperations();
    this.startSyncProcess();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Connection restored - starting sync');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Connection lost - pausing sync');
    });
  }

  private startSyncProcess() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.config.enableRealTimeSync) {
      this.syncTimer = setInterval(() => {
        if (this.isOnline) {
          this.processSyncQueue();
        }
      }, this.config.syncInterval);
    }
  }

  private loadStoredOperations() {
    try {
      const stored = localStorage.getItem('sync_operations');
      if (stored) {
        const operations = JSON.parse(stored);
        operations.forEach((op: SyncOperation) => {
          this.operations.set(op.id, op);
        });
      }
    } catch (error) {
      console.error('Failed to load sync operations:', error);
    }
  }

  private saveOperations() {
    try {
      const operations = Array.from(this.operations.values());
      localStorage.setItem('sync_operations', JSON.stringify(operations));
    } catch (error) {
      console.error('Failed to save sync operations:', error);
    }
  }

  queueSyncOperation(
    type: SyncOperation['type'],
    entityType: SyncOperation['entityType'],
    entityId: string,
    data: any,
    targetNodes: string[] = [],
    priority: SyncOperation['priority'] = 'medium'
  ): string {
    const operation: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entityType,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      sourceNode: 'client',
      targetNodes,
      priority
    };

    this.operations.set(operation.id, operation);
    this.saveOperations();

    if (this.isOnline && this.config.enableRealTimeSync) {
      this.processSyncQueue();
    }

    return operation.id;
  }

  private async processSyncQueue() {
    if (!this.isOnline) {
      return;
    }

    const pendingOperations = Array.from(this.operations.values())
      .filter(op => op.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    const batches = this.createBatches(pendingOperations, this.config.batchSize);

    for (const batch of batches) {
      await this.processBatch(batch);
    }

    this.lastSyncTime = new Date().toISOString();
  }

  private createBatches(operations: SyncOperation[], batchSize: number): SyncOperation[][] {
    const batches: SyncOperation[][] = [];
    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatch(batch: SyncOperation[]): Promise<void> {
    const promises = batch.map(operation => this.processOperation(operation));
    await Promise.allSettled(promises);
    this.saveOperations();
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    operation.status = 'in_progress';

    try {
      const success = await this.syncWithServer(operation);
      
      if (success) {
        operation.status = 'completed';
        console.log(`Sync completed for ${operation.entityType} ${operation.entityId}`);
      } else {
        throw new Error('Server sync failed');
      }
    } catch (error) {
      console.error(`Sync failed for operation ${operation.id}:`, error);
      
      operation.retryCount++;
      
      if (operation.retryCount >= operation.maxRetries) {
        operation.status = 'failed';
        console.error(`Max retries exceeded for operation ${operation.id}`);
      } else {
        operation.status = 'pending';
      }
    }
  }

  private async syncWithServer(operation: SyncOperation): Promise<boolean> {
    // Mock server sync - in real implementation, this would make HTTP requests
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, Math.random() * 2000);
    });
  }

  async detectConflicts(entityType: string, entityId: string, localData: any, remoteData: any): Promise<SyncConflict | null> {
    // Simple conflict detection based on data comparison
    const localVersion = localData.version || 0;
    const remoteVersion = remoteData.version || 0;

    if (localVersion < remoteVersion) {
      const conflict: SyncConflict = {
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operationId: '',
        entityType,
        entityId,
        conflictType: 'version_mismatch',
        localData,
        remoteData,
        timestamp: new Date().toISOString(),
        status: 'unresolved'
      };

      this.conflicts.set(conflict.id, conflict);
      return conflict;
    }

    return null;
  }

  async resolveConflict(
    conflictId: string,
    resolution: SyncConflict['resolution'],
    mergedData?: any
  ): Promise<boolean> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      return false;
    }

    conflict.status = 'resolved';
    conflict.resolution = resolution;

    if (resolution === 'manual_merge' && mergedData) {
      // Apply merged data
      const operation = this.queueSyncOperation(
        'update',
        conflict.entityType as SyncOperation['entityType'],
        conflict.entityId,
        mergedData,
        [],
        'high'
      );
      console.log(`Applied manual merge for conflict ${conflictId}, operation: ${operation}`);
    }

    this.conflicts.delete(conflictId);
    return true;
  }

  getPendingOperations(): SyncOperation[] {
    return Array.from(this.operations.values()).filter(op => op.status === 'pending');
  }

  getFailedOperations(): SyncOperation[] {
    return Array.from(this.operations.values()).filter(op => op.status === 'failed');
  }

  getOperationById(id: string): SyncOperation | undefined {
    return this.operations.get(id);
  }

  retryOperation(id: string): boolean {
    const operation = this.operations.get(id);
    if (!operation || operation.status !== 'failed') {
      return false;
    }

    operation.status = 'pending';
    operation.retryCount = 0;
    this.saveOperations();

    if (this.isOnline) {
      this.processSyncQueue();
    }

    return true;
  }

  deleteOperation(id: string): boolean {
    const deleted = this.operations.delete(id);
    if (deleted) {
      this.saveOperations();
    }
    return deleted;
  }

  getConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values());
  }

  getConflictById(id: string): SyncConflict | undefined {
    return this.conflicts.get(id);
  }

  getSyncStatus() {
    const total = this.operations.size;
    const pending = this.getPendingOperations().length;
    const completed = Array.from(this.operations.values()).filter(op => op.status === 'completed').length;
    const failed = this.getFailedOperations().length;
    const inProgress = Array.from(this.operations.values()).filter(op => op.status === 'in_progress').length;

    return {
      isOnline: this.isOnline,
      total,
      pending,
      completed,
      failed,
      inProgress,
      conflicts: this.conflicts.size,
      lastSyncTime: this.lastSyncTime,
      successRate: total > 0 ? (completed / total) * 100 : 0
    };
  }

  forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    return this.processSyncQueue();
  }

  clearCompletedOperations(): number {
    const completedIds = Array.from(this.operations.entries())
      .filter(([_, op]) => op.status === 'completed')
      .map(([id]) => id);

    completedIds.forEach(id => this.operations.delete(id));
    this.saveOperations();

    return completedIds.length;
  }

  clearAllOperations(): void {
    this.operations.clear();
    this.conflicts.clear();
    this.saveOperations();
  }

  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enableRealTimeSync !== undefined) {
      if (newConfig.enableRealTimeSync) {
        this.startSyncProcess();
      } else {
        if (this.syncTimer) {
          clearInterval(this.syncTimer);
          this.syncTimer = null;
        }
      }
    }
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  exportSyncData(): string {
    const exportData = {
      operations: Array.from(this.operations.values()),
      conflicts: Array.from(this.conflicts.values()),
      config: this.config,
      lastSyncTime: this.lastSyncTime,
      exportTime: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  importSyncData(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);
      
      if (importData.operations) {
        this.operations.clear();
        importData.operations.forEach((op: SyncOperation) => {
          this.operations.set(op.id, op);
        });
      }
      
      if (importData.conflicts) {
        this.conflicts.clear();
        importData.conflicts.forEach((conflict: SyncConflict) => {
          this.conflicts.set(conflict.id, conflict);
        });
      }
      
      if (importData.config) {
        this.config = { ...this.config, ...importData.config };
      }

      if (importData.lastSyncTime) {
        this.lastSyncTime = importData.lastSyncTime;
      }

      this.saveOperations();
      return true;
    } catch (error) {
      console.error('Failed to import sync data:', error);
      return false;
    }
  }

  // Mock data for demonstration
  loadMockData() {
    const mockOperations: SyncOperation[] = [
      {
        id: 'sync_1',
        type: 'create',
        entityType: 'order',
        entityId: 'order_123',
        data: { id: 'order_123', customer: 'John Doe', total: 45.50 },
        timestamp: '2024-01-15T10:00:00Z',
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
        sourceNode: 'client',
        targetNodes: ['primary', 'backup'],
        priority: 'high'
      },
      {
        id: 'sync_2',
        type: 'update',
        entityType: 'inventory',
        entityId: 'item_456',
        data: { id: 'item_456', stock: 25 },
        timestamp: '2024-01-15T10:05:00Z',
        status: 'completed',
        retryCount: 0,
        maxRetries: 3,
        sourceNode: 'client',
        targetNodes: ['primary'],
        priority: 'medium'
      }
    ];

    mockOperations.forEach(op => {
      this.operations.set(op.id, op);
    });

    this.saveOperations();
  }
}

export const dataSynchronizationManager = DataSynchronizationManager.getInstance();

// Initialize mock data
dataSynchronizationManager.loadMockData();

