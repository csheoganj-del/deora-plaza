"use client"

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useTheme, ThemeSelector, QuickThemeSwitcher, THEME_PRESETS } from './theme-presets'

// Lighting Effect Components
const LightingEffects = {
  ambient: () => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-radial from-white/10 to-transparent rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-gradient-radial from-white/8 to-transparent rounded-full blur-lg animate-pulse delay-1000" />
    </div>
  ),
  directional: () => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 right-0 w-1/2 h-1/2 bg-gradient-to-l from-white/8 to-transparent blur-sm" />
    </div>
  ),
  accent: () => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-radial from-adaptive-accent-color/20 to-transparent rounded-full blur-2xl animate-pulse" />
      <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-adaptive-accent-color/30 rounded-full blur-xl animate-ping" />
    </div>
  ),
  dramatic: () => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/3 w-2 h-full bg-gradient-to-b from-white/20 via-white/5 to-transparent blur-sm transform -skew-x-12" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gradient-radial from-adaptive-accent-color/25 to-transparent rounded-full blur-2xl" />
      <div className="absolute top-1/3 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-sm" />
    </div>
  ),
  ethereal: () => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent animate-pulse" />
      <div className="absolute top-1/4 left-1/3 w-20 h-20 bg-gradient-radial from-adaptive-accent-color/15 to-transparent rounded-full blur-xl animate-float" />
      <div className="absolute bottom-1/3 right-1/4 w-16 h-16 bg-gradient-radial from-white/12 to-transparent rounded-full blur-lg animate-float delay-2000" />
      <div className="absolute top-2/3 left-1/4 w-12 h-12 bg-gradient-radial from-adaptive-accent-color/10 to-transparent rounded-full blur-md animate-float delay-4000" />
    </div>
  )
}

// Artistic Element Components
const ArtisticElements = {
  particles: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
  ),
  geometricShapes: () => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-16 h-16 border border-white/20 rotate-45 animate-spin-slow" />
      <div className="absolute bottom-1/3 right-1/3 w-12 h-12 bg-gradient-to-br from-adaptive-accent-color/20 to-transparent rounded-full animate-pulse" />
      <div className="absolute top-2/3 left-2/3 w-8 h-8 bg-white/10 transform rotate-12 animate-bounce-slow" />
    </div>
  ),
  organicFlows: () => (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full opacity-20" viewBox="0 0 400 400">
        <path
          d="M50,200 Q200,50 350,200 T350,200"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="animate-draw-path text-adaptive-accent-color"
        />
        <path
          d="M100,300 Q250,150 400,300"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          className="animate-draw-path text-white delay-2000"
        />
      </svg>
    </div>
  )
}

// Theme Preview Card Component
interface ThemePreviewCardProps {
  theme: typeof THEME_PRESETS[0]
  isActive: boolean
  onClick: () => void
}

function ThemePreviewCard({ theme, isActive, onClick }: ThemePreviewCardProps) {
  const LightingComponent = LightingEffects[theme.lightingEffect]

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer transition-all duration-500 transform",
        "rounded-28 overflow-hidden",
        "hover:scale-105 hover:shadow-2xl",
        isActive ? "ring-2 ring-adaptive-accent-color scale-105" : "hover:ring-1 hover:ring-white/30"
      )}
    >
      {/* Background Preview */}
      <div className={cn("w-full h-48 relative", theme.backgroundClass)}>
        {/* Lighting Effects */}
        <LightingComponent />
        
        {/* Glass Overlay */}
        <div className={cn("absolute inset-4", `glass-${theme.glassStyle}`)}>
          <div className="p-4 h-full flex flex-col justify-between">
            <div>
              <div className="text-lg font-semibold text-adaptive-primary mb-1">
                {theme.name}
              </div>
              <div className="text-xs text-adaptive-secondary">
                {theme.category}
              </div>
            </div>
            <div className="text-2xl">{theme.preview.split(' ')[0]}</div>
          </div>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Theme Info */}
      <div className="p-4 glass-soft">
        <div className="text-sm font-medium text-adaptive-primary mb-2">
          {theme.name}
        </div>
        <div className="text-xs text-adaptive-tertiary mb-3 line-clamp-2">
          {theme.description}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-1 rounded-full bg-adaptive-glass-bg text-adaptive-secondary">
            {theme.lightingEffect}
          </span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-adaptive-accent-color opacity-60" />
            <div className="w-2 h-2 rounded-full bg-adaptive-glass-border opacity-40" />
            <div className="w-2 h-2 rounded-full bg-adaptive-text-tertiary opacity-30" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Theme Showcase Component
