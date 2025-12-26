// Unified Inventory Management System for All Business Units
export interface BusinessUnitType {
  CAFE: 'cafe';
  RESTAURANT: 'restaurant';
  BAR: 'bar';
  HOTEL: 'hotel';
  MARRIAGE_GARDEN: 'marriage_garden';
}

export interface InventoryCategory {
  FOOD: 'food';
  BEVERAGE: 'beverage';
  CLEANING: 'cleaning';
  MAINTENANCE: 'maintenance';
  FURNITURE: 'furniture';
  EQUIPMENT: 'equipment';
  SUPPLIES: 'supplies';
  LINEN: 'linen';
  DECORATION: 'decoration';
  UTILITY: 'utility';
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: keyof InventoryCategory;
  sku: string;
  barcode?: string;
  unit: string; // kg, liter, piece, box, bottle, etc.
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  sellingPrice?: number;
  supplier?: string;
  location?: string;
  expiryDate?: string;
  batchNumber?: string;
  isActive: boolean;
  businessUnits: (keyof BusinessUnitType)[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'waste' | 'return';
  quantity: number;
  unitCost?: number;
  reason: string;
  reference?: string; // Order ID, Invoice number, etc.
  fromLocation?: string;
  toLocation?: string;
  businessUnit: keyof BusinessUnitType;
  userId: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  itemId: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'expired' | 'overstock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  isRead: boolean;
  businessUnit: keyof BusinessUnitType;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface InventoryTransfer {
  id: string;
  itemId: string;
  fromBusinessUnit: keyof BusinessUnitType;
  toBusinessUnit: keyof BusinessUnitType;
  quantity: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedBy: string;
  approvedBy?: string;
  completedBy?: string;
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  categories: (keyof InventoryCategory)[];
  businessUnits: (keyof BusinessUnitType)[];
  leadTime: number; // in days
  paymentTerms: string;
  isActive: boolean;
  rating: number; // 1-5
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: {
    itemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved' | 'received' | 'cancelled';
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  businessUnit: keyof BusinessUnitType;
  requestedBy: string;
  approvedBy?: string;
  receivedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryReport {
  id: string;
  type: 'stock_summary' | 'movement_report' | 'valuation_report' | 'expiry_report' | 'supplier_performance';
  businessUnit?: keyof BusinessUnitType;
  dateFrom: string;
  dateTo: string;
  data: any;
  generatedBy: string;
  generatedAt: string;
  format: 'pdf' | 'excel' | 'csv';
}

export class UnifiedInventoryManager {
  private static instance: UnifiedInventoryManager;
  private items: InventoryItem[] = [];
  private movements: StockMovement[] = [];
  private alerts: StockAlert[] = [];
  private transfers: InventoryTransfer[] = [];
  private suppliers: Supplier[] = [];
  private purchaseOrders: PurchaseOrder[] = [];
  private reports: InventoryReport[] = [];

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): UnifiedInventoryManager {
    if (!UnifiedInventoryManager.instance) {
      UnifiedInventoryManager.instance = new UnifiedInventoryManager();
    }
    return UnifiedInventoryManager.instance;
  }

  private initializeMockData() {
    // Mock inventory items
    this.items = [
      {
        id: 'item_coffee_arabica',
        name: 'Arabica Coffee Beans',
        description: 'Premium Arabica coffee beans from Colombia',
        category: 'FOOD',
        sku: 'CF-001',
        unit: 'kg',
        currentStock: 45.5,
        minStock: 10,
        maxStock: 100,
        reorderPoint: 15,
        reorderQuantity: 50,
        unitCost: 25.50,
        sellingPrice: 45.00,
        supplier: 'supplier_1',
        location: 'Warehouse A',
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 'BATCH-2024-001',
        isActive: true,
        businessUnits: ['CAFE', 'RESTAURANT'],
        tags: ['coffee', 'beverage', 'premium'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'item_milk_fresh',
        name: 'Fresh Milk',
        description: 'Fresh whole milk from local dairy',
        category: 'FOOD',
        sku: 'ML-001',
        unit: 'liter',
        currentStock: 25,
        minStock: 20,
        maxStock: 100,
        reorderPoint: 30,
        reorderQuantity: 50,
        unitCost: 2.80,
        sellingPrice: 5.00,
        supplier: 'supplier_2',
        location: 'Fridge A',
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        businessUnits: ['CAFE', 'RESTAURANT', 'BAR'],
        tags: ['milk', 'dairy', 'fresh'],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'item_cleaning_solution',
        name: 'All-Purpose Cleaning Solution',
        description: 'Professional grade cleaning solution',
        category: 'CLEANING',
        sku: 'CL-001',
        unit: 'liter',
        currentStock: 8,
        minStock: 5,
        maxStock: 50,
        reorderPoint: 10,
        reorderQuantity: 20,
        unitCost: 12.00,
        supplier: 'supplier_3',
        location: 'Storage B',
        isActive: true,
        businessUnits: ['CAFE', 'RESTAURANT', 'BAR', 'HOTEL', 'MARRIAGE_GARDEN'],
        tags: ['cleaning', 'maintenance'],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'item_hotel_towel',
        name: 'Hotel Bath Towel',
        description: 'Premium cotton bath towel',
        category: 'LINEN',
        sku: 'LN-001',
        unit: 'piece',
        currentStock: 150,
        minStock: 50,
        maxStock: 300,
        reorderPoint: 75,
        reorderQuantity: 100,
        unitCost: 15.00,
        supplier: 'supplier_4',
        location: 'Linen Room',
        isActive: true,
        businessUnits: ['HOTEL'],
        tags: ['linen', 'hotel', 'bathroom'],
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Mock suppliers
    this.suppliers = [
      {
        id: 'supplier_1',
        name: 'Premium Coffee Imports',
        contactPerson: 'John Smith',
        email: 'john@premiumcoffee.com',
        phone: '+1234567890',
        address: '123 Coffee Street, Bean City',
        categories: ['FOOD', 'BEVERAGE'],
        businessUnits: ['CAFE', 'RESTAURANT', 'BAR'],
        leadTime: 3,
        paymentTerms: 'NET 30',
        isActive: true,
        rating: 4.8,
        notes: 'Premium quality coffee supplier',
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'supplier_2',
        name: 'Fresh Dairy Co.',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@freshdairy.com',
        phone: '+1234567891',
        address: '456 Dairy Road, Milk Town',
        categories: ['FOOD'],
        businessUnits: ['CAFE', 'RESTAURANT', 'BAR'],
        leadTime: 1,
        paymentTerms: 'NET 15',
        isActive: true,
        rating: 4.5,
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Generate initial stock movements
    this.movements = [
      {
        id: 'movement_1',
        itemId: 'item_coffee_arabica',
        type: 'in',
        quantity: 50,
        unitCost: 25.50,
        reason: 'Initial stock',
        reference: 'INIT-001',
        businessUnit: 'CAFE',
        userId: 'admin',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'movement_2',
        itemId: 'item_coffee_arabica',
        type: 'out',
        quantity: 4.5,
        reason: 'Daily usage',
        reference: 'DAILY-001',
        businessUnit: 'CAFE',
        userId: 'staff_1',
        createdAt: new Date().toISOString()
      }
    ];

    // Generate alerts
    this.checkAndGenerateAlerts();
  }

  // Inventory Item Management
  public getItems(filter?: {
    businessUnit?: keyof BusinessUnitType;
    category?: keyof InventoryCategory;
    activeOnly?: boolean;
    search?: string;
  }): InventoryItem[] {
    let filteredItems = this.items;

    if (filter?.businessUnit) {
      filteredItems = filteredItems.filter(item => 
        item.businessUnits.includes(filter.businessUnit!)
      );
    }
    if (filter?.category) {
      filteredItems = filteredItems.filter(item => item.category === filter.category);
    }
    if (filter?.activeOnly) {
      filteredItems = filteredItems.filter(item => item.isActive);
    }
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return filteredItems;
  }

  public getItemById(id: string): InventoryItem | null {
    return this.items.find(item => item.id === id) || null;
  }

  public createItem(itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): InventoryItem {
    const item: InventoryItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.items.push(item);
    this.checkAndGenerateAlerts();
    return item;
  }

  public updateItem(id: string, updates: Partial<InventoryItem>): boolean {
    const item = this.getItemById(id);
    if (item) {
      Object.assign(item, updates);
      item.updatedAt = new Date().toISOString();
      this.checkAndGenerateAlerts();
      return true;
    }
    return false;
  }

  public deleteItem(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.checkAndGenerateAlerts();
      return true;
    }
    return false;
  }

  // Stock Movement Management
  public addMovement(movementData: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement {
    const movement: StockMovement = {
      ...movementData,
      id: `movement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    this.movements.push(movement);

    // Update item stock
    const item = this.getItemById(movementData.itemId);
    if (item) {
      switch (movementData.type) {
        case 'in':
          item.currentStock += movementData.quantity;
          break;
        case 'out':
        case 'waste':
          item.currentStock -= movementData.quantity;
          break;
        case 'adjustment':
          item.currentStock = movementData.quantity;
          break;
        case 'transfer':
          // Transfer doesn't affect total stock, just location
          break;
        case 'return':
          item.currentStock += movementData.quantity;
          break;
      }
      item.updatedAt = new Date().toISOString();
    }

    this.checkAndGenerateAlerts();
    return movement;
  }

  public getMovements(filter?: {
    itemId?: string;
    businessUnit?: keyof BusinessUnitType;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): StockMovement[] {
    let filteredMovements = this.movements;

    if (filter?.itemId) {
      filteredMovements = filteredMovements.filter(movement => movement.itemId === filter.itemId);
    }
    if (filter?.businessUnit) {
      filteredMovements = filteredMovements.filter(movement => movement.businessUnit === filter.businessUnit);
    }
    if (filter?.type) {
      filteredMovements = filteredMovements.filter(movement => movement.type === filter.type);
    }
    if (filter?.dateFrom) {
      filteredMovements = filteredMovements.filter(movement => 
        new Date(movement.createdAt) >= new Date(filter.dateFrom!)
      );
    }
    if (filter?.dateTo) {
      filteredMovements = filteredMovements.filter(movement => 
        new Date(movement.createdAt) <= new Date(filter.dateTo!)
      );
    }

    return filteredMovements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Stock Alerts Management
  private checkAndGenerateAlerts(): void {
    const now = new Date();
    const newAlerts: StockAlert[] = [];

    this.items.forEach(item => {
      if (!item.isActive) return;

      // Low stock alert
      if (item.currentStock <= item.minStock && item.currentStock > 0) {
        const existingAlert = this.alerts.find(alert => 
          alert.itemId === item.id && 
          alert.type === 'low_stock' && 
          !alert.resolvedAt
        );

        if (!existingAlert) {
          newAlerts.push({
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            itemId: item.id,
            type: 'low_stock',
            severity: item.currentStock <= item.reorderPoint ? 'high' : 'medium',
            message: `Low stock alert: ${item.name} (${item.currentStock} ${item.unit} remaining)`,
            isRead: false,
            businessUnit: item.businessUnits[0], // Use first business unit
            createdAt: now.toISOString()
          });
        }
      }

      // Out of stock alert
      if (item.currentStock === 0) {
        const existingAlert = this.alerts.find(alert => 
          alert.itemId === item.id && 
          alert.type === 'out_of_stock' && 
          !alert.resolvedAt
        );

        if (!existingAlert) {
          newAlerts.push({
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            itemId: item.id,
            type: 'out_of_stock',
            severity: 'critical',
            message: `Out of stock: ${item.name}`,
            isRead: false,
            businessUnit: item.businessUnits[0],
            createdAt: now.toISOString()
          });
        }
      }

      // Expiry alerts
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysToExpiry <= 0) {
          const existingAlert = this.alerts.find(alert => 
            alert.itemId === item.id && 
            alert.type === 'expired' && 
            !alert.resolvedAt
          );

          if (!existingAlert) {
            newAlerts.push({
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              itemId: item.id,
              type: 'expired',
              severity: 'critical',
              message: `Item expired: ${item.name} (expired on ${expiryDate.toLocaleDateString()})`,
              isRead: false,
              businessUnit: item.businessUnits[0],
              createdAt: now.toISOString()
            });
          }
        } else if (daysToExpiry <= 7) {
          const existingAlert = this.alerts.find(alert => 
            alert.itemId === item.id && 
            alert.type === 'expiring' && 
            !alert.resolvedAt
          );

          if (!existingAlert) {
            newAlerts.push({
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              itemId: item.id,
              type: 'expiring',
              severity: daysToExpiry <= 3 ? 'high' : 'medium',
              message: `Item expiring soon: ${item.name} (expires in ${daysToExpiry} days)`,
              isRead: false,
              businessUnit: item.businessUnits[0],
              createdAt: now.toISOString()
            });
          }
        }
      }

      // Overstock alert
      if (item.currentStock >= item.maxStock) {
        const existingAlert = this.alerts.find(alert => 
          alert.itemId === item.id && 
          alert.type === 'overstock' && 
          !alert.resolvedAt
        );

        if (!existingAlert) {
          newAlerts.push({
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            itemId: item.id,
            type: 'overstock',
            severity: 'low',
            message: `Overstock alert: ${item.name} (${item.currentStock} ${item.unit}, max: ${item.maxStock})`,
            isRead: false,
            businessUnit: item.businessUnits[0],
            createdAt: now.toISOString()
          });
        }
      }
    });

    this.alerts.push(...newAlerts);
  }

  public getAlerts(filter?: {
    businessUnit?: keyof BusinessUnitType;
    type?: string;
    severity?: string;
    unreadOnly?: boolean;
  }): StockAlert[] {
    let filteredAlerts = this.alerts;

    if (filter?.businessUnit) {
      filteredAlerts = filteredAlerts.filter(alert => alert.businessUnit === filter.businessUnit);
    }
    if (filter?.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === filter.type);
    }
    if (filter?.severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === filter.severity);
    }
    if (filter?.unreadOnly) {
      filteredAlerts = filteredAlerts.filter(alert => !alert.isRead);
    }

    return filteredAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public markAlertAsRead(alertId: string, userId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      alert.resolvedAt = new Date().toISOString();
      alert.resolvedBy = userId;
      return true;
    }
    return false;
  }

  // Transfer Management
  public createTransfer(transferData: Omit<InventoryTransfer, 'id' | 'requestedAt'>): InventoryTransfer {
    const transfer: InventoryTransfer = {
      ...transferData,
      id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestedAt: new Date().toISOString()
    };

    this.transfers.push(transfer);
    return transfer;
  }

  public getTransfers(filter?: {
    status?: string;
    fromBusinessUnit?: keyof BusinessUnitType;
    toBusinessUnit?: keyof BusinessUnitType;
  }): InventoryTransfer[] {
    let filteredTransfers = this.transfers;

    if (filter?.status) {
      filteredTransfers = filteredTransfers.filter(transfer => transfer.status === filter.status);
    }
    if (filter?.fromBusinessUnit) {
      filteredTransfers = filteredTransfers.filter(transfer => transfer.fromBusinessUnit === filter.fromBusinessUnit);
    }
    if (filter?.toBusinessUnit) {
      filteredTransfers = filteredTransfers.filter(transfer => transfer.toBusinessUnit === filter.toBusinessUnit);
    }

    return filteredTransfers.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  public updateTransferStatus(id: string, status: InventoryTransfer['status'], userId: string): boolean {
    const transfer = this.transfers.find(t => t.id === id);
    if (transfer) {
      transfer.status = status;
      
      if (status === 'approved') {
        transfer.approvedBy = userId;
        transfer.approvedAt = new Date().toISOString();
      } else if (status === 'completed') {
        transfer.completedBy = userId;
        transfer.completedAt = new Date().toISOString();
        
        // Create stock movements for transfer
        this.addMovement({
          itemId: transfer.itemId,
          type: 'out',
          quantity: transfer.quantity,
          reason: 'Transfer out',
          reference: transfer.id,
          fromLocation: transfer.fromBusinessUnit,
          toLocation: transfer.toBusinessUnit,
          businessUnit: transfer.fromBusinessUnit,
          userId
        });

        this.addMovement({
          itemId: transfer.itemId,
          type: 'in',
          quantity: transfer.quantity,
          reason: 'Transfer in',
          reference: transfer.id,
          fromLocation: transfer.fromBusinessUnit,
          toLocation: transfer.toBusinessUnit,
          businessUnit: transfer.toBusinessUnit,
          userId
        });
      }
      
      return true;
    }
    return false;
  }

  // Supplier Management
  public getSuppliers(filter?: {
    businessUnit?: keyof BusinessUnitType;
    category?: keyof InventoryCategory;
    activeOnly?: boolean;
  }): Supplier[] {
    let filteredSuppliers = this.suppliers;

    if (filter?.businessUnit) {
      filteredSuppliers = filteredSuppliers.filter(supplier => 
        supplier.businessUnits.includes(filter.businessUnit!)
      );
    }
    if (filter?.category) {
      filteredSuppliers = filteredSuppliers.filter(supplier => 
        supplier.categories.includes(filter.category!)
      );
    }
    if (filter?.activeOnly) {
      filteredSuppliers = filteredSuppliers.filter(supplier => supplier.isActive);
    }

    return filteredSuppliers;
  }

  public getSupplierById(id: string): Supplier | null {
    return this.suppliers.find(supplier => supplier.id === id) || null;
  }

  public createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
    const supplier: Supplier = {
      ...supplierData,
      id: `supplier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.suppliers.push(supplier);
    return supplier;
  }

  // Purchase Order Management
  public createPurchaseOrder(orderData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>): PurchaseOrder {
    const order: PurchaseOrder = {
      ...orderData,
      id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.purchaseOrders.push(order);
    return order;
  }

  public getPurchaseOrders(filter?: {
    businessUnit?: keyof BusinessUnitType;
    status?: string;
    supplierId?: string;
  }): PurchaseOrder[] {
    let filteredOrders = this.purchaseOrders;

    if (filter?.businessUnit) {
      filteredOrders = filteredOrders.filter(order => order.businessUnit === filter.businessUnit);
    }
    if (filter?.status) {
      filteredOrders = filteredOrders.filter(order => order.status === filter.status);
    }
    if (filter?.supplierId) {
      filteredOrders = filteredOrders.filter(order => order.supplierId === filter.supplierId);
    }

    return filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Reports and Analytics
  public getInventoryValuation(businessUnit?: keyof BusinessUnitType): {
    totalValue: number;
    categoryBreakdown: Record<string, number>;
    businessUnitBreakdown: Record<string, number>;
  } {
    const items = this.getItems({ businessUnit, activeOnly: true });
    
    let totalValue = 0;
    const categoryBreakdown: Record<string, number> = {};
    const businessUnitBreakdown: Record<string, number> = {};

    items.forEach(item => {
      const itemValue = item.currentStock * item.unitCost;
      totalValue += itemValue;

      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + itemValue;

      item.businessUnits.forEach(bu => {
        businessUnitBreakdown[bu] = (businessUnitBreakdown[bu] || 0) + (itemValue / item.businessUnits.length);
      });
    });

    return {
      totalValue,
      categoryBreakdown,
      businessUnitBreakdown
    };
  }

  public getLowStockItems(businessUnit?: keyof BusinessUnitType): InventoryItem[] {
    const items = this.getItems({ businessUnit, activeOnly: true });
    return items.filter(item => item.currentStock <= item.minStock).sort((a, b) => {
      const aPercentage = (a.currentStock / a.minStock) * 100;
      const bPercentage = (b.currentStock / b.minStock) * 100;
      return aPercentage - bPercentage;
    });
  }

  public getExpiringItems(days: number = 7, businessUnit?: keyof BusinessUnitType): InventoryItem[] {
    const items = this.getItems({ businessUnit, activeOnly: true });
    const now = new Date();
    const cutoffDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return items
      .filter(item => item.expiryDate && new Date(item.expiryDate) <= cutoffDate)
      .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
  }

  public getMovementStats(dateFrom?: string, dateTo?: string, businessUnit?: keyof BusinessUnitType): {
    totalIn: number;
    totalOut: number;
    totalWaste: number;
    totalTransfers: number;
    netChange: number;
  } {
    const movements = this.getMovements({ dateFrom, dateTo, businessUnit });
    
    const totalIn = movements
      .filter(m => m.type === 'in')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const totalOut = movements
      .filter(m => m.type === 'out')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const totalWaste = movements
      .filter(m => m.type === 'waste')
      .reduce((sum, m) => sum + m.quantity, 0);
    
    const totalTransfers = movements
      .filter(m => m.type === 'transfer')
      .reduce((sum, m) => sum + m.quantity, 0);

    return {
      totalIn,
      totalOut,
      totalWaste,
      totalTransfers,
      netChange: totalIn - totalOut - totalWaste
    };
  }
}

// Export singleton instance
export const unifiedInventoryManager = UnifiedInventoryManager.getInstance();

