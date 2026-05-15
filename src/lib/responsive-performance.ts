/**
 * Responsive Performance Utilities for Apple-Grade UI
 * Handles device capability detection and performance optimization
 */

export interface DeviceCapabilities {
  supportsBackdropFilter: boolean;
  supportsWebkitBackdropFilter: boolean;
  isLowEndDevice: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasReducedMotion: boolean;
  hasHighContrast: boolean;
  pixelRatio: number;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
}

export class ResponsivePerformanceManager {
  private capabilities: DeviceCapabilities;
  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.capabilities = this.detectCapabilities();
    this.initializePerformanceMonitoring();
    this.applyOptimizations();
  }

  private detectCapabilities(): DeviceCapabilities {
    const isMobile = window.innerWidth <= 640;
    const isTablet = window.innerWidth > 640 && window.innerWidth <= 1024;
    const isDesktop = window.innerWidth > 1024;

    return {
      supportsBackdropFilter: CSS.supports('backdrop-filter', 'blur(16px)'),
      supportsWebkitBackdropFilter: CSS.supports('-webkit-backdrop-filter', 'blur(16px)'),
      isLowEndDevice: this.detectLowEndDevice(),
      isMobile,
      isTablet,
      isDesktop,
      hasReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      hasHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
      pixelRatio: window.devicePixelRatio || 1,
      connectionSpeed: this.detectConnectionSpeed(),
    };
  }

  private detectLowEndDevice(): boolean {
    // Check for low-end device indicators
    const memory = (navigator as any).deviceMemory;
    const hardwareConcurrency = navigator.hardwareConcurrency;
    
    if (memory && memory < 4) return true;
    if (hardwareConcurrency && hardwareConcurrency < 4) return true;
    
    // Check for slow performance
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      Math.random();
    }
    const duration = performance.now() - start;
    
    return duration > 10; // If simple operations take too long
  }

  private detectConnectionSpeed(): 'slow' | 'fast' | 'unknown' {
    const connection = (navigator as any).connection;
    if (!connection) return 'unknown';
    
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
    if (effectiveType === '3g') return 'slow';
    return 'fast';
  }

  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure' && entry.duration > 16) {
            // Frame took longer than 16ms (60fps threshold)
            this.handleSlowFrame(entry);
          }
        });
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('Performance monitoring not supported:', error);
      }
    }
  }

  private handleSlowFrame(entry: PerformanceEntry): void {
    // Reduce effects if frames are dropping
    document.documentElement.classList.add('apple-performance-monitor');
    
    // Remove class after a delay to re-enable effects
    setTimeout(() => {
      document.documentElement.classList.remove('apple-performance-monitor');
    }, 5000);
  }

  private applyOptimizations(): void {
    const { capabilities } = this;
    const root = document.documentElement;

    // Apply capability-based classes
    if (!capabilities.supportsBackdropFilter && !capabilities.supportsWebkitBackdropFilter) {
      root.classList.add('no-backdrop-filter');
    }

    if (capabilities.isLowEndDevice) {
      root.classList.add('low-end-device');
    }

    if (capabilities.connectionSpeed === 'slow') {
      root.classList.add('slow-connection');
    }

    if (capabilities.hasReducedMotion) {
      root.classList.add('reduced-motion');
    }

    if (capabilities.hasHighContrast) {
      root.classList.add('high-contrast');
    }

    // Set CSS custom properties based on capabilities
    root.style.setProperty('--device-pixel-ratio', capabilities.pixelRatio.toString());
    
    if (capabilities.isLowEndDevice) {
      root.style.setProperty('--glass-blur', '6px');
      root.style.setProperty('--duration-fast', '0.1s');
      root.style.setProperty('--duration-normal', '0.2s');
    }
  }

  public getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities };
  }

  public optimizeForDevice(): void {
    const { capabilities } = this;
    
    if (capabilities.isMobile) {
      this.optimizeForMobile();
    } else if (capabilities.isTablet) {
      this.optimizeForTablet();
    } else {
      this.optimizeForDesktop();
    }
  }

  private optimizeForMobile(): void {
    // Reduce glass blur for better performance
    document.documentElement.style.setProperty('--glass-blur', '12px');
    
    // Disable hover effects
    document.documentElement.classList.add('mobile-optimized');
  }

  private optimizeForTablet(): void {
    // Moderate glass blur
    document.documentElement.style.setProperty('--glass-blur', '14px');
  }

  private optimizeForDesktop(): void {
    // Full glass blur for desktop
    document.documentElement.style.setProperty('--glass-blur', '16px');
  }

  public enableLazyBlur(): void {
    // Enable lazy loading of blur effects
    const lazyBlurElements = document.querySelectorAll('.apple-lazy-blur');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('loaded');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px',
    });

    lazyBlurElements.forEach((element) => {
      observer.observe(element);
    });
  }

  public measurePerformance(name: string, fn: () => void): void {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }

  public cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Singleton instance
export const responsivePerformanceManager = new ResponsivePerformanceManager();

// Utility functions
export function isBackdropFilterSupported(): boolean {
  return CSS.supports('backdrop-filter', 'blur(16px)') || 
         CSS.supports('-webkit-backdrop-filter', 'blur(16px)');
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function getOptimalBlurValue(): string {
  const capabilities = responsivePerformanceManager.getCapabilities();
  
  if (capabilities.isLowEndDevice) return '6px';
  if (capabilities.isMobile) return '12px';
  if (capabilities.isTablet) return '14px';
  return '16px';
}

export function shouldUseReducedEffects(): boolean {
  const capabilities = responsivePerformanceManager.getCapabilities();
  return capabilities.isLowEndDevice || 
         capabilities.connectionSpeed === 'slow' || 
         capabilities.hasReducedMotion;
}

// Initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    responsivePerformanceManager.optimizeForDevice();
    responsivePerformanceManager.enableLazyBlur();
  });

  // Handle resize events
  window.addEventListener('resize', () => {
    responsivePerformanceManager.optimizeForDevice();
  });

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    responsivePerformanceManager.cleanup();
  });
}