"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

interface GlassmorphismContextType {
  currentBackground: string | null
  adaptiveStyles: any
  uploadBackground: (file: File) => Promise<void>
  setPresetBackground: (background: string) => void
  resetToDefault: () => void
}

const GlassmorphismContext = createContext<GlassmorphismContextType | null>(null)

export function useGlassmorphism() {
  const context = useContext(GlassmorphismContext)
  if (!context) {
    throw new Error('useGlassmorphism must be used within GlassmorphismProvider')
  }
  return context
}

const defaultStyles = {
  '--glass-color': 'rgba(255, 255, 255, 0.25)',
  '--text-color': 'rgba(0, 0, 0, 0.9)',
  '--border-color': 'rgba(255, 255, 255, 0.18)',
  '--shadow-color': 'rgba(0, 0, 0, 0.18)',
  '--accent-color': '#3b82f6',
  '--blur-intensity': '20px',
  '--saturation': '180%',
  '--blur-intensity-minus-10': '10px',
  '--blur-intensity-minus-8': '12px',
  '--blur-intensity-plus-2': '22px',
  '--blur-intensity-plus-4': '24px',
  '--saturation-minus-20': '160%',
  '--text-shadow': '0 1px 3px rgba(255, 255, 255, 0.8)',
  '--card-backdrop': 'rgba(255, 255, 255, 0.4)',
  '--strong-glass': 'rgba(255, 255, 255, 0.5)',
  '--text-background': 'rgba(255, 255, 255, 0.7)',
}

export function GlassmorphismProvider({ children }: { children: React.ReactNode }) {
  const [currentBackground, setCurrentBackground] = useState<string | null>(null)
  const [adaptiveStyles, setAdaptiveStyles] = useState<any>(defaultStyles)

  const uploadBackground = async (file: File) => {
    try {
      // Create simple background image URL
      const imageUrl = URL.createObjectURL(file)
      setCurrentBackground(`url(${imageUrl})`)
    } catch (error) {
      console.error('Image upload failed:', error)
    }
  }

  const setPresetBackground = (background: string) => {
    setCurrentBackground(background)
    setAdaptiveStyles(defaultStyles)
  }

  const resetToDefault = () => {
    setCurrentBackground(null)
    setAdaptiveStyles(defaultStyles)
  }

  return (
    <GlassmorphismContext.Provider
      value={{
        currentBackground,
        adaptiveStyles,
        uploadBackground,
        setPresetBackground,
        resetToDefault,
      }}
    >
      <div
        className="glassmorphism-root"
        style={{
          ...adaptiveStyles,
          background: currentBackground || 'linear-gradient(180deg, #f5f7fa, #e6ebf1)',
          minHeight: '100vh',
          transition: 'background 0.5s ease',
        } as React.CSSProperties}
      >
        {children}
      </div>
    </GlassmorphismContext.Provider>
  )
}