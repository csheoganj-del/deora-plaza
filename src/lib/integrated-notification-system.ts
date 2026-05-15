"use client"

import { getAudioSystem, AudioNotification, AudioNotificationType } from "@/lib/audio/notification-system";
import { useToast } from "@/components/ui/feedback/notification-toast";
import { emailNotificationManager } from "@/lib/email-notifications";
import { createClient } from "@/lib/supabase/client";
import { getRecentNotifications, markNotificationAsRead } from "@/actions/notifications";
import { speakKitchenAlert } from "@/lib/utils";

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
  | 'waiterless_toggle_changed'
  | 'item_ready';

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
  private notifications: IntegratedNotification[] = [];
  private unreadCount: number = 0;
  private listeners: Set<(state: { notifications: IntegratedNotification[], unreadCount: number }) => void> = new Set();
  private supabase = createClient();
  private channel: any = null;

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
   * Sync notifications from database
   */
  async syncFromDatabase() {
    console.log('🔄 [NotificationSystem] Syncing notifications from database...');
    const result = await getRecentNotifications();
    console.log('🔄 [NotificationSystem] Sync result:', result);

    if (result.success && result.data) {
      console.log(`🔄 [NotificationSystem] Found ${result.data.length} notifications in DB`);
      const dbNotifications = result.data.map((n: any) => this.mapDbToIntegrated(n));

      // Combine with existing local notifications, avoiding duplicates
      const existingIds = new Set(this.notifications.map(n => n.id));
      const newNotifications = dbNotifications.filter((n: any) => !existingIds.has(n.id));

      if (newNotifications.length > 0) {
        console.log(`✨ [NotificationSystem] Found ${newNotifications.length} brand new notifications`);

        // Trigger notification flow for these new ones
        // But only if they are relatively fresh (e.g., within last 5 minutes)
        // to avoid a storm of alerts on first load
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        for (const n of newNotifications) {
          const createdAt = n.metadata?.createdAt ? new Date(n.metadata.createdAt).getTime() : now;
          if (now - createdAt < fiveMinutes) {
            console.log(`🔔 [NotificationSystem] Triggering alert for fresh notification: ${n.title}`);
            this.sendNotification(n, false);
          } else {
            // Just add to list without alert
            this.notifications = [n, ...this.notifications].slice(0, 50);
          }
        }

        this.unreadCount = this.notifications.filter(n => !n.metadata?.isRead).length;
        this.notifyListeners();
      }
    }

    this.setupRealtimeListener();
  }

  /**
   * Set up real-time listener for notifications table
   */
  private setupRealtimeListener() {
    if (this.channel) {
      console.log('📡 [NotificationSystem] Realtime listener already active');
      return;
    }

    console.log('📡 [NotificationSystem] Setting up Realtime listener for notifications...');
    this.channel = this.supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('📥 [NotificationSystem] New notification from DB (Realtime):', payload.new);
          this.handleIncomingDbNotification(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('📡 [NotificationSystem] Realtime subscription status:', status);
      });
  }

  /**
   * Map database record to IntegratedNotification
   */
  private mapDbToIntegrated(dbNotif: any): IntegratedNotification {
    return {
      id: dbNotif.id,
      type: dbNotif.type as NotificationType,
      title: dbNotif.title,
      message: dbNotif.message,
      businessUnit: dbNotif.businessUnit,
      priority: dbNotif.priority || 'medium',
      orderId: dbNotif.metadata?.orderId,
      orderNumber: dbNotif.metadata?.orderNumber,
      metadata: {
        ...dbNotif.metadata,
        isRead: dbNotif.isRead,
        createdAt: dbNotif.createdAt
      }
    };
  }

  /**
   * Handle incoming notification from Realtime
   */
  private async handleIncomingDbNotification(dbNotif: any) {
    const notification = this.mapDbToIntegrated(dbNotif);

    // Filter by business unit if needed (optional, server already handles recipient)
    // Here we just trigger the full notification flow
    await this.sendNotification(notification, false); // false = don't save back to DB
  }

  /**
   * Send integrated notification
   */
  async sendNotification(notification: IntegratedNotification, saveToDb = true): Promise<void> {
    console.log('🔔 Sending integrated notification:', notification);

    // Avoid duplicates if coming from Realtime
    if (this.notifications.some(n => n.id === notification.id)) {
      return;
    }

    const typeSettings = this.settings.typeSettings[notification.type];
    const unitSettings = this.settings.businessUnitSettings[notification.businessUnit] || {
      audioEnabled: true,
      visualEnabled: true,
      spatialAudio: false,
      position: { x: 0, y: 0, z: 0 }
    };

    console.log(`🔔 [NotificationSystem] Processing notification "${notification.title}"`, {
      type: notification.type,
      businessUnit: notification.businessUnit,
      typeSettings,
      unitSettings
    });

    if (!typeSettings?.enabled) {
      console.log('❌ [NotificationSystem] Notification type disabled:', notification.type);
      return;
    }

    // Send audio notification
    if (notification.audioEnabled !== false &&
      this.settings.audioEnabled &&
      unitSettings.audioEnabled) {

      // Send audio notification (Don't await to avoid delaying Hindi voice alerts)
      this.sendAudioNotification(notification, typeSettings).catch(err =>
        console.warn("[IntegratedNotificationSystem] Audio playback failed:", err)
      );

      // --- Custom Hindi Voice Alerts ---
      this.handleVoiceAlerts(notification);
    }

    // Send visual notification
    if (notification.visualEnabled !== false &&
      this.settings.visualEnabled &&
      unitSettings.visualEnabled) {

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

    // Update history - BUT SKIP for 'kitchen_alert' (reminders)
    // Reverting exclusion of 'order_new' as user seemingly missed them ("why notification bell is empty")
    const skipHistoryTypes: NotificationType[] = ['kitchen_alert'];

    if (!skipHistoryTypes.includes(notification.type)) {
      this.notifications = [notification, ...this.notifications].slice(0, 50);
      this.unreadCount++;
      this.notifyListeners();
    } else {
      console.log(`🔕 [NotificationSystem] Skipped adding ${notification.type} to history list (Audio/Visual still active)`);
    }
  }

  /**
   * Handle Hindi voice alerts for waiters and managers
   */
  private handleVoiceAlerts(notification: IntegratedNotification) {
    const { type, metadata, orderNumber } = notification;
    const isTakeaway = metadata?.isTakeaway || metadata?.locationName === 'Takeaway' || metadata?.location === 'Takeaway';
    const location = isTakeaway ? "takeaway" : metadata?.location || metadata?.locationName || `table number ${metadata?.tableNumber || ''}`;

    let hindiMessage = "";

    if (type === 'order_new') {
      // New order notification - this is what was missing!
      hindiMessage = `${location} ke liye naya order aaya hai, kripya ise taiyar karein`;
    } else if (type === 'order_ready') {
      hindiMessage = `Order number ${orderNumber} ${location} ke liye taiyaar hai, kripya ise serve karein`;
    } else if (type === 'item_ready') {
      const itemName = metadata?.itemName || "item";
      hindiMessage = `${itemName} ${location} ke liye taiyaar hai`;
    } else if (type === 'order_served') {
      hindiMessage = `Order number ${orderNumber} serve ho gaya hai`;
    }

    if (hindiMessage) {
      console.log(`[IntegratedNotificationSystem] Speaking Hindi message: "${hindiMessage}"`);
      speakKitchenAlert(hindiMessage, true);
    }
  }

  /**
   * Listen for notification state changes
   */
  subscribe(callback: (state: { notifications: IntegratedNotification[], unreadCount: number }) => void) {
    this.listeners.add(callback);
    // Initial call
    callback({ notifications: this.notifications, unreadCount: this.unreadCount });
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    const state = { notifications: this.notifications, unreadCount: this.unreadCount };
    this.listeners.forEach(callback => callback(state));
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Update local state
    this.notifications = this.notifications.map(n =>
      n.id === notificationId ? { ...n, metadata: { ...n.metadata, isRead: true } } : n
    );
    this.unreadCount = Math.max(0, this.unreadCount - (notification.metadata?.isRead ? 0 : 1));
    this.notifyListeners();

    // Update database
    if (notificationId && !notificationId.startsWith('local_')) {
      await markNotificationAsRead(notificationId);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    const unreadNotifications = this.notifications.filter(n => !n.metadata?.isRead);

    // Update local state
    this.notifications = [];
    this.unreadCount = 0;
    this.notifyListeners();

    // Update database for unread ones
    for (const notif of unreadNotifications) {
      if (notif.id && !notif.id.startsWith('local_')) {
        await markNotificationAsRead(notif.id);
      }
    }
  }

  getNotifications(): IntegratedNotification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.unreadCount;
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
          notification.priority === 'critical' ? 'high' : notification.priority
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
        },
        item_ready: {
          enabled: true,
          priority: 'high',
          audioType: 'order_ready'
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
    getSettings: system.getSettings.bind(system),
    markAsRead: system.markAsRead.bind(system),
    clearAll: system.clearAll.bind(system)
  };
}