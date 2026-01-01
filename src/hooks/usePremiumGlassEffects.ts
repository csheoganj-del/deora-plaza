"use client";

import { useEffect } from 'react';
import { premiumGlassEffects } from '@/lib/premium-glass-effects';

/**
 * Hook to initialize premium glass effects on dashboard
 */
export function usePremiumGlassEffects() {
  useEffect(() => {
    // Initialize effects after component mount
    const timer = setTimeout(() => {
      premiumGlassEffects.init();
    }, 100);

    // Initialize scroll depth effect
    const cleanupScrollDepth = premiumGlassEffects.initScrollDepth();

    return () => {
      clearTimeout(timer);
      if (cleanupScrollDepth) {
        cleanupScrollDepth();
      }
    };
  }, []);

  return {
    addButtonRipple: premiumGlassEffects.addButtonRipple.bind(premiumGlassEffects),
    animateModalEntrance: premiumGlassEffects.animateModalEntrance.bind(premiumGlassEffects),
  };
}