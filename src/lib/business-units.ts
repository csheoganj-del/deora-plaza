// Multi-Business Unit Management System for DEORA
// Manages Cafe, Restaurant, Bar, Hotel, and Marriage Garden operations

export enum BusinessUnitType {
  CAFE = 'cafe',
  RESTAURANT = 'restaurant',
  BAR = 'bar',
  HOTEL = 'hotel',
  MARRIAGE_GARDEN = 'marriage_garden'
}

export interface BusinessUnit {
  id: string;
  name: string;
  type: BusinessUnitType;
  description: string;
  isActive: boolean;
  settings: BusinessUnitSettings;
  operatingHours: OperatingHours;
  contact: ContactInfo;
  features: string[];
}

export interface BusinessUnitSettings {
  enableOnlineOrders: boolean;
  enableReservations: boolean;
  enableRoomBooking: boolean;
  enableEventBooking: boolean;
  currency: string;
  taxRate: number;
  serviceCharge: number;
  minimumOrder: number;
  deliveryRadius: number;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  specialHours?: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website?: string;
}

export interface BusinessUnitStats {
  totalRevenue: number;
  todayRevenue: number;
  ordersCount: number;
  activeStaff: number;
  occupancyRate?: number;
  averageOrderValue: number;
  popularItems: string[];
  percentageChange?: number;
}

// Default business units configuration
export const DEFAULT_BUSINESS_UNITS: Partial<BusinessUnit>[] = [
  {
    name: 'DEORA Cafe',
    type: BusinessUnitType.CAFE,
    description: 'Cozy cafe & restaurant with premium coffee, snacks and fine dining',
    isActive: true,
    settings: {
      enableOnlineOrders: true,
      enableReservations: false,
      enableRoomBooking: false,
      enableEventBooking: false,
      currency: 'INR',
      taxRate: 5,
      serviceCharge: 0,
      minimumOrder: 100,
      deliveryRadius: 5
    },
    features: ['WiFi', 'Outdoor Seating', 'Pet Friendly']
  },
  // {
  //   name: 'DEORA Restaurant',
  //   type: BusinessUnitType.RESTAURANT,
  //   description: 'Fine dining restaurant with multi-cuisine menu',
  //   isActive: true,
  //   settings: {
  //     enableOnlineOrders: true,
  //     enableReservations: true,
  //     enableRoomBooking: false,
  //     enableEventBooking: false,
  //     currency: 'INR',
  //     taxRate: 5,
  //     serviceCharge: 10,
  //     minimumOrder: 500,
  //     deliveryRadius: 8
  //   },
  //   features: ['Private Dining', 'Live Music', 'Wine Cellar']
  // },
  {
    name: 'DEORA Bar',
    type: BusinessUnitType.BAR,
    description: 'Premium bar with extensive drink selection',
    isActive: true,
    settings: {
      enableOnlineOrders: true,
      enableReservations: true,
      enableRoomBooking: false,
      enableEventBooking: true,
      currency: 'INR',
      taxRate: 5,
      serviceCharge: 15,
      minimumOrder: 200,
      deliveryRadius: 3
    },
    features: ['Cocktail Bar', 'Live Sports', 'DJ Nights']
  },
  {
    name: 'DEORA Hotel',
    type: BusinessUnitType.HOTEL,
    description: 'Luxury hotel with premium amenities',
    isActive: true,
    settings: {
      enableOnlineOrders: true,
      enableReservations: true,
      enableRoomBooking: true,
      enableEventBooking: false,
      currency: 'INR',
      taxRate: 12,
      serviceCharge: 0,
      minimumOrder: 0,
      deliveryRadius: 0
    },
    features: ['24/7 Service', 'Spa', 'Gym', 'Conference Rooms']
  },
  {
    name: 'DEORA Marriage Garden',
    type: BusinessUnitType.MARRIAGE_GARDEN,
    description: 'Beautiful venue for weddings and events',
    isActive: true,
    settings: {
      enableOnlineOrders: false,
      enableReservations: false,
      enableRoomBooking: false,
      enableEventBooking: true,
      currency: 'INR',
      taxRate: 18,
      serviceCharge: 0,
      minimumOrder: 50000,
      deliveryRadius: 0
    },
    features: ['Catering Service', 'Decoration', 'Parking', 'Generator Backup']
  }
];

