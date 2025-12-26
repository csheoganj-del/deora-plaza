// Event Management System for Marriage Garden and Event Hall Bookings
export interface EventType {
  WEDDING: 'wedding';
  RECEPTION: 'reception';
  ENGAGEMENT: 'engagement';
  BIRTHDAY: 'birthday';
  CORPORATE: 'corporate';
  CONFERENCE: 'conference';
  SEMINAR: 'seminar';
  WORKSHOP: 'workshop';
  EXHIBITION: 'exhibition';
  CULTURAL: 'cultural';
  RELIGIOUS: 'religious';
  SOCIAL: 'social';
}

export interface EventPackage {
  id: string;
  name: string;
  type: keyof EventType;
  description: string;
  basePrice: number;
  duration: number; // in hours
  capacity: number;
  includes: string[];
  excludes: string[];
  isActive: boolean;
  businessUnit: 'garden' | 'hall';
}

export interface EventService {
  id: string;
  name: string;
  type: 'catering' | 'decoration' | 'photography' | 'music' | 'lighting' | 'transport' | 'security' | 'cleaning';
  description: string;
  basePrice: number;
  unitType: 'fixed' | 'per_person' | 'per_hour';
  unitValue: number;
  isActive: boolean;
}

export interface EventStaff {
  id: string;
  name: string;
  role: 'coordinator' | 'manager' | 'supervisor' | 'technician' | 'support';
  phone: string;
  email: string;
  skills: string[];
  hourlyRate: number;
  availability: {
    date: string;
    shifts: string[]; // morning, evening, night
  }[];
  isActive: boolean;
}

