"use client"

import React from 'react'
import { cn } from '@/lib/utils'

// Mobile-first responsive container
export function ResponsiveContainer({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      "w-full px-4 sm:px-6 lg:px-8 mx-auto",
      "max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-4xl",
      className
    )}>
      {children}
    </div>
  )
}

// Mobile-optimized dialog
export function MobileDialog({ 
  children, 
  isOpen, 
  onClose,
  title,
  className 
}: { 
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string 
}) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog content */}
      <div className={cn(
        "relative w-full max-w-lg mx-4 mb-0 sm:mb-4",
        "bg-background rounded-t-lg sm:rounded-lg border shadow-lg",
        "max-h-[90vh] overflow-y-auto",
        // Mobile-specific styles
        "sm:max-h-[85vh]",
        className
      )}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// Mobile-optimized table with horizontal scroll
export function ResponsiveTable({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className={cn(
          "overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg",
          className
        )}>
          <table className="min-w-full divide-y divide-gray-300">
            {children}
          </table>
        </div>
      </div>
      {/* Scroll indicator */}
      <div className="flex justify-center mt-2 sm:hidden">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

// Mobile-optimized form layout
export function MobileForm({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <form className={cn(
      "space-y-4 sm:space-y-6",
      // Mobile-specific spacing and layout
      "px-4 sm:px-0",
      className
    )}>
      {children}
    </form>
  )
}

// Mobile-optimized button group
export function MobileButtonGroup({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row gap-3 sm:gap-2",
      "w-full sm:w-auto",
      className
    )}>
      {React.Children.map(children, (child, index) => (
        <div className="flex-1 sm:flex-initial">
          {child}
        </div>
      ))}
    </div>
  )
}

// Mobile-optimized card layout
export function ResponsiveCard({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      "bg-card text-card-foreground rounded-lg border shadow-sm",
      "p-4 sm:p-6",
      "w-full",
      className
    )}>
      {children}
    </div>
  )
}

// Mobile-optimized grid
export function ResponsiveGrid({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3 },
  className 
}: { 
  children: React.ReactNode
  cols?: { sm?: number; md?: number; lg?: number; xl?: number }
  className?: string 
}) {
  const gridClasses = cn(
    "grid gap-4 sm:gap-6",
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  )

  return (
    <div className={gridClasses}>
      {children}
    </div>
  )
}

// Touch-friendly button with proper sizing
export function TouchButton({ 
  children, 
  size = 'default',
  className,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'sm' | 'default' | 'lg'
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Touch-friendly sizes (minimum 44px)
        {
          'h-11 px-4 text-sm min-w-[44px]': size === 'sm', // 44px height
          'h-12 px-6 text-base min-w-[48px]': size === 'default', // 48px height
          'h-14 px-8 text-lg min-w-[56px]': size === 'lg', // 56px height
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// Mobile-optimized navigation
export function MobileNavigation({ 
  items, 
  currentPath,
  className 
}: { 
  items: Array<{ href: string; label: string; icon?: React.ReactNode }>
  currentPath: string
  className?: string 
}) {
  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background border-t",
      "sm:hidden", // Only show on mobile
      className
    )}>
      <div className="flex items-center justify-around py-2">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 min-w-[44px] min-h-[44px]",
              "text-xs font-medium transition-colors",
              currentPath === item.href
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.icon && (
              <div className="w-5 h-5 mb-1">
                {item.icon}
              </div>
            )}
            <span className="truncate max-w-[60px]">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}

// Hook for mobile detection
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  return isMobile
}

// Hook for safe area insets (for devices with notches)
export function useSafeArea() {
  const [safeArea, setSafeArea] = React.useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  })

  React.useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement)
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea)

    return () => {
      window.removeEventListener('resize', updateSafeArea)
    }
  }, [])

  return safeArea
}