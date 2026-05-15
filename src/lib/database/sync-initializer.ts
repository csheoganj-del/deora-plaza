/**
 * 🚀 Database Sync Initializer
 * 
 * Automatically starts and manages database synchronization
 * Integrates with the existing system seamlessly
 */

import { getSyncManager } from './sync-manager';
import { EventEmitter } from 'events';

export interface SyncInitializerConfig {
  autoStart: boolean;
  startDelay: number; // milliseconds
  enableLogging: boolean;
  enableNotifications: boolean;
}

class SyncInitializer extends EventEmitter {
  private config: SyncInitializerConfig;
  private syncManager: any;
  private isInitialized = false;
  private startupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<SyncInitializerConfig>) {
    super();
    
    this.config = {
      autoStart: true,
      startDelay: 5000, // 5 seconds after app start
      enableLogging: true,
      enableNotifications: true,
      ...config
    };

    this.initialize();
  }

  private async initialize() {
    if (typeof window === 'undefined') {
      // Server-side - don't initialize sync
      return;
    }

    try {
      console.log('🔄 Initializing Database Sync System...');

      // Get sync manager instance
      this.syncManager = getSyncManager();

      // Setup event listeners
      this.setupEventListeners();

      // Auto-start if enabled
      if (this.config.autoStart) {
        this.scheduleStart();
      }

      this.isInitialized = true;
      console.log('✅ Database Sync System initialized');

    } catch (error) {
      console.error('❌ Failed to initialize sync system:', error);
    }
  }

  private setupEventListeners() {
    if (!this.syncManager) return;

    // Sync started
    this.syncManager.on('sync-started', () => {
      if (this.config.enableLogging) {
        console.log('🚀 Database sync started');
      }
      
      if (this.config.enableNotifications) {
        this.showNotification('Database sync started', 'success');
      }
      
      this.emit('sync-started');
    });

    // Sync stopped
    this.syncManager.on('sync-stopped', () => {
      if (this.config.enableLogging) {
        console.log('🛑 Database sync stopped');
      }
      
      this.emit('sync-stopped');
    });

    // Sync progress
    this.syncManager.on('sync-progress', (progress: any) => {
      if (this.config.enableLogging) {
        console.log(`📊 Sync progress: ${progress.table} (${progress.completed}/${progress.total})`);
      }
      
      this.emit('sync-progress', progress);
    });

    // Sync error
    this.syncManager.on('sync-error', (error: any) => {
      if (this.config.enableLogging) {
        console.error('❌ Sync error:', error);
      }
      
      if (this.config.enableNotifications) {
        this.showNotification(`Sync error in ${error.table}`, 'error');
      }
      
      this.emit('sync-error', error);
    });

    // Window events
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Online/offline events
    window.addEventListener('online', () => {
      if (this.config.enableLogging) {
        console.log('🌐 Back online - resuming sync');
      }
      this.resumeSync();
    });

    window.addEventListener('offline', () => {
      if (this.config.enableLogging) {
        console.log('📴 Gone offline - pausing sync');
      }
      this.pauseSync();
    });
  }

  private scheduleStart() {
    this.startupTimer = setTimeout(async () => {
      try {
        await this.startSync();
      } catch (error) {
        console.error('❌ Failed to auto-start sync:', error);
      }
    }, this.config.startDelay);
  }

  async startSync() {
    if (!this.syncManager) {
      throw new Error('Sync manager not initialized');
    }

    try {
      await this.syncManager.startSync();
      
      // Store sync status in localStorage
      localStorage.setItem('database-sync-status', JSON.stringify({
        enabled: true,
        startedAt: new Date().toISOString()
      }));

    } catch (error) {
      console.error('❌ Failed to start sync:', error);
      throw error;
    }
  }

  async stopSync() {
    if (!this.syncManager) return;

    try {
      await this.syncManager.stopSync();
      
      // Update sync status in localStorage
      localStorage.setItem('database-sync-status', JSON.stringify({
        enabled: false,
        stoppedAt: new Date().toISOString()
      }));

    } catch (error) {
      console.error('❌ Failed to stop sync:', error);
      throw error;
    }
  }

  async resumeSync() {
    if (!this.syncManager) return;

    try {
      const status = this.syncManager.getStatus();
      if (!status.isRunning) {
        await this.startSync();
      }
    } catch (error) {
      console.error('❌ Failed to resume sync:', error);
    }
  }

  async pauseSync() {
    if (!this.syncManager) return;

    try {
      const status = this.syncManager.getStatus();
      if (status.isRunning) {
        await this.stopSync();
      }
    } catch (error) {
      console.error('❌ Failed to pause sync:', error);
    }
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info') {
    // Create a simple notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DEORA Plaza - Database Sync', {
        body: message,
        icon: '/favicon.ico',
        tag: 'database-sync'
      });
    } else {
      // Fallback to console
      const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
      console.log(`${emoji} ${message}`);
    }
  }

  getSyncStatus() {
    if (!this.syncManager) {
      return { initialized: false };
    }

    return {
      initialized: this.isInitialized,
      ...this.syncManager.getStatus(),
      statistics: this.syncManager.getStatistics()
    };
  }

  async forceFullSync() {
    if (!this.syncManager) {
      throw new Error('Sync manager not initialized');
    }

    return await this.syncManager.forceFullSync();
  }

  updateConfig(newConfig: Partial<SyncInitializerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  private cleanup() {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
    }

    if (this.syncManager) {
      this.syncManager.stopSync().catch(console.error);
    }
  }

  // Public API for manual control
  async enableSync() {
    this.config.autoStart = true;
    await this.startSync();
  }

  async disableSync() {
    this.config.autoStart = false;
    await this.stopSync();
  }

  isRunning() {
    return this.syncManager?.getStatus()?.isRunning || false;
  }
}

// Global singleton
let syncInitializer: SyncInitializer | null = null;

export function getSyncInitializer(): SyncInitializer {
  if (!syncInitializer) {
    syncInitializer = new SyncInitializer();
  }
  return syncInitializer;
}

export function initializeSync(config?: Partial<SyncInitializerConfig>): SyncInitializer {
  if (!syncInitializer) {
    syncInitializer = new SyncInitializer(config);
  }
  return syncInitializer;
}

// Auto-initialize when module is imported (client-side only)
if (typeof window !== 'undefined') {
  initializeSync();
}