// Booking and reservation system for hotel and marriage garden
export interface BookingType {
  HOTEL_ROOM: 'hotel_room';
  MARRIAGE_GARDEN: 'marriage_garden';
  EVENT_HALL: 'event_hall';
  RESTAURANT_TABLE: 'restaurant_table';
}

export interface Room {
  id: string;
  number: string;
  type: 'single' | 'double' | 'suite' | 'deluxe' | 'presidential';
  category: 'standard' | 'premium' | 'luxury';
  capacity: number;
  basePrice: number;
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  floor: number;
  images?: string[];
  description?: string;
}

export interface MarriageGarden {
  id: string;
  name: string;
  capacity: number;
  basePrice: number;
  area: number; // in square feet
  amenities: string[];
  status: 'available' | 'booked' | 'maintenance';
  images?: string[];
  description?: string;
  features: string[];
}

export interface Booking {
  id: string;
  type: keyof BookingType;
  resourceId: string; // room ID or garden ID
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    idProof?: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  businessUnit: 'hotel' | 'garden';
}

export interface BookingSlot {
  id: string;
  resourceId: string;
  date: string;
  status: 'available' | 'booked' | 'blocked';
  bookingId?: string;
  price?: number;
}

export interface BookingRule {
  id: string;
  type: keyof BookingType;
  rule: 'min_days' | 'max_days' | 'advance_booking' | 'cancellation' | 'payment';
  value: number | string;
  description: string;
  businessUnit: 'hotel' | 'garden';
}

