"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
;
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Maximize2, Minimize2, Navigation, Satellite, Map as MapIcon, Layers } from 'lucide-react';
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

interface GoogleMapsComponentProps {
  users: UserLocationData[];
  center: { lat: number; lng: number };
  onUserSelect?: (user: UserLocationData) => void;
  selectedUser?: UserLocationData | null;
  height?: string;
}

// Role-based marker colors and icons (moved to utility)
// const getRoleConfig = ... (now imported from @/lib/google-maps)

// Map types available in Google Maps
const mapTypes = {
  roadmap: {
    name: 'Roadmap',
    icon: <MapIcon className="h-4 w-4" />,
    type: 'roadmap' as google.maps.MapTypeId
  },
  satellite: {
    name: 'Satellite',
    icon: <Satellite className="h-4 w-4" />,
    type: 'satellite' as google.maps.MapTypeId
  },
  hybrid: {
    name: 'Hybrid',
    icon: <Layers className="h-4 w-4" />,
    type: 'hybrid' as google.maps.MapTypeId
  },
  terrain: {
    name: 'Terrain',
    icon: <Layers className="h-4 w-4" />,
    type: 'terrain' as google.maps.MapTypeId
  }
};

export function GoogleMapsComponent({ 
  users, 
  center, 
  onUserSelect, 
  selectedUser, 
  height = "500px"
}: GoogleMapsComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentMapType, setCurrentMapType] = useState<keyof typeof mapTypes>('roadmap');
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
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
        
        if (isGoogleMapsAvailable()) {
          setGoogleMapsLoaded(true);
          setIsLoading(false);
          console.log('✅ Google Maps loaded successfully');
        } else {
          throw new Error('Google Maps failed to initialize properly');
        }
      } catch (error: any) {
        console.error('❌ Error loading Google Maps:', error);
        setError(error.message || 'Failed to load Google Maps');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current) return;

    try {
      console.log('🗺️ Initializing Google Maps...');
      
      // Clean up existing map
      if (mapInstanceRef.current) {
        console.log('🔄 Cleaning up existing map...');
        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        
        // Close info window
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
      }

      // Create new map
      const map = new google.maps.Map(mapRef.current, {
        center: center,
        zoom: 15,
        mapTypeId: mapTypes[currentMapType].type,
        zoomControl: true,
        mapTypeControl: false, // We'll use custom controls
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: false, // We'll use custom fullscreen
        gestureHandling: 'cooperative',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Create info window
      infoWindowRef.current = new google.maps.InfoWindow();

      console.log('✅ Google Maps initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing map:', error);
      setError('Failed to initialize map');
    }
  }, [googleMapsLoaded, center, currentMapType]);

  // Update markers when users change
  useEffect(() => {
    if (!mapInstanceRef.current || !googleMapsLoaded) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

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
        map: map,
        icon: markerIcon,
        title: `${user.username} (${roleConfig.label})`,
        zIndex: user.userId === selectedUser?.userId ? 1000 : 100
      });

      // Create info window content using utility
      const infoContent = createUserInfoWindowContent(user);

      // Add click listener
      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(map, marker);
        }
        
        if (onUserSelect) {
          onUserSelect(user);
        }
      });

      // Add accuracy circle for GPS locations
      if (user.source === 'gps' && user.accuracy) {
        const accuracyCircle = new google.maps.Circle({
          strokeColor: roleConfig.color,
          strokeOpacity: 0.3,
          strokeWeight: 1,
          fillColor: roleConfig.color,
          fillOpacity: 0.1,
          map: map,
          center: { lat: user.latitude, lng: user.longitude },
          radius: user.accuracy
        });
      }

      markersRef.current.push(marker);
    });

    // Add business center marker
    const centerMarker = new google.maps.Marker({
      position: center,
      map: map,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: '#dc2626',
        fillOpacity: 1,
        strokeColor: '#f8f8f8',
        strokeWeight: 2,
        scale: 8,
        rotation: 180
      },
      title: 'DEORA Plaza - Business Location',
      zIndex: 2000
    });

    const businessInfoContent = createBusinessInfoWindowContent(center);

    centerMarker.addListener('click', () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(businessInfoContent);
        infoWindowRef.current.open(map, centerMarker);
      }
    });

    markersRef.current.push(centerMarker);

    // Fit map to show all markers if there are users
    if (users.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      // Add all user locations to bounds
      users.forEach(user => {
        bounds.extend({ lat: user.latitude, lng: user.longitude });
      });
      
      // Add business center to bounds
      bounds.extend(center);
      
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom()! > 18) {
          map.setZoom(18);
        }
      });
    }

  }, [mapInstanceRef.current, users, selectedUser, onUserSelect, center, googleMapsLoaded]);

  // Handle map type change
  const handleMapTypeChange = useCallback((mapType: keyof typeof mapTypes) => {
    setCurrentMapType(mapType);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapTypes[mapType].type);
    }
  }, []);

  // Center map on user's current location
  const centerOnUserLocation = useCallback(() => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          mapInstanceRef.current!.setCenter(userLocation);
          mapInstanceRef.current!.setZoom(16);
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }, []);

  if (isLoading) {
    return (
      <div className="premium-card p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
          <p className="text-xs text-muted-foreground mt-1">Powered by Google Maps API</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-card p-6">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-[#F59E0B]" />
          <h3 className="font-medium text-lg mb-2">Google Maps Unavailable</h3>
          
          {error.includes('BillingNotEnabled') ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Google Maps requires billing to be enabled on your Google Cloud project.
              </p>
              
              <div className="bg-[#EFF6FF] border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-3">💡 Solutions Available:</h4>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="bg-[#BBF7D0] text-green-800 px-2 py-1 rounded text-xs font-medium">FREE</div>
                    <div>
                      <div className="font-medium">Use OpenStreetMap (Recommended)</div>
                      <div className="text-[#6D5DFB]">Switch to our free map option - no API key needed!</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-[#F59E0B]/10 text-[#F59E0B]800 px-2 py-1 rounded text-xs font-medium">PAID</div>
                    <div>
                      <div className="font-medium">Enable Google Cloud Billing</div>
                      <div className="text-[#6D5DFB]">$7 per 1,000 map loads after free tier</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  🗺️ Use Free Maps
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://console.cloud.google.com/billing', '_blank')}
                >
                  💳 Setup Billing
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
                Retry
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
            <Badge variant="secondary" className="bg-[#DBEAFE] text-blue-800 text-xs">
              Google Maps
            </Badge>
          </div>
          
          {/* Map Type Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {Object.entries(mapTypes).map(([key, mapType]) => (
              <Button
                key={key}
                variant={currentMapType === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleMapTypeChange(key as keyof typeof mapTypes)}
                className="h-8 px-3"
              >
                {mapType.icon}
                <span className="ml-1 hidden sm:inline">{mapType.name}</span>
              </Button>
            ))}
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
                <div className="w-3 h-3 bg-[#EF4444]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
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
        {users.length === 0 && (
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Powered by Google Maps
          </Badge>
          <Badge variant="secondary" className="bg-[#DBEAFE] text-blue-800 text-xs">
            High Accuracy • Satellite View
          </Badge>
        </div>
      </div>
    </div>
  );
}

