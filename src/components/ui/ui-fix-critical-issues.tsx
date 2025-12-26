"use client";

/**
 * 🔧 Critical UI/UX Fixes
 * 
 * Addresses overlapping elements, z-index conflicts, readability issues,
 * and accessibility problems identified in the system audit
 */

import { useEffect } from 'react';

export function CriticalUIFixes() {
  useEffect(() => {
    // Apply critical fixes immediately
    applyCriticalFixes();
    
    // Apply fixes after DOM updates
    const observer = new MutationObserver(() => {
      applyCriticalFixes();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  return null; // This component only applies fixes, no UI
}

function applyCriticalFixes() {
  // Fix 1: Z-Index Management
  fixZIndexConflicts();
  
  // Fix 2: Text Readability & Contrast
  fixTextContrast();
  
  // Fix 3: Button Accessibility
  fixButtonAccessibility();
  
  // Fix 4: Mobile Responsiveness
  fixMobileResponsiveness();
  
  // Fix 5: Dialog Positioning
  fixDialogPositioning();
  
  // Fix 6: Glass Effect Optimization
  optimizeGlassEffects();
}

function fixZIndexConflicts() {
  const style = document.createElement('style');
  style.id = 'critical-z-index-fixes';
  
  // Remove existing fix if present
  const existing = document.getElementById('critical-z-index-fixes');
  if (existing) existing.remove();
  
  style.textContent = `
    /* Z-Index Scale: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 */
    
    /* Base Layer */
    .z-base { z-index: 10 !important; }
    
    /* Content Layer */
    .z-content { z-index: 20 !important; }
    
    /* Header/Navigation */
    header, .header-glass { z-index: 30 !important; }
    
    /* Dropdowns/Tooltips */
    [role="menu"], [role="tooltip"], .dropdown-content { z-index: 40 !important; }
    
    /* Modals/Dialogs */
    [role="dialog"], .modal, .dialog-overlay { z-index: 50 !important; }
    .dialog-content { z-index: 51 !important; }
    
    /* Mobile Menu */
    .mobile-menu-overlay { z-index: 60 !important; }
    .mobile-menu-content { z-index: 61 !important; }
    
    /* Notifications/Toasts */
    .toast, .notification { z-index: 70 !important; }
    
    /* Loading/Blocking */
    .loading-overlay, .blocking-overlay { z-index: 80 !important; }
    
    /* Critical Alerts */
    .alert-critical { z-index: 90 !important; }
    
    /* Debug/Dev Tools */
    .debug-overlay { z-index: 100 !important; }
  `;
  
  document.head.appendChild(style);
}

function fixTextContrast() {
  const style = document.createElement('style');
  style.id = 'critical-contrast-fixes';
  
  const existing = document.getElementById('critical-contrast-fixes');
  if (existing) existing.remove();
  
  style.textContent = `
    /* Text Contrast Fixes for WCAG AA Compliance */
    
    /* Primary Text - High Contrast */
    .adaptive-text-primary,
    .text-white,
    h1, h2, h3, h4, h5, h6 {
      color: rgba(255, 255, 255, 0.95) !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
    }
    
    /* Secondary Text - Medium Contrast */
    .adaptive-text-secondary,
    .text-white\\/70 {
      color: rgba(255, 255, 255, 0.85) !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25) !important;
    }
    
    /* Muted Text - Readable Contrast */
    .text-white\\/60,
    .text-muted-foreground {
      color: rgba(255, 255, 255, 0.75) !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
    }
    
    /* Stats Numbers - Maximum Contrast */
    .stats-number,
    .text-2xl,
    .text-3xl {
      color: rgba(255, 255, 255, 1) !important;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4) !important;
      font-weight: 700 !important;
    }
    
    /* Button Text - High Contrast */
    button, .btn {
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
    }
    
    /* Dark Mode Adjustments */
    @media (prefers-color-scheme: dark) {
      .adaptive-text-primary { color: rgba(255, 255, 255, 0.98) !important; }
      .adaptive-text-secondary { color: rgba(255, 255, 255, 0.88) !important; }
      .text-muted-foreground { color: rgba(255, 255, 255, 0.78) !important; }
    }
    
    /* Light Mode Adjustments */
    @media (prefers-color-scheme: light) {
      .adaptive-text-primary { color: rgba(0, 0, 0, 0.95) !important; }
      .adaptive-text-secondary { color: rgba(0, 0, 0, 0.75) !important; }
      .text-muted-foreground { color: rgba(0, 0, 0, 0.65) !important; }
    }
  `;
  
  document.head.appendChild(style);
}

function fixButtonAccessibility() {
  const style = document.createElement('style');
  style.id = 'critical-button-fixes';
  
  const existing = document.getElementById('critical-button-fixes');
  if (existing) existing.remove();
  
  style.textContent = `
    /* Button Accessibility Fixes */
    
    /* Minimum Touch Target Size (44x44px) */
    button,
    [role="button"],
    .btn {
      min-width: 44px !important;
      min-height: 44px !important;
      padding: 8px 16px !important;
    }
    
    /* Icon Buttons */
    button[class*="icon"],
    .btn-icon {
      min-width: 44px !important;
      min-height: 44px !important;
      padding: 10px !important;
    }
    
    /* Focus Indicators */
    button:focus-visible,
    [role="button"]:focus-visible {
      outline: 2px solid #6366f1 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2) !important;
    }
    
    /* Hover States - Visible on Glass */
    button:hover,
    [role="button"]:hover {
      background-color: rgba(255, 255, 255, 0.15) !important;
      border-color: rgba(99, 102, 241, 0.5) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    }
    
    /* Active States */
    button:active,
    [role="button"]:active {
      transform: translateY(0) !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
    }
    
    /* Disabled States - Better Contrast */
    button:disabled,
    [role="button"][aria-disabled="true"] {
      opacity: 0.7 !important;
      background-color: rgba(255, 255, 255, 0.1) !important;
      color: rgba(255, 255, 255, 0.6) !important;
      cursor: not-allowed !important;
    }
    
    /* Primary Button Contrast */
    .btn-primary,
    button[class*="primary"] {
      background-color: #6366f1 !important;
      color: white !important;
      border: 1px solid #4f46e5 !important;
    }
    
    .btn-primary:hover,
    button[class*="primary"]:hover {
      background-color: #4f46e5 !important;
      border-color: #3730a3 !important;
    }
  `;
  
  document.head.appendChild(style);
}

function fixMobileResponsiveness() {
  const style = document.createElement('style');
  style.id = 'critical-mobile-fixes';
  
  const existing = document.getElementById('critical-mobile-fixes');
  if (existing) existing.remove();
  
  style.textContent = `
    /* Mobile Responsiveness Fixes */
    
    /* Viewport Height Fix */
    html, body {
      height: 100dvh !important; /* Dynamic viewport height */
      overflow-x: hidden !important;
    }
    
    /* Mobile Dialog Sizing */
    @media (max-width: 768px) {
      [role="dialog"],
      .dialog-content {
        width: calc(100vw - 16px) !important;
        max-width: calc(100vw - 16px) !important;
        margin: 8px !important;
        max-height: calc(100dvh - 32px) !important;
        overflow-y: auto !important;
      }
      
      /* Mobile Sidebar Width */
      .mobile-sidebar,
      .sheet-content {
        width: min(280px, calc(100vw - 32px)) !important;
      }
      
      /* Mobile Header Padding */
      header {
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
      
      /* Mobile Card Padding */
      .card,
      .premium-card {
        padding: 16px !important;
        margin: 8px !important;
      }
      
      /* Mobile Text Sizing */
      h1 { font-size: 1.5rem !important; }
      h2 { font-size: 1.25rem !important; }
      h3 { font-size: 1.125rem !important; }
      
      /* Mobile Button Spacing */
      .btn-group {
        flex-direction: column !important;
        gap: 8px !important;
      }
      
      .btn-group button {
        width: 100% !important;
      }
    }
    
    /* Tablet Adjustments */
    @media (min-width: 769px) and (max-width: 1024px) {
      .dialog-content {
        width: 90vw !important;
        max-width: 600px !important;
      }
    }
  `;
  
  document.head.appendChild(style);
}

function fixDialogPositioning() {
  const style = document.createElement('style');
  style.id = 'critical-dialog-fixes';
  
  const existing = document.getElementById('critical-dialog-fixes');
  if (existing) existing.remove();
  
  style.textContent = `
    /* Dialog Positioning Fixes */
    
    /* Dialog Overlay */
    .dialog-overlay,
    [role="dialog"][class*="fixed"] {
      position: fixed !important;
      inset: 0 !important;
      z-index: 50 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background-color: rgba(0, 0, 0, 0.5) !important;
      backdrop-filter: blur(4px) !important;
    }
    
    /* Dialog Content */
    .dialog-content {
      position: relative !important;
      z-index: 51 !important;
      max-width: 32rem !important;
      max-height: 90vh !important;
      overflow-y: auto !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(20px) !important;
      border-radius: 16px !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3) !important;
      margin: 16px !important;
    }
    
    /* Dialog Header */
    .dialog-header {
      position: sticky !important;
      top: 0 !important;
      z-index: 52 !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(20px) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
      padding: 16px 24px !important;
    }
    
    /* Dialog Footer */
    .dialog-footer {
      position: sticky !important;
      bottom: 0 !important;
      z-index: 52 !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(20px) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
      padding: 16px 24px !important;
    }
    
    /* Dialog Body */
    .dialog-body {
      padding: 24px !important;
      overflow-y: auto !important;
    }
    
    /* Close Button */
    .dialog-close {
      position: absolute !important;
      top: 16px !important;
      right: 16px !important;
      z-index: 53 !important;
      width: 32px !important;
      height: 32px !important;
      border-radius: 8px !important;
      background: rgba(255, 255, 255, 0.2) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    
    .dialog-close:hover {
      background: rgba(255, 255, 255, 0.3) !important;
    }
  `;
  
  document.head.appendChild(style);
}

function optimizeGlassEffects() {
  const style = document.createElement('style');
  style.id = 'critical-glass-optimization';
  
  const existing = document.getElementById('critical-glass-optimization');
  if (existing) existing.remove();
  
  style.textContent = `
    /* Optimized Glass Effects - Reduced Layers */
    
    /* Base Glass Effect - 2 Layers Only */
    .glass-effect-optimized {
      background: rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(12px) saturate(120%) !important;
      -webkit-backdrop-filter: blur(12px) saturate(120%) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-radius: 16px !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
      position: relative !important;
      overflow: hidden !important;
    }
    
    /* Remove Excessive Layers */
    .glass-effect-optimized::before,
    .glass-effect-optimized::after {
      display: none !important;
    }
    
    /* Simplified Hover Effect */
    .glass-effect-optimized:hover {
      background: rgba(255, 255, 255, 0.15) !important;
      border-color: rgba(99, 102, 241, 0.3) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
      transition: all 0.2s ease !important;
    }
    
    /* Disable Animations on Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
      .glass-effect-optimized,
      .glass-effect-optimized:hover {
        transform: none !important;
        transition: none !important;
      }
      
      /* Disable all liquid animations */
      [class*="liquid"],
      [class*="animate"] {
        animation: none !important;
      }
    }
    
    /* Performance Optimization */
    .glass-effect-optimized {
      contain: layout style paint !important;
      will-change: transform, opacity !important;
    }
    
    /* Fallback for No Backdrop Filter Support */
    @supports not (backdrop-filter: blur(12px)) {
      .glass-effect-optimized {
        background: rgba(255, 255, 255, 0.9) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
    }
  `;
  
  document.head.appendChild(style);
  
  // Apply optimized class to existing glass elements
  const glassElements = document.querySelectorAll('[class*="glass"], [class*="liquid"]');
  glassElements.forEach(element => {
    element.classList.add('glass-effect-optimized');
  });
}