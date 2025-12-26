export interface GeofenceZone {
  id: string;
  name: string;
  locationId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
  type: 'entry' | 'exit' | 'dwell';
  active: boolean;
  businessHours: {
    [key: string]: { open: string; close: string };
  };
  restrictions: {
    allowedUsers?: string[];
    blockedUsers?: string[];
    maxCapacity?: number;
  };
}

export interface GeofenceEvent {
  id: string;
  zoneId: string;
  userId?: string;
  deviceId?: string;
  eventType: 'entry' | 'exit' | 'dwell_start' | 'dwell_end';
  timestamp: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy: number; // in meters
  duration?: number; // for dwell events, in seconds
}

export interface LocationBasedService {
  id: string;
  name: string;
  type: 'promotion' | 'notification' | 'access_control' | 'automation';
  triggerZones: string[];
  conditions: {
    timeRange?: { start: string; end: string };
    userSegments?: string[];
    minDwellTime?: number; // in seconds
    maxCapacity?: number;
  };
  actions: ServiceAction[];
  active: boolean;
}

export interface ServiceAction {
  type: 'send_notification' | 'apply_discount' | 'grant_access' | 'trigger_workflow' | 'log_event';
  parameters: any;
  delay?: number; // in seconds
}

export interface LocationAnalytics {
  zoneId: string;
  date: string;
  totalEntries: number;
  totalExits: number;
  uniqueVisitors: number;
  averageDwellTime: number; // in minutes
  peakHour: string;
  conversionRate: number;
  revenue: number;
}

