"use client"

import { useEffect, useRef } from 'react';
import { useServerAuth } from '@/hooks/useServerAuth';

// Global flag — persists across component remounts in the same browser session
let globalNotifInitialized = false;

/**
 * Component that initializes the global notification system ONCE per session.
 * Uses a module-level flag to prevent re-initialization on remounts.
 */
export function NotificationSystemInitializer() {
  const { status } = useServerAuth();

  useEffect(() => {
    if (status === "authenticated" && !globalNotifInitialized) {
      globalNotifInitialized = true;
      // Only set up realtime listener — no DB poll needed
      try {
        const { getIntegratedNotificationSystem } = require('@/lib/integrated-notification-system');
        const system = getIntegratedNotificationSystem();
        system.setupRealtimeListener();
      } catch (e) {
        // Notification system unavailable
      }
    }
  }, [status]);

  return null;
}