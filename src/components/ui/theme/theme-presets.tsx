"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Theme Preset Types
export interface ThemePreset {
  id: string
  name: string
  description: string
  category: 'natural' | 'artistic' | 'professional' | 'cosmic' | 'seasonal'
  cssVariables: Record<string, string>
  backgroundClass: string
  glassStyle: 'soft' | 'strong' | 'crystal' | 'liquid' | 'ethereal'
  lightingEffect: 'ambient' | 'directional' | 'accent' | 'dramatic' | 'ethereal'
  preview: string
}

// World-Class Theme Presets
export const THEME_PRESETS: ThemePreset[] = [
  // NATURAL THEMES
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    description: 'Northern lights dancing across a starlit sky with ethereal green and blue waves',
    category: 'natural',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 255, 255, 0.98)',
      '--adaptive-text-secondary': 'rgba(200, 255, 220, 0.85)',
      '--adaptive-text-tertiary': 'rgba(150, 255, 200, 0.65)',
      '--adaptive-glass-bg': 'rgba(20, 80, 60, 0.15)',
      '--adaptive-glass-border': 'rgba(100, 255, 180, 0.3)',
      '--adaptive-glass-highlight': 'rgba(150, 255, 200, 0.25)',
      '--adaptive-shadow-color': 'rgba(0, 40, 30, 0.4)',
      '--adaptive-accent-color': '#00FF88',
    },
    backgroundClass: 'aurora-borealis-bg',
    glassStyle: 'ethereal',
    lightingEffect: 'ethereal',
    preview: '🌌 Aurora dancing across starlit sky'
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    description: 'Deep ocean with bioluminescent creatures and gentle underwater lighting',
    category: 'natural',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(200, 240, 255, 0.95)',
      '--adaptive-text-secondary': 'rgba(150, 220, 255, 0.80)',
      '--adaptive-text-tertiary': 'rgba(100, 200, 255, 0.60)',
      '--adaptive-glass-bg': 'rgba(0, 50, 100, 0.20)',
      '--adaptive-glass-border': 'rgba(100, 200, 255, 0.25)',
      '--adaptive-glass-highlight': 'rgba(150, 220, 255, 0.30)',
      '--adaptive-shadow-color': 'rgba(0, 20, 40, 0.5)',
      '--adaptive-accent-color': '#00BFFF',
    },
    backgroundClass: 'ocean-depths-bg',
    glassStyle: 'liquid',
    lightingEffect: 'ambient',
    preview: '🌊 Deep ocean with bioluminescent glow'
  },
  {
    id: 'mountain-sunrise',
    name: 'Mountain Sunrise',
    description: 'Golden hour over mountain peaks with warm atmospheric lighting',
    category: 'natural',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 250, 240, 0.95)',
      '--adaptive-text-secondary': 'rgba(255, 220, 180, 0.80)',
      '--adaptive-text-tertiary': 'rgba(255, 200, 150, 0.65)',
      '--adaptive-glass-bg': 'rgba(100, 50, 20, 0.15)',
      '--adaptive-glass-border': 'rgba(255, 180, 100, 0.25)',
      '--adaptive-glass-highlight': 'rgba(255, 220, 150, 0.30)',
      '--adaptive-shadow-color': 'rgba(50, 25, 10, 0.4)',
      '--adaptive-accent-color': '#FF8C42',
    },
    backgroundClass: 'mountain-sunrise-bg',
    glassStyle: 'soft',
    lightingEffect: 'directional',
    preview: '🏔️ Golden sunrise over mountain peaks'
  },
  {
    id: 'forest-mist',
    name: 'Forest Mist',
    description: 'Misty forest with dappled sunlight filtering through ancient trees',
    category: 'natural',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(240, 255, 240, 0.95)',
      '--adaptive-text-secondary': 'rgba(200, 255, 200, 0.80)',
      '--adaptive-text-tertiary': 'rgba(160, 240, 160, 0.65)',
      '--adaptive-glass-bg': 'rgba(20, 60, 20, 0.18)',
      '--adaptive-glass-border': 'rgba(120, 200, 120, 0.25)',
      '--adaptive-glass-highlight': 'rgba(160, 240, 160, 0.28)',
      '--adaptive-shadow-color': 'rgba(10, 30, 10, 0.4)',
      '--adaptive-accent-color': '#32CD32',
    },
    backgroundClass: 'forest-mist-bg',
    glassStyle: 'soft',
    lightingEffect: 'ambient',
    preview: '🌲 Misty forest with dappled sunlight'
  },

  // COSMIC THEMES
  {
    id: 'nebula-dreams',
    name: 'Nebula Dreams',
    description: 'Colorful cosmic nebula with swirling gases and distant stars',
    category: 'cosmic',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 240, 255, 0.98)',
      '--adaptive-text-secondary': 'rgba(220, 180, 255, 0.85)',
      '--adaptive-text-tertiary': 'rgba(180, 140, 255, 0.70)',
      '--adaptive-glass-bg': 'rgba(60, 20, 100, 0.20)',
      '--adaptive-glass-border': 'rgba(180, 120, 255, 0.30)',
      '--adaptive-glass-highlight': 'rgba(220, 160, 255, 0.35)',
      '--adaptive-shadow-color': 'rgba(30, 10, 50, 0.5)',
      '--adaptive-accent-color': '#9D4EDD',
    },
    backgroundClass: 'nebula-dreams-bg',
    glassStyle: 'ethereal',
    lightingEffect: 'dramatic',
    preview: '🌌 Colorful cosmic nebula with swirling gases'
  },
  {
    id: 'starfield-infinity',
    name: 'Starfield Infinity',
    description: 'Infinite starfield with twinkling stars and cosmic dust',
    category: 'cosmic',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 255, 255, 0.98)',
      '--adaptive-text-secondary': 'rgba(200, 220, 255, 0.85)',
      '--adaptive-text-tertiary': 'rgba(150, 180, 255, 0.70)',
      '--adaptive-glass-bg': 'rgba(10, 20, 40, 0.25)',
      '--adaptive-glass-border': 'rgba(100, 150, 255, 0.30)',
      '--adaptive-glass-highlight': 'rgba(150, 200, 255, 0.35)',
      '--adaptive-shadow-color': 'rgba(0, 10, 20, 0.6)',
      '--adaptive-accent-color': '#4A90E2',
    },
    backgroundClass: 'starfield-infinity-bg',
    glassStyle: 'crystal',
    lightingEffect: 'accent',
    preview: '⭐ Infinite starfield with twinkling stars'
  },
  {
    id: 'galaxy-spiral',
    name: 'Galaxy Spiral',
    description: 'Spiral galaxy with luminous arms and cosmic phenomena',
    category: 'cosmic',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 245, 255, 0.98)',
      '--adaptive-text-secondary': 'rgba(255, 200, 255, 0.85)',
      '--adaptive-text-tertiary': 'rgba(255, 150, 255, 0.70)',
      '--adaptive-glass-bg': 'rgba(80, 20, 80, 0.20)',
      '--adaptive-glass-border': 'rgba(255, 120, 255, 0.30)',
      '--adaptive-glass-highlight': 'rgba(255, 180, 255, 0.35)',
      '--adaptive-shadow-color': 'rgba(40, 10, 40, 0.5)',
      '--adaptive-accent-color': '#FF69B4',
    },
    backgroundClass: 'galaxy-spiral-bg',
    glassStyle: 'ethereal',
    lightingEffect: 'dramatic',
    preview: '🌌 Spiral galaxy with luminous arms'
  },

  // ARTISTIC THEMES
  {
    id: 'abstract-geometry',
    name: 'Abstract Geometry',
    description: 'Modern geometric patterns with sophisticated color gradients',
    category: 'artistic',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 255, 255, 0.95)',
      '--adaptive-text-secondary': 'rgba(220, 220, 255, 0.80)',
      '--adaptive-text-tertiary': 'rgba(180, 180, 255, 0.65)',
      '--adaptive-glass-bg': 'rgba(40, 40, 80, 0.18)',
      '--adaptive-glass-border': 'rgba(120, 120, 200, 0.25)',
      '--adaptive-glass-highlight': 'rgba(160, 160, 220, 0.30)',
      '--adaptive-shadow-color': 'rgba(20, 20, 40, 0.4)',
      '--adaptive-accent-color': '#6366F1',
    },
    backgroundClass: 'abstract-geometry-bg',
    glassStyle: 'crystal',
    lightingEffect: 'accent',
    preview: '🔷 Modern geometric patterns'
  },
  {
    id: 'liquid-metal',
    name: 'Liquid Metal',
    description: 'Flowing metallic surfaces with dynamic reflections and highlights',
    category: 'artistic',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 255, 255, 0.98)',
      '--adaptive-text-secondary': 'rgba(220, 230, 240, 0.85)',
      '--adaptive-text-tertiary': 'rgba(180, 200, 220, 0.70)',
      '--adaptive-glass-bg': 'rgba(60, 70, 80, 0.22)',
      '--adaptive-glass-border': 'rgba(150, 170, 190, 0.30)',
      '--adaptive-glass-highlight': 'rgba(200, 220, 240, 0.35)',
      '--adaptive-shadow-color': 'rgba(30, 35, 40, 0.5)',
      '--adaptive-accent-color': '#64748B',
    },
    backgroundClass: 'liquid-metal-bg',
    glassStyle: 'liquid',
    lightingEffect: 'directional',
    preview: '🌊 Flowing metallic surfaces'
  },
  {
    id: 'prismatic-light',
    name: 'Prismatic Light',
    description: 'Rainbow light refractions with crystal-like optical effects',
    category: 'artistic',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 255, 255, 0.98)',
      '--adaptive-text-secondary': 'rgba(240, 240, 255, 0.85)',
      '--adaptive-text-tertiary': 'rgba(200, 200, 255, 0.70)',
      '--adaptive-glass-bg': 'rgba(80, 80, 120, 0.20)',
      '--adaptive-glass-border': 'rgba(180, 180, 255, 0.35)',
      '--adaptive-glass-highlight': 'rgba(220, 220, 255, 0.40)',
      '--adaptive-shadow-color': 'rgba(40, 40, 60, 0.4)',
      '--adaptive-accent-color': '#8B5CF6',
    },
    backgroundClass: 'prismatic-light-bg',
    glassStyle: 'crystal',
    lightingEffect: 'dramatic',
    preview: '🌈 Rainbow light refractions'
  },

  // PROFESSIONAL THEMES
  {
    id: 'executive-suite',
    name: 'Executive Suite',
    description: 'Sophisticated dark theme with premium materials and subtle lighting',
    category: 'professional',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 255, 255, 0.95)',
      '--adaptive-text-secondary': 'rgba(200, 200, 200, 0.80)',
      '--adaptive-text-tertiary': 'rgba(150, 150, 150, 0.65)',
      '--adaptive-glass-bg': 'rgba(40, 40, 40, 0.25)',
      '--adaptive-glass-border': 'rgba(100, 100, 100, 0.30)',
      '--adaptive-glass-highlight': 'rgba(150, 150, 150, 0.35)',
      '--adaptive-shadow-color': 'rgba(0, 0, 0, 0.6)',
      '--adaptive-accent-color': '#3B82F6',
    },
    backgroundClass: 'executive-suite-bg',
    glassStyle: 'strong',
    lightingEffect: 'ambient',
    preview: '💼 Sophisticated dark professional theme'
  },
  {
    id: 'platinum-elegance',
    name: 'Platinum Elegance',
    description: 'Luxurious platinum and silver tones with refined lighting',
    category: 'professional',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 255, 255, 0.98)',
      '--adaptive-text-secondary': 'rgba(230, 230, 230, 0.85)',
      '--adaptive-text-tertiary': 'rgba(200, 200, 200, 0.70)',
      '--adaptive-glass-bg': 'rgba(80, 80, 80, 0.20)',
      '--adaptive-glass-border': 'rgba(180, 180, 180, 0.30)',
      '--adaptive-glass-highlight': 'rgba(220, 220, 220, 0.35)',
      '--adaptive-shadow-color': 'rgba(20, 20, 20, 0.5)',
      '--adaptive-accent-color': '#6B7280',
    },
    backgroundClass: 'platinum-elegance-bg',
    glassStyle: 'liquid',
    lightingEffect: 'directional',
    preview: '🏆 Luxurious platinum and silver tones'
  },

  // SEASONAL THEMES
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    description: 'Delicate pink cherry blossoms with soft spring lighting',
    category: 'seasonal',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 250, 250, 0.95)',
      '--adaptive-text-secondary': 'rgba(255, 220, 230, 0.80)',
      '--adaptive-text-tertiary': 'rgba(255, 190, 210, 0.65)',
      '--adaptive-glass-bg': 'rgba(100, 60, 80, 0.15)',
      '--adaptive-glass-border': 'rgba(255, 180, 200, 0.25)',
      '--adaptive-glass-highlight': 'rgba(255, 220, 230, 0.30)',
      '--adaptive-shadow-color': 'rgba(50, 30, 40, 0.3)',
      '--adaptive-accent-color': '#F472B6',
    },
    backgroundClass: 'cherry-blossom-bg',
    glassStyle: 'soft',
    lightingEffect: 'ambient',
    preview: '🌸 Delicate pink cherry blossoms'
  },
  {
    id: 'autumn-forest',
    name: 'Autumn Forest',
    description: 'Rich autumn colors with golden leaves and warm lighting',
    category: 'seasonal',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(255, 250, 240, 0.95)',
      '--adaptive-text-secondary': 'rgba(255, 220, 180, 0.80)',
      '--adaptive-text-tertiary': 'rgba(255, 190, 140, 0.65)',
      '--adaptive-glass-bg': 'rgba(80, 50, 20, 0.18)',
      '--adaptive-glass-border': 'rgba(200, 150, 80, 0.25)',
      '--adaptive-glass-highlight': 'rgba(240, 200, 120, 0.30)',
      '--adaptive-shadow-color': 'rgba(40, 25, 10, 0.4)',
      '--adaptive-accent-color': '#F59E0B',
    },
    backgroundClass: 'autumn-forest-bg',
    glassStyle: 'soft',
    lightingEffect: 'directional',
    preview: '🍂 Rich autumn colors with golden leaves'
  },
  {
    id: 'winter-aurora',
    name: 'Winter Aurora',
    description: 'Icy winter landscape with aurora lights and crystalline effects',
    category: 'seasonal',
    cssVariables: {
      '--adaptive-text-primary': 'rgba(240, 250, 255, 0.98)',
      '--adaptive-text-secondary': 'rgba(200, 230, 255, 0.85)',
      '--adaptive-text-tertiary': 'rgba(160, 210, 255, 0.70)',
      '--adaptive-glass-bg': 'rgba(20, 40, 60, 0.20)',
      '--adaptive-glass-border': 'rgba(120, 180, 255, 0.30)',
      '--adaptive-glass-highlight': 'rgba(180, 220, 255, 0.35)',
      '--adaptive-shadow-color': 'rgba(10, 20, 30, 0.5)',
      '--adaptive-accent-color': '#0EA5E9',
    },
    backgroundClass: 'winter-aurora-bg',
    glassStyle: 'crystal',
    lightingEffect: 'ethereal',
    preview: '❄️ Icy winter landscape with aurora lights'
  }
]

