"use client"

import { useEffect, useRef, useState } from 'react';
import { useIntegratedNotifications } from '@/lib/integrated-notification-system';

/**
 * React hook for managing the integrated notification system
 * Connects audio, visual, and email notifications
 */
export function useNotificationSystem() {
  const integratedNotifications = useIntegratedNotifications();
  const isInitialized = useRef(false);
  const [state, setState] = useState({ notifications: [] as any[], unreadCount: 0 });

  useEffect(() => {
    const { getIntegratedNotificationSystem } = require('@/lib/integrated-notification-system');
    const system = getIntegratedNotificationSystem();

    if (!isInitialized.current) {
      // Try to get toast system, but don't fail if it's not available
      try {
        const { useToast } = require('@/components/ui/feedback/notification-toast');
        const toast = useToast();
        system.setToastSystem(toast);
      } catch (error) {
        console.warn('Toast system not available yet, will work without visual notifications');
      }
      
      isInitialized.current = true;
      console.log('🔔 Notification system initialized');
      system.syncFromDatabase();
    }

    // Subscribe to state changes
    const unsubscribe = system.subscribe((newState: any) => {
      setState(newState);
    });

    // Fallback polling
    const pollInterval = setInterval(() => {
      system.syncFromDatabase();
    }, 30000); // Every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  return {
    ...integratedNotifications,
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    syncFromDatabase: () => {
      const { getIntegratedNotificationSystem } = require('@/lib/integrated-notification-system');
      return getIntegratedNotificationSystem().syncFromDatabase();
    },
    markAllAsRead: () => {
      const { getIntegratedNotificationSystem } = require('@/lib/integrated-notification-system');
      getIntegratedNotificationSystem().markAllAsRead();
    },
    clearAll: () => {
      const { getIntegratedNotificationSystem } = require('@/lib/integrated-notification-system');
      getIntegratedNotificationSystem().clearAll();
    },

    // Convenience methods for common notifications
    notifyOrderPlaced: (orderId: string, orderNumber: string, businessUnit: string, metadata: any = {}) => {
      return integratedNotifications.handleOrderStatusChange(
        orderId,
        orderNumber,
        '',
        'pending',
        businessUnit,
        metadata
      );
    },

    notifyOrderReady: (orderId: string, orderNumber: string, businessUnit: string, metadata: any = {}) => {
      return integratedNotifications.handleOrderStatusChange(
        orderId,
        orderNumber,
        'preparing',
        'ready',
        businessUnit,
        metadata
      );
    },

    notifyOrderServed: (orderId: string, orderNumber: string, businessUnit: string, metadata: any = {}) => {
      return integratedNotifications.handleOrderStatusChange(
        orderId,
        orderNumber,
        'ready',
        'served',
        businessUnit,
        metadata
      );
    },

    notifyWaiterlessToggle: (businessUnit: string, enabled: boolean, metadata: any = {}) => {
      return integratedNotifications.handleToggleChange(
        'waiterless',
        businessUnit,
        enabled,
        metadata
      );
    },

    notifyGSTToggle: (businessUnit: string, enabled: boolean, metadata: any = {}) => {
      return integratedNotifications.handleToggleChange(
        'gst',
        businessUnit,
        enabled,
        metadata
      );
    },

    notifyInternalOrderRequest: (orderId: string, orderNumber: string, orderType: string, fromDept: string, toDept: string, metadata: any = {}) => {
      return integratedNotifications.handleInternalOrderNotification(
        orderId,
        orderNumber,
        orderType,
        fromDept,
        toDept,
        'pending',
        metadata
      );
    },

    notifyInternalOrderReady: (orderId: string, orderNumber: string, orderType: string, fromDept: string, toDept: string, metadata: any = {}) => {
      return integratedNotifications.handleInternalOrderNotification(
        orderId,
        orderNumber,
        orderType,
        fromDept,
        toDept,
        'ready',
        metadata
      );
    }
  };
}

/**
 * Hook for notification settings management
 */
export function useNotificationSettings() {
  const { getSettings, updateSettings } = useIntegratedNotifications();

  const toggleAudio = (enabled: boolean) => {
    updateSettings({ audioEnabled: enabled });
  };

  const toggleVisual = (enabled: boolean) => {
    updateSettings({ visualEnabled: enabled });
  };

  const toggleEmail = (enabled: boolean) => {
    updateSettings({ emailEnabled: enabled });
  };

  const setMasterVolume = (volume: number) => {
    updateSettings({ masterVolume: Math.max(0, Math.min(1, volume)) });
  };

  const toggleBusinessUnitAudio = (businessUnit: string, enabled: boolean) => {
    const settings = getSettings();
    const unitSettings = settings.businessUnitSettings[businessUnit] || {};

    updateSettings({
      businessUnitSettings: {
        ...settings.businessUnitSettings,
        [businessUnit]: {
          ...unitSettings,
          audioEnabled: enabled
        }
      }
    });
  };

  const toggleBusinessUnitVisual = (businessUnit: string, enabled: boolean) => {
    const settings = getSettings();
    const unitSettings = settings.businessUnitSettings[businessUnit] || {};

    updateSettings({
      businessUnitSettings: {
        ...settings.businessUnitSettings,
        [businessUnit]: {
          ...unitSettings,
          visualEnabled: enabled
        }
      }
    });
  };

  const toggleNotificationType = (type: string, enabled: boolean) => {
    const settings = getSettings();
    const typeSettings = settings.typeSettings[type as keyof typeof settings.typeSettings];

    if (typeSettings) {
      updateSettings({
        typeSettings: {
          ...settings.typeSettings,
          [type]: {
            ...typeSettings,
            enabled
          }
        }
      });
    }
  };

  return {
    getSettings,
    toggleAudio,
    toggleVisual,
    toggleEmail,
    setMasterVolume,
    toggleBusinessUnitAudio,
    toggleBusinessUnitVisual,
    toggleNotificationType
  };
}