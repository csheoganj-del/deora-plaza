/**
 * 🌍 Global Background Initializer Component
 * Ensures background synchronization across login and dashboard
 */

"use client";

import { useEffect, useState } from 'react';
import { initializeGlobalBackground, shouldSyncBackground, refreshGlobalBackground } from '@/lib/global-background-sync';
import { useBackgroundPreferences } from '@/hooks/useBackgroundPreferences';

interface GlobalBackgroundInitializerProps {
  children?: React.ReactNode;
}

export function GlobalBackgroundInitializer({ children }: GlobalBackgroundInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { preferences, current } = useBackgroundPreferences();

  // Initialize global background system
  useEffect(() => {
    if (!shouldSyncBackground()) {
      console.log('🚫 Route does not require background sync');
      return;
    }

    console.log('🌍 Initializing global background for route...');
    
    // Initialize the global system
    initializeGlobalBackground();
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up global background system');
    };
  }, []);

  // Sync when background changes
  useEffect(() => {
    if (!isInitialized || !current) return;

    console.log('🔄 Background changed, refreshing global state...');
    refreshGlobalBackground();
  }, [current, isInitialized]);

  // Listen for route changes and refresh background
  useEffect(() => {
    if (!isInitialized) return;

    const handleRouteChange = () => {
      if (shouldSyncBackground()) {
        console.log('🔄 Route changed, refreshing background...');
        setTimeout(() => {
          refreshGlobalBackground();
        }, 100);
      }
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleRouteChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleRouteChange();
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [isInitialized]);

  // Force background application on mount for immediate effect
  useEffect(() => {
    if (!isInitialized || !current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      console.log('🎨 Force applying current background...');
      refreshGlobalBackground();
    }, 50);

    return () => clearTimeout(timer);
  }, [isInitialized, current]);

  return <>{children}</>;
}

/**
 * Hook to check if global background is active
 */
export function useGlobalBackgroundStatus() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const hasClass = document.body.classList.contains('global-background-active');
      setIsActive(hasClass);
    };

    // Check immediately
    checkStatus();

    // Set up observer for class changes
    const observer = new MutationObserver(checkStatus);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return isActive;
}