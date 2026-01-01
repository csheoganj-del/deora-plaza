/**
 * 🎨 React Hook for Background Preferences
 * Provides reactive access to background preferences across components
 */

"use client";

import { useState, useEffect } from 'react';
import { 
  BackgroundPreferences, 
  BackgroundPreference,
  getBackgroundPreferences,
  setCurrentBackground,
  addToFavorites,
  removeFromFavorites,
  initializeBackgroundSystem
} from '@/lib/background-preferences';

export function useBackgroundPreferences() {
  const [preferences, setPreferences] = useState<BackgroundPreferences>({
    current: null,
    favorites: [],
    recent: []
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = () => {
      const prefs = getBackgroundPreferences();
      setPreferences(prefs);
      setIsLoading(false);
      
      // Initialize background system
      initializeBackgroundSystem();
    };

    loadPreferences();
  }, []);

  // Listen for preference changes
  useEffect(() => {
    const handleChange = (event: CustomEvent<BackgroundPreferences>) => {
      setPreferences(event.detail);
    };

    window.addEventListener('background-preferences-changed', handleChange as EventListener);
    
    return () => {
      window.removeEventListener('background-preferences-changed', handleChange as EventListener);
    };
  }, []);

  // Set current background
  const setBackground = async (background: Omit<BackgroundPreference, 'timestamp'>) => {
    await setCurrentBackground(background);
  };

  // Add to favorites
  const addFavorite = (background: BackgroundPreference) => {
    addToFavorites(background);
  };

  // Remove from favorites
  const removeFavorite = (backgroundId: string) => {
    removeFromFavorites(backgroundId);
  };

  // Check if background is favorited
  const isFavorite = (backgroundId: string) => {
    return preferences.favorites.some(bg => bg.id === backgroundId);
  };

  return {
    preferences,
    isLoading,
    setBackground,
    addFavorite,
    removeFavorite,
    isFavorite,
    current: preferences.current,
    favorites: preferences.favorites,
    recent: preferences.recent
  };
}