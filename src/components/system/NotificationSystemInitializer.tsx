"use client"

import { useEffect } from 'react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useServerAuth } from '@/hooks/useServerAuth';

/**
 * Component that initializes the global notification system
 * Must be rendered inside ToastProvider
 */
export function NotificationSystemInitializer() {
  const { status } = useServerAuth();
  const notificationSystem = useNotificationSystem();

  useEffect(() => {
    if (status === "authenticated" && notificationSystem.syncFromDatabase) {
      console.log('[NotificationSystemInitializer] Initializing notification system...');
      notificationSystem.syncFromDatabase();
    }
  }, [status, notificationSystem.syncFromDatabase]);

  // This component doesn't render anything
  return null;
}