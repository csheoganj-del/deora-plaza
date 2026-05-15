/**
 * React Hook for Responsive Performance Management
 * Provides device capabilities and performance optimization utilities
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  responsivePerformanceManager, 
  DeviceCapabilities,
  isBackdropFilterSupported,
  isTouchDevice,
  getOptimalBlurValue,
  shouldUseReducedEffects
} from '@/lib/responsive-performance';

export interface UseResponsivePerformanceReturn {
  capabilities: DeviceCapabilities;
  isBackdropFilterSupported: boolean;
  isTouchDevice: boolean;
  optimalBlurValue: string;
  shouldUseReducedEffects: boolean;
  measurePerformance: (name: string, fn: () => void) => void;
  optimizeForDevice: () => void;
  enableLazyBlur: () => void;
}

export function useResponsivePerformance(): UseResponsivePerformanceReturn {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => 
    responsivePerformanceManager.getCapabilities()
  );

  const [backdropFilterSupported, setBackdropFilterSupported] = useState(() => 
    isBackdropFilterSupported()
  );

  const [touchDevice, setTouchDevice] = useState(() => 
    isTouchDevice()
  );

  const [optimalBlur, setOptimalBlur] = useState(() => 
    getOptimalBlurValue()
  );

  const [reducedEffects, setReducedEffects] = useState(() => 
    shouldUseReducedEffects()
  );

  // Update capabilities on resize
  useEffect(() => {
    const handleResize = () => {
      const newCapabilities = responsivePerformanceManager.getCapabilities();
      setCapabilities(newCapabilities);
      setOptimalBlur(getOptimalBlurValue());
      setReducedEffects(shouldUseReducedEffects());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Monitor media query changes
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleMediaQueryChange = () => {
      const newCapabilities = responsivePerformanceManager.getCapabilities();
      setCapabilities(newCapabilities);
      setReducedEffects(shouldUseReducedEffects());
    };

    reducedMotionQuery.addEventListener('change', handleMediaQueryChange);
    highContrastQuery.addEventListener('change', handleMediaQueryChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleMediaQueryChange);
      highContrastQuery.removeEventListener('change', handleMediaQueryChange);
    };
  }, []);

  const measurePerformance = useCallback((name: string, fn: () => void) => {
    responsivePerformanceManager.measurePerformance(name, fn);
  }, []);

  const optimizeForDevice = useCallback(() => {
    responsivePerformanceManager.optimizeForDevice();
  }, []);

  const enableLazyBlur = useCallback(() => {
    responsivePerformanceManager.enableLazyBlur();
  }, []);

  return {
    capabilities,
    isBackdropFilterSupported: backdropFilterSupported,
    isTouchDevice: touchDevice,
    optimalBlurValue: optimalBlur,
    shouldUseReducedEffects: reducedEffects,
    measurePerformance,
    optimizeForDevice,
    enableLazyBlur,
  };
}

// Utility hook for glass card optimization
export function useGlassCardOptimization() {
  const { capabilities, optimalBlurValue, shouldUseReducedEffects } = useResponsivePerformance();

  const getGlassCardProps = useCallback(() => {
    const baseProps = {
      className: 'apple-glass-card',
      style: {} as React.CSSProperties,
    };

    if (shouldUseReducedEffects) {
      baseProps.className += ' apple-performance-monitor';
    }

    if (!capabilities.supportsBackdropFilter && !capabilities.supportsWebkitBackdropFilter) {
      baseProps.style.backdropFilter = 'none';
      baseProps.style.WebkitBackdropFilter = 'none';
      baseProps.style.background = 'rgba(255, 255, 255, 0.9)';
    } else {
      baseProps.style.backdropFilter = `blur(${optimalBlurValue}) saturate(150%)`;
      baseProps.style.WebkitBackdropFilter = `blur(${optimalBlurValue}) saturate(150%)`;
    }

    return baseProps;
  }, [capabilities, optimalBlurValue, shouldUseReducedEffects]);

  return { getGlassCardProps };
}

// Utility hook for button optimization
export function useButtonOptimization() {
  const { capabilities, isTouchDevice } = useResponsivePerformance();

  const getButtonProps = useCallback((variant: 'primary' | 'secondary' = 'primary') => {
    const baseProps = {
      className: `apple-button-${variant}`,
      style: {} as React.CSSProperties,
    };

    if (isTouchDevice) {
      baseProps.style.minHeight = '44px';
      baseProps.style.minWidth = '44px';
    }

    if (capabilities.hasReducedMotion) {
      baseProps.className += ' reduced-motion';
    }

    return baseProps;
  }, [capabilities, isTouchDevice]);

  return { getButtonProps };
}

// Utility hook for responsive text sizing
export function useResponsiveText() {
  const { capabilities } = useResponsivePerformance();

  const getTextSize = useCallback((baseSize: number) => {
    if (capabilities.isMobile) {
      return Math.max(16, baseSize * 0.9); // Ensure minimum 16px on mobile
    }
    if (capabilities.isTablet) {
      return baseSize * 0.95;
    }
    return baseSize;
  }, [capabilities]);

  const getTextProps = useCallback((variant: 'display' | 'heading' | 'body' | 'caption') => {
    return {
      className: `apple-text-${variant}`,
      style: {
        fontSize: capabilities.isMobile && variant === 'body' ? '16px' : undefined, // Prevent zoom on iOS
      } as React.CSSProperties,
    };
  }, [capabilities]);

  return { getTextSize, getTextProps };
}