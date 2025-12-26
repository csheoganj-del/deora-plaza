/**
 * Enhanced Readability System for DEORA Dashboard
 * Balances visual beauty with business readability
 */

export type ReadabilityMode = 'beauty' | 'balanced' | 'business' | 'maximum';

export interface ReadabilityConfig {
  mode: ReadabilityMode;
  textContrast: number;
  cardOpacity: number;
  preserveBackgrounds: boolean;
  enhanceBusinessData: boolean;
}

const READABILITY_CONFIGS: Record<ReadabilityMode, ReadabilityConfig> = {
  beauty: {
    mode: 'beauty',
    textContrast: 1.0,
    cardOpacity: 0.1,
    preserveBackgrounds: true,
    enhanceBusinessData: false,
  },
  balanced: {
    mode: 'balanced',
    textContrast: 1.2,
    cardOpacity: 0.3,
    preserveBackgrounds: true,
    enhanceBusinessData: true,
  },
  business: {
    mode: 'business',
    textContrast: 1.5,
    cardOpacity: 0.85,
    preserveBackgrounds: false,
    enhanceBusinessData: true,
  },
  maximum: {
    mode: 'maximum',
    textContrast: 2.0,
    cardOpacity: 0.95,
    preserveBackgrounds: false,
    enhanceBusinessData: true,
  },
};

/**
 * Apply readability mode with smooth transitions
 */
export function applyReadabilityMode(mode: ReadabilityMode = 'beauty') {
  if (typeof document === 'undefined') return;

  const config = READABILITY_CONFIGS[mode];
  const root = document.documentElement;
  const body = document.body;

  // Remove all existing readability classes
  body.classList.remove('readability-beauty', 'readability-balanced', 'readability-business', 'readability-maximum');
  
  // Add new mode class
  body.classList.add(`readability-${mode}`);

  // Set CSS custom properties for smooth transitions
  root.style.setProperty('--readability-text-contrast', config.textContrast.toString());
  root.style.setProperty('--readability-card-opacity', config.cardOpacity.toString());
  root.style.setProperty('--readability-preserve-bg', config.preserveBackgrounds ? '1' : '0');

  // Apply mode-specific styles
  switch (mode) {
    case 'beauty':
      applyBeautyMode();
      break;
    case 'balanced':
      applyBalancedMode();
      break;
    case 'business':
      applyBusinessMode();
      break;
    case 'maximum':
      applyMaximumMode();
      break;
  }

  // Save preference
  localStorage.setItem('deora-readability-mode', mode);
  
  console.log(`✅ Applied readability mode: ${mode}`);
}

function applyBeautyMode() {
  const root = document.documentElement;
  
  // Preserve all backgrounds and glass effects
  root.style.setProperty('--enhanced-text-primary', 'rgba(255, 255, 255, 0.95)');
  root.style.setProperty('--enhanced-text-secondary', 'rgba(255, 255, 255, 0.8)');
  root.style.setProperty('--enhanced-card-bg', 'transparent');
  root.style.setProperty('--enhanced-card-border', 'transparent');
}

function applyBalancedMode() {
  const root = document.documentElement;
  
  // Subtle enhancement for better readability while preserving beauty
  root.style.setProperty('--enhanced-text-primary', 'rgba(255, 255, 255, 1)');
  root.style.setProperty('--enhanced-text-secondary', 'rgba(255, 255, 255, 0.9)');
  root.style.setProperty('--enhanced-card-bg', 'rgba(255, 255, 255, 0.1)');
  root.style.setProperty('--enhanced-card-border', 'rgba(255, 255, 255, 0.15)');
}

function applyBusinessMode() {
  const root = document.documentElement;
  
  // High contrast for business data while maintaining some visual appeal
  root.style.setProperty('--enhanced-text-primary', '#1a1a1a');
  root.style.setProperty('--enhanced-text-secondary', '#4a4a4a');
  root.style.setProperty('--enhanced-card-bg', 'rgba(255, 255, 255, 0.85)');
  root.style.setProperty('--enhanced-card-border', 'rgba(0, 0, 0, 0.1)');
}

function applyMaximumMode() {
  const root = document.documentElement;
  
  // Maximum contrast for accessibility and critical business operations
  root.style.setProperty('--enhanced-text-primary', '#000000');
  root.style.setProperty('--enhanced-text-secondary', '#333333');
  root.style.setProperty('--enhanced-card-bg', 'rgba(255, 255, 255, 0.95)');
  root.style.setProperty('--enhanced-card-border', 'rgba(0, 0, 0, 0.15)');
}

/**
 * Initialize readability system
 */
export function initializeReadabilitySystem() {
  if (typeof document === 'undefined') return;

  // Get saved preference or default to beauty mode
  const savedMode = localStorage.getItem('deora-readability-mode') as ReadabilityMode || 'beauty';
  
  // Apply the mode
  applyReadabilityMode(savedMode);
  
  return savedMode;
}

/**
 * Toggle between beauty and business modes
 */
export function toggleReadabilityMode(): ReadabilityMode {
  const currentMode = localStorage.getItem('deora-readability-mode') as ReadabilityMode || 'beauty';
  
  const nextMode: ReadabilityMode = currentMode === 'beauty' ? 'business' : 'beauty';
  
  applyReadabilityMode(nextMode);
  
  return nextMode;
}

/**
 * Get current readability mode
 */
export function getCurrentReadabilityMode(): ReadabilityMode {
  return localStorage.getItem('deora-readability-mode') as ReadabilityMode || 'beauty';
}