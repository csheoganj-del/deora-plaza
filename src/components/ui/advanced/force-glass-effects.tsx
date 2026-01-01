"use client";

import { useEffect } from 'react';

/**
 * Force Glass Effects - Direct inline style application
 */
export function ForceGlassEffects() {
  useEffect(() => {
    const applyGlassEffects = () => {
      // Apply background to body
      document.body.style.background = `
        radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.08), transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.06), transparent 40%),
        radial-gradient(circle at 40% 60%, rgba(6, 182, 212, 0.04), transparent 30%),
        linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)
      `;
      document.body.style.backgroundAttachment = 'fixed';
      
      // Find and style all cards with multiple selectors
      const selectors = [
        '.premium-card',
        '[class*="premium-card"]',
        'div[class*="premium"]',
        'div[class*="card"]',
        // Target the specific structure from UnifiedDashboard
        '.grid.gap-6 > div',
        '.grid.gap-6.md\\:grid-cols-2.lg\\:grid-cols-4 > div'
      ];
      
      let totalCards = 0;
      selectors.forEach(selector => {
        const cards = document.querySelectorAll(selector);
        totalCards += cards.length;
        
        cards.forEach((card, index) => {
          const cardElement = card as HTMLElement;
          
          // Skip if already processed
          if (cardElement.dataset.glassProcessed) return;
          cardElement.dataset.glassProcessed = 'true';
          
          // Apply beautiful glass effects
          cardElement.style.setProperty('background', 'rgba(255, 255, 255, 0.65)', 'important');
          cardElement.style.setProperty('backdrop-filter', 'blur(18px) saturate(140%) brightness(108%)', 'important');
          cardElement.style.setProperty('-webkit-backdrop-filter', 'blur(18px) saturate(140%) brightness(108%)', 'important');
          cardElement.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.4)', 'important');
          cardElement.style.setProperty('border-radius', '18px', 'important');
          cardElement.style.setProperty('box-shadow', '0 8px 30px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)', 'important');
          cardElement.style.setProperty('transition', 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)', 'important');
          cardElement.style.setProperty('overflow', 'hidden', 'important');
          cardElement.style.setProperty('position', 'relative', 'important');
          
          // Add hover effects
          cardElement.addEventListener('mouseenter', () => {
            cardElement.style.setProperty('transform', 'translateY(-4px)', 'important');
            cardElement.style.setProperty('box-shadow', '0 16px 45px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 0 20px rgba(99, 102, 241, 0.15)', 'important');
            cardElement.style.setProperty('background', 'rgba(255, 255, 255, 0.75)', 'important');
            cardElement.style.setProperty('border-color', 'rgba(99, 102, 241, 0.3)', 'important');
          });
          
          cardElement.addEventListener('mouseleave', () => {
            cardElement.style.setProperty('transform', 'translateY(0)', 'important');
            cardElement.style.setProperty('box-shadow', '0 8px 30px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)', 'important');
            cardElement.style.setProperty('background', 'rgba(255, 255, 255, 0.65)', 'important');
            cardElement.style.setProperty('border-color', 'rgba(255, 255, 255, 0.4)', 'important');
          });
          
          // Try to override any existing classes
          cardElement.className = cardElement.className + ' glass-effect-applied';
        });
      });
      
      // If no cards found, try a more aggressive approach
      if (totalCards === 0) {
        const allDivs = document.querySelectorAll('div');
        
        // Look for divs that might be cards based on content
        allDivs.forEach((div, index) => {
          const divElement = div as HTMLElement;
          const text = divElement.textContent || '';
          
          // Check if this div contains card-like content
          if (text.includes('Total Revenue') || 
              text.includes('Total Bookings') || 
              text.includes('Hotel') || 
              text.includes('Bar & POS') ||
              text.includes('Garden Events') ||
              text.includes('Cafe Tables')) {
            
            // Apply glass effects instead of test colors
            divElement.style.setProperty('background', 'rgba(255, 255, 255, 0.65)', 'important');
            divElement.style.setProperty('backdrop-filter', 'blur(18px) saturate(140%) brightness(108%)', 'important');
            divElement.style.setProperty('-webkit-backdrop-filter', 'blur(18px) saturate(140%) brightness(108%)', 'important');
            divElement.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.4)', 'important');
            divElement.style.setProperty('border-radius', '18px', 'important');
            divElement.style.setProperty('box-shadow', '0 8px 30px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)', 'important');
          }
        });
      }
    };
    
    // Apply immediately and with delays
    applyGlassEffects();
    setTimeout(applyGlassEffects, 500);
    setTimeout(applyGlassEffects, 1000);
    setTimeout(applyGlassEffects, 2000);
    
  }, []);

  return null; // No visual indicator needed
}