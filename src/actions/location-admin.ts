/**
 * Admin Location Actions
 * Server actions for admin location dashboard functionality
 */

"use server";

import { queryDocuments } from "@/lib/supabase/database";
import { requireAuth } from "@/lib/auth-helpers";

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

/**
 * Get all user locations with detailed information
 * Only accessible by admins
 */
export async function getAllUserLocationsWithDetails(): Promise<UserLocationData[]> {
  try {
    // Verify admin permissions
    const session = await requireAuth();
    if (!['super_admin', 'owner'].includes(session.user.role)) {
      throw new Error('Insufficient permissions');
    }

    // Get all users with their latest location data
    const users = await queryDocuments("users", []);
    const userLocations = await queryDocuments("user_locations", []);
    const locationPermissions = await queryDocuments("location_permissions", []);

    // Combine user data with location data
    const userLocationData: UserLocationData[] = [];

    for (const user of users) {
      // Check if user has granted location permissions
      const permissions = locationPermissions.find((p: any) => p.user_id === user.id);
      if (!permissions || !permissions.can_view) {
        continue; // Skip users who haven't granted view permission
      }

      // Get user's latest location
      const location = userLocations.find((l: any) => l.user_id === user.id);
      if (!location) {
        continue; // Skip users without location data
      }

      // Determine if user is online (last activity within 30 minutes)
      const lastActivity = new Date(Math.max(
        new Date(location.timestamp).getTime(),
        new Date(user.last_login || 0).getTime()
      ));
      const isOnline = Date.now() - lastActivity.getTime() < 30 * 60 * 1000;

      // Extract device info from metadata
      const metadata = location.metadata || {};
      const deviceInfo = metadata.userAgent ? {
        userAgent: metadata.userAgent,
        platform: getPlatformFromUserAgent(metadata.userAgent)
      } : undefined;

      userLocationData.push({
        userId: user.id,
        username: user.username || user.name || user.phone_number || 'Unknown',
        role: user.role || 'unknown',
        businessUnit: user.business_unit || 'unknown',
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        timestamp: location.timestamp,
        accuracy: metadata.accuracy ? parseFloat(metadata.accuracy) : undefined,
        source: metadata.source || 'unknown',
        isOnline,
        lastSeen: user.last_login || location.timestamp,
        deviceInfo
      });
    }

    // Sort by most recent activity
    userLocationData.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return userLocationData;
  } catch (error) {
    console.error('Error fetching user locations:', error);
    throw new Error('Failed to fetch user locations');
  }
}

/**
 * Get location history for a specific user
 */
export async function getUserLocationHistory(
  userId: string, 
  limit: number = 50
): Promise<any[]> {
  try {
    const session = await requireAuth();
    if (!['super_admin', 'owner', 'manager'].includes(session.user.role)) {
      throw new Error('Insufficient permissions');
    }

    // Check if user has granted permission to view their location history
    const permissions = await queryDocuments("location_permissions", [
      { field: 'user_id', operator: '==', value: userId }
    ]);
    if (!permissions || permissions.length === 0 || !permissions[0].can_view) {
      throw new Error('User has not granted permission to view location history');
    }

    // Get activity logs for the user
    const activities = await queryDocuments("activity_logs", [
      { field: 'user_id', operator: '==', value: userId }
    ]);
    
    // Sort by timestamp and limit results
    const sortedActivities = activities
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return sortedActivities.map((activity: any) => ({
      id: activity.id,
      activityType: activity.activity_type,
      description: activity.description,
      latitude: activity.latitude ? parseFloat(activity.latitude) : null,
      longitude: activity.longitude ? parseFloat(activity.longitude) : null,
      timestamp: activity.timestamp,
      metadata: activity.metadata || {}
    }));
  } catch (error) {
    console.error('Error fetching user location history:', error);
    throw new Error('Failed to fetch location history');
  }
}

/**
 * Get location analytics summary
 */
export async function getLocationAnalyticsSummary(): Promise<{
  totalUsers: number;
  onlineUsers: number;
  gpsUsers: number;
  recentActivity: number;
  businessUnitBreakdown: Record<string, number>;
  roleBreakdown: Record<string, number>;
}> {
  try {
    const session = await requireAuth();
    if (!['super_admin', 'owner'].includes(session.user.role)) {
      throw new Error('Insufficient permissions');
    }

    const users = await getAllUserLocationsWithDetails();
    
    const analytics = {
      totalUsers: users.length,
      onlineUsers: users.filter(u => u.isOnline).length,
      gpsUsers: users.filter(u => u.source === 'gps').length,
      recentActivity: users.filter(u => {
        const timeDiff = Date.now() - new Date(u.timestamp).getTime();
        return timeDiff < 5 * 60 * 1000; // Last 5 minutes
      }).length,
      businessUnitBreakdown: users.reduce((acc, user) => {
        acc[user.businessUnit] = (acc[user.businessUnit] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      roleBreakdown: users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return analytics;
  } catch (error) {
    console.error('Error generating location analytics:', error);
    throw new Error('Failed to generate analytics');
  }
}

/**
 * Check if a user is within a specific geofence
 */
export async function checkUserInGeofence(
  userId: string, 
  geofenceId: string
): Promise<boolean> {
  try {
    const session = await requireAuth();
    if (!['super_admin', 'owner', 'manager'].includes(session.user.role)) {
      throw new Error('Insufficient permissions');
    }

    // Get user's current location
    const userLocations = await queryDocuments("user_locations", [
      { field: 'user_id', operator: '==', value: userId }
    ]);
    if (!userLocations || userLocations.length === 0) {
      return false;
    }

    const userLocation = userLocations[0];
    const userLat = parseFloat(userLocation.latitude);
    const userLng = parseFloat(userLocation.longitude);

    // Get geofence definition
    const geofences = await queryDocuments("geofences", [
      { field: 'id', operator: '==', value: geofenceId }
    ]);
    if (!geofences || geofences.length === 0) {
      return false;
    }

    const geofence = geofences[0];
    if (!geofence.is_active) {
      return false;
    }

    // Simple circular geofence check
    const geofenceCoords = geofence.coordinates[0];
    const geofenceLat = geofenceCoords.latitude;
    const geofenceLng = geofenceCoords.longitude;
    const radius = geofence.radius;

    const distance = calculateDistance(userLat, userLng, geofenceLat, geofenceLng);
    return distance <= radius;
  } catch (error) {
    console.error('Error checking geofence:', error);
    return false;
  }
}

/**
 * Get all active geofences
 */
export async function getActiveGeofences(): Promise<any[]> {
  try {
    const session = await requireAuth();
    if (!['super_admin', 'owner', 'manager'].includes(session.user.role)) {
      throw new Error('Insufficient permissions');
    }

    const geofences = await queryDocuments("geofences", [
      { field: 'is_active', operator: '==', value: true }
    ]);
    return geofences.map((geofence: any) => ({
      id: geofence.id,
      name: geofence.name,
      type: geofence.type,
      coordinates: geofence.coordinates,
      radius: geofence.radius,
      businessUnit: geofence.business_unit,
      actions: geofence.actions
    }));
  } catch (error) {
    console.error('Error fetching geofences:', error);
    throw new Error('Failed to fetch geofences');
  }
}

/**
 * Helper function to extract platform from user agent
 */
function getPlatformFromUserAgent(userAgent: string): string {
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Unknown';
}

/**
 * Helper function to calculate distance between two coordinates
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

