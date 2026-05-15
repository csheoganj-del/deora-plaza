export interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: 'order' | 'reservation' | 'promotion' | 'alert' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  metadata?: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  type: EmailNotification['type'];
}

class EmailNotificationManager {
  private static instance: EmailNotificationManager;
  private notifications: EmailNotification[] = [];
  private templates: EmailTemplate[] = [];
  private transporter: any;

  private constructor() {
    this.initializeTransporter();
    this.loadTemplates();
  }

  static getInstance(): EmailNotificationManager {
    if (!EmailNotificationManager.instance) {
      EmailNotificationManager.instance = new EmailNotificationManager();
    }
    return EmailNotificationManager.instance;
  }

  private initializeTransporter() {
    // Mock transporter configuration
    this.transporter = {
      sendMail: async (options: any) => {
        console.log('Sending email:', options);
        return { messageId: `mock_${Date.now()}` };
      }
    };
  }

  private loadTemplates() {
    this.templates = [
      {
        id: 'order_confirmation',
        name: 'Order Confirmation',
        subject: 'Order Confirmation - {{orderNumber}}',
        body: `
          <h2>Order Confirmation</h2>
          <p>Thank you for your order!</p>
          <p><strong>Order Number:</strong> {{orderNumber}}</p>
          <p><strong>Total:</strong> {{total}}</p>
          <p><strong>Estimated Delivery:</strong> {{estimatedTime}}</p>
          <p>Order Details:</p>
          <ul>
            {{#each items}}
            <li>{{name}} - {{quantity}} x \${{price}}</li>
            {{/each}}
          </ul>
        `,
        variables: ['orderNumber', 'total', 'estimatedTime', 'items'],
        type: 'order'
      },
      {
        id: 'reservation_confirmation',
        name: 'Reservation Confirmation',
        subject: 'Reservation Confirmed - {{reservationNumber}}',
        body: `
          <h2>Reservation Confirmed</h2>
          <p>Your reservation has been confirmed!</p>
          <p><strong>Reservation Number:</strong> {{reservationNumber}}</p>
          <p><strong>Date:</strong> {{date}}</p>
          <p><strong>Time:</strong> {{time}}</p>
          <p><strong>Party Size:</strong> {{partySize}}</p>
          <p><strong>Business Unit:</strong> {{businessUnit}}</p>
        `,
        variables: ['reservationNumber', 'date', 'time', 'partySize', 'businessUnit'],
        type: 'reservation'
      },
      {
        id: 'promotion_email',
        name: 'Promotional Email',
        subject: '{{promotionTitle}} - Limited Time Offer!',
        body: `
          <h2>{{promotionTitle}}</h2>
          <p>{{promotionDescription}}</p>
          <p><strong>Discount:</strong> {{discount}}%</p>
          <p><strong>Valid Until:</strong> {{validUntil}}</p>
          <p>Use code: {{promoCode}}</p>
        `,
        variables: ['promotionTitle', 'promotionDescription', 'discount', 'validUntil', 'promoCode'],
        type: 'promotion'
      },
      {
        id: 'low_inventory_alert',
        name: 'Low Inventory Alert',
        subject: 'Low Stock Alert - {{itemName}}',
        body: `
          <h2>Low Inventory Alert</h2>
          <p>The following item is running low on stock:</p>
          <p><strong>Item:</strong> {{itemName}}</p>
          <p><strong>Current Stock:</strong> {{currentStock}}</p>
          <p><strong>Reorder Point:</strong> {{reorderPoint}}</p>
          <p><strong>Business Unit:</strong> {{businessUnit}}</p>
          <p>Please reorder soon to avoid stockouts.</p>
        `,
        variables: ['itemName', 'currentStock', 'reorderPoint', 'businessUnit'],
        type: 'alert'
      }
    ];
  }

  async sendNotification(notification: Omit<EmailNotification, 'id' | 'createdAt' | 'status'>): Promise<EmailNotification> {
    const newNotification: EmailNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    this.notifications.push(newNotification);

    try {
      // Send email
      await this.transporter.sendMail({
        to: newNotification.to,
        subject: newNotification.subject,
        html: newNotification.body
      });

      newNotification.status = 'sent';
      newNotification.sentAt = new Date().toISOString();
    } catch (error) {
      console.error('Failed to send email:', error);
      newNotification.status = 'failed';
    }

    return newNotification;
  }

  async sendFromTemplate(
    templateId: string,
    to: string,
    variables: Record<string, any>,
    priority: EmailNotification['priority'] = 'medium'
  ): Promise<EmailNotification> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let subject = template.subject;
    let body = template.body;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value));
      body = body.replace(regex, String(value));
    });

    // Handle simple array templates (like order items)
    if (variables.items && Array.isArray(variables.items)) {
      const itemsList = variables.items.map((item: any) => 
        `<li>${item.name} - ${item.quantity} x $${item.price}</li>`
      ).join('');
      body = body.replace(/{{#each items}}[\s\S]*?{{\/each}}/, itemsList);
    }

    return this.sendNotification({
      to,
      subject,
      body,
      type: template.type,
      priority,
      metadata: { templateId, variables }
    });
  }

  getNotifications(filters?: {
    type?: EmailNotification['type'];
    status?: EmailNotification['status'];
    limit?: number;
  }): EmailNotification[] {
    let filtered = this.notifications;

    if (filters?.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters?.status) {
      filtered = filtered.filter(n => n.status === filters.status);
    }

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getNotificationById(id: string): EmailNotification | undefined {
    return this.notifications.find(n => n.id === id);
  }

  getTemplates(): EmailTemplate[] {
    return this.templates;
  }

  getTemplateById(id: string): EmailTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  async retryFailedNotification(id: string): Promise<boolean> {
    const notification = this.getNotificationById(id);
    if (!notification || notification.status !== 'failed') {
      return false;
    }

    try {
      await this.transporter.sendMail({
        to: notification.to,
        subject: notification.subject,
        html: notification.body
      });

      notification.status = 'sent';
      notification.sentAt = new Date().toISOString();
      return true;
    } catch (error) {
      console.error('Retry failed:', error);
      return false;
    }
  }

  getNotificationStats() {
    const total = this.notifications.length;
    const sent = this.notifications.filter(n => n.status === 'sent').length;
    const failed = this.notifications.filter(n => n.status === 'failed').length;
    const pending = this.notifications.filter(n => n.status === 'pending').length;

    const typeStats = this.notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      sent,
      failed,
      pending,
      successRate: total > 0 ? (sent / total) * 100 : 0,
      typeStats
    };
  }

  // Mock data for demonstration
  loadMockData() {
    const mockNotifications: EmailNotification[] = [
      {
        id: 'notif_1',
        to: 'customer@example.com',
        subject: 'Order Confirmation - #12345',
        body: '<h2>Order Confirmation</h2><p>Thank you for your order!</p>',
        type: 'order',
        priority: 'high',
        status: 'sent',
        createdAt: '2024-01-15T10:00:00Z',
        sentAt: '2024-01-15T10:01:00Z'
      },
      {
        id: 'notif_2',
        to: 'staff@example.com',
        subject: 'Low Stock Alert - Coffee Beans',
        body: '<h2>Low Inventory Alert</h2><p>Coffee beans are running low!</p>',
        type: 'alert',
        priority: 'high',
        status: 'pending',
        createdAt: '2024-01-15T11:30:00Z'
      }
    ];

    this.notifications = mockNotifications;
  }
}

export const emailNotificationManager = EmailNotificationManager.getInstance();

// Initialize mock data
emailNotificationManager.loadMockData();

