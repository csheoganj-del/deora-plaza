// Hotel Management System - Check-in/Check-out and Room Management
export interface RoomStatus {
  AVAILABLE: 'available';
  OCCUPIED: 'occupied';
  RESERVED: 'reserved';
  MAINTENANCE: 'maintenance';
  CLEANING: 'cleaning';
  OUT_OF_ORDER: 'out_of_order';
}

export interface HousekeepingStatus {
  CLEAN: 'clean';
  DIRTY: 'dirty';
  IN_PROGRESS: 'in_progress';
  NEEDS_INSPECTION: 'needs_inspection';
}

export interface RoomType {
  id: string;
  name: string;
  category: 'standard' | 'deluxe' | 'suite' | 'presidential';
  basePrice: number;
  maxOccupancy: number;
  bedConfiguration: string;
  size: number; // in sq ft
  amenities: string[];
  features: string[];
  images: string[];
  description: string;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  typeId: string;
  status: keyof RoomStatus;
  housekeeping: keyof HousekeepingStatus;
  currentOccupancy: number;
  maxOccupancy: number;
  lastCleaned?: string;
  nextCleaning?: string;
  maintenanceNotes?: string;
  notes?: string;
  isActive: boolean;
}

export interface CheckIn {
  id: string;
  bookingId: string;
  roomId: string;
  guestInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    idType: string;
    idNumber: string;
  };
  checkInTime: string;
  expectedCheckOut: string;
  actualCheckOut?: string;
  adults: number;
  children: number;
  totalGuests: number;
  roomRate: number;
  additionalCharges: {
    type: string;
    description: string;
    amount: number;
    date: string;
  }[];
  payments: {
    amount: number;
    method: string;
    date: string;
    reference?: string;
  }[];
  status: 'active' | 'checked_out' | 'no_show';
  specialRequests?: string;
  checkedInBy: string;
  checkedOutBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  type: 'cleaning' | 'maintenance' | 'inspection' | 'deep_clean';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  scheduledTime: string;
  completedTime?: string;
  notes?: string;
  createdBy: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomInventory {
  roomId: string;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    condition: 'good' | 'fair' | 'poor' | 'missing';
    lastChecked: string;
  }[];
  lastUpdated: string;
  updatedBy: string;
}

export interface HotelStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  reservedRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  averageDailyRate: number;
  revenuePerAvailableRoom: number;
  totalRevenue: number;
  checkInsToday: number;
  checkOutsToday: number;
  arrivalsToday: number;
  departuresToday: number;
}

