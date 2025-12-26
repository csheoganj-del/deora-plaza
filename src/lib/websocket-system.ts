// Real-time WebSocket System for DEORA
// Provides live updates, notifications, and real-time collaboration

import { logger, LogCategory } from './logging-system';

export enum WebSocketEventType {
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  BILL_CREATED = 'bill_created',
  BILL_UPDATED = 'bill_updated',
  MENU_UPDATED = 'menu_updated',
  TABLE_STATUS_CHANGED = 'table_status_changed',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  SYSTEM_NOTIFICATION = 'system_notification',
  BUSINESS_UNIT_UPDATE = 'business_unit_update',
  STOCK_ALERT = 'stock_alert',
  PAYMENT_RECEIVED = 'payment_received',
  KITCHEN_ORDER = 'kitchen_order',
  BAR_ORDER = 'bar_order'
}

export interface WebSocketMessage {
  id: string;
  type: WebSocketEventType;
  data: any;
  timestamp: Date;
  userId?: string;
  businessUnit?: string;
  room?: string;
  metadata?: Record<string, any>;
}

export interface WebSocketClient {
  id: string;
  userId?: string;
  businessUnit?: string;
  rooms: Set<string>;
  lastActivity: Date;
  socket: any; // Using any for WebSocket compatibility
}

export interface WebSocketConfig {
  heartbeatInterval: number;
  maxInactiveTime: number;
  reconnectAttempts: number;
  reconnectDelay: number;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private clients: Map<string, WebSocketClient> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private config: WebSocketConfig;
  private heartbeatInterval?: NodeJS.Timeout;
  private server?: any; // WebSocket server instance

