"use client"

import { getAudioSystem, AudioNotification, AudioNotificationType } from "@/lib/audio/notification-system";
import { useToast } from "@/components/ui/notification-toast";
import { emailNotificationManager } from "@/lib/email-notifications";

/**
 * 🔔 DEORA Plaza - Integrated Notification System
 * 
 * Combines audio, visual, and email notifications with business logic
 * Integrates with internal order flow and business settings
 */

export interface IntegratedNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  businessUnit: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Audio settings
  audioEnabled?: boolean;
  audioType?: AudioNotificationType;
  spatialPosition?: { x: number; y: number; z: number };
  
  // Visual settings
  visualEnabled?: boolean;
  toastType?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  
  // Email settings
  emailEnabled?: boolean;
  emailRecipients?: string[];
  emailTemplate?: string;
  
  // Metadata
  orderId?: string;
  orderNumber?: string;
  tableNumber?: string;
  roomNumber?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export type NotificationType = 
  | 'order_new'
  | 'order_ready'
  | 'order_served'
  | 'order_completed'
  | 'internal_order_new'
  | 'internal_order_ready'
  | 'internal_order_completed'
  | 'waiterless_auto_serve'
  | 'payment_success'
  | 'payment_failed'
  | 'booking_new'
  | 'booking_confirmed'
  | 'table_ready'
  | 'kitchen_alert'
  | 'inventory_low'
  | 'staff_call'
  | 'system_alert'
  | 'gst_toggle_changed'
  | 'waiterless_toggle_changed';

interface NotificationSettings {
  audioEnabled: boolean;
  visualEnabled: boolean;
  emailEnabled: boolean;
  masterVolume: number;
  
  // Per-business unit settings
  businessUnitSettings: Record<string, {
    audioEnabled: boolean;
    visualEnabled: boolean;
    spatialAudio: boolean;
    position: { x: number; y: number; z: number };
  }>;
  
  // Per-notification type settings
  typeSettings: Record<NotificationType, {
    enabled: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    audioType: AudioNotificationType;
    emailTemplate?: string;
  }>;
}

class IntegratedNotificationSystem {
  private static instance: IntegratedNotificationSystem;
  private audioSystem = getAudioSystem();
  private settings: NotificationSettings;
  private toastSystem: any = null;
  
  private constructor() {
    this.settings = this.getDefaultSettings();
    this.initializeSystem();
  }

  static getInstance(): IntegratedNotificationSystem {
    if (!IntegratedNotificationSystem.instance) {
      IntegratedNotificationSystem.instance = new IntegratedNotificationSystem();
    }
    return IntegratedNotificationSystem.instance;
  }

  /**
   * Initialize the notification system
   */
  private initializeSystem() {
    // Set up audio system
    this.audioSystem.setEnabled(this.settings.audioEnabled);
    this.audioSystem.setMasterVolume(this.settings.masterVolume);
    
    // Set up spatial positions for business units
    Object.entries(this.settings.businessUnitSettings).forEach(([unit, config]) => {
      if (config.spatialAudio) {
        // Business units are positioned in a virtual space
        this.audioSystem.updateListenerPosition(0, 0, 0); // Center position
      }
    });
  }

  /**
   * Send integrated notification
   */
  async sendNotification(notification: IntegratedNotification): Promise<void> {
    console.log('🔔 Sending integrated notification:', notification);

    const typeSettings = this.settings.typeSettings[notification.type];
    const unitSettings = this.settings.businessUnitSettings[notification.businessUnit];

    if (!typeSettings?.enabled) {
      console.log('Notification type disabled:', notification.type);
      return;
    }

    // Send audio notification
    if (notification.audioEnabled !== false && 
        this.settings.audioEnabled && 
        unitSettings?.audioEnabled) {
      
      await this.sendAudioNotification(notification, typeSettings);
    }

    // Send visual notification
    if (notification.visualEnabled !== false && 
        this.settings.visualEnabled && 
        unitSettings?.visualEnabled) {
      
      this.sendVisualNotification(notification);
    }

    // Send email notification
    if (notification.emailEnabled && 
        this.settings.emailEnabled && 
        notification.emailRecipients?.length) {
      
      await this.sendEmailNotification(notification, typeSettings);
    }

    // Log notification for audit
    this.logNotification(notification);
  }

