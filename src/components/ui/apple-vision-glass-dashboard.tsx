"use client"

import React, { useState, useEffect, useRef } from 'react'
import { 
  Home, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Bell, 
  LogOut,
  Hotel,
  Coffee,
  Wine,
  TreePine,
  ChefHat,
  Search,
  Plus,
  Calendar,
  Clock,
  Palette,
  Upload
} from 'lucide-react'
import { analyzeImageColors, createImageBackground, type ColorAnalysis } from '@/lib/color-analysis'

interface MenuItem {
  icon: React.ReactNode
  label: string
  badge?: number
  href?: string
  isActive?: boolean
}

interface VisionCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const VisionCard = ({ children, className = "", onClick }: VisionCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isIdle, setIsIdle] = useState(false)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    let idleTimeout: NodeJS.Timeout

    const startIdle = () => {
      idleTimeout = setTimeout(() => {
        setIsIdle(true)
      }, 1200)
    }

    const stopIdle = () => {
      clearTimeout(idleTimeout)
      setIsIdle(false)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const rotateX = ((y / rect.height) - 0.5) * -8
      const rotateY = ((x / rect.width) - 0.5) * 8

      card.style.transform = `
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateY(-6px)
      `

      card.style.setProperty('--x', `${(x / rect.width) * 100}%`)
      card.style.setProperty('--y', `${(y / rect.height) * 100}%`)
      
      card.style.boxShadow = `
        0 40px 80px rgba(0,0,0,0.22),
        inset 0 1px 1px rgba(255,255,255,0.8)
      `
    }

    const handleMouseLeave = () => {
      card.style.transform = "rotateX(0) rotateY(0) translateY(0)"
      card.style.boxShadow = `
        0 30px 60px rgba(0,0,0,0.18),
        inset 0 1px 1px rgba(255,255,255,0.7)
      `
      startIdle()
    }

    const handleMouseEnter = () => {
      stopIdle()
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)
    card.addEventListener('mouseenter', handleMouseEnter)

    startIdle()

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
      card.removeEventListener('mouseenter', handleMouseEnter)
      clearTimeout(idleTimeout)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`
        vision-card
        ${isIdle ? 'idle' : ''}
        ${className}
      `}
      style={{
        '--x': '50%',
        '--y': '50%'
      } as React.CSSProperties}
    >
      <div className="vision-card-highlight"></div>
      {children}
    </div>
  )
}

const LiquidGlassButton = ({
  children,
  onClick,
  variant = 'primary',
  className = ""
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  className?: string
}) => {
  return (
    <button
      onClick={onClick}
      className={`liquid-glass ${variant} ${className}`}
    >
      {children}
    </button>
  )
}

