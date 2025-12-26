/**
 * Force Adaptive Colors System
 * Ensures adaptive colors are applied immediately and override any default styles
 */

export function forceApplyAdaptiveColors() {
  if (typeof document === 'undefined') return;

  console.log('🚀 Force applying adaptive colors...');

  // Default adaptive colors for immediate application
  const defaultColors = {
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    textAccent: '#8b5cf6',
    logoColor: '#667eea',
    cardBackground: 'rgba(0, 0, 0, 0.4)',
    cardBorder: 'rgba(255, 255, 255, 0.2)',
    buttonBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    buttonText: '#ffffff',
    inputBackground: 'rgba(0, 0, 0, 0.3)',
    inputBorder: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.5)'
  };

  const root = document.documentElement;
  
  // Apply CSS custom properties
  root.style.setProperty('--adaptive-text-primary', defaultColors.textPrimary);
  root.style.setProperty('--adaptive-text-secondary', defaultColors.textSecondary);
  root.style.setProperty('--adaptive-text-accent', defaultColors.textAccent);
  root.style.setProperty('--adaptive-logo-color', defaultColors.logoColor);
  root.style.setProperty('--adaptive-card-bg', defaultColors.cardBackground);
  root.style.setProperty('--adaptive-card-border', defaultColors.cardBorder);
  root.style.setProperty('--adaptive-button-bg', defaultColors.buttonBackground);
  root.style.setProperty('--adaptive-button-text', defaultColors.buttonText);
  root.style.setProperty('--adaptive-input-bg', defaultColors.inputBackground);
  root.style.setProperty('--adaptive-input-border', defaultColors.inputBorder);
  root.style.setProperty('--adaptive-shadow', defaultColors.shadowColor);

  // Add the adaptive colors active class only after hydration
  requestAnimationFrame(() => {
    document.body.classList.add('adaptive-colors-active');
  });

  console.log('✅ Force applied adaptive colors');
}

// Only apply after hydration to avoid SSR/client mismatches
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceApplyAdaptiveColors);
  } else {
    // DOM is already ready
    forceApplyAdaptiveColors();
  }
}