  /**
   * Send audio notification
   */
  private async sendAudioNotification(
    notification: IntegratedNotification, 
    typeSettings: any
  ): Promise<void> {
    const unitSettings = this.settings.businessUnitSettings[notification.businessUnit];
    
    const audioNotification: AudioNotification = {
      id: notification.id,
      type: notification.audioType || typeSettings.audioType,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      businessUnit: notification.businessUnit,
      userId: notification.userId,
      position: unitSettings?.spatialAudio ? 
        (notification.spatialPosition || unitSettings.position) : undefined,
      duration: notification.duration
    };

    await this.audioSystem.playNotification(audioNotification);
  }

  /**
   * Send visual notification (toast)
   */
  private sendVisualNotification(notification: IntegratedNotification): void {
    if (!this.toastSystem) {
      console.warn('Toast system not initialized');
      return;
    }

    this.toastSystem.addToast({
      title: notification.title,
      description: notification.message,
      type: notification.toastType || this.getToastTypeFromPriority(notification.priority),
      duration: notification.duration || this.getDurationFromPriority(notification.priority)
    });
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    notification: IntegratedNotification,
    typeSettings: any
  ): Promise<void> {
    if (!notification.emailRecipients?.length) return;

    const templateId = notification.emailTemplate || typeSettings.emailTemplate;
    if (!templateId) {
      console.warn('No email template configured for notification type:', notification.type);
      return;
    }

    const variables = {
      title: notification.title,
      message: notification.message,
      businessUnit: notification.businessUnit,
      orderNumber: notification.orderNumber,
      tableNumber: notification.tableNumber,
      roomNumber: notification.roomNumber,
      ...notification.metadata
    };

    for (const recipient of notification.emailRecipients) {
      try {
        await emailNotificationManager.sendFromTemplate(
          templateId,
          recipient,
          variables,
          notification.priority
        );
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }
  }

  /**
   * Set toast system reference
   */
  setToastSystem(toastSystem: any): void {
    this.toastSystem = toastSystem;
  }

  /**
   * Handle order status change notifications
   */
  async handleOrderStatusChange(
    orderId: string,
    orderNumber: string,
    oldStatus: string,
    newStatus: string,
    businessUnit: string,
    metadata: any = {}
  ): Promise<void> {
    const notificationId = `order_${orderId}_${newStatus}_${Date.now()}`;
    
    let notificationType: NotificationType;
    let title: string;
    let message: string;
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    switch (newStatus) {
      case 'pending':
        notificationType = 'order_new';
        title = 'New Order';
        message = `Order ${orderNumber} placed`;
        priority = 'high';
        break;
      
      case 'ready':
        notificationType = 'order_ready';
        title = 'Order Ready';
        message = `Order ${orderNumber} is ready for delivery`;
        priority = 'high';
        break;
      
      case 'served':
        notificationType = 'order_served';
        title = 'Order Served';
        message = `Order ${orderNumber} has been served`;
        priority = 'medium';
        
        // Check if this was auto-served in waiterless mode
        if (metadata.waiterlessMode) {
          notificationType = 'waiterless_auto_serve';
          title = 'Auto-Served';
          message = `Order ${orderNumber} auto-served (waiterless mode)`;
        }
        break;
      
      case 'completed':
        notificationType = 'order_completed';
        title = 'Order Completed';
        message = `Order ${orderNumber} completed successfully`;
        priority = 'low';
        break;
      
      default:
        return; // Don't send notification for other statuses
    }

    const notification: IntegratedNotification = {
      id: notificationId,
      type: notificationType,
      title,
      message,
      businessUnit,
      priority,
      orderId,
      orderNumber,
      tableNumber: metadata.tableNumber,
      roomNumber: metadata.roomNumber,
      metadata
    };

    await this.sendNotification(notification);
  }

  /**
   * Handle internal order notifications
   */
  async handleInternalOrderNotification(
    orderId: string,
    orderNumber: string,
    orderType: string,
    fromDepartment: string,
    toDepartment: string,
    status: string,
    metadata: any = {}
  ): Promise<void> {
    const notificationId = `internal_${orderId}_${status}_${Date.now()}`;
    
    let notificationType: NotificationType;
    let title: string;
    let message: string;
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let targetUnit = toDepartment;

    switch (status) {
      case 'pending':
        notificationType = 'internal_order_new';
        title = 'Internal Order Request';
        message = `${orderType} request from ${fromDepartment}`;
        priority = metadata.priority === 'urgent' ? 'critical' : 'high';
        break;
      
      case 'ready':
        notificationType = 'internal_order_ready';
        title = 'Internal Order Ready';
        message = `${orderType} ready for ${fromDepartment}`;
        priority = 'high';
        targetUnit = fromDepartment; // Notify requesting department
        break;
      
      case 'completed':
        notificationType = 'internal_order_completed';
        title = 'Internal Order Completed';
        message = `${orderType} completed successfully`;
        priority = 'low';
        targetUnit = fromDepartment; // Notify requesting department
        break;
      
      default:
        return;
    }

    const notification: IntegratedNotification = {
      id: notificationId,
      type: notificationType,
      title,
      message,
      businessUnit: targetUnit,
      priority,
      orderId,
      orderNumber,
      metadata: {
        ...metadata,
        orderType,
        fromDepartment,
        toDepartment
      }
    };

    await this.sendNotification(notification);
  }

  /**
   * Handle business settings toggle changes
   */
  async handleToggleChange(
    toggleType: 'waiterless' | 'gst',
    businessUnit: string,
    enabled: boolean,
    metadata: any = {}
  ): Promise<void> {
    const notificationId = `toggle_${toggleType}_${businessUnit}_${Date.now()}`;
    
    const notificationType: NotificationType = toggleType === 'waiterless' 
      ? 'waiterless_toggle_changed' 
      : 'gst_toggle_changed';
    
    const title = toggleType === 'waiterless' 
      ? 'Waiterless Mode Changed' 
      : 'GST Settings Changed';
    
    const message = `${toggleType === 'waiterless' ? 'Waiterless mode' : 'GST'} ${enabled ? 'enabled' : 'disabled'} for ${businessUnit}`;

    const notification: IntegratedNotification = {
      id: notificationId,
      type: notificationType,
      title,
      message,
      businessUnit,
      priority: 'medium',
      metadata: {
        ...metadata,
        toggleType,
        enabled
      }
    };

    await this.sendNotification(notification);
  }

  /**
   * Update notification settings
   */
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Update audio system
    if (newSettings.audioEnabled !== undefined) {
      this.audioSystem.setEnabled(newSettings.audioEnabled);
    }
    
    if (newSettings.masterVolume !== undefined) {
      this.audioSystem.setMasterVolume(newSettings.masterVolume);
    }
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Get default notification settings
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      audioEnabled: true,
      visualEnabled: true,
      emailEnabled: false,
      masterVolume: 0.7,
      
      businessUnitSettings: {
        restaurant: {
          audioEnabled: true,
          visualEnabled: true,
          spatialAudio: true,
          position: { x: -2, y: 0, z: 0 }
        },
        cafe: {
          audioEnabled: true,
          visualEnabled: true,
          spatialAudio: true,
          position: { x: 2, y: 0, z: 0 }
        },
        bar: {
          audioEnabled: true,
          visualEnabled: true,
          spatialAudio: true,
          position: { x: 0, y: 0, z: -2 }
        },
        hotel: {
          audioEnabled: true,
          visualEnabled: true,
          spatialAudio: true,
          position: { x: 0, y: 2, z: 0 }
        },
        garden: {
          audioEnabled: true,
          visualEnabled: true,
          spatialAudio: true,
          position: { x: 0, y: 0, z: 2 }
        },
        kitchen: {
          audioEnabled: true,
          visualEnabled: true,
          spatialAudio: false,
          position: { x: 0, y: 0, z: 0 }
        }
      },
      
      typeSettings: {
        order_new: {
          enabled: true,
          priority: 'high',
          audioType: 'order_new',
          emailTemplate: 'order_confirmation'
        },
        order_ready: {
          enabled: true,
          priority: 'high',
          audioType: 'order_ready'
        },
        order_served: {
          enabled: true,
          priority: 'medium',
          audioType: 'order_delivered'
        },
        order_completed: {
          enabled: true,
          priority: 'low',
          audioType: 'success'
        },
        internal_order_new: {
          enabled: true,
          priority: 'high',
          audioType: 'kitchen_alert'
        },
        internal_order_ready: {
          enabled: true,
          priority: 'high',
          audioType: 'order_ready'
        },
        internal_order_completed: {
          enabled: true,
          priority: 'medium',
          audioType: 'success'
        },
        waiterless_auto_serve: {
          enabled: true,
          priority: 'medium',
          audioType: 'success'
        },
        payment_success: {
          enabled: true,
          priority: 'medium',
          audioType: 'payment_success'
        },
        payment_failed: {
          enabled: true,
          priority: 'high',
          audioType: 'payment_failed'
        },
        booking_new: {
          enabled: true,
          priority: 'high',
          audioType: 'booking_new',
          emailTemplate: 'reservation_confirmation'
        },
        booking_confirmed: {
          enabled: true,
          priority: 'medium',
          audioType: 'booking_confirmed'
        },
        table_ready: {
          enabled: true,
          priority: 'high',
          audioType: 'table_ready'
        },
        kitchen_alert: {
          enabled: true,
          priority: 'critical',
          audioType: 'kitchen_alert'
        },
        inventory_low: {
          enabled: true,
          priority: 'medium',
          audioType: 'inventory_low',
          emailTemplate: 'low_inventory_alert'
        },
        staff_call: {
          enabled: true,
          priority: 'high',
          audioType: 'staff_call'
        },
        system_alert: {
          enabled: true,
          priority: 'high',
          audioType: 'system_alert'
        },
        gst_toggle_changed: {
          enabled: true,
          priority: 'medium',
          audioType: 'info'
        },
        waiterless_toggle_changed: {
          enabled: true,
          priority: 'medium',
          audioType: 'info'
        }
      }
    };
  }

  /**
   * Helper methods
   */
  private getToastTypeFromPriority(priority: string): 'success' | 'error' | 'warning' | 'info' {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'info';
    }
  }

  private getDurationFromPriority(priority: string): number {
    switch (priority) {
      case 'critical': return 10000; // 10 seconds
      case 'high': return 7000;     // 7 seconds
      case 'medium': return 5000;   // 5 seconds
      case 'low': return 3000;      // 3 seconds
      default: return 5000;
    }
  }

  private logNotification(notification: IntegratedNotification): void {
    console.log('📝 Notification logged:', {
      id: notification.id,
      type: notification.type,
      businessUnit: notification.businessUnit,
      priority: notification.priority,
      timestamp: new Date().toISOString()
    });
  }
}

// Global singleton
let integratedNotificationSystem: IntegratedNotificationSystem | null = null;

export function getIntegratedNotificationSystem(): IntegratedNotificationSystem {
  if (!integratedNotificationSystem) {
    integratedNotificationSystem = IntegratedNotificationSystem.getInstance();
  }
  return integratedNotificationSystem;
}

// React hook for integrated notifications
export function useIntegratedNotifications() {
  const system = getIntegratedNotificationSystem();
  
  return {
    sendNotification: system.sendNotification.bind(system),
    handleOrderStatusChange: system.handleOrderStatusChange.bind(system),
    handleInternalOrderNotification: system.handleInternalOrderNotification.bind(system),
    handleToggleChange: system.handleToggleChange.bind(system),
    updateSettings: system.updateSettings.bind(system),
    getSettings: system.getSettings.bind(system)
  };
}