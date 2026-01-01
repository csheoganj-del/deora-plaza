"use client";

import { useEffect } from 'react';

/**
 * Hook to manage system background effects
 * Applies Apple-grade atmospheric background styling
 */
export function useSystemBackground() {
  useEffect(() => {
    // Apply system background class to body
    document.body.classList.add('system-background');
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('system-background');
    };
  }, []);

  return {
    isActive: true,
    toggle: () => {
      document.body.classList.toggle('system-background');
    }
  };
}