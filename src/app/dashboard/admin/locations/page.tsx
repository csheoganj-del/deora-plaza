/**
 * Admin Location Dashboard
 * Real-time map view of all user locations with detailed information
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
;
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Users, 
  RefreshCw, 
  Search, 
  Filter,
  Clock,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { LocationMap } from '@/components/location/LocationMap';
import { GoogleLocationMap } from '@/components/location/GoogleLocationMap';
import { GoogleMapsComponent } from '@/components/location/GoogleMapsComponent';
import { UserLocationCard } from '@/components/location/UserLocationCard';
import { LocationAnalytics } from '@/components/location/LocationAnalytics';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/hooks/use-toast';

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
  deviceInfo?: {
    userAgent: string;
    platform: string;
  };
}

export default function AdminLocationsPage() {
  const { data: session } = useSupabaseSession();
  const [userLocations, setUserLocations] = useState<UserLocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterBusinessUnit, setFilterBusinessUnit] = useState<string>('all');
  const [filterOnlineStatus, setFilterOnlineStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserLocationData | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [mapType, setMapType] = useState<'simple' | 'google' | 'googlemaps'>('simple'); // Default to free option

  // Check if user has admin permissions
  const isAdmin = session?.user?.role && ['super_admin', 'owner'].includes(session.user.role);

  const fetchUserLocations = useCallback(async () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view user locations.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { getAllUserLocationsWithDetails } = await import('@/actions/location-admin');
      const locations = await getAllUserLocationsWithDetails();
      
      setUserLocations(locations);
      setLastRefresh(new Date());
      
      // Update map center to show all users
      if (locations.length > 0) {
        const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
        const avgLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
      }

      toast({
        title: "Locations Updated",
        description: `Found ${locations.length} user locations`,
      });
    } catch (error) {
      console.error('Error fetching user locations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user locations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchUserLocations, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, fetchUserLocations]);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      fetchUserLocations();
    }
  }, [isAdmin, fetchUserLocations]);

  // Filter users based on search and filters
  const filteredUsers = userLocations.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesBusinessUnit = filterBusinessUnit === 'all' || user.businessUnit === filterBusinessUnit;
    const matchesOnlineStatus = filterOnlineStatus === 'all' || 
                               (filterOnlineStatus === 'online' && user.isOnline) ||
                               (filterOnlineStatus === 'offline' && !user.isOnline);
    
    return matchesSearch && matchesRole && matchesBusinessUnit && matchesOnlineStatus;
  });

  // Get unique roles and business units for filters
  const uniqueRoles = [...new Set(userLocations.map(user => user.role))];
  const uniqueBusinessUnits = [...new Set(userLocations.map(user => user.businessUnit))];

  const handleUserSelect = (user: UserLocationData) => {
    setSelectedUser(user);
    setMapCenter({ lat: user.latitude, lng: user.longitude });
  };

  const getStatusColor = (user: UserLocationData) => {
    if (!user.isOnline) return 'bg-[#F8FAFC]';
    
    const timeDiff = Date.now() - new Date(user.timestamp).getTime();
    if (timeDiff < 5 * 60 * 1000) return 'bg-[#DCFCE7]0'; // < 5 minutes
    if (timeDiff < 30 * 60 * 1000) return 'bg-[#F59E0B]/100'; // < 30 minutes
    return 'bg-[#FEE2E2]0'; // > 30 minutes
  };

  const getAccuracyBadge = (source: string, accuracy?: number) => {
    switch (source) {
      case 'gps':
        return <Badge variant="default" className="bg-[#BBF7D0] text-green-800">GPS</Badge>;
      case 'ip':
        return <Badge variant="secondary" className="bg-[#F59E0B]/10 text-[#F59E0B]800">IP</Badge>;
      case 'manual':
        return <Badge variant="outline" className="bg-[#DBEAFE] text-blue-800">Manual</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="premium-card p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-[#F59E0B] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            You need admin privileges to access the location dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time tracking of user locations across all business units
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Map Type Selector */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={mapType === 'simple' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapType('simple')}
              className="h-8 px-3"
            >
              🗺️ Free Maps
            </Button>
            <Button
              variant={mapType === 'google' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapType('google')}
              className="h-8 px-3"
            >
              📍 Google Maps
            </Button>
            <Button
              variant={mapType === 'googlemaps' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMapType('googlemaps')}
              className="h-8 px-3"
            >
              🌍 Enhanced
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-[#DCFCE7] border-green-200' : ''}
          >
            {autoRefresh ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            Auto Refresh
          </Button>
          
          <Button
            onClick={fetchUserLocations}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card">
          <div className="p-8 p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-[#EFF6FF]0" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{userLocations.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="p-8 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-[#DCFCE7]0" />
              <div>
                <p className="text-sm text-muted-foreground">Online Now</p>
                <p className="text-2xl font-bold">
                  {userLocations.filter(u => u.isOnline).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="p-8 p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-[#EDEBFF]0" />
              <div>
                <p className="text-sm text-muted-foreground">GPS Tracked</p>
                <p className="text-2xl font-bold">
                  {userLocations.filter(u => u.source === 'gps').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="p-8 p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Last Update</p>
                <p className="text-sm font-medium">
                  {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="premium-card">
        <div className="p-8 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterBusinessUnit} onValueChange={setFilterBusinessUnit}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Business Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {uniqueBusinessUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>
                    {unit.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterOnlineStatus} onValueChange={setFilterOnlineStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Map */}
            <div className="premium-card lg:col-span-3">
              <div className="p-8 border-b border-[#E5E7EB]">
                <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Live Location Map
                  {autoRefresh && (
                    <Badge variant="secondary" className="bg-[#BBF7D0] text-green-800">
                      Auto-updating
                    </Badge>
                  )}
                </h2>
              </div>
              <div className="p-8">
                {mapType === 'googlemaps' ? (
                  <GoogleMapsComponent
                    users={filteredUsers}
                    center={mapCenter}
                    onUserSelect={handleUserSelect}
                    selectedUser={selectedUser}
                    height="500px"
                  />
                ) : mapType === 'google' ? (
                  <GoogleLocationMap
                    users={filteredUsers}
                    center={mapCenter}
                    onUserSelect={handleUserSelect}
                    selectedUser={selectedUser}
                    height="500px"
                  />
                ) : (
                  <LocationMap
                    users={filteredUsers}
                    center={mapCenter}
                    onUserSelect={handleUserSelect}
                    selectedUser={selectedUser}
                    height="500px"
                  />
                )}
              </div>
            </div>

            {/* User Details Sidebar */}
            <div className="premium-card">
              <div className="p-8 border-b border-[#E5E7EB]">
                <h2 className="text-3xl font-bold text-[#111827] text-lg">User Details</h2>
              </div>
              <div className="p-8">
                {selectedUser ? (
                  <UserLocationCard user={selectedUser} />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a user on the map to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="premium-card">
            <div className="p-8 border-b border-[#E5E7EB]">
              <h2 className="text-3xl font-bold text-[#111827]">User Locations List</h2>
            </div>
            <div className="p-8">
              <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No users found matching your filters</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(user)}`} />
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.role} • {user.businessUnit}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getAccuracyBadge(user.source, user.accuracy)}
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <LocationAnalytics users={userLocations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