export function AppleVisionGlassDashboard() {
  const [activeItem, setActiveItem] = useState(0)
  const [currentBackground, setCurrentBackground] = useState(0)
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false)
  const [customBackground, setCustomBackground] = useState<string | null>(null)
  const [smartColors, setSmartColors] = useState<ColorAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [adaptiveStyles, setAdaptiveStyles] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const backgroundOptions = [
    {
      name: "Apple Default",
      background: "linear-gradient(180deg, #f5f7fa, #e6ebf1)",
      patterns: true
    },
    {
      name: "Ocean Breeze", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      patterns: false
    },
    {
      name: "Sunset Glow",
      background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
      patterns: false
    },
    {
      name: "Forest Mist",
      background: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
      patterns: false
    },
    {
      name: "Aurora Borealis",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      patterns: false
    },
    {
      name: "Desert Sand",
      background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      patterns: false
    },
    {
      name: "Midnight Sky",
      background: "linear-gradient(135deg, #2c3e50 0%, #000428 100%)",
      patterns: false
    },
    {
      name: "Cherry Blossom",
      background: "linear-gradient(135deg, #ffeef8 0%, #f8d7da 50%, #ffc0cb 100%)",
      patterns: false
    },
    {
      name: "Custom Image",
      background: customBackground || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      patterns: false,
      isCustom: true
    }
  ]

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('Starting image upload and analysis...')
    setIsAnalyzing(true)
    
    try {
      // Create background image
      const imageUrl = await createImageBackground(file)
      console.log('Image background created:', imageUrl.substring(0, 50) + '...')
      setCustomBackground(`url(${imageUrl})`)
      
      // Analyze colors for smart adaptation
      const img = new Image()
      img.onload = async () => {
        try {
          console.log('Starting color analysis...')
          const analysis = await analyzeImageColors(img)
          console.log('Color analysis complete:', analysis)
          setSmartColors(analysis)
          
          // Create adaptive styles object with enhanced readability
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
            // Enhanced readability
            '--text-shadow': analysis.textShadow,
            '--card-backdrop': analysis.cardBackdrop,
            '--strong-glass': analysis.strongGlass,
            '--text-background': analysis.textBackground,
          }
          console.log('Setting adaptive styles:', newStyles)
          setAdaptiveStyles(newStyles)
          
          setCurrentBackground(backgroundOptions.length - 1) // Switch to custom image
          setShowBackgroundSelector(false)
          setForceUpdate(prev => prev + 1) // Force re-render
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

  const getCurrentGlassStyles = () => {
    console.log('getCurrentGlassStyles check:', {
      customBackground: !!customBackground,
      smartColors: !!smartColors,
      currentBackground,
      backgroundOptionsLength: backgroundOptions.length,
      isCustomSelected: currentBackground === backgroundOptions.length - 1
    })
    
    if (smartColors && currentBackground === backgroundOptions.length - 1) {
      // Use smart colors for custom image
      console.log('✅ Using smart colors:', smartColors)
      return {
        glassColor: smartColors.glassColor,
        textColor: smartColors.textColor,
        borderColor: smartColors.borderColor,
        shadowColor: smartColors.shadowColor,
        accentColor: smartColors.accentColor,
        blurIntensity: smartColors.blurIntensity,
        saturation: smartColors.saturation
      }
    } else {
      // Use default glass styles for preset backgrounds
      console.log('❌ Using default glass styles - condition failed')
      return {
        glassColor: 'rgba(255, 255, 255, 0.25)',
        textColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.18)',
        shadowColor: 'rgba(0, 0, 0, 0.18)',
        accentColor: '#3b82f6',
        blurIntensity: 20,
        saturation: 180
      }
    }
  }

  const glassStyles = getCurrentGlassStyles()

  // Get the current styles to apply - use adaptiveStyles when available
  const currentStyles = adaptiveStyles || {
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
    // Default enhanced readability
    '--text-shadow': '0 1px 3px rgba(255, 255, 255, 0.8)',
    '--card-backdrop': 'rgba(255, 255, 255, 0.4)',
    '--strong-glass': 'rgba(255, 255, 255, 0.5)',
    '--text-background': 'rgba(255, 255, 255, 0.7)',
  }

  console.log('🎨 Current styles being applied:', currentStyles)

  // Cursor gravity effect
  useEffect(() => {
    const gravityRadius = 220
    const gravityStrength = 0.12

    const handleMouseMove = (e: MouseEvent) => {
      document.querySelectorAll('.vision-card').forEach(card => {
        const rect = card.getBoundingClientRect()
        const cardX = rect.left + rect.width / 2
        const cardY = rect.top + rect.height / 2

        const dx = e.clientX - cardX
        const dy = e.clientY - cardY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < gravityRadius) {
          const pull = (1 - distance / gravityRadius) * gravityStrength
          const element = card as HTMLElement
          element.style.transform = `translate(${dx * pull}px, ${dy * pull}px)`
        } else {
          const element = card as HTMLElement
          element.style.transform = "translate(0,0)"
        }
      })
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const menuItems: MenuItem[] = [
    { icon: <Home size={18} />, label: "Dashboard", href: "/dashboard", isActive: activeItem === 0 },
    { icon: <ShoppingCart size={18} />, label: "Orders", badge: 5, href: "/dashboard/orders", isActive: activeItem === 1 },
    { icon: <ChefHat size={18} />, label: "Kitchen", href: "/dashboard/kitchen", isActive: activeItem === 2 },
    { icon: <Coffee size={18} />, label: "Cafe", href: "/dashboard/cafe", isActive: activeItem === 3 },
    { icon: <Wine size={18} />, label: "Bar", href: "/dashboard/bar", isActive: activeItem === 4 },
    { icon: <Hotel size={18} />, label: "Hotel", href: "/dashboard/hotel", isActive: activeItem === 5 },
    { icon: <TreePine size={18} />, label: "Garden", href: "/dashboard/garden", isActive: activeItem === 6 },
    { icon: <Users size={18} />, label: "Customers", href: "/dashboard/customers", isActive: activeItem === 7 },
    { icon: <BarChart3 size={18} />, label: "Analytics", href: "/dashboard/analytics", isActive: activeItem === 8 },
    { icon: <Bell size={18} />, label: "Notifications", badge: 3, href: "/dashboard/notifications", isActive: activeItem === 9 },
    { icon: <Settings size={18} />, label: "Settings", href: "/dashboard/settings", isActive: activeItem === 10 },
  ]

  return (
    <div 
      className="min-h-screen flex"
      style={currentStyles as React.CSSProperties}
    >
      <style jsx global>{`
        body {
          background: ${backgroundOptions[currentBackground].background};
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
          margin: 0;
          padding: 0;
          position: relative;
          transition: background 0.5s ease;
        }

        ${backgroundOptions[currentBackground].patterns ? `
        body::before {
          content: "";
          position: fixed;
          inset: 0;
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        body::after {
          content: "";
          position: fixed;
          inset: 0;
          background-image: 
            repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(255,255,255,0.03) 100px, rgba(255,255,255,0.03) 200px),
            repeating-linear-gradient(-45deg, transparent, transparent 100px, rgba(255,255,255,0.02) 100px, rgba(255,255,255,0.02) 200px);
          pointer-events: none;
          z-index: 0;
        }` : ''}

        .vision-card {
          padding: 24px;
          border-radius: 22px;
          background: var(--strong-glass);
          backdrop-filter: blur(var(--blur-intensity)) saturate(var(--saturation));
          -webkit-backdrop-filter: blur(var(--blur-intensity)) saturate(var(--saturation));
          border: 1px solid var(--border-color);
          box-shadow: 
            0 30px 60px var(--shadow-color),
            inset 0 1px 1px rgba(255, 255, 255, 0.7);
          transition: 
            transform 0.18s ease,
            box-shadow 0.18s ease;
          transform-style: preserve-3d;
          perspective: 1000px;
          position: relative;
          overflow: hidden;
          will-change: transform;
          cursor: pointer;
          z-index: 10;
          color: var(--text-color);
        }

        .vision-card h1, .vision-card h2, .vision-card h3, .vision-card h4, .vision-card h5, .vision-card h6 {
          text-shadow: var(--text-shadow);
          font-weight: 600;
        }

        .vision-card p, .vision-card span {
          text-shadow: var(--text-shadow);
        }

        .vision-card-highlight {
          content: "";
          position: absolute;
          inset: -40%;
          background: radial-gradient(
            circle at var(--x, 50%) var(--y, 50%),
            rgba(255,255,255,0.35),
            transparent 45%
          );
          transition: opacity 0.2s ease;
          pointer-events: none;
          opacity: 0;
        }

        .vision-card:hover .vision-card-highlight {
          opacity: 1;
        }

        .vision-card.idle {
          animation: visionFloat 6s ease-in-out infinite;
        }

        @keyframes visionFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        .liquid-glass {
          padding: 14px 28px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-color);
          background: var(--strong-glass);
          backdrop-filter: blur(var(--blur-intensity)) saturate(var(--saturation));
          -webkit-backdrop-filter: blur(var(--blur-intensity)) saturate(var(--saturation));
          border: 1px solid var(--border-color);
          box-shadow: 
            0 12px 30px var(--shadow-color),
            inset 0 1px 1px rgba(255, 255, 255, 0.7);
          transition: 
            transform 0.18s ease,
            box-shadow 0.18s ease,
            backdrop-filter 0.18s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          z-index: 10;
          text-shadow: var(--text-shadow);
        }

        .liquid-glass::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            120deg,
            rgba(255,255,255,0.6),
            rgba(255,255,255,0)
          );
          opacity: 0.5;
          pointer-events: none;
        }

        .liquid-glass:active {
          transform: scale(0.97) translateY(2px);
          backdrop-filter: blur(var(--blur-intensity-plus-2)) saturate(var(--saturation-minus-20));
          -webkit-backdrop-filter: blur(var(--blur-intensity-plus-2)) saturate(var(--saturation-minus-20));
          box-shadow: 
            0 4px 10px var(--shadow-color),
            inset 0 2px 3px rgba(255, 255, 255, 0.9);
        }

        .liquid-glass:hover {
          box-shadow: 
            0 16px 40px var(--shadow-color),
            inset 0 1px 1px rgba(255, 255, 255, 0.8);
        }

        .liquid-glass.secondary {
          background: var(--glass-color);
          color: var(--text-color);
        }

        .vision-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
          padding: 60px;
        }

        .vision-sidebar {
          width: 280px;
          height: 100vh;
          padding: 24px;
          background: var(--strong-glass);
          backdrop-filter: blur(var(--blur-intensity-plus-4)) saturate(var(--saturation));
          -webkit-backdrop-filter: blur(var(--blur-intensity-plus-4)) saturate(var(--saturation));
          border-right: 1px solid var(--border-color);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.6);
          position: relative;
          z-index: 10;
          color: var(--text-color);
        }

        .vision-sidebar h1, .vision-sidebar h2, .vision-sidebar p {
          text-shadow: var(--text-shadow);
        }

        .vision-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 500;
          color: var(--text-color);
          transition: all 0.16s ease;
          cursor: pointer;
          margin-bottom: 4px;
        }

        .vision-nav-item:hover {
          background: var(--glass-color);
          color: var(--text-color);
          backdrop-filter: blur(var(--blur-intensity-minus-10));
          -webkit-backdrop-filter: blur(var(--blur-intensity-minus-10));
        }

        .vision-nav-item.active {
          background: var(--glass-color);
          color: var(--text-color);
          backdrop-filter: blur(var(--blur-intensity-minus-8));
          -webkit-backdrop-filter: blur(var(--blur-intensity-minus-8));
          box-shadow: 
            0 8px 20px var(--shadow-color),
            inset 0 1px 1px rgba(255, 255, 255, 0.8);
        }

        @media (max-width: 768px) {
          .vision-card {
            transform: none !important;
            animation: none !important;
          }
          
          .liquid-glass {
            transform: none !important;
          }
        }

        .theme-selector {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 50;
        }

        .background-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 20px;
          max-width: 400px;
        }

        .background-option {
          width: 120px;
          height: 80px;
          border-radius: 12px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .background-option:hover {
          transform: scale(1.05);
        }

        .background-option.active {
          border-color: rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .background-option-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 8px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 11px;
          font-weight: 500;
          text-align: center;
        }

        .upload-option {
          border: 2px dashed rgba(255, 255, 255, 0.5) !important;
        }

        .upload-option:hover {
          border-color: rgba(255, 255, 255, 0.8) !important;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div className="min-h-screen flex">
        {/* Background Selector */}
        <div className="theme-selector">
          <button
            onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
            className="liquid-glass mb-4 flex items-center gap-2"
          >
            <Palette size={16} />
            Backgrounds
          </button>

          {showBackgroundSelector && (
            <div className="vision-card background-grid">
              {/* Upload Button */}
              <div
                className="background-option upload-option"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '8px',
                  border: '2px dashed rgba(255, 255, 255, 0.5)'
                }}
              >
                {isAnalyzing ? (
                  <div className="animate-spin">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <>
                    <Upload size={20} color="white" />
                    <span className="text-white text-xs font-medium">Upload Image</span>
                  </>
                )}
              </div>

              {/* Preset Backgrounds */}
              {backgroundOptions.slice(0, -1).map((bg, index) => (
                <div
                  key={index}
                  className={`background-option ${currentBackground === index ? 'active' : ''}`}
                  style={{ background: bg.background }}
                  onClick={() => {
                    setCurrentBackground(index)
                    setShowBackgroundSelector(false)
                    setSmartColors(null) // Reset smart colors for presets
                  }}
                >
                  <div className="background-option-content">
                    {bg.name}
                  </div>
                </div>
              ))}

              {/* Custom Image Option */}
              {customBackground && (
                <div
                  className={`background-option ${currentBackground === backgroundOptions.length - 1 ? 'active' : ''}`}
                  style={{ 
                    backgroundImage: customBackground,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  onClick={() => {
                    setCurrentBackground(backgroundOptions.length - 1)
                    setShowBackgroundSelector(false)
                  }}
                >
                  <div className="background-option-content">
                    Custom Image
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>
        {/* Sidebar */}
        <div className="vision-sidebar">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">D</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>DEORA Plaza</h1>
                <p className="text-sm" style={{ color: 'var(--text-color)', opacity: 0.7 }}>Management System</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-color)', opacity: 0.6 }} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                style={{ 
                  borderRadius: '16px',
                  background: 'var(--glass-color)',
                  backdropFilter: 'blur(var(--blur-intensity-minus-10)) saturate(var(--saturation))',
                  WebkitBackdropFilter: 'blur(var(--blur-intensity-minus-10)) saturate(var(--saturation))',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.5)',
                  color: 'var(--text-color)'
                }}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {menuItems.map((item, index) => (
              <div
                key={index}
                onClick={() => setActiveItem(index)}
                className={`vision-nav-item ${item.isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User Profile */}
          <div className="mt-auto pt-6">
            <div className="flex items-center gap-3 p-3 rounded-16 mb-3" style={{
              borderRadius: '16px',
              background: 'var(--glass-color)',
              backdropFilter: 'blur(var(--blur-intensity-minus-10))',
              WebkitBackdropFilter: 'blur(var(--blur-intensity-minus-10))',
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)'
            }}>
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">M</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>Manager</p>
                <p className="text-xs" style={{ color: 'var(--text-color)', opacity: 0.7 }}>{/* Dynamic email */}</p>
              </div>
            </div>
            
            <LiquidGlassButton variant="secondary" className="w-full">
              <LogOut size={16} className="mr-2" />
              Sign Out
            </LiquidGlassButton>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  {menuItems[activeItem]?.label || 'Dashboard'}
                </h2>
                <p style={{ color: 'var(--text-color)', opacity: 0.7 }}>Welcome back to your DEORA Plaza dashboard</p>
              </div>
              
              <div className="flex items-center gap-3">
                <LiquidGlassButton>
                  <Plus size={16} className="mr-2" />
                  New Order
                </LiquidGlassButton>
                <LiquidGlassButton variant="secondary">
                  <Calendar size={16} />
                </LiquidGlassButton>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="vision-grid mb-8" style={{ padding: '0', gap: '24px' }}>
              {[
                { title: "Today's Revenue", value: "₹45,230", change: "+12%", icon: <BarChart3 size={20} /> },
                { title: "Active Orders", value: "127", change: "+8%", icon: <ShoppingCart size={20} /> },
                { title: "Table Occupancy", value: "18/24", change: "75%", icon: <Users size={20} /> },
                { title: "Customer Satisfaction", value: "4.8/5", change: "+0.2", icon: <Coffee size={20} /> }
              ].map((stat, index) => (
                <VisionCard key={index}>
                  <div className="flex items-center justify-between mb-4">
                    <div style={{ color: 'var(--accent-color)', opacity: 0.8 }}>
                      {stat.icon}
                    </div>
                    <span className="text-green-600 text-sm font-medium">{stat.change}</span>
                  </div>
                  <h3 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-color)' }}>{stat.value}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-color)', opacity: 0.7 }}>{stat.title}</p>
                </VisionCard>
              ))}
            </div>

            {/* Main Content Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <VisionCard className="lg:col-span-2">
                <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-color)' }}>Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    { action: "New order #1234", time: "2 min ago", status: "pending" },
                    { action: "Table 5 payment completed", time: "5 min ago", status: "success" },
                    { action: "Garden booking confirmed", time: "10 min ago", status: "info" },
                    { action: "Kitchen alert: Low stock", time: "15 min ago", status: "warning" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/30 transition-all duration-200">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-color)' }}>{activity.action}</p>
                        <p className="text-sm" style={{ color: 'var(--text-color)', opacity: 0.7 }}>{activity.time}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status === 'success' ? 'bg-green-500' :
                        activity.status === 'warning' ? 'bg-yellow-500' :
                        activity.status === 'info' ? 'bg-blue-500' :
                        'bg-purple-500'
                      }`}></div>
                    </div>
                  ))}
                </div>
              </VisionCard>

              <VisionCard>
                <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-color)' }}>Quick Actions</h3>
                <div className="space-y-3">
                  {[
                    { icon: <Plus size={16} />, label: "New Order" },
                    { icon: <Calendar size={16} />, label: "Book Table" },
                    { icon: <Clock size={16} />, label: "View Reports" },
                    { icon: <Settings size={16} />, label: "Settings" }
                  ].map((action, index) => (
                    <LiquidGlassButton key={index} className="w-full justify-start">
                      {action.icon}
                      <span className="ml-3">{action.label}</span>
                    </LiquidGlassButton>
                  ))}
                </div>
              </VisionCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}