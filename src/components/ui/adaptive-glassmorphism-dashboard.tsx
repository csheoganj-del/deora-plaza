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
  Palette
} from 'lucide-react'

interface MenuItem {
  icon: React.ReactNode
  label: string
  badge?: number
  href?: string
  isActive?: boolean
}

interface BackgroundTheme {
  id: string
  name: string
  background: string
  glassColor: string
  glassOpacity: number
  borderColor: string
  textColor: string
  accentColor: string
  shadowColor: string
  blurIntensity: number
  saturation: number
}

interface VisionCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  theme: BackgroundTheme
}

const backgroundThemes: BackgroundTheme[] = [
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glassColor: 'rgba(255, 255, 255, 0.15)',
    glassOpacity: 0.15,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textColor: 'rgba(255, 255, 255, 0.9)',
    accentColor: '#60a5fa',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    blurIntensity: 20,
    saturation: 180
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    glassColor: 'rgba(255, 255, 255, 0.2)',
    glassOpacity: 0.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    textColor: 'rgba(0, 0, 0, 0.8)',
    accentColor: '#f472b6',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    blurIntensity: 18,
    saturation: 160
  },
  {
    id: 'forest',
    name: 'Forest Mist',
    background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    glassColor: 'rgba(255, 255, 255, 0.12)',
    glassOpacity: 0.12,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    accentColor: '#34d399',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    blurIntensity: 22,
    saturation: 200
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    glassColor: 'rgba(255, 255, 255, 0.1)',
    glassOpacity: 0.1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    textColor: 'rgba(255, 255, 255, 0.9)',
    accentColor: '#a78bfa',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    blurIntensity: 25,
    saturation: 220
  },
  {
    id: 'desert',
    name: 'Desert Sand',
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    glassColor: 'rgba(255, 255, 255, 0.25)',
    glassOpacity: 0.25,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    textColor: 'rgba(0, 0, 0, 0.85)',
    accentColor: '#f59e0b',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    blurIntensity: 15,
    saturation: 140
  },
  {
    id: 'midnight',
    name: 'Midnight Sky',
    background: 'linear-gradient(135deg, #2c3e50 0%, #000428 100%)',
    glassColor: 'rgba(255, 255, 255, 0.08)',
    glassOpacity: 0.08,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    accentColor: '#3b82f6',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    blurIntensity: 28,
    saturation: 250
  },
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    background: 'linear-gradient(135deg, #ffeef8 0%, #f8d7da 50%, #ffc0cb 100%)',
    glassColor: 'rgba(255, 255, 255, 0.3)',
    glassOpacity: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    textColor: 'rgba(0, 0, 0, 0.8)',
    accentColor: '#ec4899',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    blurIntensity: 12,
    saturation: 120
  },
  {
    id: 'cosmic',
    name: 'Cosmic Purple',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 75%, #f5576c 100%)',
    glassColor: 'rgba(255, 255, 255, 0.12)',
    glassOpacity: 0.12,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textColor: 'rgba(255, 255, 255, 0.9)',
    accentColor: '#8b5cf6',
    shadowColor: 'rgba(0, 0, 0, 0.35)',
    blurIntensity: 24,
    saturation: 200
  }
]

const VisionCard = ({ children, className = "", onClick, theme }: VisionCardProps) => {
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
    }

    const handleMouseLeave = () => {
      card.style.transform = "rotateX(0) rotateY(0) translateY(0)"
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
      className={`vision-card ${isIdle ? 'idle' : ''} ${className}`}
      style={{
        '--x': '50%',
        '--y': '50%',
        background: theme.glassColor,
        backdropFilter: `blur(${theme.blurIntensity}px) saturate(${theme.saturation}%)`,
        WebkitBackdropFilter: `blur(${theme.blurIntensity}px) saturate(${theme.saturation}%)`,
        border: `1px solid ${theme.borderColor}`,
        color: theme.textColor,
        boxShadow: `
          0 30px 60px ${theme.shadowColor},
          inset 0 1px 1px rgba(255, 255, 255, ${theme.glassOpacity * 3})
        `
      } as React.CSSProperties}
    >
      <div 
        className="vision-card-highlight"
        style={{
          background: `radial-gradient(
            circle at var(--x, 50%) var(--y, 50%),
            rgba(255,255,255,${theme.glassOpacity * 2}),
            transparent 45%
          )`
        }}
      ></div>
      {children}
    </div>
  )
}