  private constructor() {
    this.config = {
      heartbeatInterval: 30000, // 30 seconds
      maxInactiveTime: 300000, // 5 minutes
      reconnectAttempts: 5,
      reconnectDelay: 5000 // 5 seconds
    };

    this.startHeartbeat();
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  // Initialize WebSocket server
  initializeServer(server: any): void {
    this.server = server;
    
    this.server.on('connection', (ws: any, request: any) => {
      this.handleConnection(ws, request);
    });

    logger.info('WebSocket server initialized', LogCategory.SYSTEM);
  }

  // Handle new WebSocket connection
  private handleConnection(socket: any, request: any): void {
    const clientId = this.generateClientId();
    const url = new URL(request.url || '/', 'http://localhost');
    const userId = url.searchParams.get('userId') || undefined;
    const businessUnit = url.searchParams.get('businessUnit') || undefined;

    const client: WebSocketClient = {
      id: clientId,
      userId,
      businessUnit,
      rooms: new Set(),
      lastActivity: new Date(),
      socket
    };

    this.clients.set(clientId, client);

    // Setup socket event handlers
    socket.on('message', (data: string) => {
      this.handleMessage(clientId, data);
    });

    socket.on('close', () => {
      this.handleDisconnection(clientId);
    });

    socket.on('error', (error: any) => {
      logger.error('WebSocket client error', error, LogCategory.SYSTEM, {
        clientId,
        userId,
        businessUnit
      });
    });

    // Send welcome message
    this.sendToClient(clientId, {
      id: this.generateMessageId(),
      type: WebSocketEventType.SYSTEM_NOTIFICATION,
      data: { message: 'Connected successfully', clientId },
      timestamp: new Date()
    });

    logger.info('WebSocket client connected', LogCategory.SYSTEM, {
        clientId,
        userId,
        businessUnit
      });
  }

  // Handle incoming messages from clients
  private handleMessage(clientId: string, data: string): void {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(clientId);

      if (!client) return;

      client.lastActivity = new Date();

      // Handle different message types
      switch (message.type) {
        case 'join_room':
          this.joinRoom(clientId, message.room);
          break;
        case 'leave_room':
          this.leaveRoom(clientId, message.room);
          break;
        case 'ping':
          this.sendToClient(clientId, {
            id: this.generateMessageId(),
            type: WebSocketEventType.SYSTEM_NOTIFICATION,
            data: { message: 'pong' },
            timestamp: new Date()
          });
          break;
        default:
          logger.warn('Unknown WebSocket message type', LogCategory.SYSTEM, {
            clientId,
            messageType: message.type
          });
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message', error as Error, LogCategory.SYSTEM, {
        clientId,
        data
      });
    }
  }

  // Handle client disconnection
  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId);
    
    if (client) {
      // Remove from all rooms
      client.rooms.forEach(room => {
        this.leaveRoom(clientId, room);
      });

      this.clients.delete(clientId);

      logger.info('WebSocket client disconnected', LogCategory.SYSTEM, {
        clientId,
        userId: client.userId,
        businessUnit: client.businessUnit
      });
    }
  }

  // Join a room
  joinRoom(clientId: string, room: string): void {
    const client = this.clients.get(clientId);
    
    if (!client) return;

    client.rooms.add(room);

    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }

    this.rooms.get(room)!.add(clientId);

    logger.debug('Client joined room', {
      category: 'system',
      clientId,
      room,
      userId: client.userId
    });
  }

  // Leave a room
  leaveRoom(clientId: string, room: string): void {
    const client = this.clients.get(clientId);
    
    if (!client) return;

    client.rooms.delete(room);

    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.delete(clientId);
      
      if (roomClients.size === 0) {
        this.rooms.delete(room);
      }
    }

    logger.debug('Client left room', {
      category: 'system',
      clientId,
      room,
      userId: client.userId
    });
  }

  // Send message to specific client
  sendToClient(clientId: string, message: WebSocketMessage): boolean {
    const client = this.clients.get(clientId);
    
    if (!client || client.socket.readyState !== 1) { // WebSocket.OPEN = 1
      return false;
    }

    try {
      client.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Failed to send WebSocket message', error as Error, LogCategory.SYSTEM, {
        clientId,
        messageType: message.type
      });
      return false;
    }
  }

  // Broadcast message to all clients
  broadcast(message: WebSocketMessage, filter?: (client: WebSocketClient) => boolean): void {
    let sentCount = 0;
    let failedCount = 0;

    this.clients.forEach((client, clientId) => {
      if (filter && !filter(client)) return;

      if (this.sendToClient(clientId, message)) {
        sentCount++;
      } else {
        failedCount++;
      }
    });

    logger.debug('WebSocket broadcast completed', {
      category: 'system',
      messageType: message.type,
      sentCount,
      failedCount,
      totalClients: this.clients.size
    });
  }

  // Send message to room
  sendToRoom(room: string, message: WebSocketMessage): void {
    const roomClients = this.rooms.get(room);
    
    if (!roomClients) return;

    let sentCount = 0;
    let failedCount = 0;

    roomClients.forEach(clientId => {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      } else {
        failedCount++;
      }
    });

    logger.debug('WebSocket room message sent', {
      category: 'system',
      room,
      messageType: message.type,
      sentCount,
      failedCount
    });
  }

  // Send message to business unit
  sendToBusinessUnit(businessUnit: string, message: WebSocketMessage): void {
    this.broadcast(message, client => client.businessUnit === businessUnit);
  }

  // Send message to specific user
  sendToUser(userId: string, message: WebSocketMessage): void {
    this.broadcast(message, client => client.userId === userId);
  }

  // Business event methods
  notifyOrderCreated(order: any): void {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: WebSocketEventType.ORDER_CREATED,
      data: order,
      timestamp: new Date(),
      businessUnit: order.businessUnit
    };

    this.sendToBusinessUnit(order.businessUnit, message);
    
    // Also send to kitchen/bar rooms
    if (order.businessUnit === 'cafe') {
      this.sendToRoom('kitchen', message);
    } else if (order.businessUnit === 'bar') {
      this.sendToRoom('bar', message);
    }
  }

  notifyOrderStatusChanged(orderId: string, status: string, businessUnit: string): void {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: WebSocketEventType.ORDER_STATUS_CHANGED,
      data: { orderId, status, businessUnit },
      timestamp: new Date(),
      businessUnit
    };

    this.sendToBusinessUnit(businessUnit, message);
  }

  notifyBillCreated(bill: any): void {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: WebSocketEventType.BILL_CREATED,
      data: bill,
      timestamp: new Date(),
      businessUnit: bill.businessUnit
    };

    this.sendToBusinessUnit(bill.businessUnit, message);
  }

  notifyMenuUpdated(menuItem: any, businessUnit: string): void {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: WebSocketEventType.MENU_UPDATED,
      data: menuItem,
      timestamp: new Date(),
      businessUnit
    };

    this.sendToBusinessUnit(businessUnit, message);
  }

  notifyTableStatusChanged(tableId: string, status: string, businessUnit: string): void {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: WebSocketEventType.TABLE_STATUS_CHANGED,
      data: { tableId, status, businessUnit },
      timestamp: new Date(),
      businessUnit
    };

    this.sendToBusinessUnit(businessUnit, message);
    this.sendToRoom('floor_staff', message);
  }

  notifyStockAlert(item: any, businessUnit: string): void {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: WebSocketEventType.STOCK_ALERT,
      data: item,
      timestamp: new Date(),
      businessUnit
    };

    this.sendToBusinessUnit(businessUnit, message);
    this.sendToRoom('management', message);
  }

  notifyPaymentReceived(payment: any, businessUnit: string): void {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: WebSocketEventType.PAYMENT_RECEIVED,
      data: payment,
      timestamp: new Date(),
      businessUnit
    };

    this.sendToBusinessUnit(businessUnit, message);
    this.sendToRoom('cashier', message);
  }

  // Start heartbeat to check inactive connections
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const inactiveClients: string[] = [];

      this.clients.forEach((client, clientId) => {
        if (now.getTime() - client.lastActivity.getTime() > this.config.maxInactiveTime) {
          inactiveClients.push(clientId);
        }
      });

      // Remove inactive clients
      inactiveClients.forEach(clientId => {
        const client = this.clients.get(clientId);
        if (client) {
          client.socket.terminate();
          this.handleDisconnection(clientId);
        }
      });

      // Clean up inactive connections
      if (inactiveClients.length > 0) {
        logger.info('Cleaned up inactive WebSocket clients', LogCategory.SYSTEM, {
          count: inactiveClients.length
        });
      }
      
      // Remove inactive clients
      inactiveClients.forEach(clientId => {
        const client = this.clients.get(clientId);
        if (client) {
          try {
            client.socket.terminate();
          } catch (error) {
            // Fallback if terminate not available
            client.socket.close();
          }
          this.handleDisconnection(clientId);
        }
      });
    }, this.config.heartbeatInterval);
  }

  // Stop heartbeat
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  // Generate unique client ID
  private generateClientId(): string {
    return `WS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get connection statistics
  getStats(): {
    totalClients: number;
    clientsByBusinessUnit: Record<string, number>;
    rooms: Array<{ name: string; clientCount: number }>;
  } {
    const clientsByBusinessUnit: Record<string, number> = {};
    const rooms: Array<{ name: string; clientCount: number }> = [];

    this.clients.forEach(client => {
      if (client.businessUnit) {
        clientsByBusinessUnit[client.businessUnit] = (clientsByBusinessUnit[client.businessUnit] || 0) + 1;
      }
    });

    this.rooms.forEach((clients, roomName) => {
      rooms.push({
        name: roomName,
        clientCount: clients.size
      });
    });

    return {
      totalClients: this.clients.size,
      clientsByBusinessUnit,
      rooms
    };
  }

  // Shutdown WebSocket server
  shutdown(): void {
    this.stopHeartbeat();

    // Close all client connections
    this.clients.forEach((client, clientId) => {
      client.socket.close();
    });

    this.clients.clear();
    this.rooms.clear();

    logger.info('WebSocket server shutdown', LogCategory.SYSTEM);
  }
}

// Export singleton instance
export const webSocketManager = WebSocketManager.getInstance();

// Client-side WebSocket helper
export class WebSocketClientHelper {
  private socket?: any;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private messageHandlers: Map<WebSocketEventType, (data: any) => void> = new Map();
  private config: WebSocketConfig;

  constructor(
    private url: string,
    private userId?: string,
    private businessUnit?: string,
    config?: Partial<WebSocketConfig>
  ) {
    this.config = {
      heartbeatInterval: 30000,
      maxInactiveTime: 300000,
      reconnectAttempts: 5,
      reconnectDelay: 5000,
      ...config
    };

    this.connect();
  }

  // Connect to WebSocket server
  private connect(): void {
    const wsUrl = new URL(this.url);
    if (this.userId) wsUrl.searchParams.set('userId', this.userId);
    if (this.businessUnit) wsUrl.searchParams.set('businessUnit', this.businessUnit);

    this.socket = new (globalThis as any).WebSocket(wsUrl.toString());

    this.socket.onopen = () => {
      logger.info('WebSocket client connected', LogCategory.SYSTEM);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.socket.onmessage = (event: any) => {
      this.handleMessage(event.data);
    };

    this.socket.onclose = () => {
      logger.info('WebSocket client disconnected', LogCategory.SYSTEM);
      this.stopHeartbeat();
      this.attemptReconnect();
    };

    this.socket.onerror = (error: any) => {
      logger.error('WebSocket client error', error, LogCategory.SYSTEM);
    };
  }

  // Handle incoming messages
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message.data);
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message', error as Error, LogCategory.SYSTEM);
    }
  }

  // Attempt to reconnect
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.config.reconnectAttempts) {
      this.reconnectAttempts++;
      
      this.reconnectTimer = setTimeout(() => {
        logger.info(`Attempting WebSocket reconnection (${this.reconnectAttempts}/${this.config.reconnectAttempts})`, LogCategory.SYSTEM);
        this.connect();
      }, this.config.reconnectDelay);
    } else {
      logger.error('WebSocket reconnection failed', undefined, LogCategory.SYSTEM, {
        attempts: this.reconnectAttempts
      });
    }
  }

  // Start client heartbeat
  private startHeartbeat(): void {
    setInterval(() => {
      if (this.socket && this.socket.readyState === 1) { // WebSocket.OPEN = 1
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.heartbeatInterval);
  }

  // Stop client heartbeat
  private stopHeartbeat(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }

  // Register message handler
  on(eventType: WebSocketEventType, handler: (data: any) => void): void {
    this.messageHandlers.set(eventType, handler);
  }

  // Remove message handler
  off(eventType: WebSocketEventType): void {
    this.messageHandlers.delete(eventType);
  }

  // Join a room
  joinRoom(room: string): void {
    if (this.socket && this.socket.readyState === 1) { // WebSocket.OPEN = 1
      this.socket.send(JSON.stringify({ type: 'join_room', room }));
    }
  }

  // Leave a room
  leaveRoom(room: string): void {
    if (this.socket && this.socket.readyState === 1) { // WebSocket.OPEN = 1
      this.socket.send(JSON.stringify({ type: 'leave_room', room }));
    }
  }

  // Close connection
  close(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
    }
  }
}

export default webSocketManager;

