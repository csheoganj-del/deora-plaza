export interface OfflineData {
  id: string;
  type: 'order' | 'reservation' | 'inventory' | 'customer' | 'staff';
  data: any;
  timestamp: string;
  synced: boolean;
  lastSyncAttempt?: string;
  syncAttempts: number;
}

export interface SyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  type: OfflineData['type'];
  data: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  retries: number;
  maxRetries: number;
}

export interface OfflineConfig {
  maxStorageSize: number; // in MB
  syncInterval: number; // in milliseconds
  maxRetries: number;
  enableBackgroundSync: boolean;
}

class OfflineDataManager {
  private static instance: OfflineDataManager;
  private storage: Map<string, OfflineData> = new Map();
  private syncQueue: SyncQueue[] = [];
  private config: OfflineConfig = {
    maxStorageSize: 50, // 50MB
    syncInterval: 30000, // 30 seconds
    maxRetries: 3,
    enableBackgroundSync: true
  };
  private syncTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.initializeOfflineSupport();
    this.loadStoredData();
    this.setupEventListeners();
  }

  static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager();
    }
    return OfflineDataManager.instance;
  }

  private initializeOfflineSupport() {
    // Initialize service worker for offline caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Start background sync if enabled
    if (this.config.enableBackgroundSync) {
      this.startBackgroundSync();
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Connection restored');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Connection lost - entering offline mode');
    });

    // Listen for storage events (for multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('offline_data_') || e.key?.startsWith('sync_queue_')) {
        this.loadStoredData();
      }
    });
  }

  private startBackgroundSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline) {
        this.processSyncQueue();
      }
    }, this.config.syncInterval);
  }

  private stopBackgroundSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private async loadStoredData() {
    try {
      // Load offline data from localStorage
      const storedData = localStorage.getItem('offline_data');
      if (storedData) {
        const data = JSON.parse(storedData);
        this.storage = new Map(Object.entries(data));
      }

      // Load sync queue from localStorage
      const storedQueue = localStorage.getItem('sync_queue');
      if (storedQueue) {
        this.syncQueue = JSON.parse(storedQueue);
      }
    } catch (error) {
      console.error('Failed to load stored data:', error);
    }
  }

  private saveToStorage() {
    try {
      // Save offline data
      const dataObject = Object.fromEntries(this.storage);
      localStorage.setItem('offline_data', JSON.stringify(dataObject));

      // Save sync queue
      localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save data to storage:', error);
      // Handle storage quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.cleanupOldData();
      }
    }
  }

  private cleanupOldData() {
    // Remove oldest synced data to free up space
    const entries = Array.from(this.storage.entries());
    const syncedEntries = entries.filter(([_, data]) => data.synced);
    
    // Sort by timestamp (oldest first)
    syncedEntries.sort((a, b) => 
      new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime()
    );

    // Remove oldest 25% of synced data
    const toRemove = Math.floor(syncedEntries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.storage.delete(syncedEntries[i][0]);
    }

    this.saveToStorage();
  }

  storeData(type: OfflineData['type'], data: any, id?: string): string {
    const dataId = id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineData: OfflineData = {
      id: dataId,
      type,
      data,
      timestamp: new Date().toISOString(),
      synced: this.isOnline,
      syncAttempts: 0
    };

    this.storage.set(dataId, offlineData);
    this.saveToStorage();

    // Add to sync queue if online
    if (this.isOnline) {
      this.addToSyncQueue('create', type, data, 'high');
    }

    return dataId;
  }

  getData(id: string): OfflineData | undefined {
    return this.storage.get(id);
  }

  getDataByType(type: OfflineData['type']): OfflineData[] {
    return Array.from(this.storage.values()).filter(data => data.type === type);
  }

  updateData(id: string, newData: any): boolean {
    const existingData = this.storage.get(id);
    if (!existingData) {
      return false;
    }

    const updatedData: OfflineData = {
      ...existingData,
      data: { ...existingData.data, ...newData },
      timestamp: new Date().toISOString(),
      synced: this.isOnline
    };

    this.storage.set(id, updatedData);
    this.saveToStorage();

    // Add to sync queue if online
    if (this.isOnline) {
      this.addToSyncQueue('update', existingData.type, updatedData.data, 'medium');
    }

    return true;
  }

  deleteData(id: string): boolean {
    const existingData = this.storage.get(id);
    if (!existingData) {
      return false;
    }

    this.storage.delete(id);
    this.saveToStorage();

    // Add to sync queue if online
    if (this.isOnline) {
      this.addToSyncQueue('delete', existingData.type, { id }, 'low');
    }

    return true;
  }

  private addToSyncQueue(
    action: SyncQueue['action'],
    type: OfflineData['type'],
    data: any,
    priority: SyncQueue['priority']
  ) {
    const syncItem: SyncQueue = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      type,
      data,
      timestamp: new Date().toISOString(),
      priority,
      retries: 0,
      maxRetries: this.config.maxRetries
    };

    this.syncQueue.push(syncItem);
    this.saveToStorage();
  }

  private async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    // Sort by priority (high first)
    const sortedQueue = [...this.syncQueue].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const syncItem of sortedQueue) {
      try {
        await this.syncItem(syncItem);
        
        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter(item => item.id !== syncItem.id);
      } catch (error) {
        console.error(`Sync failed for item ${syncItem.id}:`, error);
        
        // Increment retry count
        syncItem.retries++;
        
        // Remove from queue if max retries exceeded
        if (syncItem.retries >= syncItem.maxRetries) {
          this.syncQueue = this.syncQueue.filter(item => item.id !== syncItem.id);
          console.error(`Max retries exceeded for sync item ${syncItem.id}`);
        }
      }
    }

    this.saveToStorage();
  }

  private async syncItem(syncItem: SyncQueue): Promise<void> {
    // Mock API call - in real implementation, this would call actual backend
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          console.log(`Synced ${syncItem.action} for ${syncItem.type}:`, syncItem.data);
          resolve();
        } else {
          reject(new Error('Mock sync failure'));
        }
      }, 1000);
    });
  }

  forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    return this.processSyncQueue();
  }

  getSyncStatus() {
    const totalItems = this.storage.size;
    const syncedItems = Array.from(this.storage.values()).filter(item => item.synced).length;
    const pendingSync = this.syncQueue.length;

    return {
      isOnline: this.isOnline,
      totalItems,
      syncedItems,
      pendingSync,
      syncQueueSize: this.syncQueue.length,
      lastSyncTime: this.getLastSyncTime()
    };
  }

  private getLastSyncTime(): string | null {
    const syncedItems = Array.from(this.storage.values()).filter(item => item.synced);
    if (syncedItems.length === 0) {
      return null;
    }

    return syncedItems
      .map(item => item.lastSyncAttempt || item.timestamp)
      .sort()
      .pop() || null;
  }

  clearAllData(): void {
    this.storage.clear();
    this.syncQueue = [];
    this.saveToStorage();
  }

  exportData(): string {
    const exportData = {
      offlineData: Object.fromEntries(this.storage),
      syncQueue: this.syncQueue,
      config: this.config,
      exportTime: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);
      
      if (importData.offlineData) {
        this.storage = new Map(Object.entries(importData.offlineData));
      }
      
      if (importData.syncQueue) {
        this.syncQueue = importData.syncQueue;
      }
      
      if (importData.config) {
        this.config = { ...this.config, ...importData.config };
      }

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  updateConfig(newConfig: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enableBackgroundSync !== undefined) {
      if (newConfig.enableBackgroundSync) {
        this.startBackgroundSync();
      } else {
        this.stopBackgroundSync();
      }
    }
  }

  getConfig(): OfflineConfig {
    return { ...this.config };
  }

  // Mock data for demonstration
  loadMockData() {
    const mockData: OfflineData[] = [
      {
        id: 'order_1',
        type: 'order',
        data: {
          id: 'order_1',
          customerName: 'John Doe',
          items: ['Coffee', 'Sandwich'],
          total: 15.50,
          status: 'pending'
        },
        timestamp: '2024-01-15T10:00:00Z',
        synced: false,
        syncAttempts: 0
      },
      {
        id: 'reservation_1',
        type: 'reservation',
        data: {
          id: 'reservation_1',
          customerName: 'Jane Smith',
          date: '2024-01-20',
          time: '19:00',
          partySize: 4
        },
        timestamp: '2024-01-15T11:00:00Z',
        synced: true,
        lastSyncAttempt: '2024-01-15T11:01:00Z',
        syncAttempts: 1
      }
    ];

    mockData.forEach(data => {
      this.storage.set(data.id, data);
    });

    this.saveToStorage();
  }
}

export const offlineDataManager = OfflineDataManager.getInstance();

// Initialize mock data
offlineDataManager.loadMockData();