const LiquidGlassButton = ({
  children,
  onClick,
  variant = 'primary',
  className = "",
  theme
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  className?: string
  theme: BackgroundTheme
}) => {
  const buttonStyle = {
    background: variant === 'primary' ? theme.glassColor : `rgba(255, 255, 255, ${theme.glassOpacity * 0.8})`,
    backdropFilter: `blur(${theme.blurIntensity - 2}px) saturate(${theme.saturation}%)`,
    WebkitBackdropFilter: `blur(${theme.blurIntensity - 2}px) saturate(${theme.saturation}%)`,
    border: `1px solid ${theme.borderColor}`,
    color: theme.textColor,
    boxShadow: `
      0 12px 30px ${theme.shadowColor},
      inset 0 1px 1px rgba(255, 255, 255, ${theme.glassOpacity * 2})
    `
  }

  return (
    <button
      onClick={onClick}
      className={`liquid-glass ${variant} ${className}`}
      style={buttonStyle}
    >
      {children}
    </button>
  )
}

export function AdaptiveGlassmorphismDashboard() {
  const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(backgroundThemes[0])
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [activeItem, setActiveItem] = useState(0)

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
    <>
      <style jsx global>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
          margin: 0;
          padding: 0;
          transition: background 0.5s ease;
        }

        .vision-card {
          padding: 24px;
          border-radius: 22px;
          transition: 
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.3s ease,
            backdrop-filter 0.3s ease;
          transform-style: preserve-3d;
          perspective: 1000px;
          position: relative;
          overflow: hidden;
          will-change: transform;
          cursor: pointer;
          z-index: 10;
        }

        .vision-card-highlight {
          content: "";
          position: absolute;
          inset: -40%;
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
          font-weight: 500;
          transition: 
            transform 0.18s ease,
            box-shadow 0.18s ease,
            backdrop-filter 0.18s ease,
            background 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          z-index: 10;
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
        }

        .liquid-glass:hover {
          transform: translateY(-1px);
        }

        .vision-sidebar {
          width: 280px;
          height: 100vh;
          padding: 24px;
          position: relative;
          z-index: 10;
          transition: background 0.3s ease, backdrop-filter 0.3s ease;
        }

        .vision-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.16s ease;
          cursor: pointer;
          margin-bottom: 4px;
        }

        .theme-selector {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 50;
          transition: all 0.3s ease;
        }

        .theme-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 20px;
          max-width: 400px;
        }

        .theme-option {
          width: 120px;
          height: 80px;
          border-radius: 12px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .theme-option:hover {
          transform: scale(1.05);
        }

        .theme-option.active {
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .theme-option-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 8px;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          color: white;
          font-size: 12px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .vision-card {
            transform: none !important;
            animation: none !important;
          }
          
          .liquid-glass {
            transform: none !important;
          }

          .theme-grid {
            grid-template-columns: 1fr;
            max-width: 200px;
          }
        }
      `}</style>

      <div 
        className="min-h-screen flex transition-all duration-500"
        style={{ background: currentTheme.background }}
      >
        {/* Theme Selector */}
        <div className="theme-selector">
          <LiquidGlassButton
            theme={currentTheme}
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            className="mb-4"
          >
            <Palette size={16} className="mr-2" />
            Themes
          </LiquidGlassButton>

          {showThemeSelector && (
            <VisionCard theme={currentTheme} className="theme-grid">
              {backgroundThemes.map((theme) => (
                <div
                  key={theme.id}
                  className={`theme-option ${currentTheme.id === theme.id ? 'active' : ''}`}
                  style={{ background: theme.background }}
                  onClick={() => {
                    setCurrentTheme(theme)
                    setShowThemeSelector(false)
                  }}
                >
                  <div className="theme-option-content">
                    {theme.name}
                  </div>
                </div>
              ))}
            </VisionCard>
          )}
        </div>

        {/* Sidebar */}
        <div 
          className="vision-sidebar"
          style={{
            background: currentTheme.glassColor,
            backdropFilter: `blur(${currentTheme.blurIntensity + 4}px) saturate(${currentTheme.saturation}%)`,
            WebkitBackdropFilter: `blur(${currentTheme.blurIntensity + 4}px) saturate(${currentTheme.saturation}%)`,
            borderRight: `1px solid ${currentTheme.borderColor}`,
            boxShadow: `inset 0 1px 1px rgba(255, 255, 255, ${currentTheme.glassOpacity * 3})`
          }}
        >
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: currentTheme.accentColor }}
              >
                <span className="text-white text-sm font-semibold">D</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold" style={{ color: currentTheme.textColor }}>
                  DEORA Plaza
                </h1>
                <p className="text-sm" style={{ color: `${currentTheme.textColor}80` }}>
                  Management System
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: `${currentTheme.textColor}60` }} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ 
                  background: `rgba(255, 255, 255, ${currentTheme.glassOpacity * 0.8})`,
                  backdropFilter: `blur(${currentTheme.blurIntensity - 8}px) saturate(${currentTheme.saturation}%)`,
                  WebkitBackdropFilter: `blur(${currentTheme.blurIntensity - 8}px) saturate(${currentTheme.saturation}%)`,
                  border: `1px solid ${currentTheme.borderColor}`,
                  color: currentTheme.textColor
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
                className="vision-nav-item"
                style={{
                  color: item.isActive ? currentTheme.textColor : `${currentTheme.textColor}70`,
                  background: item.isActive 
                    ? `rgba(255, 255, 255, ${currentTheme.glassOpacity * 1.5})` 
                    : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!item.isActive) {
                    e.currentTarget.style.background = `rgba(255, 255, 255, ${currentTheme.glassOpacity * 0.8})`
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.isActive) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <div 
                    className="text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center"
                    style={{ background: currentTheme.accentColor }}
                  >
                    {item.badge}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User Profile */}
          <div className="mt-auto pt-6">
            <div 
              className="flex items-center gap-3 p-3 rounded-2xl mb-3"
              style={{
                background: `rgba(255, 255, 255, ${currentTheme.glassOpacity * 0.6})`,
                border: `1px solid ${currentTheme.borderColor}`
              }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: currentTheme.accentColor }}
              >
                <span className="text-white text-xs font-semibold">M</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: currentTheme.textColor }}>Manager</p>
                <p className="text-xs" style={{ color: `${currentTheme.textColor}60` }}>
                  {/* Dynamic email will be loaded from session */}
                </p>
              </div>
            </div>
            
            <LiquidGlassButton theme={currentTheme} variant="secondary" className="w-full">
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
                <h2 className="text-3xl font-semibold mb-2" style={{ color: currentTheme.textColor }}>
                  {menuItems[activeItem]?.label || 'Dashboard'}
                </h2>
                <p style={{ color: `${currentTheme.textColor}80` }}>
                  Welcome back to your DEORA Plaza dashboard
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <LiquidGlassButton theme={currentTheme}>
                  <Plus size={16} className="mr-2" />
                  New Order
                </LiquidGlassButton>
                <LiquidGlassButton theme={currentTheme} variant="secondary">
                  <Calendar size={16} />
                </LiquidGlassButton>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: "Today's Revenue", value: "₹45,230", change: "+12%", icon: <BarChart3 size={20} /> },
                { title: "Active Orders", value: "127", change: "+8%", icon: <ShoppingCart size={20} /> },
                { title: "Table Occupancy", value: "18/24", change: "75%", icon: <Users size={20} /> },
                { title: "Customer Satisfaction", value: "4.8/5", change: "+0.2", icon: <Coffee size={20} /> }
              ].map((stat, index) => (
                <VisionCard key={index} theme={currentTheme}>
                  <div className="flex items-center justify-between mb-4">
                    <div style={{ color: currentTheme.accentColor, opacity: 0.8 }}>
                      {stat.icon}
                    </div>
                    <span className="text-sm font-medium" style={{ color: currentTheme.accentColor }}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold mb-1" style={{ color: currentTheme.textColor }}>
                    {stat.value}
                  </h3>
                  <p className="text-sm" style={{ color: `${currentTheme.textColor}70` }}>
                    {stat.title}
                  </p>
                </VisionCard>
              ))}
            </div>

            {/* Main Content Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <VisionCard theme={currentTheme} className="lg:col-span-2">
                <h3 className="text-xl font-semibold mb-6" style={{ color: currentTheme.textColor }}>
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {[
                    { action: "New order #1234", time: "2 min ago", status: "pending" },
                    { action: "Table 5 payment completed", time: "5 min ago", status: "success" },
                    { action: "Garden booking confirmed", time: "10 min ago", status: "info" },
                    { action: "Kitchen alert: Low stock", time: "15 min ago", status: "warning" }
                  ].map((activity, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:bg-white hover:bg-opacity-10"
                    >
                      <div>
                        <p className="font-medium" style={{ color: currentTheme.textColor }}>
                          {activity.action}
                        </p>
                        <p className="text-sm" style={{ color: `${currentTheme.textColor}60` }}>
                          {activity.time}
                        </p>
                      </div>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: activity.status === 'success' ? '#10b981' :
                                     activity.status === 'warning' ? '#f59e0b' :
                                     activity.status === 'info' ? currentTheme.accentColor :
                                     '#8b5cf6'
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </VisionCard>

              <VisionCard theme={currentTheme}>
                <h3 className="text-xl font-semibold mb-6" style={{ color: currentTheme.textColor }}>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: <Plus size={16} />, label: "New Order" },
                    { icon: <Calendar size={16} />, label: "Book Table" },
                    { icon: <Clock size={16} />, label: "View Reports" },
                    { icon: <Settings size={16} />, label: "Settings" }
                  ].map((action, index) => (
                    <LiquidGlassButton key={index} theme={currentTheme} className="w-full justify-start">
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
    </>
  )
}

export default AdaptiveGlassmorphismDashboard