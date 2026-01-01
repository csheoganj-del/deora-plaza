import React from 'react'
import { Button } from './base/button'
import { cn } from '@/lib/utils'

interface LiquidButtonProps extends React.ComponentProps<typeof Button> {
  variant?: 'default' | 'liquid' | 'glass'
}

export function LiquidButton({ 
  className, 
  variant = 'liquid',
  children,
  ...props 
}: LiquidButtonProps) {
  return (
    <Button
      className={cn(
        // Base liquid glass styling
        variant === 'liquid' && [
          'bg-gradient-to-br from-[var(--warm-amber-500)]/20 to-[var(--warm-amber-600)]/10',
          'backdrop-filter backdrop-blur-md',
          'border border-[var(--warm-amber-500)]/30',
          'hover:from-[var(--warm-amber-500)]/30 hover:to-[var(--warm-amber-600)]/20',
          'hover:border-[var(--warm-amber-500)]/50',
          'transition-all duration-300 ease-out',
          'shadow-lg hover:shadow-xl',
          'apple-interactive'
        ],
        variant === 'glass' && [
          'apple-glass-card',
          'hover:apple-glass-card-elevated'
        ],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}