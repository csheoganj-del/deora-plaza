import { THEME_PRESETS, type ThemePreset } from '@/components/ui/theme-presets'

/**
 * Theme utility functions for managing world-class themes
 */

export class ThemeManager {
  private static instance: ThemeManager
  private currentTheme: ThemePreset | null = null
  private observers: ((theme: ThemePreset) => void)[] = []

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  /**
   * Apply a theme to the document
   */
  applyTheme(theme: ThemePreset): void {
    this.currentTheme = theme
    
    // Apply CSS variables to document root
    const root = document.documentElement
    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // Apply background class to body
    this.applyBackgroundClass(theme.backgroundClass)
    
    // Apply glass style class
    this.applyGlassStyle(theme.glassStyle)
    
    // Store theme preference
    this.saveThemePreference(theme.id)
    
    // Notify observers
    this.notifyObservers(theme)
  }

  /**
   * Apply background class to body
   */
  private applyBackgroundClass(backgroundClass: string): void {
    const body = document.body
    
    // Remove existing background classes
    body.className = body.className
      .replace(/\b\w+-bg\b/g, '')
      .trim()
    
    // Add new background class
    body.classList.add(backgroundClass)
    
    // Add image background support class if needed
    if (!body.classList.contains('has-image-background')) {
      body.classList.add('background-transition')
    }
  }

  /**
   * Apply glass style to elements
   */
  private applyGlassStyle(glassStyle: string): void {
    const root = document.documentElement
    root.setAttribute('data-glass-style', glassStyle)
  }

  /**
   * Get theme by ID
   */
  getThemeById(id: string): ThemePreset | undefined {
    return THEME_PRESETS.find(theme => theme.id === id)
  }

  /**
   * Get themes by category
   */
  getThemesByCategory(category: string): ThemePreset[] {
    return THEME_PRESETS.filter(theme => theme.category === category)
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): ThemePreset | null {
    return this.currentTheme
  }

  /**
   * Save theme preference to localStorage
   */
  private saveThemePreference(themeId: string): void {
    try {
      localStorage.setItem('preferred-theme', themeId)
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }

  /**
   * Load theme preference from localStorage
   */
  loadThemePreference(): ThemePreset | null {
    try {
      const savedThemeId = localStorage.getItem('preferred-theme')
      if (savedThemeId) {
        return this.getThemeById(savedThemeId) || null
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error)
    }
    return null
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(callback: (theme: ThemePreset) => void): () => void {
    this.observers.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(callback)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  /**
   * Notify all observers of theme change
   */
  private notifyObservers(theme: ThemePreset): void {
    this.observers.forEach(callback => {
      try {
        callback(theme)
      } catch (error) {
        console.error('Error in theme observer:', error)
      }
    })
  }

  /**
   * Get random theme from category
   */
  getRandomTheme(category?: string): ThemePreset {
    const themes = category ? this.getThemesByCategory(category) : THEME_PRESETS
    const randomIndex = Math.floor(Math.random() * themes.length)
    return themes[randomIndex]
  }

  /**
   * Cycle to next theme in category
   */
  cycleTheme(direction: 'next' | 'prev' = 'next', category?: string): ThemePreset {
    const themes = category ? this.getThemesByCategory(category) : THEME_PRESETS
    
    if (!this.currentTheme) {
      return themes[0]
    }
    
    const currentIndex = themes.findIndex(theme => theme.id === this.currentTheme!.id)
    let nextIndex: number
    
    if (direction === 'next') {
      nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % themes.length
    } else {
      nextIndex = currentIndex === -1 ? themes.length - 1 : 
                  currentIndex === 0 ? themes.length - 1 : currentIndex - 1
    }
    
    return themes[nextIndex]
  }

  /**
   * Auto-apply theme based on time of day
   */
  applyTimeBasedTheme(): void {
    const hour = new Date().getHours()
    let themeId: string
    
    if (hour >= 6 && hour < 12) {
      // Morning: Mountain Sunrise or Cherry Blossom
      themeId = Math.random() > 0.5 ? 'mountain-sunrise' : 'cherry-blossom'
    } else if (hour >= 12 && hour < 18) {
      // Afternoon: Forest Mist or Ocean Depths
      themeId = Math.random() > 0.5 ? 'forest-mist' : 'ocean-depths'
    } else if (hour >= 18 && hour < 22) {
      // Evening: Autumn Forest or Nebula Dreams
      themeId = Math.random() > 0.5 ? 'autumn-forest' : 'nebula-dreams'
    } else {
      // Night: Aurora Borealis or Starfield Infinity
      themeId = Math.random() > 0.5 ? 'aurora-borealis' : 'starfield-infinity'
    }
    
    const theme = this.getThemeById(themeId)
    if (theme) {
      this.applyTheme(theme)
    }
  }

  /**
   * Apply theme based on system preferences
   */
  applySystemBasedTheme(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    let themeId: string
    
    if (prefersDark) {
      if (prefersReducedMotion) {
        themeId = 'executive-suite' // Professional, minimal animation
      } else {
        themeId = 'starfield-infinity' // Dark with subtle animations
      }
    } else {
      if (prefersReducedMotion) {
        themeId = 'platinum-elegance' // Light, minimal animation
      } else {
        themeId = 'mountain-sunrise' // Light with animations
      }
    }
    
    const theme = this.getThemeById(themeId)
    if (theme) {
      this.applyTheme(theme)
    }
  }

  /**
   * Initialize theme system
   */
  initialize(): void {
    // Try to load saved preference first
    const savedTheme = this.loadThemePreference()
    if (savedTheme) {
      this.applyTheme(savedTheme)
      return
    }
    
    // Fall back to system-based theme
    this.applySystemBasedTheme()
  }
}

/**
 * Color analysis utilities
 */
export class ColorAnalyzer {
  /**
   * Analyze image and suggest appropriate theme
   */
  static async analyzeImageForTheme(imageUrl: string): Promise<ThemePreset | null> {
    try {
      // Create canvas to analyze image colors
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = 100
          canvas.height = 100
          ctx.drawImage(img, 0, 0, 100, 100)
          
          const imageData = ctx.getImageData(0, 0, 100, 100)
          const colors = this.extractDominantColors(imageData)
          const suggestedTheme = this.suggestThemeFromColors(colors)
          
          resolve(suggestedTheme)
        }
        
        img.onerror = () => resolve(null)
        img.src = imageUrl
      })
    } catch (error) {
      console.error('Error analyzing image:', error)
      return null
    }
  }

