import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'subtle'
  blur?: number
  opacity?: number
  children: React.ReactNode
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', blur, opacity, children, style, ...props }, ref) => {
    // Build CSS custom properties for dynamic blur and opacity
    const customStyle: React.CSSProperties = {
      ...style,
      ...(blur && { '--glass-blur': `${blur}px` }),
      ...(opacity && { '--glass-bg': `rgba(255, 255, 255, ${opacity})` }),
    }

    // Map variants to CSS classes
    const variantClasses = {
      default: 'apple-glass-card',
      elevated: 'apple-glass-card-elevated', 
      subtle: 'apple-glass-card-subtle'
    }

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          'apple-card-enter', // Add entrance animation
          className
        )}
        style={customStyle}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = "GlassCard"

export { GlassCard }