/**
 * Google Maps Location Component
 * Displays user locations on Google Maps with real-time updates
 */

"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
;
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Maximize2, Minimize2, Satellite, Map as MapIcon, Navigation } from 'lucide-react';
import { 
  initializeGoogleMaps, 
  isGoogleMapsAvailable, 
  getRoleConfig, 
  createMarkerIcon, 
  createUserInfoWindowContent, 
  createBusinessInfoWindowContent 
} from '@/lib/google-maps';

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

interface GoogleLocationMapProps {
  users: UserLocationData[];
  center: { lat: number; lng: number };
  onUserSelect?: (user: UserLocationData) => void;
  selectedUser?: UserLocationData | null;
  height?: string;
  apiKey?: string;
}

// Role-based marker colors and icons (moved to utility)
// const getRoleConfig = ... (now imported from @/lib/google-maps)

export function GoogleLocationMap({ 
  users, 
  center, 
  onUserSelect, 
  selectedUser, 
  height = "500px",
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
}: GoogleLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get API key from environment
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Google Maps API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.');
        }

        // Initialize Google Maps using the new utility
        await initializeGoogleMaps(apiKey);
        
        if (mapRef.current && isGoogleMapsAvailable()) {
          const googleMap = new google.maps.Map(mapRef.current, {
            center,
            zoom: 15,
            mapTypeId: mapType,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ],
            mapTypeControl: false,
            streetViewControl: true,
            fullscreenControl: false,
            zoomControl: true,
            scaleControl: true
          });

          setMap(googleMap);
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error('Error loading Google Maps:', error);
        setError(error.message || 'Failed to load Google Maps');
        setIsLoading(false);
      }
    };

    initMap();
  }, [center, mapType]);

  // Update markers when users change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const newMarkers: google.maps.Marker[] = [];

    // Add user markers
    users.forEach((user) => {
      const roleConfig = getRoleConfig(user.role, user.isOnline);
      
      // Create custom marker icon using utility
      const markerIcon = createMarkerIcon(
        roleConfig.color, 
        user.userId === selectedUser?.userId, 
        user.isOnline
      );

      const marker = new google.maps.Marker({
        position: { lat: user.latitude, lng: user.longitude },
        map,
        title: `${user.username} (${roleConfig.label})`,
        icon: markerIcon,
        animation: user.isOnline ? google.maps.Animation.DROP : undefined
      });

      // Create info window using utility
      const infoWindow = new google.maps.InfoWindow({
        content: createUserInfoWindowContent(user)
      });

      // Add click listener
      marker.addListener('click', () => {
        if (onUserSelect) {
          onUserSelect(user);
        }
        infoWindow.open(map, marker);
      });

      // Add accuracy circle for GPS locations
      if (user.source === 'gps' && user.accuracy) {
        const accuracyCircle = new google.maps.Circle({
          strokeColor: roleConfig.color,
          strokeOpacity: 0.3,
          strokeWeight: 1,
          fillColor: roleConfig.color,
          fillOpacity: 0.1,
          map,
          center: { lat: user.latitude, lng: user.longitude },
          radius: user.accuracy
        });

        // Store circle reference to clean up later
        (marker as any).accuracyCircle = accuracyCircle;
      }

      newMarkers.push(marker);
    });

    // Add center marker (business location)
    const centerMarker = new google.maps.Marker({
      position: center,
      map,
      title: 'DEORA Plaza - Business Location',
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#dc2626',
        fillOpacity: 1,
        strokeColor: '#f8f8f8',
        strokeWeight: 2,
      }
    });

    const centerInfoWindow = new google.maps.InfoWindow({
      content: createBusinessInfoWindowContent(center)
    });

    centerMarker.addListener('click', () => {
      centerInfoWindow.open(map, centerMarker);
    });

    newMarkers.push(centerMarker);
    setMarkers(newMarkers);

    // Fit map to show all markers
    if (users.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      users.forEach(user => {
        bounds.extend({ lat: user.latitude, lng: user.longitude });
      });
      bounds.extend(center);
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 18) map.setZoom(18);
        google.maps.event.removeListener(listener);
      });
    }

  }, [map, users, selectedUser, onUserSelect, center]);

  // Handle map type change
  const handleMapTypeChange = useCallback((type: 'roadmap' | 'satellite') => {
    setMapType(type);
    if (map) {
      map.setMapTypeId(type);
    }
  }, [map]);

  // Center map on user's current location
  const centerOnUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          if (map) {
            map.setCenter(userLocation);
            map.setZoom(16);
          }
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }, [map]);

  if (error) {
    return (
      <div className="premium-card p-6">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-[#F59E0B]" />
          <h3 className="font-medium text-lg mb-2">Google Maps Unavailable</h3>
          
          {error.includes('BillingNotEnabled') ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Google Maps requires billing to be enabled on your Google Cloud project.
              </p>
              
              <div className="bg-[#EFF6FF] border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">💡 Quick Solutions:</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <span className="font-medium">1.</span>
                    <span>Use our <strong>FREE OpenStreetMap</strong> option (no API key needed)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">2.</span>
                    <span>Enable billing in <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">3.</span>
                    <span>Get a new API key with Maps JavaScript API enabled</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  🗺️ Switch to Free Maps
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://console.cloud.google.com/billing', '_blank')}
                >
                  💳 Enable Billing
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#EF4444]">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
      {/* Map Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {users.length} users • {users.filter(u => u.isOnline).length} online
            </span>
          </div>
          
          {/* Map Type Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={mapType === 'roadmap' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleMapTypeChange('roadmap')}
              className="h-8 px-3"
            >
              <MapIcon className="h-4 w-4 mr-1" />
              Map
            </Button>
            <Button
              variant={mapType === 'satellite' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleMapTypeChange('satellite')}
              className="h-8 px-3"
            >
              <Satellite className="h-4 w-4 mr-1" />
              Satellite
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={centerOnUserLocation}
            title="Center on my location"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative border rounded-lg overflow-hidden bg-[#F8FAFC]">
        <div
          ref={mapRef}
          className="w-full"
          style={{ height: isFullscreen ? 'calc(100vh - 120px)' : height }}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff Locations
          </h4>
          <div className="space-y-2 text-xs">
            {[
              { role: 'waiter', icon: '🍽️', label: 'Waiters' },
              { role: 'kitchen', icon: '👨‍🍳', label: 'Kitchen' },
              { role: 'bartender', icon: '🍹', label: 'Bartenders' },
              { role: 'manager', icon: '👔', label: 'Managers' },
              { role: 'reception', icon: '🏨', label: 'Reception' }
            ].map(({ role, icon, label }) => {
              const config = getRoleConfig(role, true);
              const count = users.filter(u => u.role === role && u.isOnline).length;
              if (count === 0) return null;
              
              return (
                <div key={role} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border border-white"
                      style={{ backgroundColor: config.color }}
                    ></div>
                    <span className="text-xs">{icon} {label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {count}
                  </Badge>
                </div>
              );
            })}
            
            <div className="pt-2 border-t border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#EF4444] transform rotate-45"></div>
                <span className="text-xs">🏢 Business Location</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#22C55E]">
              {users.filter(u => u.isOnline).length}
            </div>
            <div className="text-xs text-muted-foreground">Online Now</div>
          </div>
        </div>

        {/* No users message */}
        {users.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No staff locations available</p>
              <p className="text-sm">Staff will appear here when they share their location</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Info */}
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <div>
          Click on markers for detailed information • Real-time location tracking
        </div>
        <div>
          Powered by Google Maps
        </div>
      </div>
    </div>
  );
}

