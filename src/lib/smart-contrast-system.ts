/**
 * Smart Contrast System for Dashboard Readability
 * Automatically adjusts colors based on background for optimal readability
 */

export interface ContrastColors {
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Card colors
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  
  // Interactive elements
  buttonPrimary: string;
  buttonSecondary: string;
  buttonText: string;
  
  // Status colors
  success: string;
  warning: string;
  danger: string;
  
  // Sidebar and navigation
  sidebarBg: string;
  sidebarText: string;
  sidebarHover: string;
}

export type ContrastLevel = 'low' | 'medium' | 'high' | 'maximum';

/**
 * Generate smart contrast colors with different intensity levels
 */
export function generateSmartContrastColors(level: ContrastLevel = 'high'): ContrastColors {
  const configs = {
    low: {
      cardOpacity: 0.85,
      textPrimary: '#2d3748',
      textSecondary: '#4a5568',
      shadowOpacity: 0.1,
      borderOpacity: 0.06,
    },
    medium: {
      cardOpacity: 0.90,
      textPrimary: '#1a202c',
      textSecondary: '#2d3748',
      shadowOpacity: 0.12,
      borderOpacity: 0.08,
    },
    high: {
      cardOpacity: 0.95,
      textPrimary: '#1a1a1a',
      textSecondary: '#4a4a4a',
      shadowOpacity: 0.15,
      borderOpacity: 0.1,
    },
    maximum: {
      cardOpacity: 0.98,
      textPrimary: '#000000',
      textSecondary: '#333333',
      shadowOpacity: 0.2,
      borderOpacity: 0.12,
    }
  };

  const config = configs[level];
  
  return {
    // Enhanced text contrast
    textPrimary: config.textPrimary,
    textSecondary: config.textSecondary,
    textMuted: '#6a6a6a',
    
    // Premium card styling
    cardBackground: `rgba(255, 255, 255, ${config.cardOpacity})`,
    cardBorder: `rgba(0, 0, 0, ${config.borderOpacity})`,
    cardShadow: `rgba(0, 0, 0, ${config.shadowOpacity})`,
    
    // Professional buttons
    buttonPrimary: '#2563eb',
    buttonSecondary: `rgba(255, 255, 255, ${config.cardOpacity})`,
    buttonText: '#ffffff',
    
    // High-contrast status colors
    success: '#059669',
    warning: '#d97706', 
    danger: '#dc2626',
    
    // Premium sidebar
    sidebarBg: `rgba(255, 255, 255, ${config.cardOpacity - 0.03})`,
    sidebarText: config.textPrimary,
    sidebarHover: 'rgba(59, 130, 246, 0.08)',
  };
}

/**
 * Apply smart contrast colors with enhanced styling
 */
export function applySmartContrastColors(colors: ContrastColors, level: ContrastLevel = 'high') {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Apply all color variables
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = `--smart-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
  
  // Add level-specific class
  document.body.classList.remove('smart-contrast-low', 'smart-contrast-medium', 'smart-contrast-high', 'smart-contrast-maximum');
  document.body.classList.add(`smart-contrast-${level}`, 'smart-contrast-active');
  
  console.log(`✅ Applied smart contrast (${level} level) for enhanced readability`);
}

/**
 * Initialize smart contrast with auto-detection
 */
export function initializeSmartContrast(level?: ContrastLevel) {
  // Check user preference first
  const savedLevel = localStorage.getItem('deora-contrast-level') as ContrastLevel;
  
  // Auto-detect optimal level if not specified
  const autoLevel = level || savedLevel || autoDetectContrastLevel();
  
  const colors = generateSmartContrastColors(autoLevel);
  applySmartContrastColors(colors, autoLevel);
  
  return autoLevel;
}

/**
 * Auto-detect optimal contrast based on page type
 */
export function autoDetectContrastLevel(): ContrastLevel {
  const pathname = window.location.pathname;
  
  // High-data pages need maximum readability
  if (pathname.includes('/billing') || pathname.includes('/reports') || pathname.includes('/analytics')) {
    return 'maximum';
  }
  
  // Dashboard pages need high readability
  if (pathname.includes('/dashboard')) {
    return 'high';
  }
  
  // Other pages can use medium
  return 'medium';
}