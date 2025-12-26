"use client";

import { useState } from 'react';
;
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoogleMapsComponent } from '@/components/location/GoogleMapsComponent';
import { MapPin, TestTube, Map } from 'lucide-react';

// Mock user data for testing
const mockUsers = [
  {
    userId: 'user1',
    username: 'John Waiter',
    role: 'waiter',
    businessUnit: 'Restaurant',
    latitude: 40.7128,
    longitude: -74.0060,
    timestamp: new Date().toISOString(),
    accuracy: 10,
    source: 'gps' as const,
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    userId: 'user2',
    username: 'Sarah Kitchen',
    role: 'kitchen',
    businessUnit: 'Restaurant',
    latitude: 40.7130,
    longitude: -74.0058,
    timestamp: new Date().toISOString(),
    accuracy: 15,
    source: 'gps' as const,
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    userId: 'user3',
    username: 'Mike Manager',
    role: 'manager',
    businessUnit: 'Restaurant',
    latitude: 40.7125,
    longitude: -74.0062,
    timestamp: new Date().toISOString(),
    accuracy: 8,
    source: 'gps' as const,
    isOnline: false,
    lastSeen: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
  },
  {
    userId: 'user4',
    username: 'Lisa Bartender',
    role: 'bartender',
    businessUnit: 'Bar',
    latitude: 40.7132,
    longitude: -74.0055,
    timestamp: new Date().toISOString(),
    accuracy: 12,
    source: 'gps' as const,
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    userId: 'user5',
    username: 'David Reception',
    role: 'reception',
    businessUnit: 'Hotel',
    latitude: 40.7126,
    longitude: -74.0065,
    timestamp: new Date().toISOString(),
    accuracy: 20,
    source: 'ip' as const,
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    userId: 'user6',
    username: 'Emma Admin',
    role: 'admin',
    businessUnit: 'Admin',
    latitude: 40.7124,
    longitude: -74.0067,
    timestamp: new Date().toISOString(),
    accuracy: 5,
    source: 'manual' as const,
    isOnline: true,
    lastSeen: new Date().toISOString()
  }
];

const businessCenter = { lat: 40.7128, lng: -74.0060 }; // New York coordinates

export default function TestMapPage() {
  const [selectedUser, setSelectedUser] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="h-6 w-6" />
            Google Maps Testing Dashboard
          </h1>
          <p className="text-muted-foreground">
            Test Google Maps integration with mock staff location data
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-[#DBEAFE] text-blue-800">
            Google Maps API
          </Badge>
          <Badge variant="outline">
            High Accuracy GPS
          </Badge>
        </div>
      </div>

      {/* Test Controls */}
      <div className="premium-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                {mockUsers.length} test users • {mockUsers.filter(u => u.isOnline).length} online
              </span>
            </div>
            
            {selectedUser && (
              <Badge variant="secondary">
                Selected: {selectedUser.username}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUser(null)}
            >
              Clear Selection
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh Map
            </Button>
          </div>
        </div>
      </div>

      {/* Google Maps Component */}
      <div className="premium-card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Map className="h-5 w-5" />
          Google Maps Location Tracking
        </h2>
        
        <GoogleMapsComponent
          users={mockUsers}
          center={businessCenter}
          selectedUser={selectedUser}
          onUserSelect={setSelectedUser}
          height="600px"
        />
      </div>

      {/* Selected User Details */}
      {selectedUser && (
        <div className="premium-card p-6">
          <h3 className="text-lg font-semibold mb-4">Selected User Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="font-medium">{selectedUser.username}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Role:</span>
              <p className="font-medium capitalize">{selectedUser.role}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className={`font-medium ${selectedUser.isOnline ? 'text-[#22C55E]' : 'text-[#9CA3AF]'}`}>
                {selectedUser.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Accuracy:</span>
              <p className="font-medium">±{selectedUser.accuracy}m</p>
            </div>
            <div>
              <span className="text-muted-foreground">Coordinates:</span>
              <p className="font-mono text-xs">
                {selectedUser.latitude.toFixed(6)}, {selectedUser.longitude.toFixed(6)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Source:</span>
              <p className="font-medium uppercase">{selectedUser.source}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Business Unit:</span>
              <p className="font-medium">{selectedUser.businessUnit}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Seen:</span>
              <p className="font-medium">
                {new Date(selectedUser.lastSeen).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Staff Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="premium-card p-4">
          <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
            👥 Staff Overview
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Staff:</span>
              <span className="font-medium">{mockUsers.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Online:</span>
              <span className="font-medium text-[#22C55E]">{mockUsers.filter(u => u.isOnline).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Offline:</span>
              <span className="font-medium text-[#9CA3AF]">{mockUsers.filter(u => !u.isOnline).length}</span>
            </div>
          </div>
        </div>

        <div className="premium-card p-4">
          <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
            🏢 Departments
          </h4>
          <div className="space-y-2 text-sm">
            {['Restaurant', 'Bar', 'Hotel'].map(unit => {
              const count = mockUsers.filter(u => u.businessUnit === unit).length;
              const online = mockUsers.filter(u => u.businessUnit === unit && u.isOnline).length;
              return (
                <div key={unit} className="flex justify-between">
                  <span>{unit}:</span>
                  <span className="font-medium">{online}/{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="premium-card p-4">
          <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
            📍 Location Sources
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>GPS:</span>
              <span className="font-medium">{mockUsers.filter(u => u.source === 'gps').length}</span>
            </div>
            <div className="flex justify-between">
              <span>IP Location:</span>
              <span className="font-medium">{mockUsers.filter(u => u.source === 'ip').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Manual:</span>
              <span className="font-medium">{mockUsers.filter(u => u.source === 'manual').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Information */}
      <div className="premium-card p-4">
        <h4 className="text-md font-semibold mb-2">🔧 Google Maps API Information</h4>
        <div className="text-xs space-y-1 text-muted-foreground">
          <p>• API Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Configured ✅' : 'Missing ❌'}</p>
          <p>• Map Types: Roadmap, Satellite, Hybrid, Terrain</p>
          <p>• Libraries: Places, Geometry</p>
          <p>• Features: High accuracy GPS, Street View, Places API</p>
          <p>• Business Center: {businessCenter.lat}, {businessCenter.lng}</p>
          <p>• Test Users: {mockUsers.length} (mock data for development)</p>
        </div>
      </div>
    </div>
  );
}