// Theme Context
interface ThemeContextType {
  currentTheme: ThemePreset
  setTheme: (theme: ThemePreset) => void
  themes: ThemePreset[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme Provider Component
interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: string
}

export function ThemeProvider({ children, defaultTheme = 'aurora-borealis' }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(
    THEME_PRESETS.find(t => t.id === defaultTheme) || THEME_PRESETS[0]
  )

  const setTheme = (theme: ThemePreset) => {
    setCurrentTheme(theme)
    
    // Apply CSS variables to document root
    const root = document.documentElement
    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // Apply background class to body
    document.body.className = document.body.className
      .replace(/\b\w+-bg\b/g, '') // Remove existing background classes
      .trim()
    document.body.classList.add(theme.backgroundClass)
    
    // Store theme preference
    localStorage.setItem('preferred-theme', theme.id)
  }

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('preferred-theme')
    if (savedTheme) {
      const theme = THEME_PRESETS.find(t => t.id === savedTheme)
      if (theme) {
        setTheme(theme)
      }
    } else {
      // Apply default theme
      setTheme(currentTheme)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes: THEME_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Theme Selector Component
interface ThemeSelectorProps {
  className?: string
  showCategories?: boolean
  compact?: boolean
}

export function ThemeSelector({ className, showCategories = true, compact = false }: ThemeSelectorProps) {
  const { currentTheme, setTheme, themes } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(themes.map(t => t.category)))]
  const filteredThemes = selectedCategory === 'all' 
    ? themes 
    : themes.filter(t => t.category === selectedCategory)

  return (
    <div className={cn("space-y-6", className)}>
      {showCategories && (
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                "ios-button-secondary",
                selectedCategory === category && "ios-button-primary"
              )}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className={cn(
        "grid gap-4",
        compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      )}>
        {filteredThemes.map(theme => (
          <div
            key={theme.id}
            onClick={() => setTheme(theme)}
            className={cn(
              "group cursor-pointer transition-all duration-500",
              "glass-adaptive rounded-28 p-6",
              "hover:scale-105 hover:shadow-2xl",
              currentTheme.id === theme.id && "ring-2 ring-adaptive-accent-color"
            )}
          >
            <div className="space-y-3">
              <div className="text-lg font-semibold text-adaptive-primary">
                {theme.name}
              </div>
              <div className="text-sm text-adaptive-secondary">
                {theme.preview}
              </div>
              {!compact && (
                <div className="text-xs text-adaptive-tertiary">
                  {theme.description}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-1 rounded-full bg-adaptive-glass-bg text-adaptive-secondary">
                  {theme.category}
                </span>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-adaptive-accent-color to-adaptive-glass-highlight opacity-60" />
                  <div className="w-3 h-3 rounded-full bg-adaptive-glass-border opacity-40" />
                  <div className="w-3 h-3 rounded-full bg-adaptive-text-tertiary opacity-30" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Quick Theme Switcher Component
export function QuickThemeSwitcher({ className }: { className?: string }) {
  const { currentTheme, setTheme, themes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ios-button-secondary p-3 rounded-full"
        title="Change Theme"
      >
        🎨
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-strong rounded-28 p-4 z-50">
          <div className="space-y-2">
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => {
                  setTheme(theme)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full text-left p-3 rounded-14 transition-all duration-300",
                  "hover:bg-adaptive-glass-highlight",
                  currentTheme.id === theme.id && "bg-adaptive-glass-bg"
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{theme.preview.split(' ')[0]}</span>
                  <div>
                    <div className="text-sm font-medium text-adaptive-primary">
                      {theme.name}
                    </div>
                    <div className="text-xs text-adaptive-tertiary">
                      {theme.category}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}