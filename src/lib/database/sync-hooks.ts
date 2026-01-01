"use client";

/**
 * 🪝 React Hooks for Database Synchronization
 * 
 * Easy-to-use hooks for monitoring and controlling sync status
 */

import { useState, useEffect, useCallback } from 'react';
import { getSyncInitializer } from './sync-initializer';

export interface UseSyncStatusReturn {
  isRunning: boolean;
  isInitialized: boolean;
  lastSync: Date | null;
  totalRecordsSynced: number;
  errorCount: number;
  queueSize: number;
  currentOperation: string | null;
  progress: {
    table: string;
    completed: number;
    total: number;
  } | null;
  startSync: () => Promise<void>;
  stopSync: () => Promise<void>;
  forceSync: () => Promise<void>;
  clearErrors: () => void;
}

/**
 * Hook for monitoring sync status
 */
export function useSyncStatus(): UseSyncStatusReturn {
  const [status, setStatus] = useState({
    isRunning: false,
    isInitialized: false,
    lastSync: null as Date | null,
    totalRecordsSynced: 0,
    errorCount: 0,
    queueSize: 0,
    currentOperation: null as string | null,
    progress: null as any
  });

  const syncInitializer = getSyncInitializer();

  const updateStatus = useCallback(() => {
    try {
      const syncStatus = syncInitializer.getSyncStatus();
      setStatus({
        isRunning: syncStatus.isRunning || false,
        isInitialized: syncStatus.initialized || false,
        lastSync: syncStatus.lastSync,
        totalRecordsSynced: syncStatus.statistics?.totalRecordsSynced || 0,
        errorCount: syncStatus.statistics?.errorCount || 0,
        queueSize: syncStatus.statistics?.queueSize || 0,
        currentOperation: syncStatus.currentOperation,
        progress: syncStatus.progress
      });
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }, [syncInitializer]);

  useEffect(() => {
    updateStatus();
    
    // Update every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for sync events
    const handleSyncEvent = () => {
      setTimeout(updateStatus, 100); // Small delay to ensure state is updated
    };

    syncInitializer.on('sync-started', handleSyncEvent);
    syncInitializer.on('sync-stopped', handleSyncEvent);
    syncInitializer.on('sync-progress', handleSyncEvent);
    syncInitializer.on('sync-error', handleSyncEvent);

    return () => {
      clearInterval(interval);
      syncInitializer.removeAllListeners();
    };
  }, [syncInitializer, updateStatus]);

  const startSync = useCallback(async () => {
    try {
      await syncInitializer.enableSync();
      updateStatus();
    } catch (error) {
      console.error('Failed to start sync:', error);
      throw error;
    }
  }, [syncInitializer, updateStatus]);

  const stopSync = useCallback(async () => {
    try {
      await syncInitializer.disableSync();
      updateStatus();
    } catch (error) {
      console.error('Failed to stop sync:', error);
      throw error;
    }
  }, [syncInitializer, updateStatus]);

  const forceSync = useCallback(async () => {
    try {
      await syncInitializer.forceFullSync();
      updateStatus();
    } catch (error) {
      console.error('Failed to force sync:', error);
      throw error;
    }
  }, [syncInitializer, updateStatus]);

  const clearErrors = useCallback(() => {
    // This would need to be implemented in the sync manager
    console.log('Clear errors requested');
  }, []);

  return {
    ...status,
    startSync,
    stopSync,
    forceSync,
    clearErrors
  };
}

/**
 * Hook for sync progress monitoring
 */
export function useSyncProgress() {
  const [progress, setProgress] = useState<{
    table: string;
    completed: number;
    total: number;
    percentage: number;
  } | null>(null);

  const syncInitializer = getSyncInitializer();

  useEffect(() => {
    const handleProgress = (progressData: any) => {
      if (progressData) {
        setProgress({
          ...progressData,
          percentage: (progressData.completed / progressData.total) * 100
        });
      } else {
        setProgress(null);
      }
    };

    syncInitializer.on('sync-progress', handleProgress);

    return () => {
      syncInitializer.off('sync-progress', handleProgress);
    };
  }, [syncInitializer]);

  return progress;
}

/**
 * Hook for sync errors monitoring
 */
export function useSyncErrors() {
  const [errors, setErrors] = useState<any[]>([]);

  const syncInitializer = getSyncInitializer();

  useEffect(() => {
    const updateErrors = () => {
      try {
        const status = syncInitializer.getSyncStatus();
        setErrors(status.errors || []);
      } catch (error) {
        console.error('Failed to get sync errors:', error);
      }
    };

    updateErrors();

    const handleError = () => {
      updateErrors();
    };

    syncInitializer.on('sync-error', handleError);

    return () => {
      syncInitializer.off('sync-error', handleError);
    };
  }, [syncInitializer]);

  return {
    errors,
    errorCount: errors.length,
    hasErrors: errors.length > 0,
    latestError: errors[errors.length - 1] || null
  };
}

/**
 * Hook for sync statistics
 */
export function useSyncStatistics() {
  const [stats, setStats] = useState({
    totalRecordsSynced: 0,
    errorCount: 0,
    successRate: 0,
    tablesMonitored: 0,
    queueSize: 0,
    lastSync: null as Date | null,
    uptime: 0
  });

  const syncInitializer = getSyncInitializer();

  useEffect(() => {
    const updateStats = () => {
      try {
        const status = syncInitializer.getSyncStatus();
        const statistics = status.statistics || {};
        
        const totalSynced = statistics.totalRecordsSynced || 0;
        const errorCount = statistics.errorCount || 0;
        const successRate = totalSynced > 0 ? ((totalSynced - errorCount) / totalSynced) * 100 : 0;

        setStats({
          totalRecordsSynced: totalSynced,
          errorCount,
          successRate,
          tablesMonitored: statistics.tablesMonitored || 0,
          queueSize: statistics.queueSize || 0,
          lastSync: statistics.lastSync,
          uptime: 0 // Would need to track this
        });
      } catch (error) {
        console.error('Failed to update sync statistics:', error);
      }
    };

    updateStats();
    
    // Update every 10 seconds
    const interval = setInterval(updateStats, 10000);

    return () => clearInterval(interval);
  }, [syncInitializer]);

  return stats;
}

/**
 * Hook for controlling sync operations
 */
export function useSyncControls() {
  const [isLoading, setIsLoading] = useState(false);
  const syncInitializer = getSyncInitializer();

  const executeOperation = useCallback(async (operation: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await operation();
    } catch (error) {
      console.error('Sync operation failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startSync = useCallback(() => {
    return executeOperation(() => syncInitializer.enableSync());
  }, [syncInitializer, executeOperation]);

  const stopSync = useCallback(() => {
    return executeOperation(() => syncInitializer.disableSync());
  }, [syncInitializer, executeOperation]);

  const forceFullSync = useCallback(() => {
    return executeOperation(() => syncInitializer.forceFullSync());
  }, [syncInitializer, executeOperation]);

  const restartSync = useCallback(async () => {
    return executeOperation(async () => {
      await syncInitializer.disableSync();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await syncInitializer.enableSync();
    });
  }, [syncInitializer, executeOperation]);

  return {
    isLoading,
    startSync,
    stopSync,
    forceFullSync,
    restartSync
  };
}