export class BookingManager {
  private static instance: BookingManager;
  private rooms: Room[] = [];
  private gardens: MarriageGarden[] = [];
  private bookings: Booking[] = [];
  private rules: BookingRule[] = [];

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): BookingManager {
    if (!BookingManager.instance) {
      BookingManager.instance = new BookingManager();
    }
    return BookingManager.instance;
  }

  private initializeMockData() {
    // Mock rooms data
    this.rooms = [
      {
        id: 'room_101',
        number: '101',
        type: 'single',
        category: 'standard',
        capacity: 1,
        basePrice: 50,
        amenities: ['AC', 'TV', 'WiFi', 'Mini Fridge'],
        status: 'available',
        floor: 1,
        description: 'Comfortable single room with modern amenities'
      },
      {
        id: 'room_201',
        number: '201',
        type: 'double',
        category: 'standard',
        capacity: 2,
        basePrice: 80,
        amenities: ['AC', 'TV', 'WiFi', 'Mini Fridge', 'Balcony'],
        status: 'available',
        floor: 2,
        description: 'Spacious double room with balcony'
      },
      {
        id: 'room_301',
        number: '301',
        type: 'suite',
        category: 'premium',
        capacity: 4,
        basePrice: 150,
        amenities: ['AC', 'TV', 'WiFi', 'Mini Fridge', 'Living Room', 'Kitchenette'],
        status: 'available',
        floor: 3,
        description: 'Luxury suite with separate living area'
      }
    ];

    // Mock gardens data
    this.gardens = [
      {
        id: 'garden_royal',
        name: 'Royal Garden',
        capacity: 500,
        basePrice: 5000,
        area: 10000,
        amenities: ['Parking', 'Power Backup', 'Catering Area', 'Stage', 'Dance Floor'],
        status: 'available',
        features: ['Outdoor Setting', 'Garden View', 'Water Fountain']
      },
      {
        id: 'garden_diamond',
        name: 'Diamond Garden',
        capacity: 300,
        basePrice: 3000,
        area: 6000,
        amenities: ['Parking', 'Power Backup', 'Catering Area', 'Stage'],
        status: 'available',
        features: ['Partial Indoor', 'Garden View']
      }
    ];

    // Mock booking rules
    this.rules = [
      {
        id: 'rule_1',
        type: 'HOTEL_ROOM',
        rule: 'min_days',
        value: 1,
        description: 'Minimum 1 day booking required',
        businessUnit: 'hotel'
      },
      {
        id: 'rule_2',
        type: 'HOTEL_ROOM',
        rule: 'max_days',
        value: 30,
        description: 'Maximum 30 days booking allowed',
        businessUnit: 'hotel'
      },
      {
        id: 'rule_3',
        type: 'MARRIAGE_GARDEN',
        rule: 'advance_booking',
        value: 7,
        description: 'Minimum 7 days advance booking required',
        businessUnit: 'garden'
      }
    ];
  }

  // Room Management
  public getRooms(filter?: {
    type?: string;
    category?: string;
    status?: string;
    capacity?: number;
  }): Room[] {
    let filteredRooms = this.rooms;

    if (filter?.type) {
      filteredRooms = filteredRooms.filter(room => room.type === filter.type);
    }
    if (filter?.category) {
      filteredRooms = filteredRooms.filter(room => room.category === filter.category);
    }
    if (filter?.status) {
      filteredRooms = filteredRooms.filter(room => room.status === filter.status);
    }
    if (filter?.capacity) {
      filteredRooms = filteredRooms.filter(room => room.capacity >= filter.capacity!);
    }

    return filteredRooms;
  }

  public getRoomById(id: string): Room | null {
    return this.rooms.find(room => room.id === id) || null;
  }

  public updateRoomStatus(id: string, status: Room['status']): boolean {
    const room = this.getRoomById(id);
    if (room) {
      room.status = status;
      return true;
    }
    return false;
  }

  // Garden Management
  public getGardens(filter?: {
    capacity?: number;
    status?: string;
  }): MarriageGarden[] {
    let filteredGardens = this.gardens;

    if (filter?.capacity) {
      filteredGardens = filteredGardens.filter(garden => garden.capacity >= filter.capacity!);
    }
    if (filter?.status) {
      filteredGardens = filteredGardens.filter(garden => garden.status === filter.status);
    }

    return filteredGardens;
  }

  public getGardenById(id: string): MarriageGarden | null {
    return this.gardens.find(garden => garden.id === id) || null;
  }

  public updateGardenStatus(id: string, status: MarriageGarden['status']): boolean {
    const garden = this.getGardenById(id);
    if (garden) {
      garden.status = status;
      return true;
    }
    return false;
  }

  // Availability Check
  public checkRoomAvailability(
    roomId: string,
    checkIn: string,
    checkOut: string
  ): boolean {
    const room = this.getRoomById(roomId);
    if (!room || room.status !== 'available') {
      return false;
    }

    const conflictingBookings = this.bookings.filter(booking => 
      booking.type === 'HOTEL_ROOM' &&
      booking.resourceId === roomId &&
      booking.status !== 'cancelled' &&
      this.isDateOverlap(
        new Date(checkIn),
        new Date(checkOut),
        new Date(booking.checkIn),
        new Date(booking.checkOut)
      )
    );

    return conflictingBookings.length === 0;
  }

  public checkGardenAvailability(
    gardenId: string,
    date: string
  ): boolean {
    const garden = this.getGardenById(gardenId);
    if (!garden || garden.status !== 'available') {
      return false;
    }

    const conflictingBookings = this.bookings.filter(booking =>
      booking.type === 'MARRIAGE_GARDEN' &&
      booking.resourceId === gardenId &&
      booking.status !== 'cancelled' &&
      this.isSameDate(new Date(date), new Date(booking.checkIn))
    );

    return conflictingBookings.length === 0;
  }

  private isDateOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1;
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  // Booking Management
  public createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Booking {
    const booking: Booking = {
      ...bookingData,
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.bookings.push(booking);
    return booking;
  }

  public getBookings(filter?: {
    type?: keyof BookingType;
    status?: string;
    businessUnit?: 'hotel' | 'garden';
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Booking[] {
    let filteredBookings = this.bookings;

    if (filter?.type) {
      filteredBookings = filteredBookings.filter(booking => booking.type === filter.type);
    }
    if (filter?.status) {
      filteredBookings = filteredBookings.filter(booking => booking.status === filter.status);
    }
    if (filter?.businessUnit) {
      filteredBookings = filteredBookings.filter(booking => booking.businessUnit === filter.businessUnit);
    }
    if (filter?.customerId) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.customerInfo.phone === filter.customerId || 
        booking.customerInfo.email === filter.customerId
      );
    }
    if (filter?.dateFrom) {
      filteredBookings = filteredBookings.filter(booking => 
        new Date(booking.checkIn) >= new Date(filter.dateFrom!)
      );
    }
    if (filter?.dateTo) {
      filteredBookings = filteredBookings.filter(booking => 
        new Date(booking.checkOut) <= new Date(filter.dateTo!)
      );
    }

    return filteredBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getBookingById(id: string): Booking | null {
    return this.bookings.find(booking => booking.id === id) || null;
  }

  public updateBookingStatus(id: string, status: Booking['status']): boolean {
    const booking = this.getBookingById(id);
    if (booking) {
      booking.status = status;
      booking.updatedAt = new Date().toISOString();
      
      // Update resource status if needed
      if (status === 'confirmed' && booking.type === 'HOTEL_ROOM') {
        this.updateRoomStatus(booking.resourceId, 'reserved');
      } else if (status === 'checked_in' && booking.type === 'HOTEL_ROOM') {
        this.updateRoomStatus(booking.resourceId, 'occupied');
      } else if (status === 'checked_out' && booking.type === 'HOTEL_ROOM') {
        this.updateRoomStatus(booking.resourceId, 'available');
      } else if (status === 'confirmed' && booking.type === 'MARRIAGE_GARDEN') {
        this.updateGardenStatus(booking.resourceId, 'booked');
      } else if (status === 'cancelled') {
        if (booking.type === 'HOTEL_ROOM') {
          this.updateRoomStatus(booking.resourceId, 'available');
        } else if (booking.type === 'MARRIAGE_GARDEN') {
          this.updateGardenStatus(booking.resourceId, 'available');
        }
      }
      
      return true;
    }
    return false;
  }

  public updatePaymentStatus(id: string, paymentStatus: Booking['paymentStatus']): boolean {
    const booking = this.getBookingById(id);
    if (booking) {
      booking.paymentStatus = paymentStatus;
      booking.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // Pricing
  public calculateRoomPrice(
    roomId: string,
    checkIn: string,
    checkOut: string,
    guests: number
  ): number {
    const room = this.getRoomById(roomId);
    if (!room) return 0;

    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );

    let basePrice = room.basePrice * nights;

    // Add guest charges if exceeding capacity
    if (guests > room.capacity) {
      const extraGuests = guests - room.capacity;
      basePrice += extraGuests * 25 * nights; // $25 per extra guest per night
    }

    // Weekend rates
    const checkInDate = new Date(checkIn);
    if (checkInDate.getDay() === 5 || checkInDate.getDay() === 6) { // Friday or Saturday
      basePrice *= 1.2; // 20% weekend surcharge
    }

    return Math.round(basePrice);
  }

  public calculateGardenPrice(
    gardenId: string,
    date: string,
    guests: number
  ): number {
    const garden = this.getGardenById(gardenId);
    if (!garden) return 0;

    let basePrice = garden.basePrice;

    // Seasonal pricing
    const bookingDate = new Date(date);
    const month = bookingDate.getMonth();
    
    // Peak season (December, January, February) - 30% surcharge
    if (month >= 11 || month <= 1) {
      basePrice *= 1.3;
    }
    
    // Monsoon season (July, August, September) - 20% discount
    if (month >= 6 && month <= 8) {
      basePrice *= 0.8;
    }

    // Guest capacity surcharge
    if (guests > garden.capacity * 0.8) {
      basePrice *= 1.1; // 10% surcharge for high occupancy
    }

    return Math.round(basePrice);
  }

  // Booking Rules
  public getRules(type: keyof BookingType, businessUnit: 'hotel' | 'garden'): BookingRule[] {
    return this.rules.filter(rule => rule.type === type && rule.businessUnit === businessUnit);
  }

  public validateBooking(
    type: keyof BookingType,
    businessUnit: 'hotel' | 'garden',
    checkIn: string,
    checkOut?: string
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const rules = this.getRules(type, businessUnit);

    for (const rule of rules) {
      switch (rule.rule) {
        case 'min_days':
          if (checkOut) {
            const days = Math.ceil(
              (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (days < (rule.value as number)) {
              errors.push(`Minimum booking period is ${rule.value} days`);
            }
          }
          break;
        
        case 'max_days':
          if (checkOut) {
            const days = Math.ceil(
              (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (days > (rule.value as number)) {
              errors.push(`Maximum booking period is ${rule.value} days`);
            }
          }
          break;
        
        case 'advance_booking':
          const daysInAdvance = Math.ceil(
            (new Date(checkIn).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysInAdvance < (rule.value as number)) {
            errors.push(`Minimum ${rule.value} days advance booking required`);
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Statistics
  public getBookingStats(
    businessUnit: 'hotel' | 'garden',
    dateFrom?: string,
    dateTo?: string
  ): {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    occupancyRate?: number;
  } {
    const bookings = this.getBookings({
      businessUnit,
      dateFrom,
      dateTo
    });

    const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    const stats: any = {
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: cancelledBookings.length,
      totalRevenue
    };

    // Calculate occupancy rate for hotel
    if (businessUnit === 'hotel') {
      const totalRooms = this.rooms.length;
      const occupiedRooms = this.rooms.filter(r => r.status === 'occupied').length;
      stats.occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    }

    return stats;
  }
}

// Export singleton instance
export const bookingManager = BookingManager.getInstance();

