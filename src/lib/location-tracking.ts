export interface Location {
  id: string;
  name: string;
  type: 'cafe' | 'restaurant' | 'bar' | 'hotel' | 'marriage_garden' | 'warehouse' | 'office';
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  region: string;
  timezone: string;
  status: 'active' | 'inactive' | 'maintenance';
  capacity: number;
  currentOccupancy: number;
  businessHours: {
    [key: string]: { open: string; close: string };
  };
  amenities: string[];
  contact: {
    phone: string;
    email: string;
  };
}

export interface LocationTrackingEvent {
  id: string;
  locationId: string;
  userId?: string;
  deviceId?: string;
  eventType: 'entry' | 'exit' | 'check_in' | 'check_out' | 'order_placed' | 'service_used';
  timestamp: string;
  data?: any;
}

export interface Geofence {
  id: string;
  name: string;
  locationId: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  radius: number; // in meters
  type: 'entry' | 'exit' | 'both';
  active: boolean;
  actions: GeofenceAction[];
}

export interface GeofenceAction {
  type: 'notification' | 'logging' | 'trigger_workflow' | 'update_status';
  target: string;
  parameters: any;
}

export interface LocationAnalytics {
  locationId: string;
  date: string;
  totalVisitors: number;
  uniqueVisitors: number;
  peakHour: string;
  averageDuration: number; // in minutes
  popularServices: Array<{ service: string; count: number }>;
  revenue: number;
  conversionRate: number;
}

class LocationTrackingManager {
  private static instance: LocationTrackingManager;
  private locations: Map<string, Location> = new Map();
  private trackingEvents: Map<string, LocationTrackingEvent> = new Map();
  private geofences: Map<string, Geofence> = new Map();
  private analytics: Map<string, LocationAnalytics[]> = new Map();
  private watchPositionId: number | null = null;
  private currentPosition: { latitude: number; longitude: number } | null = null;

  private constructor() {
    this.initializeLocations();
    this.initializeGeofences();
    this.startTracking();
  }

  static getInstance(): LocationTrackingManager {
    if (!LocationTrackingManager.instance) {
      LocationTrackingManager.instance = new LocationTrackingManager();
    }
    return LocationTrackingManager.instance;
  }

