/**
 * Interactive Location Map Component
 * Displays user locations on Google Maps with real-time updates
 */

"use client";

import { GoogleMapsComponent } from './GoogleMapsComponent';

interface UserLocationData {
  userId: string;
  username: string;
  role: string;
  businessUnit: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  source: 'gps' | 'ip' | 'manual';
  isOnline: boolean;
  lastSeen: string;
}

interface LocationMapProps {
  users: UserLocationData[];
  center: { lat: number; lng: number };
  onUserSelect?: (user: UserLocationData) => void;
  selectedUser?: UserLocationData | null;
  height?: string;
}

// Main LocationMap component now uses Google Maps
export function LocationMap({ 
  users, 
  center, 
  onUserSelect, 
  selectedUser, 
  height = "400px" 
}: LocationMapProps) {
  return (
    <GoogleMapsComponent
      users={users}
      center={center}
      onUserSelect={onUserSelect}
      selectedUser={selectedUser}
      height={height}
    />
  );
}

