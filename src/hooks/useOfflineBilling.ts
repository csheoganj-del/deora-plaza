"use client";

import { useState, useEffect } from 'react';
import { offlineManager } from '@/lib/offline-manager';

export function useOfflineBilling() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Initialize database first
        const initializeDB = async () => {
            try {
                await offlineManager.initDB();
                setIsInitialized(true);
                setIsOnline(navigator.onLine);
                await updatePendingSyncCount();
            } catch (error) {
                console.error('Failed to initialize offline database:', error);
            }
        };

        initializeDB();

        // Event listeners for online/offline
        const handleOnline = async () => {
            setIsOnline(true);
            console.log('Connection restored - triggering sync');
            await syncOfflineBills();
        };

        const handleOffline = () => {
            setIsOnline(false);
            console.log('Connection lost - offline mode activated');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const updatePendingSyncCount = async () => {
        if (!isInitialized) return; // Don't access DB until initialized

        try {
            const stats = await offlineManager.getOfflineStats();
            setPendingSyncCount(stats.pendingSync);
        } catch (error) {
            console.error('Failed to get offline stats:', error);
        }
    };

    const saveBillOffline = async (billData: any) => {
        try {
            const offlineId = `offline-bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const billWithId = {
                id: offlineId,
                ...billData,
                createdOffline: true,
                offlineTimestamp: Date.now(),
            };

            // Save to IndexedDB
            await offlineManager.saveOfflineData('bills', billWithId);

            // Queue for sync
            await offlineManager.queueForSync('bill', billData);

            await updatePendingSyncCount();

            return {
                success: true,
                offlineId,
                billNumber: billWithId.billNumber || `OFFLINE-${offlineId.slice(-8)}`,
            };
        } catch (error) {
            console.error('Failed to save bill offline:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to save offline',
            };
        }
    };

    const syncOfflineBills = async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);
        try {
            console.log('Starting offline bill sync...');
            await offlineManager.syncPendingData();
            await updatePendingSyncCount();
            console.log('Offline bills synced successfully');
        } catch (error) {
            console.error('Failed to sync offline bills:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    return {
        isOnline,
        pendingSyncCount,
        isSyncing,
        saveBillOffline,
        syncOfflineBills,
    };
}