  private initializeLocations() {
    // Main locations
    this.addLocation({
      id: 'main_cafe',
      name: 'Deora Plaza Cafe',
      type: 'cafe',
      address: '123 Plaza Drive, Downtown',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      region: 'northeast',
      timezone: 'America/New_York',
      status: 'active',
      capacity: 50,
      currentOccupancy: 32,
      businessHours: {
        monday: { open: '06:00', close: '22:00' },
        tuesday: { open: '06:00', close: '22:00' },
        wednesday: { open: '06:00', close: '22:00' },
        thursday: { open: '06:00', close: '22:00' },
        friday: { open: '06:00', close: '23:00' },
        saturday: { open: '07:00', close: '23:00' },
        sunday: { open: '07:00', close: '21:00' }
      },
      amenities: ['WiFi', 'Outdoor Seating', 'Pet Friendly', 'Drive-thru'],
      contact: { phone: '+1-555-0101', email: 'cafe@deoraplaza.com' }
    });

    this.addLocation({
      id: 'main_restaurant',
      name: 'Deora Plaza Restaurant',
      type: 'restaurant',
      address: '125 Plaza Drive, Downtown',
      coordinates: { latitude: 40.7130, longitude: -74.0065 },
      region: 'northeast',
      timezone: 'America/New_York',
      status: 'active',
      capacity: 120,
      currentOccupancy: 85,
      businessHours: {
        monday: { open: '11:00', close: '22:00' },
        tuesday: { open: '11:00', close: '22:00' },
        wednesday: { open: '11:00', close: '22:00' },
        thursday: { open: '11:00', close: '22:00' },
        friday: { open: '11:00', close: '23:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '10:00', close: '21:00' }
      },
      amenities: ['WiFi', 'Private Dining', 'Bar', 'Live Music', 'Valet Parking'],
      contact: { phone: '+1-555-0102', email: 'restaurant@deoraplaza.com' }
    });

    this.addLocation({
      id: 'main_bar',
      name: 'Deora Plaza Bar',
      type: 'bar',
      address: '127 Plaza Drive, Downtown',
      coordinates: { latitude: 40.7132, longitude: -74.0070 },
      region: 'northeast',
      timezone: 'America/New_York',
      status: 'active',
      capacity: 80,
      currentOccupancy: 45,
      businessHours: {
        monday: { open: '16:00', close: '02:00' },
        tuesday: { open: '16:00', close: '02:00' },
        wednesday: { open: '16:00', close: '02:00' },
        thursday: { open: '16:00', close: '02:00' },
        friday: { open: '16:00', close: '03:00' },
        saturday: { open: '14:00', close: '03:00' },
        sunday: { open: '14:00', close: '00:00' }
      },
      amenities: ['WiFi', 'Outdoor Patio', 'Live Sports', 'Cocktail Menu', 'DJ'],
      contact: { phone: '+1-555-0103', email: 'bar@deoraplaza.com' }
    });

    this.addLocation({
      id: 'main_hotel',
      name: 'Deora Plaza Hotel',
      type: 'hotel',
      address: '129 Plaza Drive, Downtown',
      coordinates: { latitude: 40.7134, longitude: -74.0075 },
      region: 'northeast',
      timezone: 'America/New_York',
      status: 'active',
      capacity: 200,
      currentOccupancy: 156,
      businessHours: {
        monday: { open: '00:00', close: '24:00' },
        tuesday: { open: '00:00', close: '24:00' },
        wednesday: { open: '00:00', close: '24:00' },
        thursday: { open: '00:00', close: '24:00' },
        friday: { open: '00:00', close: '24:00' },
        saturday: { open: '00:00', close: '24:00' },
        sunday: { open: '00:00', close: '24:00' }
      },
      amenities: ['WiFi', 'Spa', 'Gym', 'Pool', 'Room Service', 'Concierge', 'Business Center'],
      contact: { phone: '+1-555-0104', email: 'hotel@deoraplaza.com' }
    });

    this.addLocation({
      id: 'main_marriage_garden',
      name: 'Deora Plaza Marriage Garden',
      type: 'marriage_garden',
      address: '131 Plaza Drive, Suburbs',
      coordinates: { latitude: 40.7150, longitude: -74.0100 },
      region: 'northeast',
      timezone: 'America/New_York',
      status: 'active',
      capacity: 500,
      currentOccupancy: 0,
      businessHours: {
        monday: { open: '09:00', close: '23:00' },
        tuesday: { open: '09:00', close: '23:00' },
        wednesday: { open: '09:00', close: '23:00' },
        thursday: { open: '09:00', close: '23:00' },
        friday: { open: '09:00', close: '24:00' },
        saturday: { open: '09:00', close: '24:00' },
        sunday: { open: '09:00', close: '23:00' }
      },
      amenities: ['Parking', 'Catering', 'Decoration', 'Audio/Visual', 'Photography', 'Accommodation'],
      contact: { phone: '+1-555-0105', email: 'events@deoraplaza.com' }
    });
  }

  private initializeGeofences() {
    // Add geofences for each location
    this.locations.forEach(location => {
      this.addGeofence({
        name: `${location.name} Geofence`,
        locationId: location.id,
        coordinates: [location.coordinates],
        radius: 100, // 100 meters
        type: 'both',
        active: true,
        actions: [
          { type: 'logging', target: 'location_events', parameters: {} },
          { type: 'notification', target: 'staff', parameters: { message: 'Customer entered/exited location' } }
        ]
      });
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
          this.checkGeofences();
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

  private checkGeofences() {
    if (!this.currentPosition) return;

    this.geofences.forEach(geofence => {
      if (!geofence.active) return;

      const isInside = this.isPointInGeofence(
        this.currentPosition!,
        geofence.coordinates[0],
        geofence.radius
      );

      // This is simplified - in real implementation, you'd track previous state
      if (isInside && (geofence.type === 'entry' || geofence.type === 'both')) {
        this.triggerGeofenceActions(geofence, 'entry');
      } else if (!isInside && (geofence.type === 'exit' || geofence.type === 'both')) {
        this.triggerGeofenceActions(geofence, 'exit');
      }
    });
  }

  private isPointInGeofence(
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

  private triggerGeofenceActions(geofence: Geofence, eventType: 'entry' | 'exit') {
    geofence.actions.forEach(action => {
      switch (action.type) {
        case 'logging':
          this.trackEvent(geofence.locationId, eventType === 'entry' ? 'entry' : 'exit');
          break;
        case 'notification':
          console.log(`Notification: ${action.parameters.message}`);
          break;
        case 'trigger_workflow':
          console.log(`Trigger workflow: ${action.target}`);
          break;
        case 'update_status':
          console.log(`Update status: ${action.target}`);
          break;
      }
    });
  }

  addLocation(location: Location): string {
    const id = location.id || location.name.toLowerCase().replace(/\s+/g, '_');
    const newLocation: Location = { ...location, id };
    this.locations.set(id, newLocation);
    return id;
  }

  getLocation(id: string): Location | undefined {
    return this.locations.get(id);
  }

  getAllLocations(): Location[] {
    return Array.from(this.locations.values());
  }

  getLocationsByType(type: Location['type']): Location[] {
    return Array.from(this.locations.values()).filter(location => location.type === type);
  }

  getLocationsByRegion(region: string): Location[] {
    return Array.from(this.locations.values()).filter(location => location.region === region);
  }

  updateLocation(id: string, updates: Partial<Location>): boolean {
    const location = this.locations.get(id);
    if (!location) return false;

    Object.assign(location, updates);
    return true;
  }

  deleteLocation(id: string): boolean {
    return this.locations.delete(id);
  }

  trackEvent(
    locationId: string,
    eventType: LocationTrackingEvent['eventType'],
    userId?: string,
    deviceId?: string,
    data?: any
  ): string {
    const event: LocationTrackingEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      locationId,
      userId,
      deviceId,
      eventType,
      timestamp: new Date().toISOString(),
      data
    };

    this.trackingEvents.set(event.id, event);
    
    // Update location occupancy
    if (eventType === 'entry' || eventType === 'check_in') {
      const location = this.locations.get(locationId);
      if (location) {
        location.currentOccupancy = Math.min(location.currentOccupancy + 1, location.capacity);
      }
    } else if (eventType === 'exit' || eventType === 'check_out') {
      const location = this.locations.get(locationId);
      if (location) {
        location.currentOccupancy = Math.max(location.currentOccupancy - 1, 0);
      }
    }

    return event.id;
  }

  getEvents(locationId?: string, limit?: number): LocationTrackingEvent[] {
    let events = Array.from(this.trackingEvents.values());
    
    if (locationId) {
      events = events.filter(event => event.locationId === locationId);
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (limit) {
      events = events.slice(0, limit);
    }

    return events;
  }

  addGeofence(geofence: Omit<Geofence, 'id'>): string {
    const id = `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newGeofence: Geofence = { ...geofence, id };
    this.geofences.set(id, newGeofence);
    return id;
  }

  getGeofence(id: string): Geofence | undefined {
    return this.geofences.get(id);
  }

  getAllGeofences(): Geofence[] {
    return Array.from(this.geofences.values());
  }

  updateGeofence(id: string, updates: Partial<Geofence>): boolean {
    const geofence = this.geofences.get(id);
    if (!geofence) return false;

    Object.assign(geofence, updates);
    return true;
  }

  deleteGeofence(id: string): boolean {
    return this.geofences.delete(id);
  }

  getCurrentPosition(): { latitude: number; longitude: number } | null {
    return this.currentPosition;
  }

  getNearestLocation(latitude: number, longitude: number, type?: Location['type']): Location | null {
    const locations = type ? this.getLocationsByType(type) : this.getAllLocations();
    
    if (locations.length === 0) return null;

    let nearestLocation = locations[0];
    let minDistance = this.calculateDistance(
      latitude, longitude,
      nearestLocation.coordinates.latitude,
      nearestLocation.coordinates.longitude
    );

    for (let i = 1; i < locations.length; i++) {
      const distance = this.calculateDistance(
        latitude, longitude,
        locations[i].coordinates.latitude,
        locations[i].coordinates.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestLocation = locations[i];
      }
    }

    return nearestLocation;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  generateLocationAnalytics(locationId: string, date: string): LocationAnalytics {
    const events = this.getEvents(locationId).filter(event => 
      event.timestamp.startsWith(date)
    );

    const uniqueVisitors = new Set(
      events.filter(e => e.userId).map(e => e.userId)
    ).size;

    const hourlyVisitors = new Array(24).fill(0);
    events.forEach(event => {
      if (event.eventType === 'entry') {
        const hour = new Date(event.timestamp).getHours();
        hourlyVisitors[hour]++;
      }
    });

    const peakHour = hourlyVisitors.indexOf(Math.max(...hourlyVisitors));

    // Calculate average duration (simplified)
    const entryEvents = events.filter(e => e.eventType === 'entry');
    const exitEvents = events.filter(e => e.eventType === 'exit');
    let totalDuration = 0;
    let durationCount = 0;

    entryEvents.forEach(entry => {
      const exit = exitEvents.find(e => 
        e.userId === entry.userId && 
        new Date(e.timestamp) > new Date(entry.timestamp)
      );
      if (exit) {
        totalDuration += new Date(exit.timestamp).getTime() - new Date(entry.timestamp).getTime();
        durationCount++;
      }
    });

    const averageDuration = durationCount > 0 ? totalDuration / durationCount / 60000 : 0; // Convert to minutes

    const analytics: LocationAnalytics = {
      locationId,
      date,
      totalVisitors: entryEvents.length,
      uniqueVisitors,
      peakHour: `${peakHour}:00`,
      averageDuration,
      popularServices: [],
      revenue: 0,
      conversionRate: 0
    };

    // Store analytics
    if (!this.analytics.has(locationId)) {
      this.analytics.set(locationId, []);
    }
    this.analytics.get(locationId)!.push(analytics);

    return analytics;
  }

  getLocationAnalytics(locationId: string, days: number = 30): LocationAnalytics[] {
    const analytics = this.analytics.get(locationId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return analytics
      .filter(a => new Date(a.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getLocationStatus(locationId: string): {
    isOpen: boolean;
    currentOccupancy: number;
    occupancyRate: number;
    nextOpeningTime?: string;
    nextClosingTime?: string;
  } | null {
    const location = this.getLocation(locationId);
    if (!location) return null;

    const now = new Date();
    const currentDay = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);

    const todayHours = location.businessHours[currentDay];
    const isOpen = todayHours && currentTime >= todayHours.open && currentTime <= todayHours.close;

    const occupancyRate = (location.currentOccupancy / location.capacity) * 100;

    return {
      isOpen,
      currentOccupancy: location.currentOccupancy,
      occupancyRate,
      nextOpeningTime: todayHours?.open,
      nextClosingTime: todayHours?.close
    };
  }

  stopTracking(): void {
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }
  }

  // Mock data for demonstration
  loadMockData() {
    console.log('Location tracking system initialized with mock data');
  }
}

export const locationTrackingManager = LocationTrackingManager.getInstance();

// Initialize mock data
locationTrackingManager.loadMockData();

