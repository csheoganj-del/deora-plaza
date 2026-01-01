"use client"

import { useEffect, useRef } from 'react';
import { useIntegratedNotifications } from '@/lib/integrated-notification-system';
import { useToast } from '@/components/ui/notification-toast';

/**
 * React hook for managing the integrated notification system
 * Connects audio, visual, and email notifications
 */
export function useNotificationSystem() {
  const integratedNotifications = useIntegratedNotifications();
  const toast = useToast();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      // Set toast system reference for visual notifications
      const { getIntegratedNotificationSystem } = require('@/lib/integrated-notification-system');
      const system = getIntegratedNotificationSystem();
      system.setToastSystem(toast);
      
      isInitialized.current = true;
      console.log('🔔 Notification system initialized');
    }
  }, [toast]);

  return {
    ...integratedNotifications,
    
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