export interface Event {
  id: string;
  title: string;
  type: keyof EventType;
  description: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    company?: string;
  };
  venue: {
    id: string;
    name: string;
    type: 'garden' | 'hall';
    capacity: number;
  };
  date: string;
  startTime: string;
  endTime: string;
  expectedGuests: number;
  packages: {
    packageId: string;
    quantity: number;
    price: number;
  }[];
  services: {
    serviceId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  staff: {
    staffId: string;
    role: string;
    hours: number;
    rate: number;
    totalCost: number;
  }[];
  totalAmount: number;
  status: 'inquiry' | 'confirmed' | 'planning' | 'ongoing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  specialRequirements?: string;
  timeline: {
    milestone: string;
    date: string;
    completed: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedCoordinator?: string;
}

export interface EventTemplate {
  id: string;
  name: string;
  eventType: keyof EventType;
  description: string;
  duration: number;
  defaultPackages: string[];
  defaultServices: string[];
  requiredStaff: {
    role: string;
    count: number;
  }[];
  timeline: {
    milestone: string;
    daysBeforeEvent: number;
  }[];
  isActive: boolean;
}

export class EventManager {
  private static instance: EventManager;
  private events: Event[] = [];
  private packages: EventPackage[] = [];
  private services: EventService[] = [];
  private staff: EventStaff[] = [];
  private templates: EventTemplate[] = [];

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  private initializeMockData() {
    // Mock packages
    this.packages = [
      {
        id: 'pkg_wedding_basic',
        name: 'Basic Wedding Package',
        type: 'WEDDING',
        description: 'Essential wedding services for intimate ceremonies',
        basePrice: 5000,
        duration: 8,
        capacity: 100,
        includes: ['Venue Decoration', 'Basic Lighting', 'Sound System', 'Cleaning'],
        excludes: ['Catering', 'Photography', 'Transport'],
        isActive: true,
        businessUnit: 'garden'
      },
      {
        id: 'pkg_wedding_premium',
        name: 'Premium Wedding Package',
        type: 'WEDDING',
        description: 'Complete wedding solution with all premium services',
        basePrice: 15000,
        duration: 12,
        capacity: 300,
        includes: ['Venue Decoration', 'Premium Lighting', 'Sound System', 'Catering', 'Photography', 'Transport', 'Cleaning'],
        excludes: ['Custom Requirements'],
        isActive: true,
        businessUnit: 'garden'
      },
      {
        id: 'pkg_corporate_basic',
        name: 'Corporate Event Package',
        type: 'CORPORATE',
        description: 'Professional corporate event management',
        basePrice: 3000,
        duration: 6,
        capacity: 150,
        includes: ['Venue Setup', 'Projector', 'Sound System', 'Basic Catering'],
        excludes: ['Accommodation', 'Transport'],
        isActive: true,
        businessUnit: 'hall'
      }
    ];

    // Mock services
    this.services = [
      {
        id: 'svc_catering_basic',
        name: 'Basic Catering Service',
        type: 'catering',
        description: 'Standard buffet catering service',
        basePrice: 50,
        unitType: 'per_person',
        unitValue: 1,
        isActive: true
      },
      {
        id: 'svc_catering_premium',
        name: 'Premium Catering Service',
        type: 'catering',
        description: 'Gourmet dining experience with multiple cuisines',
        basePrice: 120,
        unitType: 'per_person',
        unitValue: 1,
        isActive: true
      },
      {
        id: 'svc_decoration_floral',
        name: 'Floral Decoration',
        type: 'decoration',
        description: 'Beautiful floral arrangements and decorations',
        basePrice: 1000,
        unitType: 'fixed',
        unitValue: 1,
        isActive: true
      },
      {
        id: 'svc_photography_basic',
        name: 'Basic Photography',
        type: 'photography',
        description: 'Professional photography with basic package',
        basePrice: 500,
        unitType: 'per_hour',
        unitValue: 1,
        isActive: true
      }
    ];

    // Mock staff
    this.staff = [
      {
        id: 'staff_coordinator_1',
        name: 'Sarah Johnson',
        role: 'coordinator',
        phone: '+1234567890',
        email: 'sarah.j@deora.com',
        skills: ['Event Planning', 'Coordination', 'Customer Service'],
        hourlyRate: 25,
        availability: [],
        isActive: true
      },
      {
        id: 'staff_manager_1',
        name: 'Michael Chen',
        role: 'manager',
        phone: '+1234567891',
        email: 'michael.c@deora.com',
        skills: ['Team Management', 'Operations', 'Budget Control'],
        hourlyRate: 35,
        availability: [],
        isActive: true
      }
    ];

    // Mock templates
    this.templates = [
      {
        id: 'template_wedding_standard',
        name: 'Standard Wedding Template',
        eventType: 'WEDDING',
        description: 'Standard wedding event timeline and requirements',
        duration: 8,
        defaultPackages: ['pkg_wedding_basic'],
        defaultServices: ['svc_catering_basic', 'svc_decoration_floral'],
        requiredStaff: [
          { role: 'coordinator', count: 1 },
          { role: 'supervisor', count: 1 }
        ],
        timeline: [
          { milestone: 'Initial Consultation', daysBeforeEvent: 90 },
          { milestone: 'Venue Booking', daysBeforeEvent: 60 },
          { milestone: 'Final Planning', daysBeforeEvent: 30 },
          { milestone: 'Setup Preparation', daysBeforeEvent: 7 },
          { milestone: 'Event Day', daysBeforeEvent: 0 }
        ],
        isActive: true
      }
    ];
  }

  // Package Management
  public getPackages(type?: keyof EventType, businessUnit?: 'garden' | 'hall'): EventPackage[] {
    let filteredPackages = this.packages;

    if (type) {
      filteredPackages = filteredPackages.filter(pkg => pkg.type === type);
    }
    if (businessUnit) {
      filteredPackages = filteredPackages.filter(pkg => pkg.businessUnit === businessUnit);
    }

    return filteredPackages.filter(pkg => pkg.isActive);
  }

  public getPackageById(id: string): EventPackage | null {
    return this.packages.find(pkg => pkg.id === id) || null;
  }

  // Service Management
  public getServices(type?: string): EventService[] {
    let filteredServices = this.services;

    if (type) {
      filteredServices = filteredServices.filter(service => service.type === type);
    }

    return filteredServices.filter(service => service.isActive);
  }

  public getServiceById(id: string): EventService | null {
    return this.services.find(service => service.id === id) || null;
  }

  // Staff Management
  public getStaff(role?: string, availableDate?: string): EventStaff[] {
    let filteredStaff = this.staff;

    if (role) {
      filteredStaff = filteredStaff.filter(staff => staff.role === role);
    }

    if (availableDate) {
      filteredStaff = filteredStaff.filter(staff => 
        staff.availability.some(avail => 
          avail.date === availableDate && avail.shifts.length > 0
        )
      );
    }

    return filteredStaff.filter(staff => staff.isActive);
  }

  public getStaffById(id: string): EventStaff | null {
    return this.staff.find(staff => staff.id === id) || null;
  }

  // Event Management
  public createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Event {
    const event: Event = {
      ...eventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.events.push(event);
    return event;
  }

  public getEvents(filter?: {
    type?: keyof EventType;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    customerId?: string;
    coordinator?: string;
  }): Event[] {
    let filteredEvents = this.events;

    if (filter?.type) {
      filteredEvents = filteredEvents.filter(event => event.type === filter.type);
    }
    if (filter?.status) {
      filteredEvents = filteredEvents.filter(event => event.status === filter.status);
    }
    if (filter?.dateFrom) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) >= new Date(filter.dateFrom!)
      );
    }
    if (filter?.dateTo) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) <= new Date(filter.dateTo!)
      );
    }
    if (filter?.customerId) {
      filteredEvents = filteredEvents.filter(event => 
        event.customerInfo.phone === filter.customerId || 
        event.customerInfo.email === filter.customerId
      );
    }
    if (filter?.coordinator) {
      filteredEvents = filteredEvents.filter(event => 
        event.assignedCoordinator === filter.coordinator
      );
    }

    return filteredEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getEventById(id: string): Event | null {
    return this.events.find(event => event.id === id) || null;
  }

  public updateEventStatus(id: string, status: Event['status']): boolean {
    const event = this.getEventById(id);
    if (event) {
      event.status = status;
      event.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  public updatePaymentStatus(id: string, paymentStatus: Event['paymentStatus']): boolean {
    const event = this.getEventById(id);
    if (event) {
      event.paymentStatus = paymentStatus;
      event.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  public assignCoordinator(eventId: string, staffId: string): boolean {
    const event = this.getEventById(eventId);
    const staff = this.getStaffById(staffId);
    
    if (event && staff && staff.role === 'coordinator') {
      event.assignedCoordinator = staffId;
      event.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // Pricing Calculator
  public calculateEventPrice(
    packages: { packageId: string; quantity: number }[],
    services: { serviceId: string; quantity: number }[],
    staff: { staffId: string; hours: number }[],
    expectedGuests: number
  ): number {
    let totalPrice = 0;

    // Calculate package prices
    for (const pkg of packages) {
      const packageData = this.getPackageById(pkg.packageId);
      if (packageData) {
        totalPrice += packageData.basePrice * pkg.quantity;
      }
    }

    // Calculate service prices
    for (const service of services) {
      const serviceData = this.getServiceById(service.serviceId);
      if (serviceData) {
        let servicePrice = 0;
        switch (serviceData.unitType) {
          case 'fixed':
            servicePrice = serviceData.basePrice * service.quantity;
            break;
          case 'per_person':
            servicePrice = serviceData.basePrice * expectedGuests * service.quantity;
            break;
          case 'per_hour':
            servicePrice = serviceData.basePrice * service.quantity;
            break;
        }
        totalPrice += servicePrice;
      }
    }

    // Calculate staff costs
    for (const staffMember of staff) {
      const staffData = this.getStaffById(staffMember.staffId);
      if (staffData) {
        totalPrice += staffData.hourlyRate * staffMember.hours;
      }
    }

    return totalPrice;
  }

  // Template Management
  public getTemplates(eventType?: keyof EventType): EventTemplate[] {
    let filteredTemplates = this.templates;

    if (eventType) {
      filteredTemplates = filteredTemplates.filter(template => template.eventType === eventType);
    }

    return filteredTemplates.filter(template => template.isActive);
  }

  public getTemplateById(id: string): EventTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  public createEventFromTemplate(
    templateId: string,
    eventData: Omit<Event, 'id' | 'packages' | 'services' | 'staff' | 'timeline' | 'createdAt' | 'updatedAt'>
  ): Event {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Calculate packages
    const packages = template.defaultPackages.map(pkgId => {
      const pkgData = this.getPackageById(pkgId);
      return pkgData ? {
        packageId: pkgId,
        quantity: 1,
        price: pkgData.basePrice
      } : null;
    }).filter(Boolean) as { packageId: string; quantity: number; price: number }[];

    // Calculate services
    const services = template.defaultServices.map(svcId => {
      const svcData = this.getServiceById(svcId);
      return svcData ? {
        serviceId: svcId,
        quantity: 1,
        unitPrice: svcData.basePrice,
        totalPrice: svcData.basePrice
      } : null;
    }).filter(Boolean) as { serviceId: string; quantity: number; unitPrice: number; totalPrice: number }[];

    // Calculate staff
    const staff = template.requiredStaff.map(req => {
      const availableStaff = this.getStaff(req.role).slice(0, req.count);
      return availableStaff.map(s => ({
        staffId: s.id,
        role: s.role,
        hours: template.duration,
        rate: s.hourlyRate,
        totalCost: s.hourlyRate * template.duration
      }));
    }).flat();

    // Generate timeline
    const eventDate = new Date(eventData.date);
    const timeline = template.timeline.map(milestone => ({
      milestone: milestone.milestone,
      date: new Date(eventDate.getTime() - (milestone.daysBeforeEvent * 24 * 60 * 60 * 1000)).toISOString(),
      completed: false
    }));

    const totalAmount = this.calculateEventPrice(
      packages.map(p => ({ packageId: p.packageId, quantity: p.quantity })),
      services.map(s => ({ serviceId: s.serviceId, quantity: s.quantity })),
      staff.map(s => ({ staffId: s.staffId, hours: s.hours })),
      eventData.expectedGuests
    );

    return this.createEvent({
      ...eventData,
      packages,
      services,
      staff,
      totalAmount,
      timeline
    });
  }

  // Availability Check
  public checkVenueAvailability(
    venueId: string,
    date: string,
    startTime: string,
    endTime: string
  ): boolean {
    const conflictingEvents = this.events.filter(event => 
      event.venue.id === venueId &&
      event.status !== 'cancelled' &&
      event.date === date &&
      (
        (event.startTime <= startTime && event.endTime > startTime) ||
        (event.startTime < endTime && event.endTime >= endTime) ||
        (event.startTime >= startTime && event.endTime <= endTime)
      )
    );

    return conflictingEvents.length === 0;
  }

  public checkStaffAvailability(
    staffId: string,
    date: string,
    startTime: string,
    endTime: string
  ): boolean {
    const conflictingEvents = this.events.filter(event =>
      event.staff.some(s => s.staffId === staffId) &&
      event.status !== 'cancelled' &&
      event.date === date &&
      (
        (event.startTime <= startTime && event.endTime > startTime) ||
        (event.startTime < endTime && event.endTime >= endTime) ||
        (event.startTime >= startTime && event.endTime <= endTime)
      )
    );

    return conflictingEvents.length === 0;
  }

  // Statistics
  public getEventStats(dateFrom?: string, dateTo?: string): {
    totalEvents: number;
    confirmedEvents: number;
    completedEvents: number;
    cancelledEvents: number;
    totalRevenue: number;
    averageEventValue: number;
    eventsByType: Record<string, number>;
    upcomingEvents: number;
  } {
    const events = this.getEvents({ dateFrom, dateTo });
    const confirmedEvents = events.filter(e => e.status === 'confirmed' || e.status === 'planning' || e.status === 'ongoing');
    const completedEvents = events.filter(e => e.status === 'completed');
    const cancelledEvents = events.filter(e => e.status === 'cancelled');
    const upcomingEvents = events.filter(e => new Date(e.date) > new Date() && e.status !== 'cancelled');

    const totalRevenue = confirmedEvents.reduce((sum, event) => sum + event.totalAmount, 0);
    const averageEventValue = confirmedEvents.length > 0 ? totalRevenue / confirmedEvents.length : 0;

    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: events.length,
      confirmedEvents: confirmedEvents.length,
      completedEvents: completedEvents.length,
      cancelledEvents: cancelledEvents.length,
      totalRevenue,
      averageEventValue,
      eventsByType,
      upcomingEvents: upcomingEvents.length
    };
  }
}

// Export singleton instance
export const eventManager = EventManager.getInstance();

