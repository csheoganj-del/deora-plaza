"use client";

/**
 * Dynamic Accent Color System
 * AI-powered theming that adapts to context, time, and data
 */

export type AccentColor = {
  rgb: string;
  name: string;
  context: string;
};

export const ACCENT_PRESETS: Record<string, AccentColor> = {
  // Time-based colors
  morning: { rgb: "255 180 80", name: "Morning Gold", context: "6AM-10AM" },
  day: { rgb: "106 124 255", name: "Day Blue", context: "10AM-6PM" },
  evening: { rgb: "170 140 255", name: "Evening Purple", context: "6PM-10PM" },
  night: { rgb: "80 200 255", name: "Night Cyan", context: "10PM-6AM" },
  
  // Business context colors
  success: { rgb: "80 200 120", name: "Success Green", context: "Revenue up" },
  warning: { rgb: "255 180 80", name: "Warning Amber", context: "Attention needed" },
  danger: { rgb: "255 120 120", name: "Alert Red", context: "Issues detected" },
  neutral: { rgb: "120 140 160", name: "Neutral Gray", context: "Stable" },
  
  // DEORA brand colors
  primary: { rgb: "109 93 251", name: "DEORA Purple", context: "Brand primary" },
  secondary: { rgb: "192 132 252", name: "DEORA Violet", context: "Brand secondary" },
  gold: { rgb: "245 158 11", name: "DEORA Gold", context: "Premium features" },
  
  // Seasonal/mood colors
  spring: { rgb: "34 197 94", name: "Spring Green", context: "Growth period" },
  summer: { rgb: "59 130 246", name: "Summer Blue", context: "Peak season" },
  autumn: { rgb: "249 115 22", name: "Autumn Orange", context: "Harvest time" },
  winter: { rgb: "139 92 246", name: "Winter Purple", context: "Cozy period" }
};

class DynamicAccentSystem {
  private currentAccent: AccentColor = ACCENT_PRESETS.primary;
  private listeners: ((accent: AccentColor) => void)[] = [];

  /**
   * Set accent color and update CSS variables
   */
  setAccent(accent: AccentColor | keyof typeof ACCENT_PRESETS) {
    const accentColor = typeof accent === 'string' ? ACCENT_PRESETS[accent] : accent;
    
    if (!accentColor) {
      console.warn('Invalid accent color:', accent);
      return;
    }

    this.currentAccent = accentColor;
    
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Set CSS variables
      root.style.setProperty('--accent', accentColor.rgb);
      root.style.setProperty('--accent-soft', `rgba(${accentColor.rgb}, 0.15)`);
      root.style.setProperty('--accent-glow', `rgba(${accentColor.rgb}, 0.45)`);
      root.style.setProperty('--accent-border', `rgba(${accentColor.rgb}, 0.3)`);
      
      console.log(`🎨 Accent updated to ${accentColor.name} (${accentColor.context})`);
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener(accentColor));
  }

  /**
   * Get current accent color
   */
  getCurrentAccent(): AccentColor {
    return this.currentAccent;
  }

  /**
   * Subscribe to accent changes
   */
  subscribe(listener: (accent: AccentColor) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Auto-set accent based on time of day
   */
  setTimeBasedAccent() {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 10) {
      this.setAccent('morning');
    } else if (hour >= 10 && hour < 18) {
      this.setAccent('day');
    } else if (hour >= 18 && hour < 22) {
      this.setAccent('evening');
    } else {
      this.setAccent('night');
    }
  }

  /**
   * Set accent based on business metrics
   */
  setBusinessAccent(revenue: number, previousRevenue: number) {
    const change = ((revenue - previousRevenue) / previousRevenue) * 100;
    
    if (change > 10) {
      this.setAccent('success');
    } else if (change < -10) {
      this.setAccent('danger');
    } else if (change < -5) {
      this.setAccent('warning');
    } else {
      this.setAccent('primary');
    }
  }

  /**
   * Set accent based on season
   */
  setSeasonalAccent() {
    const month = new Date().getMonth();
    
    if (month >= 2 && month <= 4) {
      this.setAccent('spring');
    } else if (month >= 5 && month <= 7) {
      this.setAccent('summer');
    } else if (month >= 8 && month <= 10) {
      this.setAccent('autumn');
    } else {
      this.setAccent('winter');
    }
  }

  /**
   * AI-powered accent selection (placeholder for future ML integration)
   */
  setAIAccent(context: {
    timeOfDay?: boolean;
    businessMetrics?: { revenue: number; previousRevenue: number };
    userPreference?: keyof typeof ACCENT_PRESETS;
    seasonal?: boolean;
  }) {
    // Priority: User preference > Business metrics > Time > Season
    
    if (context.userPreference) {
      this.setAccent(context.userPreference);
    } else if (context.businessMetrics) {
      this.setBusinessAccent(context.businessMetrics.revenue, context.businessMetrics.previousRevenue);
    } else if (context.timeOfDay) {
      this.setTimeBasedAccent();
    } else if (context.seasonal) {
      this.setSeasonalAccent();
    } else {
      this.setAccent('primary');
    }
  }
}

// Export singleton instance
export const dynamicAccentSystem = new DynamicAccentSystem();

// Initialize with time-based accent
if (typeof window !== 'undefined') {
  dynamicAccentSystem.setTimeBasedAccent();
}