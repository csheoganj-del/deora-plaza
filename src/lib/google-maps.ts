/**
 * Google Maps API Utilities
 * Handles initialization and loading of Google Maps using the new functional API
 */

import { importLibrary } from '@googlemaps/js-api-loader';

// Global state to track if Google Maps is loaded
let isGoogleMapsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Initialize Google Maps API with the new functional approach
 */
export async function initializeGoogleMaps(apiKey?: string): Promise<void> {
  // Return existing promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Return immediately if already loaded
  if (isGoogleMapsLoaded && typeof window !== 'undefined' && window.google && window.google.maps) {
    return Promise.resolve();
  }

  // Create loading promise
  loadingPromise = (async () => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Google Maps can only be loaded in a browser environment');
      }

      // Get API key from parameter or environment
      const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!key) {
        throw new Error('Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.');
      }

      // Check if script is already loaded
      if (window.google && window.google.maps) {
        isGoogleMapsLoaded = true;
        console.log('✅ Google Maps API already loaded');
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for existing script to load
        await new Promise<void>((resolve, reject) => {
          const checkLoaded = setInterval(() => {
            if (window.google && window.google.maps) {
              clearInterval(checkLoaded);
              isGoogleMapsLoaded = true;
              resolve();
            }
          }, 100);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkLoaded);
            reject(new Error('Timeout waiting for Google Maps to load'));
          }, 10000);
        });
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&v=weekly`;
      script.async = true;
      script.defer = true;
      
      // Wait for the script to load
      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          isGoogleMapsLoaded = true;
          console.log('✅ Google Maps API loaded successfully');
          resolve();
        };
        script.onerror = (error) => {
          console.error('❌ Failed to load Google Maps script:', error);
          reject(new Error('Failed to load Google Maps script'));
        };
        document.head.appendChild(script);
      });

    } catch (error) {
      console.error('❌ Error loading Google Maps API:', error);
      loadingPromise = null; // Reset so we can try again
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Check if Google Maps is loaded and available
 */
export function isGoogleMapsAvailable(): boolean {
  return isGoogleMapsLoaded && typeof window !== 'undefined' && !!window.google && !!window.google.maps;
}

/**
 * Get role-based marker configuration
 */
export function getRoleConfig(role: string, isOnline: boolean) {
  const configs = {
    waiter: { color: '#3b82f6', icon: '🍽️', label: 'Waiter' },
    kitchen: { color: '#ef4444', icon: '👨‍🍳', label: 'Kitchen' },
    manager: { color: '#8b5cf6', icon: '👔', label: 'Manager' },
    bartender: { color: '#f59e0b', icon: '🍹', label: 'Bartender' },
    reception: { color: '#10b981', icon: '🏨', label: 'Reception' },
    super_admin: { color: '#dc2626', icon: '⭐', label: 'Admin' },
    owner: { color: '#7c3aed', icon: '👑', label: 'Owner' },
    default: { color: '#6b7280', icon: '👤', label: 'Staff' }
  };

  const config = configs[role as keyof typeof configs] || configs.default;
  return {
    ...config,
    color: isOnline ? config.color : '#9ca3af'
  };
}

/**
 * Create a custom marker icon
 */
export function createMarkerIcon(
  color: string, 
  isSelected: boolean = false, 
  isOnline: boolean = true
): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: isSelected ? 12 : 8,
    fillColor: color,
    fillOpacity: isOnline ? 0.9 : 0.5,
    strokeColor: isSelected ? '#fbbf24' : '#f8f8f8',
    strokeWeight: isSelected ? 3 : 2,
  };
}

/**
 * Create an info window content for a user
 */
export function createUserInfoWindowContent(user: {
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
}): string {
  const roleConfig = getRoleConfig(user.role, user.isOnline);
  
  return `
    <div style="min-width: 250px; font-family: system-ui; padding: 8px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 20px;">${roleConfig.icon}</span>
        <div>
          <h3 style="margin: 0; font-weight: 600; color: #1f2937; font-size: 16px;">${user.username}</h3>
          <p style="margin: 0; font-size: 13px; color: #6b7280;">${roleConfig.label} • ${user.businessUnit}</p>
        </div>
      </div>
      
      <div style="font-size: 13px; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #6b7280; font-weight: 500;">Status:</span>
          <span style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${user.isOnline ? '#10b981' : '#9ca3af'};"></div>
            <span style="color: ${user.isOnline ? '#10b981' : '#9ca3af'}; font-weight: 500;">
              ${user.isOnline ? 'Online' : 'Offline'}
            </span>
          </span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #6b7280; font-weight: 500;">Location Source:</span>
          <span style="color: #1f2937; font-weight: 500; text-transform: uppercase;">${user.source}</span>
        </div>
        
        ${user.accuracy ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #6b7280; font-weight: 500;">Accuracy:</span>
            <span style="color: #1f2937; font-weight: 500;">±${Math.round(user.accuracy)}m</span>
          </div>
        ` : ''}
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #6b7280; font-weight: 500;">Last Seen:</span>
          <span style="color: #1f2937; font-weight: 500;">${new Date(user.lastSeen).toLocaleTimeString()}</span>
        </div>
        
        <div style="padding-top: 8px; border-top: 1px solid #e5e7eb; margin-top: 8px;">
          <div style="font-size: 11px; color: #9ca3af; font-family: monospace;">
            ${user.latitude.toFixed(6)}, ${user.longitude.toFixed(6)}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create business location info window content
 */
export function createBusinessInfoWindowContent(center: { lat: number; lng: number }): string {
  return `
    <div style="text-align: center; font-family: system-ui; padding: 8px;">
      <h3 style="margin: 0 0 6px 0; font-weight: 600; color: #dc2626; font-size: 16px;">🏢 DEORA Plaza</h3>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Business Location</p>
      <div style="font-size: 11px; color: #9ca3af; margin-top: 8px; font-family: monospace;">
        ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}
      </div>
    </div>
  `;
}