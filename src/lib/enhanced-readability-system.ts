/**
 * Enhanced Readability System
 * Provides multiple readability modes for different use cases
 */

export type ReadabilityMode = 'beauty' | 'balanced' | 'business' | 'maximum';

const READABILITY_STORAGE_KEY = 'deora-readability-mode';

/**
 * Apply a specific readability mode
 */
export function applyReadabilityMode(mode: ReadabilityMode) {
  const body = document.body;
  
  // Remove existing readability classes
  body.classList.remove(
    'readability-beauty',
    'readability-balanced', 
    'readability-business',
    'readability-maximum'
  );
  
  // Apply new mode
  body.classList.add(`readability-${mode}`);
  
  // Store preference
  localStorage.setItem(READABILITY_STORAGE_KEY, mode);
  
  console.log(`Applied readability mode: ${mode}`);
}

/**
 * Toggle between beauty and business modes
 */
export function toggleReadabilityMode(): ReadabilityMode {
  const current = getCurrentReadabilityMode();
  const newMode = current === 'beauty' ? 'business' : 'beauty';
  applyReadabilityMode(newMode);
  return newMode;
}

/**
 * Get current readability mode
 */
export function getCurrentReadabilityMode(): ReadabilityMode {
  const stored = localStorage.getItem(READABILITY_STORAGE_KEY) as ReadabilityMode;
  return stored || 'beauty';
}

/**
 * Initialize readability system
 */
export function initializeReadabilitySystem() {
  const mode = getCurrentReadabilityMode();
  applyReadabilityMode(mode);
}