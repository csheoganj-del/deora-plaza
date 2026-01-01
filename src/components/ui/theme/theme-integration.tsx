"use client"

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useTheme, QuickThemeSwitcher } from './theme-presets'
import { themeManager, ThemeTransition } from '@/lib/theme-utils'

/**
 * Theme Integration Components for easy theme system integration
 */

// Theme-aware container component
interface ThemeContainerProps {
  children: React.ReactNode
  className?: string
  glassEffect?: boolean
  lightingEffect?: boolean
  variant?: 'card' | 'panel' | 'modal' | 'sidebar'
}

export function ThemeContainer({ 
  children, 
  className, 
  glassEffect = true, 
  lightingEffect = false,
  variant = 'card'
}: ThemeContainerProps) {
  const { currentTheme } = useTheme()
  
  const baseClasses = {
    card: 'rounded-28 p-6',
    panel: 'rounded-20 p-8',
    modal: 'rounded-24 p-6 max-w-md mx-auto',
    sidebar: 'rounded-r-20 p-6 h-full'
  }
  
  const glassClasses = {
    soft: 'glass-soft',
    strong: 'glass-strong',
    crystal: 'glass-crystal',
    liquid: 'glass-liquid',
    ethereal: 'glass-ethereal'
  }

  return (
    <div className={cn(
      baseClasses[variant],
      glassEffect && glassClasses[currentTheme.glassStyle],
      'relative transition-all duration-500',
      className
    )}>
      {lightingEffect && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-adaptive-accent-color/20 rounded-full blur-xl animate-pulse" />
        </div>
      )}
      {children}
    </div>
  )
}

// Theme-aware text component
interface ThemeTextProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'tertiary' | 'accent'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  className?: string
}

export function ThemeText({ 
  children, 
  variant = 'primary', 
  size = 'base',
  weight = 'normal',
  className 
}: ThemeTextProps) {
  const textClasses = {
    primary: 'text-adaptive-primary',
    secondary: 'text-adaptive-secondary',
    tertiary: 'text-adaptive-tertiary',
    accent: 'text-adaptive-accent-color'
  }
  
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl'
  }
  
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }

  return (
    <span className={cn(
      textClasses[variant],
      sizeClasses[size],
      weightClasses[weight],
      'transition-colors duration-300',
      className
    )}>
      {children}
    </span>
  )
}

// Theme-aware button component
interface ThemeButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function ThemeButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  onClick,
  disabled = false
}: ThemeButtonProps) {
  const baseClasses = 'transition-all duration-300 font-medium rounded-14 focus:outline-none focus:ring-2 focus:ring-adaptive-accent-color'
  
  const variantClasses = {
    primary: 'ios-button-primary',
    secondary: 'ios-button-secondary',
    ghost: 'hover:bg-adaptive-glass-bg text-adaptive-primary',
    destructive: 'ios-button-destructive'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  )
}

// Theme-aware input component
interface ThemeInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'search'
  className?: string
  icon?: React.ReactNode
}

export function ThemeInput({ 
  placeholder, 
  value, 
  onChange, 
  type = 'text',
  className,
  icon
}: ThemeInputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-adaptive-tertiary">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'ios-input w-full',
          icon && 'pl-10',
          className
        )}
      />
    </div>
  )
}

// Theme status indicator
export function ThemeStatusIndicator() {
  const { currentTheme } = useTheme()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => setIsVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [currentTheme])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-apple-float-in">
      <div className="glass-strong rounded-14 px-4 py-2 flex items-center space-x-3">
        <span className="text-2xl">{currentTheme.preview.split(' ')[0]}</span>
        <div>
          <div className="text-sm font-medium text-adaptive-primary">
            {currentTheme.name}
          </div>
          <div className="text-xs text-adaptive-tertiary">
            Theme applied
          </div>
        </div>
      </div>
    </div>
  )
}

// Theme settings panel
interface ThemeSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ThemeSettingsPanel({ isOpen, onClose }: ThemeSettingsPanelProps) {
  const { currentTheme, setTheme, themes } = useTheme()
  const [autoTheme, setAutoTheme] = useState(false)
  const [timeBasedTheme, setTimeBasedTheme] = useState(false)

  const handleAutoTheme = () => {
    setAutoTheme(!autoTheme)
    if (!autoTheme) {
      themeManager.applySystemBasedTheme()
    }
  }

  const handleTimeBasedTheme = () => {
    setTimeBasedTheme(!timeBasedTheme)
    if (!timeBasedTheme) {
      themeManager.applyTimeBasedTheme()
    }
  }

