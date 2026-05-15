/**
 * 🌍 Global Background Synchronization System
 * Ensures background and adaptive colors are consistent across login and dashboard
 */

"use client";

import { 
  BackgroundPreference,
  getBackgroundPreferences,
  applyBackgroundToDocument,
  applyAdaptiveColors,
  initializeBackgroundSystem
} from './background-preferences';

export interface GlobalBackgroundState {
  isInitialized: boolean;
  currentBackground: BackgroundPreference | null;
  isTransitioning: boolean;
}

let globalState: GlobalBackgroundState = {
  isInitialized: false,
  currentBackground: null,
  isTransitioning: false
};

/**
 * Initialize global background system for any page
 */
export function initializeGlobalBackground(): void {
  if (typeof window === 'undefined') return;
  
  console.log('🌍 Initializing global background system...');
  
  // Load saved preferences
  const preferences = getBackgroundPreferences();
  
  if (preferences.current) {
    console.log('🎨 Found saved background:', preferences.current.name);
    globalState.currentBackground = preferences.current;
    
    // Apply immediately
    applyBackgroundToDocument(preferences.current);
    
    // Apply adaptive colors if available
    if (preferences.current.dominantColors) {
      applyAdaptiveColors(preferences.current.dominantColors);
    }
  } else {
    console.log('⚠️ No saved background, initializing default system');
    initializeBackgroundSystem();
  }
  
  globalState.isInitialized = true;
  
  // Listen for background changes from other tabs/windows
  window.addEventListener('storage', handleStorageChange);
  
  // Listen for custom background change events
  window.addEventListener('background-preferences-changed', handleBackgroundChange);
  
  console.log('✅ Global background system initialized');
}

/**
 * Handle storage changes from other tabs
 */
function handleStorageChange(event: StorageEvent): void {
  if (event.key === 'deora-background-preferences' && event.newValue) {
    try {
      const newPreferences = JSON.parse(event.newValue);
      if (newPreferences.current) {
        console.log('🔄 Background changed in another tab, syncing...');
        syncBackgroundFromStorage(newPreferences.current);
      }
    } catch (error) {
      console.warn('Failed to parse background preferences from storage:', error);
    }
  }
}

/**
 * Handle background change events
 */
function handleBackgroundChange(event: CustomEvent): void {
  const preferences = event.detail;
  if (preferences.current && preferences.current.id !== globalState.currentBackground?.id) {
    console.log('🔄 Background changed via event, syncing...');
    syncBackgroundFromStorage(preferences.current);
  }
}

/**
 * Sync background from storage change
 */
function syncBackgroundFromStorage(background: BackgroundPreference): void {
  if (globalState.isTransitioning) return;
  
  globalState.isTransitioning = true;
  globalState.currentBackground = background;
  
  // Apply with smooth transition
  requestAnimationFrame(() => {
    applyBackgroundToDocument(background);
    
    if (background.dominantColors) {
      applyAdaptiveColors(background.dominantColors);
    }
    
    setTimeout(() => {
      globalState.isTransitioning = false;
    }, 300);
  });
}

/**
 * Get current global background state
 */
export function getGlobalBackgroundState(): GlobalBackgroundState {
  return { ...globalState };
}

/**
 * Force refresh background from storage
 */
export function refreshGlobalBackground(): void {
  const preferences = getBackgroundPreferences();
  if (preferences.current) {
    syncBackgroundFromStorage(preferences.current);
  }
}

/**
 * Clean up global background system
 */
export function cleanupGlobalBackground(): void {
  if (typeof window === 'undefined') return;
  
  window.removeEventListener('storage', handleStorageChange);
  window.removeEventListener('background-preferences-changed', handleBackgroundChange);
  
  globalState.isInitialized = false;
}

/**
 * Check if we're on a route that should have background sync
 */
export function shouldSyncBackground(): boolean {
  if (typeof window === 'undefined') return false;
  
  const pathname = window.location.pathname;
  
  // Sync on login and dashboard routes
  return pathname === '/login' || 
         pathname.startsWith('/login') || 
         pathname === '/dashboard' || 
         pathname.startsWith('/dashboard');
}

/**
 * Apply background with route-specific optimizations
 */
export function applyBackgroundForRoute(background: BackgroundPreference): void {
  if (!shouldSyncBackground()) return;
  
  const pathname = window.location.pathname;
  
  console.log(`🎯 Applying background for route: ${pathname}`);
  
  // Apply background
  applyBackgroundToDocument(background);
  
  // Apply adaptive colors with route-specific enhancements
  if (background.dominantColors) {
    applyAdaptiveColors(background.dominantColors);
    
    // Add route-specific body classes for enhanced styling
    document.body.classList.add('global-background-active');
    
    if (pathname.startsWith('/dashboard')) {
      document.body.classList.add('dashboard-background-sync');
    } else if (pathname.startsWith('/login')) {
      document.body.classList.add('login-background-sync');
    }
  }
}

/**
 * React hook for global background state
 */
export function useGlobalBackground() {
  if (typeof window === 'undefined') {
    return {
      isInitialized: false,
      currentBackground: null,
      isTransitioning: false,
      initialize: () => {},
      refresh: () => {},
      cleanup: () => {}
    };
  }
  
  return {
    ...getGlobalBackgroundState(),
    initialize: initializeGlobalBackground,
    refresh: refreshGlobalBackground,
    cleanup: cleanupGlobalBackground
  };
}