"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeRouteAwareStyling, applyRouteSpecificStyling, detectRouteType } from '@/lib/route-aware-styling';

/**
 * Route-Aware Styling Initializer
 * Automatically applies route-specific styling based on current path
 */
export function RouteAwareInitializer() {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize the route-aware styling system
    initializeRouteAwareStyling();
  }, []);

  useEffect(() => {
    // Apply styling when route changes
    const routeType = detectRouteType();
    applyRouteSpecificStyling(routeType);
  }, [pathname]);

  return null; // This component doesn't render anything
}