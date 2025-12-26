/**
 * Unified Location Types for DEORA Plaza
 * Consolidates all location-related interfaces across the system
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface UnifiedLocation {
  id: string;
  name: string;
  type: LocationType;
  coordinates: Coordinates;
  address?: Address;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type LocationType = 
  | 'user_location'
  | 'business_unit'
  | 'storage_location'
  | 'customer_location'
  | 'delivery_location'
  | 'work_zone';

export interface LocationTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  required?: boolean;
}

export interface LocationPermissions {
  userId: string;
  canTrack: boolean;
  canView: boolean;
  canExport: boolean;
  consentGiven: boolean;
  consentDate?: string;
  retentionDays: number;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'work_zone' | 'delivery_zone' | 'restricted_zone';
  coordinates: Coordinates[];
  radius: number; // in meters
  businessUnit?: string;
  isActive: boolean;
  actions: GeofenceAction[];
}

export interface GeofenceAction {
  type: 'log' | 'notify' | 'restrict' | 'allow';
  target: string;
  parameters: Record<string, any>;
}

export interface LocationEvent {
  id: string;
  userId: string;
  eventType: 'entry' | 'exit' | 'check_in' | 'check_out' | 'order_placed';
  location: UnifiedLocation;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LocationAnalytics {
  locationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  metrics: {
    totalVisitors: number;
    uniqueVisitors: number;
    averageDuration: number; // in minutes
    peakHours: Array<{ hour: number; count: number }>;
    popularAreas: Array<{ area: string; visits: number }>;
    conversionRate: number;
    revenue: number;
  };
}

export interface MultiLocationConfig {
  organizationId: string;
  locations: Array<{
    id: string;
    name: string;
    type: 'main' | 'branch' | 'warehouse' | 'office';
    coordinates: Coordinates;
    address: Address;
    businessUnits: string[];
    isActive: boolean;
    settings: {
      timezone: string;
      currency: string;
      operatingHours: Record<string, { open: string; close: string }>;
    };
  }>;
}