  const handleRandomTheme = () => {
    const randomTheme = themeManager.getRandomTheme()
    ThemeTransition.transitionToTheme(randomTheme)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong rounded-28 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-adaptive-primary">
            🎨 Theme Settings
          </h2>
          <button
            onClick={onClose}
            className="ios-button-secondary p-2 rounded-full"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Theme */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-adaptive-primary">
              Current Theme
            </h3>
            <div className="glass-soft rounded-20 p-4 flex items-center space-x-4">
              <span className="text-3xl">{currentTheme.preview.split(' ')[0]}</span>
              <div>
                <div className="font-medium text-adaptive-primary">
                  {currentTheme.name}
                </div>
                <div className="text-sm text-adaptive-secondary">
                  {currentTheme.description}
                </div>
              </div>
            </div>
          </div>

          {/* Auto Theme Options */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-adaptive-primary">
              Automatic Themes
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-adaptive-secondary">
                  System-based theme selection
                </span>
                <button
                  onClick={handleAutoTheme}
                  className={cn('ios-toggle', autoTheme && 'active')}
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-adaptive-secondary">
                  Time-based theme changes
                </span>
                <button
                  onClick={handleTimeBasedTheme}
                  className={cn('ios-toggle', timeBasedTheme && 'active')}
                />
              </label>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-adaptive-primary">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <ThemeButton onClick={handleRandomTheme} variant="secondary">
                🎲 Random Theme
              </ThemeButton>
              <ThemeButton 
                onClick={() => themeManager.applyTimeBasedTheme()} 
                variant="secondary"
              >
                🕐 Time-based
              </ThemeButton>
            </div>
          </div>

          {/* Theme Categories */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-adaptive-primary">
              Browse by Category
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['natural', 'cosmic', 'artistic', 'professional', 'seasonal'].map(category => (
                <button
                  key={category}
                  onClick={() => {
                    const randomTheme = themeManager.getRandomTheme(category)
                    setTheme(randomTheme)
                  }}
                  className="ios-button-secondary text-sm py-2"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Themes */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-adaptive-primary">
              Featured Themes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themes.slice(0, 4).map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme)}
                  className={cn(
                    "glass-soft rounded-14 p-3 text-left transition-all duration-300",
                    "hover:scale-105",
                    currentTheme.id === theme.id && "ring-2 ring-adaptive-accent-color"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{theme.preview.split(' ')[0]}</span>
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
        </div>
      </div>
    </div>
  )
}

// Theme floating action button
export function ThemeFloatingButton() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex flex-col items-end space-y-3">
          {/* Expanded options */}
          {isExpanded && (
            <div className="flex flex-col space-y-2 animate-apple-float-in">
              <button
                onClick={() => themeManager.applyTimeBasedTheme()}
                className="glass-strong rounded-full p-3 hover:scale-110 transition-transform"
                title="Time-based theme"
              >
                🕐
              </button>
              <button
                onClick={() => {
                  const randomTheme = themeManager.getRandomTheme()
                  ThemeTransition.crossfadeToTheme(randomTheme)
                }}
                className="glass-strong rounded-full p-3 hover:scale-110 transition-transform"
                title="Random theme"
              >
                🎲
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="glass-strong rounded-full p-3 hover:scale-110 transition-transform"
                title="Theme settings"
              >
                ⚙️
              </button>
            </div>
          )}
          
          {/* Main button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "glass-strong rounded-full p-4 hover:scale-110 transition-all duration-300",
              "shadow-lg hover:shadow-xl",
              isExpanded && "rotate-45"
            )}
            title="Theme options"
          >
            🎨
          </button>
        </div>
      </div>

      <ThemeSettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  )
}

// Theme preview grid for quick selection
interface ThemePreviewGridProps {
  onThemeSelect?: (themeId: string) => void
  compact?: boolean
  maxItems?: number
}

export function ThemePreviewGrid({ 
  onThemeSelect, 
  compact = false, 
  maxItems = 8 
}: ThemePreviewGridProps) {
  const { currentTheme, setTheme, themes } = useTheme()
  const displayThemes = themes.slice(0, maxItems)

  const handleThemeSelect = (theme: typeof themes[0]) => {
    setTheme(theme)
    onThemeSelect?.(theme.id)
  }

  return (
    <div className={cn(
      "grid gap-3",
      compact 
        ? "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8" 
        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
    )}>
      {displayThemes.map(theme => (
        <button
          key={theme.id}
          onClick={() => handleThemeSelect(theme)}
          className={cn(
            "group relative overflow-hidden transition-all duration-300",
            "hover:scale-105 hover:shadow-lg",
            compact ? "aspect-square rounded-14" : "aspect-video rounded-20",
            currentTheme.id === theme.id && "ring-2 ring-adaptive-accent-color"
          )}
        >
          <div className={cn("w-full h-full", theme.backgroundClass)}>
            <div className={cn(
              "absolute inset-0 flex items-center justify-center",
              `glass-${theme.glassStyle}`
            )}>
              {compact ? (
                <span className="text-lg">{theme.preview.split(' ')[0]}</span>
              ) : (
                <div className="text-center p-2">
                  <div className="text-2xl mb-1">{theme.preview.split(' ')[0]}</div>
                  <div className="text-xs text-adaptive-primary font-medium">
                    {theme.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// Export all components
export {
  ThemeContainer as Container,
  ThemeText as Text,
  ThemeButton as Button,
  ThemeInput as Input
}