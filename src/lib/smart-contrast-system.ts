/**
 * Smart Contrast System
 * Automatically adjusts contrast based on environment and user preferences
 */

export type ContrastLevel = 'low' | 'medium' | 'high' | 'maximum';

const CONTRAST_STORAGE_KEY = 'deora-contrast-level';

/**
 * Initialize smart contrast system
 */
export function initializeSmartContrast(level: ContrastLevel = 'high') {
  const body = document.body;
  
  // Remove existing contrast classes
  body.classList.remove(
    'smart-contrast-low',
    'smart-contrast-medium',
    'smart-contrast-high',
    'smart-contrast-maximum'
  );
  
  // Add new contrast class
  body.classList.add('smart-contrast-active', `smart-contrast-${level}`);
  
  // Apply dynamic styles
  applyContrastStyles(level);
  
  // Store preference
  localStorage.setItem(CONTRAST_STORAGE_KEY, level);
  
  console.log(`Applied smart contrast: ${level}`);
}

/**
 * Auto-detect optimal contrast level based on environment
 */
export function autoDetectContrastLevel(): ContrastLevel {
  // Check for user preferences
  if (window.matchMedia('(prefers-contrast: high)').matches) {
    return 'maximum';
  }
  
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'high';
  }
  
  // Check time of day (higher contrast during work hours)
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 17) {
    return 'high';
  }
  
  return 'medium';
}

/**
 * Apply contrast-specific styles
 */
function applyContrastStyles(level: ContrastLevel) {
  const styleId = 'smart-contrast-styles';
  let style = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!style) {
    style = document.createElement('style');
    style.id = styleId;
    document.head.appendChild(style);
  }
  
  const styles = {
    low: `
      .smart-contrast-low .glass-card,
      .smart-contrast-low [class*="glass"] {
        background: rgba(255, 255, 255, 0.15) !important;
        backdrop-filter: blur(20px) !important;
      }
      .smart-contrast-low .text-primary {
        color: rgba(255, 255, 255, 0.9) !important;
      }
    `,
    medium: `
      .smart-contrast-medium .glass-card,
      .smart-contrast-medium [class*="glass"] {
        background: rgba(255, 255, 255, 0.25) !important;
        backdrop-filter: blur(16px) !important;
      }
      .smart-contrast-medium .text-primary {
        color: rgba(255, 255, 255, 0.95) !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
      }
    `,
    high: `
      .smart-contrast-high .glass-card,
      .smart-contrast-high [class*="glass"] {
        background: rgba(255, 255, 255, 0.4) !important;
        backdrop-filter: blur(12px) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
      }
      .smart-contrast-high .text-primary {
        color: rgba(255, 255, 255, 0.98) !important;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4) !important;
      }
    `,
    maximum: `
      .smart-contrast-maximum .glass-card,
      .smart-contrast-maximum [class*="glass"] {
        background: rgba(255, 255, 255, 0.9) !important;
        backdrop-filter: blur(4px) !important;
        border: 2px solid rgba(0, 0, 0, 0.1) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      }
      .smart-contrast-maximum .text-primary {
        color: rgba(0, 0, 0, 0.9) !important;
        text-shadow: none !important;
      }
      .smart-contrast-maximum {
        background: #f8f9fa !important;
      }
    `
  };
  
  style.textContent = styles[level];
}