export class BusinessUnitManager {
  private static instance: BusinessUnitManager;
  private businessUnits: Map<string, BusinessUnit> = new Map();

  private constructor() {
    this.initializeBusinessUnits();
  }

  public static getInstance(): BusinessUnitManager {
    if (!BusinessUnitManager.instance) {
      BusinessUnitManager.instance = new BusinessUnitManager();
    }
    return BusinessUnitManager.instance;
  }

  private async initializeBusinessUnits(): Promise<void> {
    try {
      // Test API keys removed for production build
      // const { validateAPIKeys, testAPIKeys } = await import('./test-api-keys');
      // const keyValidation = validateAPIKeys();
      // const keyTest = await testAPIKeys();

      // Load business units from database or use defaults
      // Use client-side functions if in browser, server-side if on server
      const isClient = typeof window !== 'undefined';
      console.log('BusinessUnitManager: Environment detection', { isClient, hasWindow: typeof window !== 'undefined' });

      const { getDocuments, createDocument } = isClient
        ? await import('./supabase/database-client')
        : await import('./supabase/database');

      console.log('BusinessUnitManager: Using database functions from', isClient ? 'client' : 'server');

      // Test Supabase connection removed for production build
      // const { testSupabaseConnection } = await import('./test-supabase');
      // const connectionTest = await testSupabaseConnection();
      // console.log('Supabase connection test result:', connectionTest);

      // if (!connectionTest.success) {
      //   throw new Error('Supabase connection failed');
      // }

      // Check if business units exist - use businesssettings table
      const existingUnits = await getDocuments('businesssettings');
      console.log('Existing business units from database:', existingUnits);

      if (!existingUnits || existingUnits.length === 0) {
        console.log('No existing business units found, creating defaults...');
        // Create default business units with simplified structure matching businesssettings table
        for (const unitData of DEFAULT_BUSINESS_UNITS) {
          const simplifiedUnit = {
            id: `bu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: unitData.name || 'Unknown Business Unit',
            address: '123 Main Street, Mumbai, Maharashtra 400001',
            mobile: '+91-9876543210',
            waiterlessMode: false
          };

          console.log('Creating simplified business unit:', simplifiedUnit);
          await createDocument('businesssettings', simplifiedUnit);

          // Store the full unit in memory for app functionality
          const fullUnit: BusinessUnit = {
            id: simplifiedUnit.id,
            name: unitData.name || 'Unknown Business Unit',
            type: unitData.type!,
            description: unitData.description || 'Business unit description',
            isActive: true,
            settings: unitData.settings!,
            operatingHours: this.getDefaultOperatingHours(),
            contact: this.getDefaultContactInfo(),
            features: unitData.features || []
          };
          this.businessUnits.set(fullUnit.id, fullUnit);
        }
      } else {
        console.log('Loading existing business units from database...');
        // Load existing units and convert to full BusinessUnit format
        existingUnits.forEach((dbUnit: any) => {
          // Find matching default unit or create a basic one
          const defaultUnit = DEFAULT_BUSINESS_UNITS.find(du => du.name === dbUnit.name);
          const fullUnit: BusinessUnit = {
            id: dbUnit.id,
            name: dbUnit.name,
            type: defaultUnit?.type || BusinessUnitType.CAFE,
            description: defaultUnit?.description || dbUnit.name,
            isActive: true,
            settings: defaultUnit?.settings || {
              enableOnlineOrders: true,
              enableReservations: false,
              enableRoomBooking: false,
              enableEventBooking: false,
              currency: 'INR',
              taxRate: 5,
              serviceCharge: 0,
              minimumOrder: 100,
              deliveryRadius: 5
            },
            operatingHours: this.getDefaultOperatingHours(),
            contact: {
              phone: dbUnit.mobile || '+91-9876543210',
              email: 'info@deora.com',
              address: dbUnit.address || '123 Main Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001',
              website: 'www.deora.com'
            },
            features: defaultUnit?.features || ['WiFi', 'Outdoor Seating']
          };
          this.businessUnits.set(fullUnit.id, fullUnit);
        });
      }
      console.log('BusinessUnitManager initialization complete. Units loaded:', this.businessUnits.size);
    } catch (error) {
      console.error('Failed to initialize business units:', error);
      // Fallback to default units without database persistence
      DEFAULT_BUSINESS_UNITS.forEach((unitData) => {
        const unit: BusinessUnit = {
          id: `bu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          operatingHours: this.getDefaultOperatingHours(),
          contact: this.getDefaultContactInfo(),
          ...unitData
        } as BusinessUnit;
        this.businessUnits.set(unit.id, unit);
      });
      console.log('Using fallback default business units:', this.businessUnits.size);
    }
  }

