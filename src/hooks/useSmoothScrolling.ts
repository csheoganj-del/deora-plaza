"use client";

import { useEffect, useRef } from 'react';

interface SmoothScrollOptions {
  friction?: number;
  maxVelocity?: number;
  enabled?: boolean;
}

/**
 * Smooth Inertia Scrolling Hook
 * Provides Mac-like trackpad scrolling with momentum
 */
export function useSmoothScrolling({
  friction = 0.85,
  maxVelocity = 50,
  enabled = true
}: SmoothScrollOptions = {}) {
  const velocityRef = useRef(0);
  const isScrollingRef = useRef(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const momentum = () => {
      isScrollingRef.current = true;
      
      // Apply scroll with current velocity
      window.scrollBy(0, velocityRef.current);
      
      // Apply friction
      velocityRef.current *= friction;
      
      // Continue if velocity is significant
      if (Math.abs(velocityRef.current) > 0.5) {
        rafRef.current = requestAnimationFrame(momentum);
      } else {
        isScrollingRef.current = false;
        velocityRef.current = 0;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Add to velocity (clamped to max)
      const deltaY = Math.max(-maxVelocity, Math.min(maxVelocity, e.deltaY * 0.8));
      velocityRef.current += deltaY;
      
      // Start momentum if not already scrolling
      if (!isScrollingRef.current) {
        rafRef.current = requestAnimationFrame(momentum);
      }
    };

    // Add wheel listener with passive: false to allow preventDefault
    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [friction, maxVelocity, enabled]);

  // Return control functions
  return {
    stop: () => {
      velocityRef.current = 0;
      isScrollingRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    setVelocity: (velocity: number) => {
      velocityRef.current = velocity;
      if (!isScrollingRef.current && Math.abs(velocity) > 0.5) {
        const momentum = () => {
          isScrollingRef.current = true;
          window.scrollBy(0, velocityRef.current);
          velocityRef.current *= friction;
          
          if (Math.abs(velocityRef.current) > 0.5) {
            rafRef.current = requestAnimationFrame(momentum);
          } else {
            isScrollingRef.current = false;
            velocityRef.current = 0;
          }
        };
        rafRef.current = requestAnimationFrame(momentum);
      }
    }
  };
}