  /**
   * Extract dominant colors from image data
   */
  private static extractDominantColors(imageData: ImageData): number[][] {
    const data = imageData.data
    const colorMap = new Map<string, number>()
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const key = `${Math.floor(r/32)},${Math.floor(g/32)},${Math.floor(b/32)}`
      
      colorMap.set(key, (colorMap.get(key) || 0) + 1)
    }
    
    // Get top 5 colors
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key]) => key.split(',').map(n => parseInt(n) * 32))
  }

  /**
   * Suggest theme based on dominant colors
   */
  private static suggestThemeFromColors(colors: number[][]): ThemePreset | null {
    if (colors.length === 0) return null
    
    const [r, g, b] = colors[0]
    
    // Analyze color characteristics
    const brightness = (r + g + b) / 3
    const isWarm = r > g && r > b
    const isCool = b > r && b > g
    const isGreen = g > r && g > b
    
    // Suggest theme based on color analysis
    if (brightness < 85) {
      // Dark colors
      if (isCool) return ThemeManager.getInstance().getThemeById('starfield-infinity')
      if (isWarm) return ThemeManager.getInstance().getThemeById('autumn-forest')
      return ThemeManager.getInstance().getThemeById('executive-suite')
    } else if (brightness > 170) {
      // Light colors
      if (isWarm) return ThemeManager.getInstance().getThemeById('mountain-sunrise')
      if (isCool) return ThemeManager.getInstance().getThemeById('winter-aurora')
      return ThemeManager.getInstance().getThemeById('cherry-blossom')
    } else {
      // Medium brightness
      if (isGreen) return ThemeManager.getInstance().getThemeById('forest-mist')
      if (isCool) return ThemeManager.getInstance().getThemeById('ocean-depths')
      if (isWarm) return ThemeManager.getInstance().getThemeById('nebula-dreams')
      return ThemeManager.getInstance().getThemeById('abstract-geometry')
    }
  }
}

/**
 * Theme transition utilities
 */
export class ThemeTransition {
  /**
   * Smooth transition between themes
   */
  static async transitionToTheme(newTheme: ThemePreset, duration: number = 800): Promise<void> {
    const body = document.body
    const root = document.documentElement
    
    // Add transition class
    body.classList.add('theme-transitioning')
    
    // Apply transition styles
    root.style.setProperty('--theme-transition-duration', `${duration}ms`)
    
    // Wait for transition to complete
    await new Promise(resolve => setTimeout(resolve, duration))
    
    // Apply new theme
    ThemeManager.getInstance().applyTheme(newTheme)
    
    // Remove transition class
    body.classList.remove('theme-transitioning')
  }

  /**
   * Crossfade transition effect
   */
  static async crossfadeToTheme(newTheme: ThemePreset): Promise<void> {
    const overlay = document.createElement('div')
    overlay.className = 'fixed inset-0 bg-black opacity-0 transition-opacity duration-500 z-50 pointer-events-none'
    document.body.appendChild(overlay)
    
    // Fade to black
    requestAnimationFrame(() => {
      overlay.style.opacity = '1'
    })
    
    await new Promise(resolve => setTimeout(resolve, 250))
    
    // Apply new theme
    ThemeManager.getInstance().applyTheme(newTheme)
    
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Fade from black
    overlay.style.opacity = '0'
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Remove overlay
    document.body.removeChild(overlay)
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance()

// Export utility functions
export {
  THEME_PRESETS,
  type ThemePreset
}