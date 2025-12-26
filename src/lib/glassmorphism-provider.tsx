"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { analyzeImageColors, createImageBackground, type ColorAnalysis } from '@/lib/color-analysis'

interface GlassmorphismContextType {
  currentBackground: string | null
  smartColors: ColorAnalysis | null
  adaptiveStyles: any
  isAnalyzing: boolean
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
  const [smartColors, setSmartColors] = useState<ColorAnalysis | null>(null)
  const [adaptiveStyles, setAdaptiveStyles] = useState<any>(defaultStyles)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const uploadBackground = async (file: File) => {
    setIsAnalyzing(true)
    
    try {
      // Create background image
      const imageUrl = await createImageBackground(file)
      setCurrentBackground(`url(${imageUrl})`)
      
      // Analyze colors for smart adaptation
      const img = new Image()
      img.onload = async () => {
        try {
          const analysis = await analyzeImageColors(img)
          setSmartColors(analysis)
          
          // Create adaptive styles
          const newStyles = {
            '--glass-color': analysis.glassColor,
            '--text-color': analysis.textColor,
            '--border-color': analysis.borderColor,
            '--shadow-color': analysis.shadowColor,
            '--accent-color': analysis.accentColor,
            '--blur-intensity': `${analysis.blurIntensity}px`,
            '--saturation': `${analysis.saturation}%`,
            '--blur-intensity-minus-10': `${analysis.blurIntensity - 10}px`,
            '--blur-intensity-minus-8': `${analysis.blurIntensity - 8}px`,
            '--blur-intensity-plus-2': `${analysis.blurIntensity + 2}px`,
            '--blur-intensity-plus-4': `${analysis.blurIntensity + 4}px`,
            '--saturation-minus-20': `${analysis.saturation - 20}%`,
            '--text-shadow': analysis.textShadow,
            '--card-backdrop': analysis.cardBackdrop,
            '--strong-glass': analysis.strongGlass,
            '--text-background': analysis.textBackground,
          }
          setAdaptiveStyles(newStyles)
        } catch (error) {
          console.error('Color analysis failed:', error)
        } finally {
          setIsAnalyzing(false)
        }
      }
      img.src = imageUrl
    } catch (error) {
      console.error('Image upload failed:', error)
      setIsAnalyzing(false)
    }
  }

  const setPresetBackground = (background: string) => {
    setCurrentBackground(background)
    setSmartColors(null)
    setAdaptiveStyles(defaultStyles)
  }

  const resetToDefault = () => {
    setCurrentBackground(null)
    setSmartColors(null)
    setAdaptiveStyles(defaultStyles)
  }

  return (
    <GlassmorphismContext.Provider
      value={{
        currentBackground,
        smartColors,
        adaptiveStyles,
        isAnalyzing,
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