class GeofencingManager {
  private static instance: GeofencingManager;
  private zones: Map<string, GeofenceZone> = new Map();
  private events: Map<string, GeofenceEvent> = new Map();
  private services: Map<string, LocationBasedService> = new Map();
  private analytics: Map<string, LocationAnalytics[]> = new Map();
  private watchPositionId: number | null = null;
  private currentPosition: { latitude: number; longitude: number } | null = null;
  private activeDwellTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeZones();
    this.initializeServices();
    this.startTracking();
  }

  static getInstance(): GeofencingManager {
    if (!GeofencingManager.instance) {
      GeofencingManager.instance = new GeofencingManager();
    }
    return GeofencingManager.instance;
  }

  private initializeZones() {
    // Cafe zones
    this.addZone({
      id: 'cafe_main',
      name: 'Cafe Main Area',
      locationId: 'main_cafe',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      radius: 50,
      type: 'entry',
      active: true,
      businessHours: {
        monday: { open: '06:00', close: '22:00' },
        tuesday: { open: '06:00', close: '22:00' },
        wednesday: { open: '06:00', close: '22:00' },
        thursday: { open: '06:00', close: '22:00' },
        friday: { open: '06:00', close: '23:00' },
        saturday: { open: '07:00', close: '23:00' },
        sunday: { open: '07:00', close: '21:00' }
      },
      restrictions: {
        maxCapacity: 50
      }
    });

    this.addZone({
      id: 'cafe_outdoor',
      name: 'Cafe Outdoor Seating',
      locationId: 'main_cafe',
      coordinates: { latitude: 40.7129, longitude: -74.0061 },
      radius: 30,
      type: 'dwell',
      active: true,
      businessHours: {
        monday: { open: '08:00', close: '21:00' },
        tuesday: { open: '08:00', close: '21:00' },
        wednesday: { open: '08:00', close: '21:00' },
        thursday: { open: '08:00', close: '21:00' },
        friday: { open: '08:00', close: '22:00' },
        saturday: { open: '09:00', close: '22:00' },
        sunday: { open: '09:00', close: '20:00' }
      },
      restrictions: {
        maxCapacity: 20
      }
    });

    // Restaurant zones
    this.addZone({
      id: 'restaurant_main',
      name: 'Restaurant Dining Area',
      locationId: 'main_restaurant',
      coordinates: { latitude: 40.7130, longitude: -74.0065 },
      radius: 75,
      type: 'entry',
      active: true,
      businessHours: {
        monday: { open: '11:00', close: '22:00' },
        tuesday: { open: '11:00', close: '22:00' },
        wednesday: { open: '11:00', close: '22:00' },
        thursday: { open: '11:00', close: '22:00' },
        friday: { open: '11:00', close: '23:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '10:00', close: '21:00' }
      },
      restrictions: {
        maxCapacity: 120
      }
    });

    // Hotel zones
    this.addZone({
      id: 'hotel_lobby',
      name: 'Hotel Lobby',
      locationId: 'main_hotel',
      coordinates: { latitude: 40.7134, longitude: -74.0075 },
      radius: 60,
      type: 'entry',
      active: true,
      businessHours: {
        monday: { open: '00:00', close: '24:00' },
        tuesday: { open: '00:00', close: '24:00' },
        wednesday: { open: '00:00', close: '24:00' },
        thursday: { open: '00:00', close: '24:00' },
        friday: { open: '00:00', close: '24:00' },
        saturday: { open: '00:00', close: '24:00' },
        sunday: { open: '00:00', close: '24:00' }
      },
      restrictions: {
        maxCapacity: 200
      }
    });

    // Marriage garden zones
    this.addZone({
      id: 'garden_ceremony',
      name: 'Marriage Garden Ceremony Area',
      locationId: 'main_marriage_garden',
      coordinates: { latitude: 40.7150, longitude: -74.0100 },
      radius: 100,
      type: 'entry',
      active: true,
      businessHours: {
        monday: { open: '09:00', close: '23:00' },
        tuesday: { open: '09:00', close: '23:00' },
        wednesday: { open: '09:00', close: '23:00' },
        thursday: { open: '09:00', close: '23:00' },
        friday: { open: '09:00', close: '24:00' },
        saturday: { open: '09:00', close: '24:00' },
        sunday: { open: '09:00', close: '23:00' }
      },
      restrictions: {
        maxCapacity: 500
      }
    });
  }

  private initializeServices() {
    // Welcome notification service
    this.addService({
      id: 'welcome_notification',
      name: 'Welcome Notification',
      type: 'notification',
      triggerZones: ['cafe_main', 'restaurant_main', 'hotel_lobby'],
      conditions: {
        timeRange: { start: '08:00', end: '22:00' }
      },
      actions: [
        {
          type: 'send_notification',
          parameters: {
            title: 'Welcome to Deora Plaza!',
            message: 'Check out today\'s specials and offers.',
            icon: 'welcome'
          }
        }
      ],
      active: true
    });

    // Dwell time promotion
    this.addService({
      id: 'dwell_promotion',
      name: 'Extended Stay Promotion',
      type: 'promotion',
      triggerZones: ['cafe_outdoor'],
      conditions: {
        minDwellTime: 1800, // 30 minutes
        timeRange: { start: '14:00', end: '18:00' }
      },
      actions: [
        {
          type: 'apply_discount',
          parameters: {
            discount: 10,
            type: 'percentage',
            description: 'Extended Stay Discount'
          },
          delay: 1800 // Apply after 30 minutes
        }
      ],
      active: true
    });

    // Access control for restricted areas
    this.addService({
      id: 'access_control',
      name: 'Staff Access Control',
      type: 'access_control',
      triggerZones: ['hotel_lobby'],
      conditions: {
        userSegments: ['staff', 'management']
      },
      actions: [
        {
          type: 'grant_access',
          parameters: {
            areas: ['kitchen', 'storage', 'office']
          }
        }
      ],
      active: true
    });

    // Peak hour automation
    this.addService({
      id: 'peak_hour_automation',
      name: 'Peak Hour Automation',
      type: 'automation',
      triggerZones: ['restaurant_main'],
      conditions: {
        timeRange: { start: '18:00', end: '21:00' },
        maxCapacity: 100
      },
      actions: [
        {
          type: 'trigger_workflow',
          parameters: {
            workflow: 'increase_staff',
            parameters: { additionalStaff: 2 }
          }
        },
        {
          type: 'send_notification',
          parameters: {
            title: 'Peak Hours',
            message: 'Restaurant is at capacity. Estimated wait time: 15 minutes.',
            target: 'customers'
          }
        }
      ],
      active: true
    });
  }

  private startTracking() {
    if ('geolocation' in navigator) {
      this.watchPositionId = navigator.geolocation.watchPosition(
        (position) => {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          this.checkZoneTransitions();
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }

  private checkZoneTransitions() {
    if (!this.currentPosition) return;

    this.zones.forEach(zone => {
      if (!zone.active) return;

      const isInside = this.isPointInZone(
        this.currentPosition!,
        zone.coordinates,
        zone.radius
      );

      const previousState = this.getUserZoneState(zone.id);
      const currentState = isInside ? 'inside' : 'outside';

      if (previousState !== currentState) {
        if (isInside) {
          this.handleZoneEntry(zone);
        } else {
          this.handleZoneExit(zone);
        }
        this.setUserZoneState(zone.id, currentState);
      }
    });
  }

  private isPointInZone(
    point: { latitude: number; longitude: number },
    center: { latitude: number; longitude: number },
    radius: number
  ): boolean {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point.latitude * Math.PI) / 180;
    const φ2 = (center.latitude * Math.PI) / 180;
    const Δφ = ((center.latitude - point.latitude) * Math.PI) / 180;
    const Δλ = ((center.longitude - point.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance <= radius;
  }

  private handleZoneEntry(zone: GeofenceZone) {
    const event: GeofenceEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      zoneId: zone.id,
      eventType: 'entry',
      timestamp: new Date().toISOString(),
      coordinates: this.currentPosition!,
      accuracy: 10
    };

    this.events.set(event.id, event);

    // Start dwell timer if zone type is dwell
    if (zone.type === 'dwell') {
      this.startDwellTimer(zone);
    }

    // Trigger services
    this.triggerServices(zone.id, 'entry');
  }

  private handleZoneExit(zone: GeofenceZone) {
    const event: GeofenceEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      zoneId: zone.id,
      eventType: 'exit',
      timestamp: new Date().toISOString(),
      coordinates: this.currentPosition!,
      accuracy: 10
    };

    this.events.set(event.id, event);

    // Stop dwell timer
    this.stopDwellTimer(zone.id);

    // Trigger services
    this.triggerServices(zone.id, 'exit');
  }

  private startDwellTimer(zone: GeofenceZone) {
    const timerKey = zone.id;
    
    // Clear existing timer
    this.stopDwellTimer(timerKey);

    const timer = setTimeout(() => {
      this.handleDwellStart(zone);
    }, 30000); // 30 seconds dwell time

    this.activeDwellTimers.set(timerKey, timer);
  }

  private stopDwellTimer(zoneId: string) {
    const timer = this.activeDwellTimers.get(zoneId);
    if (timer) {
      clearTimeout(timer);
      this.activeDwellTimers.delete(zoneId);
    }
  }

  private handleDwellStart(zone: GeofenceZone) {
    const event: GeofenceEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      zoneId: zone.id,
      eventType: 'dwell_start',
      timestamp: new Date().toISOString(),
      coordinates: this.currentPosition!,
      accuracy: 10
    };

    this.events.set(event.id, event);

    // Trigger dwell-specific services
    this.triggerServices(zone.id, 'dwell_start');
  }

  private triggerServices(zoneId: string, eventType: string) {
    this.services.forEach(service => {
      if (!service.active || !service.triggerZones.includes(zoneId)) {
        return;
      }

      // Check conditions
      if (!this.checkServiceConditions(service)) {
        return;
      }

      // Execute actions
      service.actions.forEach(action => {
        this.executeAction(action, service);
      });
    });
  }

  private checkServiceConditions(service: LocationBasedService): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // Check time range
    if (service.conditions.timeRange) {
      const { start, end } = service.conditions.timeRange;
      if (currentTime < start || currentTime > end) {
        return false;
      }
    }

    // Check user segments (simplified - would need actual user data)
    if (service.conditions.userSegments) {
      // In real implementation, check if current user belongs to segments
      // For now, assume all users are valid
    }

    return true;
  }

  private executeAction(action: ServiceAction, service: LocationBasedService) {
    const delay = action.delay || 0;

    setTimeout(() => {
      switch (action.type) {
        case 'send_notification':
          console.log(`Notification: ${action.parameters.title} - ${action.parameters.message}`);
          break;
        case 'apply_discount':
          console.log(`Discount applied: ${action.parameters.discount}% ${action.parameters.description}`);
          break;
        case 'grant_access':
          console.log(`Access granted to: ${action.parameters.areas.join(', ')}`);
          break;
        case 'trigger_workflow':
          console.log(`Workflow triggered: ${action.parameters.workflow}`);
          break;
        case 'log_event':
          console.log(`Event logged: ${JSON.stringify(action.parameters)}`);
          break;
      }
    }, delay * 1000);
  }

  private getUserZoneState(zoneId: string): string {
    return localStorage.getItem(`zone_state_${zoneId}`) || 'outside';
  }

  private setUserZoneState(zoneId: string, state: string) {
    localStorage.setItem(`zone_state_${zoneId}`, state);
  }

  private addZone(zone: GeofenceZone): string {
    const id = zone.name.toLowerCase().replace(/\s+/g, '_');
    const newZone: GeofenceZone = { ...zone, id };
    this.zones.set(id, newZone);
    return id;
  }

  getZone(id: string): GeofenceZone | undefined {
    return this.zones.get(id);
  }

  getAllZones(): GeofenceZone[] {
    return Array.from(this.zones.values());
  }

  getZonesByLocation(locationId: string): GeofenceZone[] {
    return Array.from(this.zones.values()).filter(zone => zone.locationId === locationId);
  }

  updateZone(id: string, updates: Partial<GeofenceZone>): boolean {
    const zone = this.zones.get(id);
    if (!zone) return false;

    Object.assign(zone, updates);
    return true;
  }

  deleteZone(id: string): boolean {
    return this.zones.delete(id);
  }

  private addService(service: LocationBasedService): string {
    const id = service.name.toLowerCase().replace(/\s+/g, '_');
    const newService: LocationBasedService = { ...service, id };
    this.services.set(id, newService);
    return id;
  }

  getService(id: string): LocationBasedService | undefined {
    return this.services.get(id);
  }

  getAllServices(): LocationBasedService[] {
    return Array.from(this.services.values());
  }

  updateService(id: string, updates: Partial<LocationBasedService>): boolean {
    const service = this.services.get(id);
    if (!service) return false;

    Object.assign(service, updates);
    return true;
  }

  deleteService(id: string): boolean {
    return this.services.delete(id);
  }

  getEvents(zoneId?: string, limit?: number): GeofenceEvent[] {
    let events = Array.from(this.events.values());
    
    if (zoneId) {
      events = events.filter(event => event.zoneId === zoneId);
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (limit) {
      events = events.slice(0, limit);
    }

    return events;
  }

  generateZoneAnalytics(zoneId: string, date: string): LocationAnalytics {
    const events = this.getEvents(zoneId).filter(event => 
      event.timestamp.startsWith(date)
    );

    const entries = events.filter(e => e.eventType === 'entry');
    const exits = events.filter(e => e.eventType === 'exit');
    const dwellStarts = events.filter(e => e.eventType === 'dwell_start');

    const uniqueVisitors = new Set(
      events.filter(e => e.userId).map(e => e.userId)
    ).size;

    // Calculate average dwell time
    let totalDwellTime = 0;
    let dwellCount = 0;

    dwellStarts.forEach(dwellStart => {
      const correspondingExit = exits.find(exit => 
        exit.userId === dwellStart.userId && 
        new Date(exit.timestamp) > new Date(dwellStart.timestamp)
      );
      
      if (correspondingExit) {
        totalDwellTime += new Date(correspondingExit.timestamp).getTime() - new Date(dwellStart.timestamp).getTime();
        dwellCount++;
      }
    });

    const averageDwellTime = dwellCount > 0 ? totalDwellTime / dwellCount / 60000 : 0; // Convert to minutes

    // Find peak hour
    const hourlyEntries = new Array(24).fill(0);
    entries.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      hourlyEntries[hour]++;
    });

    const peakHour = hourlyEntries.indexOf(Math.max(...hourlyEntries));

    const analytics: LocationAnalytics = {
      zoneId,
      date,
      totalEntries: entries.length,
      totalExits: exits.length,
      uniqueVisitors,
      averageDwellTime,
      peakHour: `${peakHour}:00`,
      conversionRate: 0, // Would need business data
      revenue: 0 // Would need business data
    };

    // Store analytics
    if (!this.analytics.has(zoneId)) {
      this.analytics.set(zoneId, []);
    }
    this.analytics.get(zoneId)!.push(analytics);

    return analytics;
  }

  getZoneAnalytics(zoneId: string, days: number = 30): LocationAnalytics[] {
    const analytics = this.analytics.get(zoneId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return analytics
      .filter(a => new Date(a.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getCurrentPosition(): { latitude: number; longitude: number } | null {
    return this.currentPosition;
  }

  stopTracking(): void {
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }

    // Clear all dwell timers
    this.activeDwellTimers.forEach(timer => clearTimeout(timer));
    this.activeDwellTimers.clear();
  }

  // Mock data for demonstration
  loadMockData() {
    console.log('Geofencing system initialized with mock data');
  }
}

export const geofencingManager = GeofencingManager.getInstance();

// Initialize mock data
geofencingManager.loadMockData();

