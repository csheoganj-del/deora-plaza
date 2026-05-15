"use client";

import { useEffect, useState } from 'react';
import { initializeGlobalBackground, shouldSyncBackground } from '@/lib/global-background-sync';
import { initializeRouteAwareStyling } from '@/lib/route-aware-styling';

/**
 * Background Initializer Component
 * Initializes global background synchronization and route-aware styling
 * Should be included in the root layout
 */
export function BackgroundInitializer() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      console.log('🎨 BackgroundInitializer: Starting global background initialization...');
      
      // Use requestAnimationFrame to ensure DOM is ready and avoid hydration issues
      requestAnimationFrame(() => {
        // Initialize route-aware styling first
        const currentRoute = initializeRouteAwareStyling();
        
        // Initialize global background system for login and dashboard routes
        if (shouldSyncBackground()) {
          console.log('🌍 Route supports background sync - enabling global background system');
          initializeGlobalBackground();
        } else {
          console.log('🏢 Route does not support background sync - using default styling');
        }
      });
      
      // Listen for route changes to reinitialize styling
      const handleRouteChange = () => {
        console.log('🔄 Route changed, reinitializing global background system...');
        setTimeout(() => {
          initializeRouteAwareStyling();
          if (shouldSyncBackground()) {
            initializeGlobalBackground();
          }
        }, 100);
      };
      
      window.addEventListener('popstate', handleRouteChange);
      
      // Listen for Next.js navigation events
      if (typeof window !== 'undefined') {
        // Use MutationObserver to detect URL changes in Next.js
        let lastUrl = window.location.href;
        const observer = new MutationObserver(() => {
          const currentUrl = window.location.href;
          if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            handleRouteChange();
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Also listen for pushstate/replacestate
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
          observer.disconnect();
          history.pushState = originalPushState;
          history.replaceState = originalReplaceState;
        };
      }
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, [isClient]);

  // This component doesn't render anything
  return null;
}