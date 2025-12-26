/**
 * 🎨 Global Background Preferences System
 * Manages background customization across all pages for each device
 */

import { extractDominantColors } from './color-adaptation';

export interface BackgroundPreference {
  id: string;
  name: string;
  type: 'image' | 'gradient' | 'solid';
  value: string; // URL for image, CSS for gradient/solid
  dominantColors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
  };
  timestamp: number;
}

export interface BackgroundPreferences {
  current: BackgroundPreference | null;
  favorites: BackgroundPreference[];
  recent: BackgroundPreference[];
}

const STORAGE_KEY = 'deora-background-preferences';
const MAX_RECENT = 10;
const MAX_FAVORITES = 20;

/**
 * Get current background preferences from localStorage
 */
export function getBackgroundPreferences(): BackgroundPreferences {
  if (typeof window === 'undefined') {
    return { current: null, favorites: [], recent: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load background preferences:', error);
  }

  return { current: null, favorites: [], recent: [] };
}

/**
 * Save background preferences to localStorage
 */
export function saveBackgroundPreferences(preferences: BackgroundPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('background-preferences-changed', {
      detail: preferences
    }));
  } catch (error) {
    console.warn('Failed to save background preferences:', error);
  }
}

/**
 * Set current background and update preferences
 */
export async function setCurrentBackground(background: Omit<BackgroundPreference, 'timestamp'>): Promise<void> {
  console.log('🎯 Setting new background:', background);
  
  const preferences = getBackgroundPreferences();
  
  const newBackground: BackgroundPreference = {
    ...background,
    timestamp: Date.now()
  };

  // Extract colors if it's an image
  if (background.type === 'image' && background.value) {
    try {
      console.log('🎨 Extracting colors from image...');
      const colors = await extractDominantColors(background.value);
      newBackground.dominantColors = colors;
      console.log('✅ Colors extracted:', colors);
    } catch (error) {
      console.warn('⚠️ Failed to extract colors:', error);
    }
  }

  // Update current
  preferences.current = newBackground;

  // Add to recent (remove duplicates first)
  preferences.recent = preferences.recent.filter(bg => bg.id !== background.id);
  preferences.recent.unshift(newBackground);
  preferences.recent = preferences.recent.slice(0, MAX_RECENT);

  console.log('💾 Saving preferences:', preferences);
  saveBackgroundPreferences(preferences);
  
  // Apply immediately
  console.log('🚀 Applying background immediately...');
  applyBackgroundToDocument(newBackground);
}

/**
 * Add background to favorites
 */
export function addToFavorites(background: BackgroundPreference): void {
  const preferences = getBackgroundPreferences();
  
  // Check if already in favorites
  if (preferences.favorites.some(bg => bg.id === background.id)) {
    return;
  }

  preferences.favorites.unshift(background);
  preferences.favorites = preferences.favorites.slice(0, MAX_FAVORITES);
  
  saveBackgroundPreferences(preferences);
}

/**
 * Remove background from favorites
 */
export function removeFromFavorites(backgroundId: string): void {
  const preferences = getBackgroundPreferences();
  preferences.favorites = preferences.favorites.filter(bg => bg.id !== backgroundId);
  saveBackgroundPreferences(preferences);
}

/**
 * Apply background to document
 */
export function applyBackgroundToDocument(background: BackgroundPreference): void {
  if (typeof document === 'undefined') return;

  console.log('🎨 Applying background:', background);

  const body = document.body;
  
  // Remove existing background classes
  body.classList.remove('bg-deora-default', 'bg-deora-gradient', 'bg-deora-custom');
  
  // Clear existing inline styles first
  body.style.background = '';
  body.style.backgroundColor = '';
  body.style.backgroundImage = '';
  body.style.backgroundSize = '';
  body.style.backgroundPosition = '';
  body.style.backgroundRepeat = '';
  body.style.backgroundAttachment = '';
  
  // Apply new background with !important to override CSS
  switch (background.type) {
    case 'image':
      body.style.setProperty('background-image', `url(${background.value})`, 'important');
      body.style.setProperty('background-size', 'cover', 'important');
      body.style.setProperty('background-position', 'center', 'important');
      body.style.setProperty('background-repeat', 'no-repeat', 'important');
      body.style.setProperty('background-attachment', 'fixed', 'important');
      body.classList.add('bg-deora-custom');
      console.log('✅ Applied image background with !important');
      break;
      
    case 'gradient':
      body.style.setProperty('background', background.value, 'important');
      body.style.setProperty('background-attachment', 'fixed', 'important');
      body.classList.add('bg-deora-gradient');
      console.log('✅ Applied gradient background with !important:', background.value);
      break;
      
    case 'solid':
      body.style.setProperty('background-color', background.value, 'important');
      body.style.setProperty('background-image', 'none', 'important');
      body.classList.add('bg-deora-custom');
      console.log('✅ Applied solid background with !important');
      break;
  }

  // Apply adaptive colors if available
  if (background.dominantColors) {
    applyAdaptiveColors(background.dominantColors);
    console.log('✅ Applied adaptive colors');
  }
}

/**
 * Apply adaptive colors to CSS custom properties
 */
