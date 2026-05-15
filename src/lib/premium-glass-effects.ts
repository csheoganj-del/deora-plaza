"use client";

/**
 * Premium Glass Effects System
 * Adds VisionOS-level interactive effects to dashboard cards
 */

export class PremiumGlassEffects {
  private static instance: PremiumGlassEffects;
  private isInitialized = false;

  static getInstance(): PremiumGlassEffects {
    if (!PremiumGlassEffects.instance) {
      PremiumGlassEffects.instance = new PremiumGlassEffects();
    }
    return PremiumGlassEffects.instance;
  }

  /**
   * Initialize all premium glass effects
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.initCursorParallax();
    this.initFloatingDelays();
    this.isInitialized = true;
  }

  /**
   * Cursor-depth parallax effect for cards
   */
  private initCursorParallax(): void {
    const cards = document.querySelectorAll('.premium-card-interactive, .stats-card');
    
    cards.forEach((card, index) => {
      const cardElement = card as HTMLElement;
      
      // Add floating delay for staggered animation
      cardElement.style.setProperty('--float-delay', index.toString());
      
      cardElement.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = cardElement.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        // Subtle 3D rotation based on cursor position
        const rotateX = (-y / 20);
        const rotateY = (x / 20);

        cardElement.style.transform = `
          rotateX(${rotateX}deg) 
          rotateY(${rotateY}deg) 
          translateY(-4px)
          scale(1.02)
        `;
      });

      cardElement.addEventListener('mouseleave', () => {
        cardElement.style.transform = 'rotateX(0) rotateY(0) translateY(0) scale(1)';
      });
    });
  }

  /**
   * Add staggered floating delays to cards
   */
  private initFloatingDelays(): void {
    const quickAccessCards = document.querySelectorAll('.premium-card-interactive');
    
    quickAccessCards.forEach((card, index) => {
      const cardElement = card as HTMLElement;
      cardElement.style.animationDelay = `${index * 0.5}s`;
    });
  }

  /**
   * Add scroll-based depth effect
   */
  initScrollDepth(): void {
    if (typeof window === 'undefined') return;

    const cards = document.querySelectorAll('.premium-card-interactive, .stats-card');
    
    const onScroll = () => {
      const scrollY = window.scrollY;
      
      cards.forEach((card, index) => {
        const cardElement = card as HTMLElement;
        const depth = (scrollY * 0.04) - (index * 6);
        
        // Only apply if not being hovered
        if (!cardElement.matches(':hover')) {
          cardElement.style.transform = `translateY(${depth}px)`;
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', onScroll);
  }

  /**
   * Enhanced button ripple effect
   */
  addButtonRipple(button: HTMLElement, event: MouseEvent): void {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255,255,255,0.6), transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-expand 0.6s ease-out;
      pointer-events: none;
      z-index: 1;
    `;

    button.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Glass modal entrance animation
   */
  animateModalEntrance(modal: HTMLElement): void {
    modal.style.cssText += `
      animation: modalIn 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
  }

  /**
   * Cleanup all effects
   */
  cleanup(): void {
    this.isInitialized = false;
    
    // Remove event listeners and reset transforms
    const cards = document.querySelectorAll('.premium-card-interactive, .stats-card');
    cards.forEach(card => {
      const cardElement = card as HTMLElement;
      cardElement.style.transform = '';
      cardElement.replaceWith(cardElement.cloneNode(true));
    });
  }
}

// CSS injection for ripple animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple-expand {
      from {
        transform: scale(0);
        opacity: 1;
      }
      to {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export singleton instance
export const premiumGlassEffects = PremiumGlassEffects.getInstance();