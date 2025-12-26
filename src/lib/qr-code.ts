// QR Code generation and management for table-side ordering
export interface QRCodeData {
  tableId: string;
  businessUnit: string;
  restaurantId: string;
  sessionId?: string;
  timestamp: number;
  version: string;
}

export interface TableQRCode {
  id: string;
  tableNumber: string;
  businessUnit: string;
  qrCodeData: QRCodeData;
  qrCodeUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastScanned?: string;
  scanCount: number;
}

export interface QRCodeSession {
  id: string;
  tableId: string;
  businessUnit: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  cart: QROrderItem[];
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface QROrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  customizations?: Record<string, any>;
}

export interface QRGeneratedOrder {
  sessionId: string;
  tableId: string;
  tableNumber: string;
  businessUnit: string;
  items: QROrderItem[];
  totalAmount: number;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  specialInstructions?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed';
  createdAt: string;
}

export class QRCodeManager {
  private static instance: QRCodeManager;
  private readonly BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  private readonly QR_VERSION = '1.0';
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  private constructor() {}

  public static getInstance(): QRCodeManager {
    if (!QRCodeManager.instance) {
      QRCodeManager.instance = new QRCodeManager();
    }
    return QRCodeManager.instance;
  }

  // Generate QR code data for a table
  public generateQRCodeData(tableId: string, businessUnit: string, restaurantId: string): QRCodeData {
    return {
      tableId,
      businessUnit,
      restaurantId,
      timestamp: Date.now(),
      version: this.QR_VERSION
    };
  }

  // Encode QR code data to base64 string
  public encodeQRData(data: QRCodeData): string {
    const jsonString = JSON.stringify(data);
    return btoa(jsonString);
  }

  // Decode QR code data from base64 string
  public decodeQRData(encodedData: string): QRCodeData | null {
    try {
      const jsonString = atob(encodedData);
      return JSON.parse(jsonString) as QRCodeData;
    } catch (error) {
      console.error('Failed to decode QR data:', error);
      return null;
    }
  }

  // Generate QR code URL for a table
  public generateQRCodeUrl(tableId: string, businessUnit: string, restaurantId: string): string {
    const data = this.generateQRCodeData(tableId, businessUnit, restaurantId);
    const encodedData = this.encodeQRData(data);
    return `${this.BASE_URL}/qr-order/${encodedData}`;
  }

  // Validate QR code data
  public validateQRData(data: QRCodeData): boolean {
    if (!data.tableId || !data.businessUnit || !data.restaurantId) {
      return false;
    }

    // Check if data is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAge) {
      return false;
    }

    // Check version compatibility
    if (data.version !== this.QR_VERSION) {
      return false;
    }

    return true;
  }

  // Create a new QR ordering session
  public createSession(tableId: string, businessUnit: string): QRCodeSession {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_DURATION);

    return {
      id: sessionId,
      tableId,
      businessUnit,
      cart: [],
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if session is expired
  public isSessionExpired(session: QRCodeSession): boolean {
    return new Date() > new Date(session.expiresAt);
  }

  // Add item to cart in session
  public addToCart(session: QRCodeSession, item: QROrderItem): QRCodeSession {
    const existingItemIndex = session.cart.findIndex(
      cartItem => cartItem.menuItemId === item.menuItemId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      session.cart[existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      session.cart.push(item);
    }

    session.updatedAt = new Date().toISOString();
    return session;
  }

  // Remove item from cart in session
  public removeFromCart(session: QRCodeSession, menuItemId: string): QRCodeSession {
    session.cart = session.cart.filter(item => item.menuItemId !== menuItemId);
    session.updatedAt = new Date().toISOString();
    return session;
  }

  // Update item quantity in cart
  public updateCartItemQuantity(session: QRCodeSession, menuItemId: string, quantity: number): QRCodeSession {
    const item = session.cart.find(cartItem => cartItem.menuItemId === menuItemId);
    if (item) {
      if (quantity <= 0) {
        return this.removeFromCart(session, menuItemId);
      }
      item.quantity = quantity;
      session.updatedAt = new Date().toISOString();
    }
    return session;
  }

  // Calculate cart total
  public calculateCartTotal(cart: QROrderItem[]): number {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Convert session to order
  public convertSessionToOrder(session: QRCodeSession, customerInfo?: QRGeneratedOrder['customerInfo'], specialInstructions?: string): QRGeneratedOrder {
    return {
      sessionId: session.id,
      tableId: session.tableId,
      tableNumber: session.tableId, // This would be fetched from table data
      businessUnit: session.businessUnit,
      items: session.cart,
      totalAmount: this.calculateCartTotal(session.cart),
      customerInfo,
      specialInstructions,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      createdAt: new Date().toISOString()
    };
  }

  // Generate QR code image (would need QR code library)
  public async generateQRCodeImage(url: string): Promise<string> {
    // This would typically use a library like qrcode.js or qr-image
    // For now, return a placeholder
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">QR Code</text>
        <text x="100" y="120" text-anchor="middle" font-size="8" fill="black">${url.substring(0, 30)}...</text>
      </svg>
    `)}`;
  }

  // Get table info from QR data
  public async getTableInfo(tableId: string): Promise<{ tableNumber: string; businessUnit: string } | null> {
    // This would typically fetch from your database
    // For now, return mock data
    return {
      tableNumber: tableId,
      businessUnit: 'restaurant'
    };
  }

  // Track QR code scan
  public trackQRScan(tableId: string, businessUnit: string): void {
    // This would typically update scan count in database
    console.log(`QR Code scanned for table ${tableId} in ${businessUnit}`);
  }

  // Get active sessions for a table
  public getActiveSessionsForTable(tableId: string): QRCodeSession[] {
    // This would typically fetch from your database
    // For now, return empty array
    return [];
  }

  // Clean up expired sessions
  public cleanupExpiredSessions(): void {
    // This would typically remove expired sessions from database
    console.log('Cleaning up expired QR sessions');
  }
}

// Export singleton instance
export const qrCodeManager = QRCodeManager.getInstance();

// Utility functions for QR code operations
export const generateTableQRCode = async (tableId: string, businessUnit: string, restaurantId: string): Promise<TableQRCode> => {
  const qrCodeUrl = qrCodeManager.generateQRCodeUrl(tableId, businessUnit, restaurantId);
  const qrCodeImage = await qrCodeManager.generateQRCodeImage(qrCodeUrl);
  
  return {
    id: `qr_${tableId}_${Date.now()}`,
    tableNumber: tableId,
    businessUnit,
    qrCodeData: qrCodeManager.generateQRCodeData(tableId, businessUnit, restaurantId),
    qrCodeUrl,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scanCount: 0
  };
};

export const validateQRSession = (session: QRCodeSession): { isValid: boolean; reason?: string } => {
  if (session.status !== 'active') {
    return { isValid: false, reason: 'Session is not active' };
  }

  if (qrCodeManager.isSessionExpired(session)) {
    return { isValid: false, reason: 'Session has expired' };
  }

  return { isValid: true };
};