  private getDefaultOperatingHours(): OperatingHours {
    return {
      monday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
      saturday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
      sunday: { isOpen: true, openTime: '09:00', closeTime: '23:00' }
    };
  }

  private getDefaultContactInfo(): ContactInfo {
    return {
      phone: '+91-9876543210',
      email: 'info@deora.com',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      website: 'www.deora.com'
    };
  }

  // Get all business units
  public getAllBusinessUnits(): BusinessUnit[] {
    return Array.from(this.businessUnits.values());
  }

  // Get active business units
  public getActiveBusinessUnits(): BusinessUnit[] {
    return this.getAllBusinessUnits().filter(unit => unit.isActive);
  }

  // Get business unit by ID
  public getBusinessUnit(id: string): BusinessUnit | undefined {
    return this.businessUnits.get(id);
  }

  // Get business units by type
  public getBusinessUnitsByType(type: BusinessUnitType): BusinessUnit[] {
    return this.getAllBusinessUnits().filter(unit => unit.type === type);
  }

  // Update business unit
  public async updateBusinessUnit(id: string, updates: Partial<BusinessUnit>): Promise<boolean> {
    try {
      // Use client-side functions if in browser, server-side if on server
      const isClient = typeof window !== 'undefined';
      const { updateDocument } = isClient
        ? await import('./supabase/database-client')
        : await import('./supabase/database');

      const success = await updateDocument('businesssettings', id, updates);

      if (success.success) {
        const existingUnit = this.businessUnits.get(id);
        if (existingUnit) {
          this.businessUnits.set(id, { ...existingUnit, ...updates });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update business unit:', error);
      return false;
    }
  }

  // Get business unit stats
  public async getBusinessUnitStats(unitId: string): Promise<BusinessUnitStats | null> {
    try {
      // Use client-side functions if in browser, server-side if on server
      const isClient = typeof window !== 'undefined';
      const { queryDocuments } = isClient
        ? await import('./supabase/database-client')
        : await import('./supabase/database');

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      let totalRevenue = 0;
      let todayRevenue = 0;
      let ordersCount = 0;
      let activeBookingsCount = 0;

      // Fetch Orders for revenue and count
      // Filter by business unit if not 'global_overview' (handled by caller or 'all' logic generally)
      // Note: 'global_overview' isn't a real unit ID in DB, so this function is typically called with specific unit IDs.
      // If unitId is passed, use it.

      let orderFilters: any[] = [];
      if (unitId && unitId !== 'global_overview') {
        // Map internal ID to business unit type string if needed, or assume ID matches what's stored in orders
        // Actually orders store 'businessUnit' as 'cafe', 'bar', etc.
        // We need to map the ID to the type first, because orders table uses type string in 'businessUnit' column usually
        const unit = this.getBusinessUnit(unitId);
        if (unit) {
          orderFilters.push({ field: 'businessUnit', operator: '==', value: unit.type });
        }
      }

      // Allow fetching all orders if no specific unit filter implies all
      const orders = await queryDocuments('orders', orderFilters);

      orders.forEach((order: any) => {
        const amount = Number(order.totalAmount) || 0;
        totalRevenue += amount;
        if (order.createdAt >= startOfDay) {
          todayRevenue += amount;
        }
      });
      ordersCount = orders.length;

      // Fetch Bookings for Hotel/Garden active counts
      let bookingFilters: any[] = [];
      if (unitId && unitId !== 'global_overview') {
        const unit = this.getBusinessUnit(unitId);
        if (unit && (unit.type === BusinessUnitType.HOTEL || unit.type === BusinessUnitType.MARRIAGE_GARDEN)) {
          // Only filter bookings for hotel/garden types if that's what unit is
          // But strictly talking, bookings table has 'type' usually? 'eventType' or 'type' column
          // Let's assume we filter by implicit logic or simply fetch all bookings and filter in memory if strictly needed?
          // The validation says bookings table has 'type'.
        }
      }
      // Fetching all bookings for now to calculate active
      // Optimally we should filter in query
      const bookings = await queryDocuments('bookings', []);

      // Filter bookings relevant to this unit if it's hotel/garden, or all if global
      const relevantBookings = bookings.filter((b: any) => {
        if (!unitId || unitId === 'global_overview') return true;
        const unit = this.getBusinessUnit(unitId);
        if (!unit) return false;
        // If unit is hotel, include hotel bookings
        if (unit.type === BusinessUnitType.HOTEL && (!b.type || b.type === 'room')) return true;
        if (unit.type === BusinessUnitType.MARRIAGE_GARDEN && (b.type === 'event' || b.eventType)) return true;
        return false;
      });

      // Calculate active bookings
      relevantBookings.forEach((b: any) => {
        if (b.status === 'checked_in' || b.status === 'confirmed') {
          activeBookingsCount++;
        }
        // Add booking revenue if not already in orders (depends on system design, keeping simple revenue from orders table for now)
      });


      // Calculate percentage change
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      let currentMonthRevenue = 0;
      let lastMonthRevenue = 0;

      orders.forEach((order: any) => {
        const amount = Number(order.totalAmount) || 0;
        if (order.createdAt >= startOfMonth) {
          currentMonthRevenue += amount;
        }
        if (order.createdAt >= startOfLastMonth && order.createdAt <= endOfLastMonth) {
          lastMonthRevenue += amount;
        }
      });

      let percentageChange = 0;
      if (lastMonthRevenue > 0) {
        percentageChange = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
      } else if (currentMonthRevenue > 0) {
        percentageChange = 100; // 100% growth if started from 0
      }

      return {
        totalRevenue: totalRevenue,
        todayRevenue: todayRevenue,
        ordersCount: ordersCount,
        activeStaff: 0, // Placeholder
        occupancyRate: 0, // Placeholder
        averageOrderValue: ordersCount > 0 ? totalRevenue / ordersCount : 0,
        popularItems: [],
        percentageChange: percentageChange
      };
    } catch (error) {
      console.error('Failed to get business unit stats:', error);
      return {
        totalRevenue: 0,
        todayRevenue: 0,
        ordersCount: 0,
        activeStaff: 0,
        occupancyRate: 0,
        averageOrderValue: 0,
        popularItems: []
      };
    }
  }

  // Check if business unit is open
  public isBusinessUnitOpen(unitId: string): boolean {
    const unit = this.getBusinessUnit(unitId);
    if (!unit) return false;

    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof OperatingHours;
    const daySchedule = unit.operatingHours[dayName];

    if (!daySchedule?.isOpen) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = daySchedule.openTime.split(':').map(Number);
    const [closeHour, closeMin] = daySchedule.closeTime.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime <= closeTime;
  }
}

// Export a function to get the singleton instance instead of creating it at module level
export function getBusinessUnitManager(): BusinessUnitManager {
  return BusinessUnitManager.getInstance();
}

