// Offline Manager for DEORA - Handles offline functionality and data synchronization
export class OfflineManager {
  private static instance: OfflineManager;
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncQueue: Array<{
    type: 'order' | 'inventory' | 'feedback' | 'bill';
    data: any;
    timestamp: number;
  }> = [];

  private constructor() {
    this.initDB();
    this.setupEventListeners();
  }

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('deora-offline', 1);

      request.onerror = () => {
        console.error('Offline DB: Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Offline DB: Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for different data types
        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('bills')) {
          db.createObjectStore('bills', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('inventory')) {
          db.createObjectStore('inventory', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('feedback')) {
          db.createObjectStore('feedback', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'url' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  private setupEventListeners(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Offline Manager: Connection restored');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Offline Manager: Connection lost');
    });

    // Monitor service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          console.log('Offline Manager: Sync completed', event.data);
        }
      });
    }
  }

  public async saveOfflineData<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) {
      console.error('Offline DB: Database not initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        console.log(`Offline DB: Data saved to ${storeName}`, data);
        resolve();
      };

      request.onerror = () => {
        console.error(`Offline DB: Failed to save data to ${storeName}`, request.error);
        reject(request.error);
      };
    });
  }

  public async getOfflineData<T>(storeName: string, key?: string): Promise<T[]> {
    if (!this.db) {
      console.error('Offline DB: Database not initialized');
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);

      let request: IDBRequest;
      if (key) {
        request = store.get(key);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const result = request.result;
        resolve(key ? [result] : result || []);
      };

      request.onerror = () => {
        console.error(`Offline DB: Failed to get data from ${storeName}`, request.error);
        reject(request.error);
      };
    });
  }

  public async removeFromOffline(storeName: string, key: string): Promise<void> {
    if (!this.db) {
      console.error('Offline DB: Database not initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log(`Offline DB: Data removed from ${storeName}`, key);
        resolve();
      };

      request.onerror = () => {
        console.error(`Offline DB: Failed to remove data from ${storeName}`, request.error);
        reject(request.error);
      };
    });
  }

  public async queueForSync(type: 'order' | 'inventory' | 'feedback' | 'bill', data: any): Promise<void> {
    const syncItem = {
      type,
      data,
      timestamp: Date.now(),
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.syncQueue.push(syncItem);

    if (!this.db) {
      console.error('Offline DB: Database not initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('syncQueue', 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.put(syncItem);

      request.onsuccess = () => {
        console.log('Offline DB: Item queued for sync', syncItem);
        resolve();
      };

      request.onerror = () => {
        console.error('Offline DB: Failed to queue item for sync', request.error);
        reject(request.error);
      };
    });
  }

  public async syncPendingData(): Promise<void> {
    if (!this.isOnline) {
      console.log('Offline Manager: Still offline, skipping sync');
      return;
    }

    if (!this.db) {
      console.error('Offline DB: Database not initialized');
      return;
    }

    try {
      const syncItems = await this.getOfflineData<any>('syncQueue');

      for (const item of syncItems) {
        try {
          await this.syncItem(item);
          await this.removeFromOffline('syncQueue', item.id);
          console.log('Offline Manager: Synced item', item.id);
        } catch (error) {
          console.error('Offline Manager: Failed to sync item', item.id, error);
        }
      }

      // Trigger background sync if supported
      if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        const regAny = registration as any;
        if (regAny.sync && typeof regAny.sync.register === 'function') {
          await regAny.sync.register('sync-data');
        }
      }

    } catch (error) {
      console.error('Offline Manager: Failed to sync pending data', error);
    }
  }

  private async syncItem(item: any): Promise<void> {
    const { type, data } = item;

    switch (type) {
      case 'order':
        await this.syncOrder(data);
        break;
      case 'bill':
        await this.syncBill(data);
        break;
      case 'inventory':
        await this.syncInventory(data);
        break;
      case 'feedback':
        await this.syncFeedback(data);
        break;
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  }

  private async syncOrder(orderData: any): Promise<void> {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync order: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Offline Manager: Order synced successfully', result);
  }

  private async syncInventory(inventoryData: any): Promise<void> {
    const response = await fetch('/api/inventory', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inventoryData),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync inventory: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Offline Manager: Inventory synced successfully', result);
  }

  private async syncFeedback(feedbackData: any): Promise<void> {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync feedback: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Offline Manager: Feedback synced successfully', result);
  }

  private async syncBill(billData: any): Promise<void> {
    // Import the createDirectBill action
    const { createDirectBill } = await import('@/actions/billing');

    const result = await createDirectBill({
      ...billData,
      offlineId: billData.id, // Include offline ID for tracking
    });

    if (!result.success) {
      throw new Error(`Failed to sync bill: ${result.error}`);
    }

    console.log('Offline Manager: Bill synced successfully', result);
  }

  public async cacheData(url: string, data: any): Promise<void> {
    if (!this.db) {
      console.error('Offline DB: Database not initialized');
      return;
    }

    const cacheItem = {
      url,
      data,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(cacheItem);

      request.onsuccess = () => {
        console.log('Offline DB: Data cached', url);
        resolve();
      };

      request.onerror = () => {
        console.error('Offline DB: Failed to cache data', request.error);
        reject(request.error);
      };
    });
  }

  public async getCachedData(url: string): Promise<any | null> {
    if (!this.db) {
      console.error('Offline DB: Database not initialized');
      return null;
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction('cache', 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if cache is still valid (24 hours)
          const age = Date.now() - result.timestamp;
          if (age < 24 * 60 * 60 * 1000) {
            resolve(result.data);
          } else {
            // Cache expired, remove it
            this.removeFromOffline('cache', url);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Offline DB: Failed to get cached data', request.error);
        resolve(null);
      };
    });
  }

  public isConnectionOnline(): boolean {
    return this.isOnline;
  }

  public getPendingSyncCount(): number {
    return this.syncQueue.length;
  }

  public async clearCache(): Promise<void> {
    if (!this.db) {
      console.error('Offline DB: Database not initialized');
      return;
    }

    const stores = ['orders', 'bills', 'inventory', 'feedback', 'cache', 'syncQueue'];

    for (const storeName of stores) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          console.log(`Offline DB: Cleared ${storeName}`);
          resolve();
        };

        request.onerror = () => {
          console.error(`Offline DB: Failed to clear ${storeName}`, request.error);
          reject(request.error);
        };
      });
    }
  }

  // Utility method to check if we should use offline mode
  public shouldUseOfflineMode(): boolean {
    return !this.isOnline || this.getPendingSyncCount() > 0;
  }

  // Get offline statistics
  public async getOfflineStats(): Promise<{
    cachedOrders: number;
    cachedInventory: number;
    cachedFeedback: number;
    pendingSync: number;
    isOnline: boolean;
  }> {
    const [orders, inventory, feedback, syncQueue] = await Promise.all([
      this.getOfflineData('orders'),
      this.getOfflineData('inventory'),
      this.getOfflineData('feedback'),
      this.getOfflineData('syncQueue'),
    ]);

    return {
      cachedOrders: orders.length,
      cachedInventory: inventory.length,
      cachedFeedback: feedback.length,
      pendingSync: syncQueue.length,
      isOnline: this.isOnline,
    };
  }
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();