export function ThemeShowcase() {
  const { currentTheme, setTheme, themes } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = ['all', ...Array.from(new Set(themes.map(t => t.category)))]
  
  const filteredThemes = themes.filter(theme => {
    const matchesCategory = selectedCategory === 'all' || theme.category === selectedCategory
    const matchesSearch = theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-adaptive-primary">
          🎨 World-Class Theme Gallery
        </h1>
        <p className="text-lg text-adaptive-secondary max-w-2xl mx-auto">
          Discover our collection of artistic themes featuring professional lighting effects, 
          natural scenery, and sophisticated visual components.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search themes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ios-input w-full pl-10"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-adaptive-tertiary">
            🔍
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                selectedCategory === category 
                  ? "ios-button-primary" 
                  : "ios-button-secondary"
              )}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Quick Theme Switcher */}
        <QuickThemeSwitcher />
      </div>

      {/* Current Theme Display */}
      <div className="glass-strong rounded-28 p-8">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-adaptive-primary mb-2">
              Currently Active: {currentTheme.name}
            </h2>
            <p className="text-adaptive-secondary mb-4">
              {currentTheme.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-adaptive-glass-bg text-adaptive-secondary text-sm">
                Category: {currentTheme.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-adaptive-glass-bg text-adaptive-secondary text-sm">
                Glass: {currentTheme.glassStyle}
              </span>
              <span className="px-3 py-1 rounded-full bg-adaptive-glass-bg text-adaptive-secondary text-sm">
                Lighting: {currentTheme.lightingEffect}
              </span>
            </div>
          </div>
          <div className="text-6xl">{currentTheme.preview.split(' ')[0]}</div>
        </div>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredThemes.map(theme => (
          <ThemePreviewCard
            key={theme.id}
            theme={theme}
            isActive={currentTheme.id === theme.id}
            onClick={() => setTheme(theme)}
          />
        ))}
      </div>

      {/* No Results */}
      {filteredThemes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-adaptive-primary mb-2">
            No themes found
          </h3>
          <p className="text-adaptive-secondary">
            Try adjusting your search or category filter
          </p>
        </div>
      )}

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="glass-soft rounded-28 p-6 text-center">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-lg font-semibold text-adaptive-primary mb-2">
            Professional Lighting
          </h3>
          <p className="text-adaptive-secondary text-sm">
            Ambient, directional, accent, dramatic, and ethereal lighting effects
          </p>
        </div>
        
        <div className="glass-soft rounded-28 p-6 text-center">
          <div className="text-4xl mb-4">🌿</div>
          <h3 className="text-lg font-semibold text-adaptive-primary mb-2">
            Natural Elements
          </h3>
          <p className="text-adaptive-secondary text-sm">
            Aurora, ocean depths, mountains, forests, and seasonal themes
          </p>
        </div>
        
        <div className="glass-soft rounded-28 p-6 text-center">
          <div className="text-4xl mb-4">🎭</div>
          <h3 className="text-lg font-semibold text-adaptive-primary mb-2">
            Artistic Design
          </h3>
          <p className="text-adaptive-secondary text-sm">
            Glassmorphism, gradients, shadows, and sophisticated visual hierarchy
          </p>
        </div>
      </div>
    </div>
  )
}

// Theme Demo Component for testing individual themes
export function ThemeDemo({ themeId }: { themeId?: string }) {
  const { themes, setTheme } = useTheme()
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (themeId) {
      const theme = themes.find(t => t.id === themeId)
      if (theme) {
        setTheme(theme)
      }
    }
  }, [themeId, themes, setTheme])

  const nextTheme = () => {
    const nextIndex = (currentIndex + 1) % themes.length
    setCurrentIndex(nextIndex)
    setTheme(themes[nextIndex])
  }

  const prevTheme = () => {
    const prevIndex = currentIndex === 0 ? themes.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    setTheme(themes[prevIndex])
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <div className="glass-strong rounded-28 p-8 max-w-md w-full text-center space-y-6">
        <h2 className="text-2xl font-bold text-adaptive-primary">
          Theme Demo
        </h2>
        
        <div className="space-y-4">
          <div className="text-6xl">{themes[currentIndex].preview.split(' ')[0]}</div>
          <h3 className="text-xl font-semibold text-adaptive-primary">
            {themes[currentIndex].name}
          </h3>
          <p className="text-adaptive-secondary text-sm">
            {themes[currentIndex].description}
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <button onClick={prevTheme} className="ios-button-secondary px-4 py-2">
            ← Previous
          </button>
          <span className="text-adaptive-tertiary text-sm">
            {currentIndex + 1} / {themes.length}
          </span>
          <button onClick={nextTheme} className="ios-button-secondary px-4 py-2">
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}

// Custom animations for the showcase
const customAnimations = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

@keyframes draw-path {
  0% { stroke-dasharray: 0 1000; }
  100% { stroke-dasharray: 1000 0; }
}

.animate-float { animation: float 6s ease-in-out infinite; }
.animate-spin-slow { animation: spin-slow 20s linear infinite; }
.animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
.animate-draw-path { animation: draw-path 8s ease-in-out infinite; }
.line-clamp-2 { 
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`

// Inject custom animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = customAnimations
  document.head.appendChild(style)
}