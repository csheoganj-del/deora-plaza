/**
 * Centralized Location Service for DEORA Plaza
 * Handles all location-related operations with proper security and privacy
 */

import { 
  Coordinates, 
  UnifiedLocation, 
  LocationTrackingOptions, 
  LocationPermissions,
  GeofenceZone,
  LocationEvent,
  LocationAnalytics
} from './types';

export class LocationService {
  private static instance: LocationService;
  private cache = new Map<string, any>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Get user's current location with proper fallbacks
   * Non-blocking implementation for better UX
   */
  async getCurrentLocation(
    options: LocationTrackingOptions = {}
  ): Promise<Coordinates | null> {
    const {
      enableHighAccuracy = false,
      timeout = 10000,
      maximumAge = 300000, // 5 minutes
      fallbackToIP = true,
      required = false
    } = options;

    // Check cache first
    const cacheKey = 'current_location';
    const cached = this.getFromCache(cacheKey);
    if (cached && Date.now() - cached.timestamp < maximumAge) {
      return cached.coordinates;
    }

    try {
      // Try browser geolocation first
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        const position = await this.getBrowserLocation({
          enableHighAccuracy,
          timeout,
          maximumAge
        });
        
        if (position) {
          this.setCache(cacheKey, { coordinates: position, timestamp: Date.now() });
          return position;
        }
      }

      // Fallback to IP geolocation if allowed
      if (fallbackToIP) {
        const ipLocation = await this.getIPLocation();
        if (ipLocation) {
          this.setCache(cacheKey, { coordinates: ipLocation, timestamp: Date.now() });
          return ipLocation;
        }
      }

      // If location is required but unavailable, throw error
      if (required) {
        throw new Error('Location access is required but unavailable');
      }

      return null;
    } catch (error) {
      console.error('Location service error:', error);
      
      if (required) {
        throw error;
      }
      
      return null;
    }
  }

  /**
   * Get browser geolocation with promise wrapper
   */
  private getBrowserLocation(options: PositionOptions): Promise<Coordinates | null> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Browser geolocation failed:', error.message);
          resolve(null);
        },
        options
      );
    });
  }

  /**
   * Get approximate location from IP address
   */
  private async getIPLocation(): Promise<Coordinates | null> {
    try {
      const response = await fetch('https://ipapi.co/json/', {
        timeout: 5000
      } as any);
      
      if (!response.ok) {
        throw new Error('IP geolocation service unavailable');
      }

      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude)
        };
      }
      
      return null;
    } catch (error) {
      console.warn('IP geolocation failed:', error);
      return null;
    }
  }

  /**
   * Check if user has granted location permissions
   * Client-side version - uses localStorage for basic permissions
   */
  async checkLocationPermissions(userId: string): Promise<LocationPermissions> {
    try {
      // For client-side, use localStorage as fallback
      const stored = localStorage.getItem(`location_permissions_${userId}`);
      
      if (stored) {
        return JSON.parse(stored) as LocationPermissions;
      }

      // Default permissions for new users
      const defaultPermissions: LocationPermissions = {
        userId,
        canTrack: false,
        canView: false,
        canExport: false,
        consentGiven: false,
        retentionDays: 90
      };

      // Store default permissions
      localStorage.setItem(`location_permissions_${userId}`, JSON.stringify(defaultPermissions));
      
      return defaultPermissions;
    } catch (error) {
      console.error('Error checking location permissions:', error);
      
      // Return safe defaults on error
      return {
        userId,
        canTrack: false,
        canView: false,
        canExport: false,
        consentGiven: false,
        retentionDays: 90
      };
    }
  }

  /**
   * Update user location permissions
   * Client-side version - uses localStorage
   */
  async updateLocationPermissions(
    userId: string, 
    permissions: Partial<LocationPermissions>
  ): Promise<void> {
    try {
      const existing = await this.checkLocationPermissions(userId);
      
      const updated: LocationPermissions = {
        ...existing,
        ...permissions,
        userId,
        consentDate: permissions.consentGiven ? new Date().toISOString() : existing.consentDate
      };

      localStorage.setItem(`location_permissions_${userId}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating location permissions:', error);
      throw error;
    }
  }

  /**
   * Save user location with privacy controls
   * Client-side version - uses localStorage for caching
   */
  async saveUserLocation(
    userId: string, 
    coordinates: Coordinates, 
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Check permissions first
      const permissions = await this.checkLocationPermissions(userId);
      
      if (!permissions.canTrack) {
        console.warn('User has not granted location tracking permission');
        return;
      }

      // Save to localStorage for client-side caching
      const locationData = {
        user_id: userId,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        timestamp: new Date().toISOString(),
        metadata
      };

      localStorage.setItem(`user_location_${userId}`, JSON.stringify(locationData));

      // Clear cache to force refresh
      this.clearCache('current_location');
    } catch (error) {
      console.error('Error saving user location:', error);
      throw error;
    }
  }

  /**
   * Get user's last known location
   * Client-side version - uses localStorage
   */
  async getUserLocation(userId: string): Promise<Coordinates | null> {
    try {
      const stored = localStorage.getItem(`user_location_${userId}`);
      
      if (stored) {
        const location = JSON.parse(stored);
        return {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user location:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Check if user is within a geofence
   */
  async isUserInGeofence(userId: string, geofenceId: string): Promise<boolean> {
    try {
      // Get user's current location
      const userLocation = await this.getCurrentLocation();
      if (!userLocation) {
        return false;
      }

      // For now, return a simple distance-based check
      // In a real implementation, you'd check against stored geofence boundaries
      const geofenceCenter = { latitude: 0, longitude: 0 }; // This would come from your geofence data
      const distance = this.calculateDistance(
        userLocation,
        geofenceCenter
      );

      return distance <= 100; // 100 meters radius
    } catch (error) {
      console.error('Error checking geofence:', error);
      return false;
    }
  }

  /**
   * Log location event
   */
  async logLocationEvent(event: {
    userId: string;
    eventType: string;
    location?: Coordinates;
    metadata?: any;
  }): Promise<void> {
    try {
      const locationData = {
        ...event,
        timestamp: new Date().toISOString(),
        location: event.location || await this.getCurrentLocation()
      };

      // Store in localStorage for client-side logging
      const existingLogs = JSON.parse(localStorage.getItem('location_events') || '[]');
      existingLogs.push(locationData);
      
      // Keep only last 100 events
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem('location_events', JSON.stringify(existingLogs));
    } catch (error) {
      console.error('Error logging location event:', error);
    }
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();