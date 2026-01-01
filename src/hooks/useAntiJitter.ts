"use client";

import { useEffect } from 'react';

/**
 * Hook to disable jittering animations globally
 * This provides a programmatic way to control anti-jitter behavior
 */
export function useAntiJitter(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    // Add anti-jitter class to body
    document.body.classList.add('anti-jitter-mode');

    // Override Framer Motion's default behavior
    const style = document.createElement('style');
    style.id = 'anti-jitter-override';
    style.textContent = `
      .anti-jitter-mode * {
        transform: translateZ(0) !important;
        will-change: auto !important;
      }
      
      .anti-jitter-mode *:hover {
        transform: translateZ(0) !important;
      }
      
      .anti-jitter-mode [data-framer-motion] {
        transform: translateZ(0) !important;
      }
      
      .anti-jitter-mode [data-framer-motion]:hover {
        transform: translateZ(0) !important;
      }
    `;
    
    document.head.appendChild(style);

    return () => {
      document.body.classList.remove('anti-jitter-mode');
      const existingStyle = document.getElementById('anti-jitter-override');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [enabled]);

  return {
    isAntiJitterEnabled: enabled
  };
}

/**
 * Utility function to create jitter-free motion props
 */
export function createAntiJitterMotionProps(originalProps: any = {}) {
  return {
    ...originalProps,
    whileHover: {
      transition: { duration: 0.2 }
    },
    style: {
      transform: 'translateZ(0)',
      ...originalProps.style
    }
  };
}