export class HotelManager {
  private static instance: HotelManager;
  private rooms: Room[] = [];
  private roomTypes: RoomType[] = [];
  private checkIns: CheckIn[] = [];
  private housekeepingTasks: HousekeepingTask[] = [];
  private roomInventory: RoomInventory[] = [];

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): HotelManager {
    if (!HotelManager.instance) {
      HotelManager.instance = new HotelManager();
    }
    return HotelManager.instance;
  }

  private initializeMockData() {
    // Initialize empty arrays - data should be loaded from database
    this.roomTypes = [];
    this.rooms = [];
    this.bookings = [];
    this.guests = [];
  }
      {
        id: 'type_standard',
        name: 'Standard Room',
        category: 'standard',
        basePrice: 80,
        maxOccupancy: 2,
        bedConfiguration: '1 Queen Bed',
        size: 250,
        amenities: ['AC', 'TV', 'WiFi', 'Mini Fridge', 'Safe'],
        features: ['City View', 'Work Desk'],
        images: [],
        description: 'Comfortable standard room with modern amenities'
      },
      {
        id: 'type_deluxe',
        name: 'Deluxe Room',
        category: 'deluxe',
        basePrice: 120,
        maxOccupancy: 3,
        bedConfiguration: '1 King Bed',
        size: 350,
        amenities: ['AC', 'TV', 'WiFi', 'Mini Fridge', 'Safe', 'Coffee Maker'],
        features: ['City View', 'Balcony', 'Work Desk', 'Sitting Area'],
        images: [],
        description: 'Spacious deluxe room with premium amenities'
      },
      {
        id: 'type_suite',
        name: 'Executive Suite',
        category: 'suite',
        basePrice: 200,
        maxOccupancy: 4,
        bedConfiguration: '1 King Bed + 1 Sofa Bed',
        size: 550,
        amenities: ['AC', 'TV', 'WiFi', 'Mini Fridge', 'Safe', 'Coffee Maker', 'Kitchenette'],
        features: ['City View', 'Balcony', 'Living Room', 'Work Desk', 'Dining Area'],
        images: [],
        description: 'Luxury suite with separate living area'
      }
    ];

    // Mock rooms
    this.rooms = [
      {
        id: 'room_101',
        number: '101',
        floor: 1,
        typeId: 'type_standard',
        status: 'AVAILABLE',
        housekeeping: 'CLEAN',
        currentOccupancy: 0,
        maxOccupancy: 2,
        lastCleaned: new Date().toISOString(),
        isActive: true
      },
      {
        id: 'room_102',
        number: '102',
        floor: 1,
        typeId: 'type_standard',
        status: 'OCCUPIED',
        housekeeping: 'DIRTY',
        currentOccupancy: 2,
        maxOccupancy: 2,
        isActive: true
      },
      {
        id: 'room_201',
        number: '201',
        floor: 2,
        typeId: 'type_deluxe',
        status: 'AVAILABLE',
        housekeeping: 'CLEAN',
        currentOccupancy: 0,
        maxOccupancy: 3,
        lastCleaned: new Date().toISOString(),
        isActive: true
      },
      {
        id: 'room_301',
        number: '301',
        floor: 3,
        typeId: 'type_suite',
        status: 'RESERVED',
        housekeeping: 'CLEAN',
        currentOccupancy: 0,
        maxOccupancy: 4,
        lastCleaned: new Date().toISOString(),
        isActive: true
      },
      {
        id: 'room_303',
        number: '303',
        floor: 3,
        typeId: 'type_suite',
        status: 'MAINTENANCE',
        housekeeping: 'DIRTY',
        currentOccupancy: 0,
        maxOccupancy: 4,
        maintenanceNotes: 'AC repair in progress',
        isActive: true
      }
    ];

    // Mock check-ins
    this.checkIns = [
      {
        id: 'checkin_1',
        bookingId: 'booking_1',
        roomId: 'room_102',
        guestInfo: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '+1234567890',
          address: '123 Main St, City, State',
          idType: 'Driver License',
          idNumber: 'DL123456789'
        },
        checkInTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        expectedCheckOut: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // tomorrow
        adults: 2,
        children: 0,
        totalGuests: 2,
        roomRate: 80,
        additionalCharges: [],
        payments: [
          {
            amount: 160,
            method: 'Credit Card',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            reference: 'CC123456'
          }
        ],
        status: 'active',
        checkedInBy: 'staff_1',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Mock housekeeping tasks
    this.housekeepingTasks = [
      {
        id: 'task_1',
        roomId: 'room_102',
        type: 'cleaning',
        priority: 'high',
        status: 'pending',
        scheduledTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
        notes: 'Guest checkout cleaning needed',
        createdBy: 'staff_1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task_2',
        roomId: 'room_303',
        type: 'maintenance',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: 'maintenance_1',
        scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        notes: 'AC unit repair',
        createdBy: 'staff_1',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  // Room Management
  public getRooms(filter?: {
    status?: keyof RoomStatus;
    floor?: number;
    typeId?: string;
    housekeeping?: keyof HousekeepingStatus;
  }): Room[] {
    let filteredRooms = this.rooms;

    if (filter?.status) {
      filteredRooms = filteredRooms.filter(room => room.status === filter.status);
    }
    if (filter?.floor) {
      filteredRooms = filteredRooms.filter(room => room.floor === filter.floor);
    }
    if (filter?.typeId) {
      filteredRooms = filteredRooms.filter(room => room.typeId === filter.typeId);
    }
    if (filter?.housekeeping) {
      filteredRooms = filteredRooms.filter(room => room.housekeeping === filter.housekeeping);
    }

    return filteredRooms.filter(room => room.isActive);
  }

  public getRoomById(id: string): Room | null {
    return this.rooms.find(room => room.id === id) || null;
  }

  public getRoomByNumber(number: string): Room | null {
    return this.rooms.find(room => room.number === number) || null;
  }

  public updateRoomStatus(id: string, status: keyof RoomStatus): boolean {
    const room = this.getRoomById(id);
    if (room) {
      room.status = status;
      return true;
    }
    return false;
  }

  public updateHousekeepingStatus(id: string, status: keyof HousekeepingStatus): boolean {
    const room = this.getRoomById(id);
    if (room) {
      room.housekeeping = status;
      if (status === 'CLEAN') {
        room.lastCleaned = new Date().toISOString();
      }
      return true;
    }
    return false;
  }

  // Room Types Management
  public getRoomTypes(): RoomType[] {
    return this.roomTypes;
  }

  public getRoomTypeById(id: string): RoomType | null {
    return this.roomTypes.find(type => type.id === id) || null;
  }

  // Check-in/Check-out Management
  public checkIn(checkInData: Omit<CheckIn, 'id' | 'createdAt' | 'updatedAt'>): CheckIn {
    const room = this.getRoomById(checkInData.roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.status !== 'AVAILABLE' && room.status !== 'RESERVED') {
      throw new Error('Room is not available for check-in');
    }

    const checkIn: CheckIn = {
      ...checkInData,
      id: `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.checkIns.push(checkIn);
    
    // Update room status
    this.updateRoomStatus(checkInData.roomId, 'OCCUPIED');
    this.updateHousekeepingStatus(checkInData.roomId, 'DIRTY');
    room.currentOccupancy = checkInData.totalGuests;

    return checkIn;
  }

  public checkOut(checkInId: string, finalCharges?: { type: string; description: string; amount: number }[]): CheckIn | null {
    const checkIn = this.getCheckInById(checkInId);
    if (!checkIn) {
      return null;
    }

    // Update check-out information
    checkIn.actualCheckOut = new Date().toISOString();
    checkIn.status = 'checked_out';
    checkIn.checkedOutBy = 'staff_1'; // This would come from auth
    checkIn.updatedAt = new Date().toISOString();

    // Add final charges if provided
    if (finalCharges) {
      checkIn.additionalCharges.push(...finalCharges.map(charge => ({
        ...charge,
        date: new Date().toISOString()
      })));
    }

    // Update room status
    const room = this.getRoomById(checkIn.roomId);
    if (room) {
      this.updateRoomStatus(checkIn.roomId, 'CLEANING');
      this.updateHousekeepingStatus(checkIn.roomId, 'DIRTY');
      room.currentOccupancy = 0;
      
      // Create housekeeping task
      this.createHousekeepingTask({
        roomId: checkIn.roomId,
        type: 'cleaning',
        priority: 'high',
        status: 'pending',
        scheduledTime: new Date().toISOString(),
        notes: 'Post-checkout cleaning required',
        createdBy: checkIn.checkedOutBy
      });
    }

    return checkIn;
  }

  public getCheckIns(filter?: {
    status?: string;
    roomId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): CheckIn[] {
    let filteredCheckIns = this.checkIns;

    if (filter?.status) {
      filteredCheckIns = filteredCheckIns.filter(checkIn => checkIn.status === filter.status);
    }
    if (filter?.roomId) {
      filteredCheckIns = filteredCheckIns.filter(checkIn => checkIn.roomId === filter.roomId);
    }
    if (filter?.dateFrom) {
      filteredCheckIns = filteredCheckIns.filter(checkIn => 
        new Date(checkIn.checkInTime) >= new Date(filter.dateFrom!)
      );
    }
    if (filter?.dateTo) {
      filteredCheckIns = filteredCheckIns.filter(checkIn => 
        new Date(checkIn.checkInTime) <= new Date(filter.dateTo!)
      );
    }

    return filteredCheckIns.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
  }

  public getCheckInById(id: string): CheckIn | null {
    return this.checkIns.find(checkIn => checkIn.id === id) || null;
  }

  public getActiveCheckIns(): CheckIn[] {
    return this.checkIns.filter(checkIn => checkIn.status === 'active');
  }

  public getCheckInsByRoom(roomId: string): CheckIn[] {
    return this.checkIns.filter(checkIn => checkIn.roomId === roomId);
  }

  // Housekeeping Management
  public createHousekeepingTask(taskData: Omit<HousekeepingTask, 'id' | 'createdAt' | 'updatedAt'>): HousekeepingTask {
    const task: HousekeepingTask = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.housekeepingTasks.push(task);
    return task;
  }

  public getHousekeepingTasks(filter?: {
    roomId?: string;
    status?: string;
    type?: string;
    priority?: string;
    assignedTo?: string;
  }): HousekeepingTask[] {
    let filteredTasks = this.housekeepingTasks;

    if (filter?.roomId) {
      filteredTasks = filteredTasks.filter(task => task.roomId === filter.roomId);
    }
    if (filter?.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filter.status);
    }
    if (filter?.type) {
      filteredTasks = filteredTasks.filter(task => task.type === filter.type);
    }
    if (filter?.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
    }
    if (filter?.assignedTo) {
      filteredTasks = filteredTasks.filter(task => task.assignedTo === filter.assignedTo);
    }

    return filteredTasks.sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }

  public updateHousekeepingTask(id: string, updates: Partial<HousekeepingTask>): boolean {
    const task = this.housekeepingTasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates);
      task.updatedAt = new Date().toISOString();
      
      // Update room housekeeping status if task is completed
      if (updates.status === 'completed' && task.type === 'cleaning') {
        this.updateHousekeepingStatus(task.roomId, 'CLEAN');
        if (this.getRoomById(task.roomId)?.status === 'CLEANING') {
          this.updateRoomStatus(task.roomId, 'AVAILABLE');
        }
      }
      
      return true;
    }
    return false;
  }

  // Availability Management
  public getAvailableRooms(checkIn: string, checkOut: string, occupancy: number): Room[] {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    return this.rooms.filter(room => {
      if (room.status === 'MAINTENANCE' || room.status === 'OUT_OF_ORDER') {
        return false;
      }
      if (room.maxOccupancy < occupancy) {
        return false;
      }
      
      // Check if room is available for the date range
      const conflictingCheckIns = this.checkIns.filter(checkIn => 
        checkIn.roomId === room.id &&
        checkIn.status === 'active' &&
        this.isDateOverlap(
          checkInDate,
          checkOutDate,
          new Date(checkIn.checkInTime),
          new Date(checkIn.expectedCheckOut)
        )
      );
      
      return conflictingCheckIns.length === 0;
    });
  }

  private isDateOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1;
  }

  // Statistics and Reporting
  public getHotelStats(date?: string): HotelStats {
    const targetDate = date ? new Date(date) : new Date();
    const today = targetDate.toISOString().split('T')[0];
    
    const totalRooms = this.rooms.filter(room => room.isActive).length;
    const occupiedRooms = this.rooms.filter(room => room.status === 'OCCUPIED').length;
    const availableRooms = this.rooms.filter(room => room.status === 'AVAILABLE').length;
    const reservedRooms = this.rooms.filter(room => room.status === 'RESERVED').length;
    const maintenanceRooms = this.rooms.filter(room => room.status === 'MAINTENANCE').length;
    
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    
    const activeCheckIns = this.getActiveCheckIns();
    const averageDailyRate = activeCheckIns.length > 0 
      ? activeCheckIns.reduce((sum, checkIn) => sum + checkIn.roomRate, 0) / activeCheckIns.length 
      : 0;
    
    const revenuePerAvailableRoom = availableRooms > 0 ? (averageDailyRate * occupiedRooms) / availableRooms : 0;
    const totalRevenue = activeCheckIns.reduce((sum, checkIn) => sum + checkIn.roomRate, 0);
    
    const todayCheckIns = this.checkIns.filter(checkIn => 
      checkIn.checkInTime.split('T')[0] === today
    );
    const todayCheckOuts = this.checkIns.filter(checkIn => 
      checkIn.actualCheckOut && checkIn.actualCheckOut.split('T')[0] === today
    );
    
    const arrivalsToday = todayCheckIns.length;
    const departuresToday = todayCheckOuts.length;
    const checkInsToday = arrivalsToday;
    const checkOutsToday = departuresToday;

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      reservedRooms,
      maintenanceRooms,
      occupancyRate,
      averageDailyRate,
      revenuePerAvailableRoom,
      totalRevenue,
      checkInsToday,
      checkOutsToday,
      arrivalsToday,
      departuresToday
    };
  }

  // Room Inventory Management
  public updateRoomInventory(roomId: string, items: RoomInventory['items']): boolean {
    const existingInventory = this.roomInventory.find(inv => inv.roomId === roomId);
    
    if (existingInventory) {
      existingInventory.items = items;
      existingInventory.lastUpdated = new Date().toISOString();
      existingInventory.updatedBy = 'staff_1'; // This would come from auth
    } else {
      this.roomInventory.push({
        roomId,
        items,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'staff_1'
      });
    }
    
    return true;
  }

  public getRoomInventory(roomId: string): RoomInventory | null {
    return this.roomInventory.find(inv => inv.roomId === roomId) || null;
  }

  // Guest Management
  public searchGuests(query: string): CheckIn[] {
    const lowerQuery = query.toLowerCase();
    return this.checkIns.filter(checkIn => 
      checkIn.guestInfo.name.toLowerCase().includes(lowerQuery) ||
      checkIn.guestInfo.email.toLowerCase().includes(lowerQuery) ||
      checkIn.guestInfo.phone.includes(query)
    );
  }

  public getGuestHistory(email: string): CheckIn[] {
    return this.checkIns.filter(checkIn => 
      checkIn.guestInfo.email.toLowerCase() === email.toLowerCase()
    ).sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
  }
}

// Export singleton instance
export const hotelManager = HotelManager.getInstance();

