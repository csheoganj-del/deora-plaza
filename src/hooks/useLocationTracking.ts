/**
 * Location Tracking Hook
 * Provides location tracking functionality with proper state management
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { locationService } from '@/lib/location/service';
import { Coordinates, LocationPermissions } from '@/lib/location/types';

interface LocationTrackingState {
  currentLocation: Coordinates | null;
  permissions: LocationPermissions | null;
  isTracking: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface UseLocationTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoStart?: boolean;
  userId?: string;
}

export function useLocationTracking(options: UseLocationTrackingOptions = {}) {
  const {
    enableHighAccuracy = false,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    autoStart = false,
    userId
  } = options;

  const [state, setState] = useState<LocationTrackingState>({
    currentLocation: null,
    permissions: null,
    isTracking: false,
    error: null,
    lastUpdate: null
  });

  // Load user permissions
  const loadPermissions = useCallback(async () => {
    if (!userId) return;

    try {
      const permissions = await locationService.checkLocationPermissions(userId);
      setState(prev => ({ ...prev, permissions }));
    } catch (error) {
      console.error('Error loading location permissions:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load location permissions' 
      }));
    }
  }, [userId]);

  // Start location tracking
  const startTracking = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, error: 'User ID required for tracking' }));
      return;
    }

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    try {
      const location = await locationService.getCurrentLocation({
        enableHighAccuracy,
        timeout,
        maximumAge,
        fallbackToIP: true,
        required: false
      });

      if (location) {
        setState(prev => ({
          ...prev,
          currentLocation: location,
          lastUpdate: new Date(),
          error: null
        }));

        // Save location if user has granted permission
        if (state.permissions?.canTrack) {
          await locationService.saveUserLocation(userId, location, {
            source: 'hook_tracking',
            accuracy: undefined // Will be set by the service if available
          });
        }
      } else {
        setState(prev => ({
          ...prev,
          error: 'Location not available'
        }));
      }
    } catch (error) {
      console.error('Location tracking error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Location tracking failed'
      }));
    } finally {
      setState(prev => ({ ...prev, isTracking: false }));
    }
  }, [userId, enableHighAccuracy, timeout, maximumAge, state.permissions?.canTrack]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTracking: false,
      error: null
    }));
  }, []);

  // Update permissions
  const updatePermissions = useCallback(async (newPermissions: Partial<LocationPermissions>) => {
    if (!userId) return;

    try {
      await locationService.updateLocationPermissions(userId, newPermissions);
      await loadPermissions(); // Reload permissions
    } catch (error) {
      console.error('Error updating permissions:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to update permissions'
      }));
    }
  }, [userId, loadPermissions]);

  // Check if user is in a geofence
  const checkGeofence = useCallback(async (geofenceId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      return await locationService.isUserInGeofence(userId, geofenceId);
    } catch (error) {
      console.error('Error checking geofence:', error);
      return false;
    }
  }, [userId]);

  // Log location event
  const logLocationEvent = useCallback(async (
    eventType: 'entry' | 'exit' | 'check_in' | 'check_out' | 'order_placed',
    metadata: Record<string, any> = {}
  ) => {
    if (!userId || !state.currentLocation) return;

    try {
      await locationService.logLocationEvent({
        userId,
        eventType,
        location: state.currentLocation,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'useLocationTracking'
        }
      });
    } catch (error) {
      console.error('Error logging location event:', error);
    }
  }, [userId, state.currentLocation]);

  // Load permissions on mount
  useEffect(() => {
    if (userId) {
      loadPermissions();
    }
  }, [userId, loadPermissions]);

  // Auto-start tracking if enabled and permissions allow
  useEffect(() => {
    if (autoStart && state.permissions?.canTrack && !state.isTracking) {
      startTracking();
    }
  }, [autoStart, state.permissions?.canTrack, state.isTracking, startTracking]);

  return {
    // State
    currentLocation: state.currentLocation,
    permissions: state.permissions,
    isTracking: state.isTracking,
    error: state.error,
    lastUpdate: state.lastUpdate,
    
    // Actions
    startTracking,
    stopTracking,
    updatePermissions,
    checkGeofence,
    logLocationEvent,
    
    // Computed values
    hasLocationPermission: state.permissions?.canTrack || false,
    isLocationAvailable: state.currentLocation !== null,
    canTrack: state.permissions?.canTrack && !state.isTracking,
  };
}