export function applyAdaptiveColors(colors: BackgroundPreference['dominantColors']): void {
  if (typeof document === 'undefined' || !colors) return;

  console.log('🎨 Applying adaptive colors:', colors);

  const root = document.documentElement;
  
  // Apply all the adaptive color properties that the CSS uses
  root.style.setProperty('--adaptive-text-primary', colors.text);
  root.style.setProperty('--adaptive-text-secondary', colors.textSecondary);
  root.style.setProperty('--adaptive-text-accent', colors.accent);
  root.style.setProperty('--adaptive-logo-color', colors.primary);
  
  // Enhanced card styling with better contrast
  const cardBg = colors.text === '#ffffff' 
    ? 'rgba(0, 0, 0, 0.4)' // Dark semi-transparent for light text
    : 'rgba(255, 255, 255, 0.25)'; // Light semi-transparent for dark text
    
  const cardBorder = colors.text === '#ffffff'
    ? 'rgba(255, 255, 255, 0.2)'
    : 'rgba(0, 0, 0, 0.15)';
    
  const inputBg = colors.text === '#ffffff'
    ? 'rgba(0, 0, 0, 0.3)'
    : 'rgba(255, 255, 255, 0.2)';
    
  const inputBorder = colors.text === '#ffffff'
    ? 'rgba(255, 255, 255, 0.3)'
    : 'rgba(0, 0, 0, 0.2)';
    
  const shadowColor = colors.text === '#ffffff'
    ? 'rgba(0, 0, 0, 0.5)'
    : 'rgba(0, 0, 0, 0.15)';

  root.style.setProperty('--adaptive-card-bg', cardBg);
  root.style.setProperty('--adaptive-card-border', cardBorder);
  root.style.setProperty('--adaptive-input-bg', inputBg);
  root.style.setProperty('--adaptive-input-border', inputBorder);
  root.style.setProperty('--adaptive-shadow', shadowColor);
  
  // Button styling with gradient based on primary colors
  const buttonBg = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`;
  root.style.setProperty('--adaptive-button-bg', buttonBg);
  root.style.setProperty('--adaptive-button-text', '#ffffff');
  
  // Add the adaptive colors active class after a frame to avoid hydration issues
  requestAnimationFrame(() => {
    document.body.classList.add('adaptive-colors-active');
  });
  
  console.log('✅ Applied adaptive colors to CSS properties');
}

/**
 * Initialize background system on page load
 */
export function initializeBackgroundSystem(): void {
  if (typeof window === 'undefined') return;

  console.log('🚀 Initializing background system...');

  const preferences = getBackgroundPreferences();
  console.log('📦 Loaded preferences:', preferences);
  
  if (preferences.current) {
    console.log('🎨 Applying saved background:', preferences.current.name);
    applyBackgroundToDocument(preferences.current);
  } else {
    console.log('⚠️ No saved background found, using default');
    // Apply default background with colors
    const defaultBg = getPredefinedBackgrounds()[0];
    setCurrentBackground(defaultBg);
  }
  
  // Force apply adaptive colors immediately
  setTimeout(() => {
    const currentPrefs = getBackgroundPreferences();
    if (currentPrefs.current?.dominantColors) {
      applyAdaptiveColors(currentPrefs.current.dominantColors);
    }
  }, 100);
}

/**
 * Get predefined backgrounds
 */
export function getPredefinedBackgrounds(): BackgroundPreference[] {
  return [
    {
      id: 'default',
      name: 'Default',
      type: 'gradient',
      value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      dominantColors: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#8b5cf6',
        text: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.8)'
      },
      timestamp: 0
    },
    {
      id: 'sunset',
      name: 'Sunset',
      type: 'gradient',
      value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      dominantColors: {
        primary: '#ff9a9e',
        secondary: '#fecfef',
        accent: '#ec4899',
        text: '#1f2937',
        textSecondary: 'rgba(31, 41, 55, 0.8)'
      },
      timestamp: 0
    },
    {
      id: 'ocean',
      name: 'Ocean',
      type: 'gradient',
      value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      dominantColors: {
        primary: '#0ea5e9',
        secondary: '#06b6d4',
        accent: '#0284c7',
        text: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.85)'
      },
      timestamp: 0
    },
    {
      id: 'forest',
      name: 'Forest',
      type: 'gradient',
      value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      dominantColors: {
        primary: '#059669',
        secondary: '#10b981',
        accent: '#047857',
        text: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.85)'
      },
      timestamp: 0
    },
    {
      id: 'aurora',
      name: 'Aurora',
      type: 'gradient',
      value: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      dominantColors: {
        primary: '#8b5cf6',
        secondary: '#a855f7',
        accent: '#ec4899',
        text: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.85)'
      },
      timestamp: 0
    },
    {
      id: 'midnight',
      name: 'Midnight',
      type: 'gradient',
      value: 'linear-gradient(135deg, #2c3e50 0%, #000428 100%)',
      dominantColors: {
        primary: '#3b82f6',
        secondary: '#2563eb',
        accent: '#1d4ed8',
        text: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.8)'
      },
      timestamp: 0
    },
    {
      id: 'cherry',
      name: 'Cherry Blossom',
      type: 'gradient',
      value: 'linear-gradient(135deg, #ffeef8 0%, #f8d7da 50%, #ffc0cb 100%)',
      dominantColors: {
        primary: '#be185d',
        secondary: '#ec4899',
        accent: '#db2777',
        text: '#1f2937',
        textSecondary: 'rgba(31, 41, 55, 0.8)'
      },
      timestamp: 0
    }
  ];
}

/**
 * Reset to default background
 */
export function resetToDefault(): void {
  const defaultBg = getPredefinedBackgrounds()[0];
  setCurrentBackground(defaultBg);
}

/**
 * Hook for React components to listen to background changes
 */
export function useBackgroundPreferencesHook() {
  if (typeof window === 'undefined') {
    return { current: null, favorites: [], recent: [] };
  }

  // This will be implemented in the actual React hook file
  return getBackgroundPreferences();
}